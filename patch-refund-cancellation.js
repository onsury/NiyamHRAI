// patch-refund-cancellation.js
// Creates: src/app/refund-cancellation/page.tsx
// Creates: src/app/api/subscription/cancel/route.ts
//
// Usage:
//   1. Save this file to D:\projects\NiyamHRAI\
//   2. Run: node patch-refund-cancellation.js
//   3. Then: npm run build  (to verify no errors)
//   4. Then: git add . && git commit -m "feat: refund-cancellation page + cancel api" && git push

const fs = require('fs');
const path = require('path');

// === DIRECTORIES ===
const refundPageDir = path.join('src', 'app', 'refund-cancellation');
const cancelApiDir = path.join('src', 'app', 'api', 'subscription', 'cancel');

if (!fs.existsSync(refundPageDir)) {
  fs.mkdirSync(refundPageDir, { recursive: true });
  console.log('✓ Created directory:', refundPageDir);
}

if (!fs.existsSync(cancelApiDir)) {
  fs.mkdirSync(cancelApiDir, { recursive: true });
  console.log('✓ Created directory:', cancelApiDir);
}

// === REFUND-CANCELLATION PAGE CONTENT ===
const pageContent = `import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy | NiyamHR',
  description:
    'Refund and cancellation terms for NiyamHR subscriptions. Effective 18 May 2026.',
};

export default function RefundCancellationPage() {
  return (
    <div className="min-h-screen bg-black text-stone-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-amber-400 hover:text-amber-300 text-sm mb-8 inline-block transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">
          Refund & Cancellation Policy
        </h1>

        <p className="text-stone-500 text-sm mb-12">
          Effective Date: 18 May 2026 · Last Updated: 18 May 2026
        </p>

        <div className="space-y-8 text-stone-300 leading-relaxed">
          <p>
            This Refund &amp; Cancellation Policy (&quot;Policy&quot;) governs the terms under
            which subscribers may cancel their NiyamHR subscription and request refunds. This
            Policy is part of and incorporated into the{' '}
            <Link href="/terms" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            of NiyamHR, operated by SmartDNA Business Intelligence &amp; Advisory
            (&quot;we&quot;, &quot;us&quot;, &quot;NiyamHR&quot;).
          </p>

          <Section title="1. Scope">
            <p>
              This Policy applies to all Starter and Growth plan subscribers of NiyamHR
              (niyamhr.in). Enterprise customers should refer to their signed Master Service
              Agreement for specific refund and cancellation terms.
            </p>
          </Section>

          <Section title="2. Refund Policy">
            <p>
              <strong className="text-white">All payments are final.</strong> NiyamHR does not
              provide refunds for subscription fees once paid. By subscribing, you acknowledge
              and agree that no refund will be issued for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
              <li>The current billing period</li>
              <li>Unused portions of paid subscription terms</li>
              <li>Subscriptions cancelled mid-cycle</li>
              <li>Inactive use of the service after activation</li>
            </ul>

            <SubSection title="2.1 Exceptions">
              <p>
                Refunds may be considered, at NiyamHR&apos;s sole discretion, only in the
                following exceptional circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
                <li>
                  <strong className="text-white">Duplicate charge:</strong> If you were billed
                  twice for the same period due to a technical error, the duplicate charge will
                  be refunded in full.
                </li>
                <li>
                  <strong className="text-white">Extended service unavailability:</strong> If
                  NiyamHR experiences service unavailability exceeding 72 consecutive hours
                  directly attributable to our infrastructure (excluding scheduled maintenance
                  or force majeure events), affected customers may request a service credit or
                  pro-rated refund.
                </li>
                <li>
                  <strong className="text-white">Statutory requirement:</strong> Where required
                  by applicable Indian law.
                </li>
              </ul>
              <p className="mt-3">
                Refund requests under these exceptions must be submitted in writing to{' '}
                <a
                  href="mailto:support@niyamhr.in"
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  support@niyamhr.in
                </a>{' '}
                within 30 days of the relevant event.
              </p>
            </SubSection>
          </Section>

          <Section title="3. Cancellation Policy">
            <SubSection title="3.1 How to Cancel">
              <p>You may cancel your NiyamHR subscription at any time through:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-3 marker:text-amber-400">
                <li>
                  <strong className="text-white">In-dashboard:</strong> Navigate to Dashboard →
                  Billing → Cancel Subscription
                </li>
                <li>
                  <strong className="text-white">Email:</strong> Send a cancellation request to
                  support@niyamhr.in from your registered email address
                </li>
              </ol>
            </SubSection>

            <SubSection title="3.2 Effective Date">
              <p>
                Cancellation takes effect{' '}
                <strong className="text-white">immediately upon confirmation</strong>. Upon
                cancellation:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
                <li>No further charges will be applied to your account</li>
                <li>
                  You retain full access to NiyamHR services until the end of your current
                  billing period (which you have already paid for)
                </li>
                <li>
                  After your current paid period ends, your account moves to the grace period
                  described in Section 4
                </li>
              </ul>
            </SubSection>

            <SubSection title="3.3 No Refund Triggered">
              <p>
                Cancellation does not entitle you to a refund of the current billing period.
                You receive what you paid for — full access until the end of the period.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Data Retention After Cancellation">
            <p>
              We respect your data and provide a reasonable window to export it after
              cancellation.
            </p>

            <SubSection title="4.1 Grace Period (60 Days)">
              <p>
                For <strong className="text-white">60 days</strong> following the end of your
                last paid billing period, your data remains in your NiyamHR account in
                read-only mode. During this grace period, you may:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
                <li>Log in to your account</li>
                <li>
                  View all historical data including DNA assessments, weekly check-ins, honing
                  sessions, and reports
                </li>
                <li>Export your data through available export tools</li>
                <li>Reactivate your subscription with full data restoration (no data loss)</li>
              </ul>
            </SubSection>

            <SubSection title="4.2 After 60 Days">
              <p>After the 60-day grace period expires:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
                <li>
                  All customer data will be{' '}
                  <strong className="text-white">permanently deleted</strong> from NiyamHR&apos;s
                  active systems
                </li>
                <li>Account access will be permanently revoked</li>
                <li>
                  Reactivation thereafter requires starting fresh as a new customer
                </li>
              </ul>
              <p className="mt-3">
                Encrypted backups may be retained for additional periods solely as required by
                applicable Indian law (such as tax records retention requirements), but will
                not be accessible for restoration or export.
              </p>
            </SubSection>

            <SubSection title="4.3 Right to Earlier Deletion">
              <p>
                If you wish to have your data deleted sooner than 60 days, you may submit a
                written deletion request to support@niyamhr.in. We will process such requests
                within 7 business days, subject to applicable legal retention requirements.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Trial Subscriptions">
            <p>
              Free trials do not require payment information and are not subject to refunds
              (as no payment was made). Trial subscriptions:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
              <li>Automatically end after 30 days unless converted to a paid plan</li>
              <li>May be cancelled at any time with no obligation</li>
              <li>Result in data retention per Section 4 above if not converted to paid</li>
            </ul>
          </Section>

          <Section title="6. Disputes & Chargebacks">
            <p>
              If you believe a charge is in error, please contact us at support@niyamhr.in{' '}
              <strong className="text-white">before</strong> initiating a payment dispute or
              chargeback with your card issuer. We aim to respond to all billing inquiries
              within 2 business days.
            </p>
            <p className="mt-3">
              Unauthorized chargebacks may result in immediate account suspension and
              forfeiture of access to your data during the dispute period.
            </p>
          </Section>

          <Section title="7. Enterprise Plan Customers">
            <p>
              Enterprise plan customers are governed by separate written agreements (Master
              Service Agreement). Terms in such agreements supersede this Policy.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>
              We may update this Policy from time to time to reflect changes in our practices,
              our services, or legal requirements. Material changes will be communicated via:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
              <li>Email notification to registered account holders</li>
              <li>Update banner on the NiyamHR dashboard</li>
              <li>Revised &quot;Last Updated&quot; date at the top of this Policy</li>
            </ul>
            <p className="mt-3">
              Continued use of NiyamHR after such changes constitutes acceptance of the updated
              Policy.
            </p>
          </Section>

          <Section title="9. Compliance">
            <p>This Policy is designed to comply with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3 marker:text-amber-400">
              <li>The Digital Personal Data Protection Act, 2023 (DPDPA)</li>
              <li>Reserve Bank of India guidelines for digital payments</li>
              <li>Razorpay merchant terms of service</li>
            </ul>
          </Section>

          <Section title="10. Contact">
            <p>For any questions regarding refunds, cancellations, or data handling:</p>
            <div className="mt-4 space-y-2 pl-4 border-l-2 border-amber-500/40">
              <p>
                <strong className="text-white">Email:</strong>{' '}
                <a
                  href="mailto:support@niyamhr.in"
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  support@niyamhr.in
                </a>
              </p>
              <p>
                <strong className="text-white">Address:</strong> SmartDNA Business Intelligence
                &amp; Advisory, Flat-G Balaji Shree Apart, 40-41 6th Main Road, RA, Chennai,
                Tamil Nadu 600028, India
              </p>
              <p>
                <strong className="text-white">Business Hours:</strong> Monday–Friday, 10:00 AM
                – 6:00 PM IST
              </p>
            </div>
          </Section>
        </div>

        <div className="mt-20 pt-8 border-t border-stone-800 text-sm text-stone-500 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <Link href="/terms" className="hover:text-amber-400 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-amber-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/security" className="hover:text-amber-400 transition-colors">
            Security
          </Link>
          <Link href="/contact" className="hover:text-amber-400 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4 text-white tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-stone-100">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
`;

