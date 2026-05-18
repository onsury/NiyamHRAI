// patch-2-refund-integration.js
// Three changes:
//   1. Fix company name on refund-cancellation page (SmartDNA -> Madraz Buzz Media)
//   2. Update /terms page: add refund policy cross-reference + bottom footer with policy links
//   3. Rewrite /dashboard/billing page: add Cancel Subscription button + modal + flow
//
// Usage:
//   1. Save to D:\projects\NiyamHRAI\
//   2. node patch-2-refund-integration.js
//   3. git add -A && git commit -m "feat: integrate refund-cancellation policy + cancel button"
//   4. git push

const fs = require('fs');
const path = require('path');

let summary = [];

// ====================================================================
// CHANGE 1: Fix company name on refund-cancellation page
// ====================================================================
{
  const filePath = path.join('src', 'app', 'refund-cancellation', 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Refund page not found:', filePath);
    process.exit(1);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const oldStr = 'operated by SmartDNA Business Intelligence & Advisory';
  const newStr = 'operated by Madraz Buzz Media';

  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(filePath, content);
    summary.push('✓ Refund page: company name fixed (SmartDNA → Madraz Buzz Media)');
  } else if (content.includes(newStr)) {
    summary.push('• Refund page: company name already correct');
  } else {
    summary.push('⚠ Refund page: could not find operator phrase to update');
  }
}

