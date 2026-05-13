// subscription-check.ts
// Server-side paywall enforcement.
// Use assertPaidAccess(uid) in any API route that consumes Claude API credits.
//
// Allowed states:
//   - subscriptionStatus === 'active' AND currentPeriodEnd is in the future
//   - Org is within 30 days of creation (trial period)
//
// Blocked states (returns 402 Payment Required):
//   - No org / no user record
//   - subscriptionStatus is missing or 'cancelled'
//   - Trial expired (>30 days since org createdAt) and not paid

import { applicationDefault, initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

const adminApp = getApps().length ? getApp() : initializeApp({ credential: applicationDefault() });
const adminDb = getFirestore(adminApp);

const TRIAL_DAYS = 30;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export type AccessReason =
  | 'active'           // paid + period valid
  | 'trial'            // within 30-day trial window
  | 'no_user'          // uid has no user record
  | 'no_org'           // user has no organizationId
  | 'no_org_doc'       // organization doc missing
  | 'trial_expired'    // past 30 days, no active subscription
  | 'subscription_expired'  // had a subscription but currentPeriodEnd is past
  | 'cancelled';       // subscriptionStatus explicitly cancelled

export interface SubscriptionState {
  allowed: boolean;
  reason: AccessReason;
}

export async function getSubscriptionState(uid: string): Promise<SubscriptionState> {
  if (!uid) return { allowed: false, reason: 'no_user' };

  const userSnap = await adminDb.collection('users').doc(uid).get();
  if (!userSnap.exists) return { allowed: false, reason: 'no_user' };

  const orgId = userSnap.data()?.organizationId;
  if (!orgId) return { allowed: false, reason: 'no_org' };

  const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
  if (!orgSnap.exists) return { allowed: false, reason: 'no_org_doc' };

  const org = orgSnap.data() || {};
  const now = new Date();

  // Active paid subscription with valid period
  if (org.subscriptionStatus === 'active') {
    const periodEnd: Date | undefined = org.currentPeriodEnd?.toDate?.();
    if (periodEnd && periodEnd > now) {
      return { allowed: true, reason: 'active' };
    }
    return { allowed: false, reason: 'subscription_expired' };
  }

  // Explicit cancellation
  if (org.subscriptionStatus === 'cancelled') {
    return { allowed: false, reason: 'cancelled' };
  }

  // Trial window check
  const createdAt: Date | undefined = org.createdAt?.toDate?.();
  if (createdAt) {
    const trialEnd = new Date(createdAt.getTime() + TRIAL_MS);
    if (trialEnd > now) {
      return { allowed: true, reason: 'trial' };
    }
    return { allowed: false, reason: 'trial_expired' };
  }

  // No createdAt either — treat as expired
  return { allowed: false, reason: 'trial_expired' };
}

/**
 * Asserts that the user has paid access (active subscription or within trial).
 * - Returns null if allowed (caller proceeds normally).
 * - Returns a NextResponse with 402 Payment Required if blocked.
 *
 * Usage:
 *   const block = await assertPaidAccess(uid);
 *   if (block) return block;
 */
export async function assertPaidAccess(uid: string): Promise<NextResponse | null> {
  const state = await getSubscriptionState(uid);
  if (state.allowed) return null;

  const messages: Record<AccessReason, string> = {
    active: '',
    trial: '',
    no_user: 'Account not found.',
    no_org: 'No organization linked to this account.',
    no_org_doc: 'Organization record missing.',
    trial_expired: 'Your 30-day trial has expired. Please subscribe to continue using AI features.',
    subscription_expired: 'Your subscription has expired. Please renew to continue using AI features.',
    cancelled: 'Your subscription has been cancelled. Please re-subscribe to continue using AI features.',
  };

  return NextResponse.json(
    {
      error: 'subscription_required',
      reason: state.reason,
      message: messages[state.reason] || 'This feature requires an active subscription.',
    },
    { status: 402 }
  );
}