// === CANCEL SUBSCRIPTION API ROUTE CONTENT ===
const cancelRouteContent = `import { NextRequest, NextResponse } from 'next/server';
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
`;

// === WRITE FILES ===
const pagePath = path.join(refundPageDir, 'page.tsx');
fs.writeFileSync(pagePath, pageContent);
console.log('✓ Created:', pagePath);

const routePath = path.join(cancelApiDir, 'route.ts');
fs.writeFileSync(routePath, cancelRouteContent);
console.log('✓ Created:', routePath);

console.log('');
console.log('=== DONE ===');
console.log('New page accessible at: /refund-cancellation');
console.log('New API endpoint:       POST /api/subscription/cancel');
console.log('');
console.log('NEXT STEPS:');
console.log('  1. npm run build         (verify no errors)');
console.log('  2. git add .');
console.log('  3. git commit -m "feat: refund-cancellation page + cancel api"');
console.log('  4. git push              (auto-deploys via Firebase App Hosting)');
console.log('  5. Visit niyamhr.in/refund-cancellation to verify');
console.log('');
console.log('STILL NEEDED (Patch 2 - paste these files to Claude):');
console.log('  - src/components/layout/footer.tsx (or wherever your footer lives)');
console.log('  - src/app/terms/page.tsx');
console.log('  - src/app/dashboard/billing/page.tsx');
