"use client";

/**
 * NiyamHR billing page - Razorpay Checkout flow.
 *
 * Flow:
 *   1. Resolve current user via Firebase Auth
 *   2. Read users/{uid} to get organizationId + role; gate on FOUNDER | HR_ADMIN
 *   3. Subscribe to organizations/{orgId} for current plan state
 *   4. User picks plan (Starter | Growth), cycle (monthly | annual), employee count
 *   5. POST /api/razorpay/order with Bearer token -> {orderId, amount, currency, keyId}
 *   6. Load Razorpay Checkout SDK, open with order details
 *   7. On Checkout success handler: POST /api/razorpay/verify with the 3 razorpay_*
 *      response fields -> server verifies HMAC, writes payment, flips org to active
 *   8. Firestore subscription auto-refreshes the page state
 *
 * NOTE on Firebase imports: this assumes '@/lib/firebase' exports the Firebase
 * App instance as 'app'. If your project exports differently (e.g. 'firebaseApp'
 * or via '@/firebase/config'), adjust the import line below.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
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

  // Render states
  if (!authReady || !orgLoaded && user) {
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
            {org.subscriptionStatus === 'active' ? (
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
            ) : (
              <p className="text-neutral-200">
                You’re on a 30-day free trial. Activate a paid plan below to continue beyond trial.
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
              <p className="text-xs text-neutral-500 mb-4">
                Billed {cycle}. {cycle === 'annual' ? 'One payment for 12 months.' : 'Renews each month.'}
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
                  'p-4 rounded-lg border ' +
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
          </>
        )}
      </div>
    </main>
  );
}
