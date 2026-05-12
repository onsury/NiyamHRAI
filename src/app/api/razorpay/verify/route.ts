import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/razorpay/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7).trim();

    let uid: string;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as Record<string, string>;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing signature params' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // HMAC-SHA256(order_id + '|' + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    const db = adminDb();
    const pendingRef = db.collection('pending_orders').doc(razorpay_order_id);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      // webhook already processed, or replay attempt
      const existing = await db.collection('payments').doc(razorpay_payment_id).get();
      if (existing.exists) {
        return NextResponse.json({ ok: true, alreadyApplied: true });
      }
      return NextResponse.json({ error: 'Order metadata not found' }, { status: 404 });
    }
    const meta = pendingSnap.data() as {
      uid: string;
      organizationId: string;
      plan: string;
      cycle: 'monthly' | 'annual';
      employeeCount: number;
      amount: number;
    };

    if (meta.uid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organizationId, plan, cycle, employeeCount, amount } = meta;
    const now = FieldValue.serverTimestamp();
    const periodMs =
      cycle === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const periodEnd = Timestamp.fromDate(new Date(Date.now() + periodMs));

    const batch = db.batch();

    batch.set(
      db.collection('payments').doc(razorpay_payment_id),
      {
        uid,
        organizationId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount,
        currency: 'INR',
        plan,
        cycle,
        employeeCount,
        status: 'verified',
        verifiedVia: 'client_callback',
        createdAt: now,
      },
      { merge: true }
    );

    batch.set(
      db.collection('organizations').doc(organizationId),
      {
        plan,
        billingCycle: cycle,
        paidEmployeeSlots: employeeCount,
        subscriptionStatus: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        lastPaymentId: razorpay_payment_id,
        lastPaymentAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.delete(pendingRef);
    await batch.commit();

    return NextResponse.json({
      ok: true,
      plan,
      cycle,
      employeeCount,
      currentPeriodEnd: periodEnd.toDate().toISOString(),
    });
  } catch (err) {
    console.error('[razorpay/verify] error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