// ====================================================================
// CHANGE 2: Update /terms page
// ====================================================================
{
  const filePath = path.join('src', 'app', 'terms', 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Terms page not found:', filePath);
    process.exit(1);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let termsChangeCount = 0;

  // 2a. Update section 6 (Payments and billing) to reference refund policy
  const oldSection6 = `            <h2 className="text-2xl font-black text-white mt-10 mb-4">6. Payments and billing</h2>
            <p>
              During Early Access, NiyamHR may be offered free or at introductory pricing. Once formal paid plans are activated, you will be notified in advance of any billing changes. Pricing and billing terms will be governed by a separate subscription agreement at that time.
            </p>`;

  const newSection6 = `            <h2 className="text-2xl font-black text-white mt-10 mb-4">6. Payments and billing</h2>
            <p>
              Paid plans (Starter and Growth) are billed monthly or annually as selected by the customer. Current pricing is displayed on our pricing page and within your dashboard at the time of purchase. All payments are processed through Razorpay.
            </p>
            <p>
              Refund and cancellation of subscriptions are governed by our <Link href="/refund-cancellation" className="text-amber-500 hover:text-amber-400">Refund &amp; Cancellation Policy</Link>, which forms part of these Terms by reference.
            </p>`;

  if (content.includes(oldSection6)) {
    content = content.replace(oldSection6, newSection6);
    summary.push('✓ Terms page: Section 6 updated with refund policy reference');
    termsChangeCount++;
  } else {
    summary.push('⚠ Terms page: Section 6 not found in expected format - skipped');
  }

  // 2b. Replace bottom attribution with a proper footer
  const oldFooter = `            <p className="text-sm text-white/40 mt-10 pt-6 border-t border-white/10">
              Madraz Buzz Media · Chennai, Tamil Nadu, India
            </p>`;

  const newFooter = `            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
                <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
                <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
                <Link href="/refund-cancellation" className="hover:text-amber-500 transition-colors">Refund &amp; Cancellation</Link>
                <Link href="/security" className="hover:text-amber-500 transition-colors">Security</Link>
                <Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link>
              </div>
              <p className="text-xs text-white/30 mt-4">
                Madraz Buzz Media
              </p>
            </div>`;

  if (content.includes(oldFooter)) {
    content = content.replace(oldFooter, newFooter);
    summary.push('✓ Terms page: Footer updated with policy links');
    termsChangeCount++;
  } else {
    // Try a fallback match in case the original encoded the centered dot differently
    const oldFooterAlt = /<p className="text-sm text-white\/40 mt-10 pt-6 border-t border-white\/10">\s*Madraz Buzz Media[^<]*<\/p>/;
    if (oldFooterAlt.test(content)) {
      content = content.replace(oldFooterAlt, newFooter);
      summary.push('✓ Terms page: Footer updated (fallback regex)');
      termsChangeCount++;
    } else {
      summary.push('⚠ Terms page: Footer block not found - skipped');
    }
  }

  if (termsChangeCount > 0) {
    fs.writeFileSync(filePath, content);
  }
}

// ====================================================================
// CHANGE 3: Rewrite /dashboard/billing/page.tsx with Cancel flow
// ====================================================================
{
  const filePath = path.join('src', 'app', 'dashboard', 'billing', 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Billing page not found:', filePath);
    process.exit(1);
  }

  const newBillingContent = `"use client";

/**
 * NiyamHR billing page - Razorpay Checkout flow + Cancel Subscription.
 *
 * Flow:
 *   1. Resolve current user via Firebase Auth
 *   2. Read users/{uid} to get organizationId + role; gate on FOUNDER | HR_ADMIN
 *   3. Subscribe to organizations/{orgId} for current plan state
 *   4. User picks plan (Starter | Growth), cycle (monthly | annual), employee count
 *   5. POST /api/razorpay/order with Bearer token -> {orderId, amount, currency, keyId}
 *   6. Load Razorpay Checkout SDK, open with order details
 *   7. On Checkout success: POST /api/razorpay/verify -> server verifies HMAC, flips org to active
 *   8. Cancel: POST /api/subscription/cancel -> sets subscriptionStatus='cancelled', 60-day grace
 *   9. Firestore subscription auto-refreshes UI state
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, type Timestamp } from 'firebase/firestore';
import app from '@/lib/firebase';
import {
  loadRazorpayCheckout,
  openCheckout,
  type RazorpaySuccessResponse,
} from '@/lib/razorpay/checkout-client';

// Plan constants - MUST mirror src/lib/razorpay/plans.ts on the server.
// Source: niyamhr.in pricing page.
type PlanId = 'starter' | 'growth';
type BillingCycle = 'monthly' | 'annual';

interface PlanDef {
  id: PlanId;
  name: string;
  maxEmployees: number;
  monthlyPerEmp: number;  // paise
  annualPerEmp: number;   // paise
  blurb: string;
  features: string[];
}

const PLANS: Record<PlanId, PlanDef> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    maxEmployees: 10,
    monthlyPerEmp: 124900,    // Rs 1,249
    annualPerEmp: 1198800,    // Rs 11,988
    blurb: 'Up to 10 employees',
    features: [
      'Organisation DNA Diagnostic',
      'Employee DNA Mapping',
      'Weekly AI Mentorship',
      'Honing Lab',
      'Synergy Dashboard',
      'Monthly Reports',
      'Email Support',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    maxEmployees: 100,
    monthlyPerEmp: 249900,    // Rs 2,499
    annualPerEmp: 2398800,    // Rs 23,988
    blurb: 'Up to 100 employees',
    features: [
      'Everything in Starter',
      'Full 67-trait mapping',
      'AI Mentorship Engine',
      'HR intelligence dashboard',
      'Priority support',
    ],
  },
};

interface UserProfile {
  organizationId?: string;
  role?: string;
  displayName?: string;
  email?: string;
}

interface OrganizationDoc {
  plan?: PlanId;
  billingCycle?: BillingCycle;
  paidEmployeeSlots?: number;
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  currentPeriodEnd?: Timestamp;
  lastPaymentId?: string;
  cancelledAt?: Timestamp;
  gracePeriodEnd?: Timestamp;
}

type StatusMsg = { type: 'success' | 'error' | 'info'; msg: string } | null;

function formatINR(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(ts?: Timestamp): string {
  if (!ts) return '';
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<OrganizationDoc | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);

  const [plan, setPlan] = useState<PlanId>('starter');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [employeeCount, setEmployeeCount] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);

  // Cancel subscription state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Auth bootstrap
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        router.replace('/login?next=/dashboard/billing');
      }
    });
    return unsub;
  }, [router]);

  // Load profile + subscribe to org
  useEffect(() => {
    if (!user) return;
    let unsubOrg: (() => void) | undefined;
    const db = getFirestore(app);

    (async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (!userSnap.exists()) {
          setStatus({
            type: 'error',
            msg: 'User profile not found. Complete onboarding before managing billing.',
          });
          return;
        }
        const profileData = userSnap.data() as UserProfile;
        setProfile({
          ...profileData,
          email: profileData.email || user.email || undefined,
        });

        const orgId = profileData.organizationId;
        if (!orgId) {
          setStatus({ type: 'error', msg: 'No organization linked to your account.' });
          setOrgLoaded(true);
          return;
        }

        unsubOrg = onSnapshot(doc(db, 'organizations', orgId), (snap) => {
          if (snap.exists()) {
            const orgData = snap.data() as OrganizationDoc;
            setOrg(orgData);
            // Seed selectors from current org state on first load
            if (orgData.plan && (orgData.plan === 'starter' || orgData.plan === 'growth')) {
              setPlan(orgData.plan);
            }
            if (orgData.billingCycle === 'monthly' || orgData.billingCycle === 'annual') {
              setCycle(orgData.billingCycle);
            }
            if (typeof orgData.paidEmployeeSlots === 'number' && orgData.paidEmployeeSlots > 0) {
              setEmployeeCount(orgData.paidEmployeeSlots);
            }
          }
          setOrgLoaded(true);
        }, (err) => {
          console.error('[billing] org snapshot error', err);
          setStatus({ type: 'error', msg: 'Could not load organization billing state.' });
          setOrgLoaded(true);
        });
      } catch (err) {
        console.error('[billing] profile load error', err);
        setStatus({ type: 'error', msg: 'Could not load your profile.' });
      }
    })();

    return () => {
      if (unsubOrg) unsubOrg();
    };
  }, [user]);

  // Derived state
  const isAdmin = profile?.role === 'FOUNDER' || profile?.role === 'HR_ADMIN';
  const planDef = PLANS[plan];
  const ratePerEmp = cycle === 'monthly' ? planDef.monthlyPerEmp : planDef.annualPerEmp;
  const amount = ratePerEmp * employeeCount;
  const overLimit = employeeCount > planDef.maxEmployees;
  const isActive = org?.subscriptionStatus === 'active';
  const isCancelled = org?.subscriptionStatus === 'cancelled';
  const isSamePlan =
    org?.plan === plan &&
    org?.billingCycle === cycle &&
    org?.paidEmployeeSlots === employeeCount &&
    org?.subscriptionStatus === 'active';

  // Payment handler
  const handlePay = useCallback(async () => {
    if (!user || !profile?.organizationId) return;
    setLoading(true);
    setStatus(null);

    try {
      const idToken = await user.getIdToken();
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + idToken,
        },
        body: JSON.stringify({
          plan,
          cycle,
          employeeCount,
          organizationId: profile.organizationId,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({ error: 'Order creation failed' }));
        throw new Error(err.error || 'Order creation failed (HTTP ' + orderRes.status + ')');
      }

      const order = await orderRes.json() as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };

      await loadRazorpayCheckout();

      openCheckout(
        {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'NiyamHR',
          description: planDef.name + ' (' + cycle + ') - ' + employeeCount + ' employee' + (employeeCount > 1 ? 's' : ''),
          order_id: order.orderId,
          prefill: {
            email: profile.email,
            name: profile.displayName,
          },
          notes: {
            uid: user.uid,
            organizationId: profile.organizationId,
          },
          theme: { color: '#f59e0b' },  // amber-500
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const idToken2 = await user.getIdToken();
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + idToken2,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({ error: 'Verification failed' }));
                throw new Error(err.error || 'Verification failed');
              }
              setStatus({
                type: 'success',
                msg: 'Plan activated. ' + planDef.name + ' (' + cycle + '), ' + employeeCount + ' employee' + (employeeCount > 1 ? 's' : '') + '.',
              });
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Verification failed';
              setStatus({
                type: 'error',
                msg: 'Payment received but activation pending. Reference: ' + response.razorpay_payment_id + '. (' + message + ')',
              });
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setStatus({ type: 'info', msg: 'Checkout dismissed. You can retry anytime.' });
            },
          },
        },
        (failure) => {
          setStatus({
            type: 'error',
            msg: 'Payment failed: ' + (failure.error?.description || failure.error?.reason || 'Unknown error'),
          });
          setLoading(false);
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setStatus({ type: 'error', msg: message });
      setLoading(false);
    }
  }, [user, profile, plan, cycle, employeeCount, planDef.name]);

  // Cancel subscription handler
  const handleCancelSubscription = useCallback(async () => {
    if (!user) return;
    setCancelling(true);
    setStatus(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + idToken,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Cancellation failed' }));
        throw new Error(err.error || 'Cancellation failed (HTTP ' + res.status + ')');
      }

      setShowCancelModal(false);
      setStatus({
        type: 'success',
        msg: 'Subscription cancelled. You retain access until the end of your current billing period. No further charges will be applied.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cancellation failed';
      setStatus({ type: 'error', msg: message });
    } finally {
      setCancelling(false);
    }
  }, [user]);

  // Render states
  if (!authReady || (!orgLoaded && user)) {
    return (
      <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </main>
    );
  }
  if (!user) return null;  // redirect in flight

  return (
    <main className="min-h-screen bg-black text-neutral-100 px-4 sm:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Billing</h1>
        <p className="text-neutral-400 mb-8">Manage your NiyamHR plan</p>

        {/* Current status banner */}
        {org && (
          <div className="mb-8 p-5 rounded-lg border border-neutral-800 bg-neutral-900/50">
            {isActive ? (
              <>
                <p className="text-sm text-neutral-400 mb-1">Current plan</p>
                <p className="text-xl font-semibold">
                  {org.plan && PLANS[org.plan] ? PLANS[org.plan].name : org.plan}
                  {' · '}
                  {org.billingCycle}
                  {' · '}
                  {org.paidEmployeeSlots} employee{(org.paidEmployeeSlots || 0) > 1 ? 's' : ''}
                </p>
                {org.currentPeriodEnd && (
                  <p className="text-sm text-neutral-400 mt-2">
                    Renews: {formatDate(org.currentPeriodEnd)}
                  </p>
                )}
              </>
            ) : isCancelled ? (
              <>
                <p className="text-sm text-amber-400 mb-1">Subscription cancelled</p>
                <p className="text-xl font-semibold">
                  {org.plan && PLANS[org.plan] ? PLANS[org.plan].name : org.plan}
                  {' · '}
                  {org.billingCycle}
                  {' · '}
                  {org.paidEmployeeSlots} employee{(org.paidEmployeeSlots || 0) > 1 ? 's' : ''}
                </p>
                {org.currentPeriodEnd && (
                  <p className="text-sm text-neutral-400 mt-2">
                    Access until: {formatDate(org.currentPeriodEnd)}
                  </p>
                )}
                {org.gracePeriodEnd && (
                  <p className="text-sm text-neutral-400 mt-1">
                    Data export grace period ends: {formatDate(org.gracePeriodEnd)}
                  </p>
                )}
                <p className="text-sm text-neutral-500 mt-3">
                  Reactivate by selecting a plan and paying below. See our{' '}
                  <Link href="/refund-cancellation" className="text-amber-400 hover:text-amber-300">Refund &amp; Cancellation Policy</Link>.
                </p>
              </>
            ) : (
              <p className="text-neutral-200">
                You're on a 30-day free trial. Activate a paid plan below to continue beyond trial.
              </p>
            )}
          </div>
        )}

        {/* Permission gate */}
        {profile && !isAdmin && (
          <div className="p-6 rounded-lg bg-red-950/30 border border-red-900 text-red-200">
            Only the Founder or HR Admin can manage billing for this organization.
          </div>
        )}

        {isAdmin && (
          <>
            {/* Plan tier */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Choose your plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(PLANS) as PlanId[]).map((id) => {
                  const p = PLANS[id];
                  const selected = plan === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPlan(id)}
                      className={
                        'text-left p-5 rounded-lg border-2 transition-colors ' +
                        (selected
                          ? 'border-amber-500 bg-amber-950/20'
                          : 'border-neutral-800 hover:border-neutral-600')
                      }
                    >
                      <p className="text-lg font-semibold">{p.name}</p>
                      <p className="text-sm text-neutral-400">{p.blurb}</p>
                      <p className="text-sm text-neutral-300 mt-2">
                        {formatINR(p.monthlyPerEmp)} / employee / month
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Billing cycle */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Billing cycle</h2>
              <div className="inline-flex rounded-lg border border-neutral-800 p-1 bg-neutral-900/50">
                <button
                  type="button"
                  onClick={() => setCycle('monthly')}
                  className={
                    'px-4 py-2 rounded transition-colors ' +
                    (cycle === 'monthly'
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-neutral-300 hover:text-neutral-100')
                  }
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('annual')}
                  className={
                    'px-4 py-2 rounded transition-colors ' +
                    (cycle === 'annual'
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-neutral-300 hover:text-neutral-100')
                  }
                >
                  Annual · Save 20%
                </button>
              </div>
            </section>

            {/* Employee count */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Number of employees</h2>
              <input
                type="number"
                min={1}
                max={planDef.maxEmployees}
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 w-32 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              {overLimit && (
                <p className="mt-2 text-sm text-red-400">
                  {planDef.name} caps at {planDef.maxEmployees} employees. Switch to Growth, or contact sales for Enterprise.
                </p>
              )}
            </section>

            {/* Summary + Pay */}
            <section className="p-6 rounded-lg bg-neutral-900/50 border border-neutral-800 mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-neutral-400">
                  {formatINR(ratePerEmp)} × {employeeCount} employee{employeeCount > 1 ? 's' : ''}
                </p>
                <p className="text-3xl font-bold">{formatINR(amount)}</p>
              </div>
              <p className="text-xs text-neutral-500 mb-2">
                Billed {cycle}. {cycle === 'annual' ? 'One payment for 12 months.' : 'Renews each month.'}
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                By proceeding, you agree to our{' '}
                <Link href="/terms" className="text-amber-500 hover:text-amber-400">Terms</Link>
                {' and '}
                <Link href="/refund-cancellation" className="text-amber-500 hover:text-amber-400">Refund &amp; Cancellation Policy</Link>.
              </p>
              <button
                type="button"
                onClick={handlePay}
                disabled={!isAdmin || loading || overLimit || employeeCount < 1 || isSamePlan}
                className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-amber-500 to-red-500 text-black disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {loading
                  ? 'Processing…'
                  : isSamePlan
                  ? 'You are already on this plan'
                  : 'Pay ' + formatINR(amount)}
              </button>
            </section>

            {/* Status */}
            {status && (
              <div
                className={
                  'p-4 rounded-lg border mb-6 ' +
                  (status.type === 'success'
                    ? 'bg-green-950/30 border-green-900 text-green-200'
                    : status.type === 'error'
                    ? 'bg-red-950/30 border-red-900 text-red-200'
                    : 'bg-blue-950/30 border-blue-900 text-blue-200')
                }
                role="status"
              >
                {status.msg}
              </div>
            )}

            {/* Cancel Subscription — only visible when active */}
            {isActive && (
              <section className="mt-12 p-6 rounded-lg border border-neutral-800 bg-neutral-900/30">
                <h2 className="text-lg font-semibold mb-2">Manage Subscription</h2>
                <p className="text-sm text-neutral-400 mb-4">
                  Cancel your subscription anytime. You will retain access until the end of your current billing period, then have 60 days to export your data before permanent deletion. See our{' '}
                  <Link href="/refund-cancellation" className="text-amber-500 hover:text-amber-400">Refund &amp; Cancellation Policy</Link>
                  {' for full details.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-5 py-2 rounded-lg border border-red-900/60 text-red-300 hover:bg-red-950/30 transition-colors text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              </section>
            )}
          </>
        )}
      </div>

      {/* Cancellation confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Cancel Subscription?</h3>
            <p className="text-neutral-300 mb-4">By cancelling, you confirm:</p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-300 mb-4 text-sm">
              <li>Cancellation takes effect immediately — no further charges</li>
              <li><strong className="text-white">No refund</strong> will be issued for the current billing period</li>
              <li>You retain access until {org?.currentPeriodEnd ? formatDate(org.currentPeriodEnd) : 'the end of your billing period'}</li>
              <li>60-day grace period after that to export your data</li>
              <li>Permanent data deletion after grace period ends</li>
            </ul>
            <p className="text-sm text-neutral-500 mb-6">
              Full terms in our <Link href="/refund-cancellation" className="text-amber-400 hover:text-amber-300 underline" target="_blank">Refund &amp; Cancellation Policy</Link>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
`;

  fs.writeFileSync(filePath, newBillingContent);
  summary.push('✓ Billing page: rewritten with Cancel Subscription button + modal + flow');
  summary.push('  - Added Cancel Subscription section (visible when active)');
  summary.push('  - Added confirmation modal');
  summary.push('  - Added handleCancelSubscription function calling POST /api/subscription/cancel');
  summary.push('  - Updated status banner to handle cancelled state');
  summary.push('  - Added cross-references to /refund-cancellation in checkout disclaimer');
}

// ====================================================================
// CLEANUP: Remove old patch scripts from working dir if still present
// ====================================================================
['patch-refund-cancellation.js', 'patch-fix-build-availability.js', 'patch-remove-address-from-refund.js'].forEach((f) => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    summary.push('✓ Cleaned up: removed ' + f + ' from working directory');
  }
});

// ====================================================================
// DONE
// ====================================================================
console.log('');
console.log('=== Patch 2 Summary ===');
summary.forEach((line) => console.log('  ' + line));
console.log('');
console.log('NEXT STEPS:');
console.log('  1. git add -A');
console.log('  2. git commit -m "feat: integrate refund-cancellation policy + cancel subscription button"');
console.log('  3. git push                    (auto-deploys via Firebase App Hosting)');
console.log('  4. Watch deploy at:');
console.log('     https://console.firebase.google.com/project/studio-731784467-aba01/apphosting');
console.log('  5. Once green, verify:');
console.log('     - https://niyamhr.in/terms              (footer with refund link)');
console.log('     - https://niyamhr.in/refund-cancellation (company name = Madraz Buzz Media)');
console.log('     - https://niyamhr.in/dashboard/billing   (Cancel button when active)');
console.log('  6. Clean up: Remove-Item patch-2-refund-integration.js');
