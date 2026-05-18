import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/subscription/cancel
 *
 * Allows a FOUNDER or HR_ADMIN to cancel their organization's subscription.
 * Effective immediately. No refund issued (per Refund & Cancellation Policy).
 * 60-day grace period applies after currentPeriodEnd for data export.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase ID token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // 2. Fetch user document
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json({ error: 'User data missing' }, { status: 404 });
    }

    // 3. Check role - only FOUNDER or HR_ADMIN can cancel
    const role = userData.role;
    if (role !== 'FOUNDER' && role !== 'HR_ADMIN') {
      return NextResponse.json(
        { error: 'Only founders or HR admins can cancel the subscription' },
        { status: 403 }
      );
    }

    const orgId = userData.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 4. Fetch organization
    const orgRef = adminDb.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const orgData = orgDoc.data();
    const currentPeriodEnd = orgData?.currentPeriodEnd || null;
    const subscriptionStatus = orgData?.subscriptionStatus || 'trial';

    // 5. Idempotency: if already cancelled, return current state
    if (subscriptionStatus === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Subscription already cancelled',
        alreadyCancelled: true,
        accessUntil: orgData?.currentPeriodEnd?.toDate?.()?.toISOString() || null,
        gracePeriodEnd: orgData?.gracePeriodEnd?.toDate?.()?.toISOString() || null,
      });
    }

    // 6. Calculate grace period end: 60 days after currentPeriodEnd
    //    If no currentPeriodEnd (e.g. cancelled during trial), grace = 60 days from now
    let gracePeriodEnd: Date;
    let accessUntilDate: Date;

    if (currentPeriodEnd?.toDate) {
      accessUntilDate = currentPeriodEnd.toDate();
      gracePeriodEnd = new Date(accessUntilDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 60);
    } else {
      // No active paid period (likely trial cancellation)
      accessUntilDate = new Date();
      gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 60);
    }

    // 7. Update organization
    await orgRef.update({
      subscriptionStatus: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledByUid: uid,
      cancelledByEmail: userData.email || null,
      gracePeriodEnd: gracePeriodEnd,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      effectiveFrom: 'immediate',
      accessUntil: accessUntilDate.toISOString(),
      gracePeriodEnd: gracePeriodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('[cancel-subscription] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
