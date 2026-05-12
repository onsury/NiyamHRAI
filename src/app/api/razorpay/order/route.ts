import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { razorpay, RAZORPAY_KEY_ID, adminAuth, adminDb } from '@/lib/razorpay/client';
import { PLANS, type PlanId, type BillingCycle, computeAmount } from '@/lib/razorpay/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // --- Auth: Bearer ID token ---
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7).trim();

    let uid: string;
    let email: string | undefined;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // --- Validate body ---
    const body = await req.json().catch(() => ({}));
    const { plan, cycle, employeeCount, organizationId } = body as {
      plan?: PlanId;
      cycle?: BillingCycle;
      employeeCount?: number;
      organizationId?: string;
    };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (cycle !== 'monthly' && cycle !== 'annual') {
      return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 });
    }
    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }
    if (typeof employeeCount !== 'number' || employeeCount < 1) {
      return NextResponse.json({ error: 'employeeCount must be >= 1' }, { status: 400 });
    }

    // --- Auth: caller must be FOUNDER or HR_ADMIN of the org ---
    // Mirrors firestore.rules isAdminOfOrg() pattern.
    const db = adminDb();
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    const userData = userSnap.data() as { organizationId?: string; role?: string };
    const isAdmin =
      userData.organizationId === organizationId &&
      (userData.role === 'FOUNDER' || userData.role === 'HR_ADMIN');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- Verify org exists ---
    const orgSnap = await db.collection('organizations').doc(organizationId).get();
    if (!orgSnap.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // --- Compute amount in paise ---
    let amount: number;
    try {
      amount = computeAmount(plan, cycle, employeeCount);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid amount';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Razorpay receipt: max 40 chars
    const receipt = ('nh_' + organizationId.slice(0, 8) + '_' + Date.now()).slice(0, 40);

    // --- Create order on Razorpay ---
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        uid,
        organizationId,
        plan,
        cycle,
        employeeCount: String(employeeCount),
      },
    });

    // --- Stash pending metadata for webhook fallback ---
    await db.collection('pending_orders').doc(order.id).set({
      uid,
      email: email || null,
      organizationId,
      plan,
      cycle,
      employeeCount,
      amount,
      currency: 'INR',
      receipt,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      plan,
      cycle,
      employeeCount,
      organizationId,
    });
  } catch (err) {
    console.error('[razorpay/order] error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
