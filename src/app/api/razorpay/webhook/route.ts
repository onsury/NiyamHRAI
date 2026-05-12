import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb, RAZORPAY_WEBHOOK_SECRET } from '@/lib/razorpay/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Razorpay webhook receiver.
 * Auth = HMAC signature only. Configure secret in Razorpay dashboard and set
 * RAZORPAY_WEBHOOK_SECRET in env.
 *
 * Acts as a FALLBACK to /verify. Idempotent with verify - whichever runs first wins,
 * the other detects the existing payments doc and exits cleanly.
 */
export async function POST(req: NextRequest) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    console.warn('[razorpay/webhook] Signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  type WebhookEvent = {
    event?: string;
    id?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      order?: { entity?: Record<string, unknown> };
    };
  };

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = adminDb();
  const eventType = event.event;
  const payment = event.payload?.payment?.entity as Record<string, unknown> | undefined;

  try {
    await db.collection('razorpay_webhook_log').add({
      eventType: eventType || null,
      eventId: event.id || null,
      paymentId: (payment?.id as string) || null,
      orderId: (payment?.order_id as string) || null,
      receivedAt: FieldValue.serverTimestamp(),
    });

    if (eventType === 'payment.captured' && payment) {
      const paymentId = payment.id as string;
      const orderId = payment.order_id as string;
      const pendingRef = db.collection('pending_orders').doc(orderId);
      const pendingSnap = await pendingRef.get();
      const paymentRef = db.collection('payments').doc(paymentId);

      if (pendingSnap.exists) {
        const meta = pendingSnap.data() as {
          uid: string;
          organizationId: string;
          plan: string;
          cycle: 'monthly' | 'annual';
          employeeCount: number;
        };
        const { uid, organizationId, plan, cycle, employeeCount } = meta;
        const periodMs =
          cycle === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const periodEnd = Timestamp.fromDate(new Date(Date.now() + periodMs));

        const batch = db.batch();
        batch.set(
          paymentRef,
          {
            uid,
            organizationId,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            amount: payment.amount,
            currency: payment.currency,
            plan,
            cycle,
            employeeCount,
            status: 'captured',
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            capturedAt: FieldValue.serverTimestamp(),
            verifiedVia: 'webhook',
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
            currentPeriodStart: FieldValue.serverTimestamp(),
            currentPeriodEnd: periodEnd,
            lastPaymentId: paymentId,
            lastPaymentAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        batch.delete(pendingRef);
        await batch.commit();
      } else {
        // verify already ran - just confirm capture
        await paymentRef.set(
          {
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            amount: payment.amount,
            currency: payment.currency,
            status: 'captured',
            method: payment.method,
            capturedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } else if (eventType === 'payment.failed' && payment) {
      await db.collection('payments').doc(payment.id as string).set(
        {
          razorpayPaymentId: payment.id,
          razorpayOrderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
          status: 'failed',
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          errorSource: payment.error_source,
          failedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[razorpay/webhook] handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
