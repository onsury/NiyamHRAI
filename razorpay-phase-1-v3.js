#!/usr/bin/env node
/**
 * NiyamHR - Razorpay Phase 1 (v3) backend patch
 *
 * v3 change vs v2:
 *   - Firebase Admin auth via Application Default Credentials (ADC).
 *     Firebase App Hosting reserves env var names starting with FIREBASE_,
 *     so explicit FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY won't bind.
 *     ADC auto-uses the App Hosting service account in production; local dev
 *     points GOOGLE_APPLICATION_CREDENTIALS at the downloaded service-account JSON.
 *
 * v2 baseline:
 *   - Schema: organizations/{orgId}, users/{uid}.organizationId + role
 *   - Routes: order / verify / webhook, all using adminAuth() and adminDb()
 *   - In-place firestore.rules patch (idempotent)
 *
 * Run from: D:\projects\NiyamHRAI
 * Usage:    node razorpay-phase-1-v3.js
 *
 * Existing files are backed up to <file>.bak.<timestamp>.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  console.error("ERROR: package.json not found. Run from D:\\projects\\NiyamHRAI");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
if (!pkg.dependencies || !pkg.dependencies.next) {
  console.error("ERROR: not a Next.js project (no 'next' in deps).");
  process.exit(1);
}

function write(rel, contents, opts) {
  opts = opts || {};
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const exists = fs.existsSync(full);
  if (exists && opts.skipIfExists) {
    console.log("  skip   " + rel + " (exists)");
    return;
  }
  if (exists) {
    const bak = full + ".bak." + Date.now();
    fs.copyFileSync(full, bak);
    console.log("  bak    " + path.basename(bak));
  }
  fs.writeFileSync(full, contents, "utf8");
  console.log("  " + (exists ? "write " : "new   ") + rel);
}

console.log("=== NiyamHR Razorpay Phase 1 v3 patch ===");
console.log("Root: " + ROOT);
console.log("");

// =====================================================================
// src/lib/razorpay/client.ts  (v3: Application Default Credentials)
// =====================================================================
const CLIENT_TS = [
  "import Razorpay from 'razorpay';",
  "import { getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';",
  "import { getAuth as adminGetAuth } from 'firebase-admin/auth';",
  "import { getFirestore } from 'firebase-admin/firestore';",
  "",
  "if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {",
  "  console.warn('[razorpay/client] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing - order creation will fail.');",
  "}",
  "",
  "export const razorpay = new Razorpay({",
  "  key_id: process.env.RAZORPAY_KEY_ID || '',",
  "  key_secret: process.env.RAZORPAY_KEY_SECRET || '',",
  "});",
  "",
  "export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';",
  "export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';",
  "export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';",
  "",
  "let adminApp: App | undefined;",
  "",
  "/**",
  " * Firebase Admin SDK init via Application Default Credentials.",
  " * - Production (Firebase App Hosting): auto-picks up the attached service account.",
  " * - Local dev: requires GOOGLE_APPLICATION_CREDENTIALS env var pointing at the",
  " *   service-account JSON file you downloaded.",
  " * Reason: App Hosting reserves env vars prefixed with FIREBASE_ / X_GOOGLE_ / EXT_,",
  " * so we cannot pass FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY directly.",
  " */",
  "export function ensureAdmin(): App {",
  "  if (adminApp) return adminApp;",
  "  const existing = getApps();",
  "  if (existing.length) {",
  "    adminApp = existing[0];",
  "    return adminApp;",
  "  }",
  "  adminApp = initializeApp({",
  "    credential: applicationDefault(),",
  "  });",
  "  return adminApp;",
  "}",
  "",
  "export function adminAuth() {",
  "  ensureAdmin();",
  "  return adminGetAuth();",
  "}",
  "",
  "export function adminDb() {",
  "  ensureAdmin();",
  "  return getFirestore();",
  "}",
  "",
].join("\n");
write("src/lib/razorpay/client.ts", CLIENT_TS);

// =====================================================================
// src/lib/razorpay/plans.ts  (unchanged from v1 - no schema dependency)
// =====================================================================
const PLANS_TS = [
  "export type PlanId = 'starter' | 'growth';",
  "export type BillingCycle = 'monthly' | 'annual';",
  "",
  "export interface PlanDef {",
  "  id: PlanId;",
  "  name: string;",
  "  maxEmployees: number;",
  "  rates: {",
  "    monthly: number;  // paise per employee per month",
  "    annual: number;   // paise per employee per year (already discounted)",
  "  };",
  "}",
  "",
  "/**",
  " * NiyamHR pricing - source: niyamhr.in pricing page.",
  " *",
  " * Starter: Rs 1,249/emp/mo  OR  Rs 999 x 12 = Rs 11,988/emp/yr (~20% off annual)",
  " * Growth:  Rs 2,499/emp/mo  OR  Rs 1,999 x 12 = Rs 23,988/emp/yr (~20% off annual)",
  " *",
  " * Enterprise: Custom - NOT routed through Razorpay (Contact Sales flow).",
  " */",
  "export const PLANS: Record<PlanId, PlanDef> = {",
  "  starter: {",
  "    id: 'starter',",
  "    name: 'Starter',",
  "    maxEmployees: 10,",
  "    rates: {",
  "      monthly: 124900,",
  "      annual: 1198800,",
  "    },",
  "  },",
  "  growth: {",
  "    id: 'growth',",
  "    name: 'Growth',",
  "    maxEmployees: 100,",
  "    rates: {",
  "      monthly: 249900,",
  "      annual: 2398800,",
  "    },",
  "  },",
  "};",
  "",
  "export function computeAmount(",
  "  planId: PlanId,",
  "  cycle: BillingCycle,",
  "  employeeCount: number",
  "): number {",
  "  const plan = PLANS[planId];",
  "  if (!plan) throw new Error(`Unknown plan: ${planId}`);",
  "  if (!Number.isInteger(employeeCount) || employeeCount < 1) {",
  "    throw new Error('employeeCount must be a positive integer');",
  "  }",
  "  if (employeeCount > plan.maxEmployees) {",
  "    throw new Error(",
  "      `${plan.name} plan caps at ${plan.maxEmployees} employees. Upgrade tier or contact sales.`",
  "    );",
  "  }",
  "  return plan.rates[cycle] * employeeCount;",
  "}",
  "",
].join("\n");
write("src/lib/razorpay/plans.ts", PLANS_TS);

// =====================================================================
// src/app/api/razorpay/order/route.ts  (REFACTORED for organizations schema)
// =====================================================================
const ORDER_TS = [
  "import { NextRequest, NextResponse } from 'next/server';",
  "import { FieldValue } from 'firebase-admin/firestore';",
  "import { razorpay, RAZORPAY_KEY_ID, adminAuth, adminDb } from '@/lib/razorpay/client';",
  "import { PLANS, type PlanId, type BillingCycle, computeAmount } from '@/lib/razorpay/plans';",
  "",
  "export const runtime = 'nodejs';",
  "export const dynamic = 'force-dynamic';",
  "",
  "export async function POST(req: NextRequest) {",
  "  try {",
  "    // --- Auth: Bearer ID token ---",
  "    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');",
  "    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {",
  "      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });",
  "    }",
  "    const idToken = authHeader.slice(7).trim();",
  "",
  "    let uid: string;",
  "    let email: string | undefined;",
  "    try {",
  "      const decoded = await adminAuth().verifyIdToken(idToken);",
  "      uid = decoded.uid;",
  "      email = decoded.email;",
  "    } catch {",
  "      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });",
  "    }",
  "",
  "    // --- Validate body ---",
  "    const body = await req.json().catch(() => ({}));",
  "    const { plan, cycle, employeeCount, organizationId } = body as {",
  "      plan?: PlanId;",
  "      cycle?: BillingCycle;",
  "      employeeCount?: number;",
  "      organizationId?: string;",
  "    };",
  "",
  "    if (!plan || !PLANS[plan]) {",
  "      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });",
  "    }",
  "    if (cycle !== 'monthly' && cycle !== 'annual') {",
  "      return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 });",
  "    }",
  "    if (!organizationId || typeof organizationId !== 'string') {",
  "      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });",
  "    }",
  "    if (typeof employeeCount !== 'number' || employeeCount < 1) {",
  "      return NextResponse.json({ error: 'employeeCount must be >= 1' }, { status: 400 });",
  "    }",
  "",
  "    // --- Auth: caller must be FOUNDER or HR_ADMIN of the org ---",
  "    // Mirrors firestore.rules isAdminOfOrg() pattern.",
  "    const db = adminDb();",
  "    const userSnap = await db.collection('users').doc(uid).get();",
  "    if (!userSnap.exists) {",
  "      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });",
  "    }",
  "    const userData = userSnap.data() as { organizationId?: string; role?: string };",
  "    const isAdmin =",
  "      userData.organizationId === organizationId &&",
  "      (userData.role === 'FOUNDER' || userData.role === 'HR_ADMIN');",
  "    if (!isAdmin) {",
  "      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });",
  "    }",
  "",
  "    // --- Verify org exists ---",
  "    const orgSnap = await db.collection('organizations').doc(organizationId).get();",
  "    if (!orgSnap.exists) {",
  "      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });",
  "    }",
  "",
  "    // --- Compute amount in paise ---",
  "    let amount: number;",
  "    try {",
  "      amount = computeAmount(plan, cycle, employeeCount);",
  "    } catch (e) {",
  "      const msg = e instanceof Error ? e.message : 'Invalid amount';",
  "      return NextResponse.json({ error: msg }, { status: 400 });",
  "    }",
  "",
  "    // Razorpay receipt: max 40 chars",
  "    const receipt = ('nh_' + organizationId.slice(0, 8) + '_' + Date.now()).slice(0, 40);",
  "",
  "    // --- Create order on Razorpay ---",
  "    const order = await razorpay.orders.create({",
  "      amount,",
  "      currency: 'INR',",
  "      receipt,",
  "      notes: {",
  "        uid,",
  "        organizationId,",
  "        plan,",
  "        cycle,",
  "        employeeCount: String(employeeCount),",
  "      },",
  "    });",
  "",
  "    // --- Stash pending metadata for webhook fallback ---",
  "    await db.collection('pending_orders').doc(order.id).set({",
  "      uid,",
  "      email: email || null,",
  "      organizationId,",
  "      plan,",
  "      cycle,",
  "      employeeCount,",
  "      amount,",
  "      currency: 'INR',",
  "      receipt,",
  "      createdAt: FieldValue.serverTimestamp(),",
  "    });",
  "",
  "    return NextResponse.json({",
  "      orderId: order.id,",
  "      amount,",
  "      currency: 'INR',",
  "      keyId: RAZORPAY_KEY_ID,",
  "      plan,",
  "      cycle,",
  "      employeeCount,",
  "      organizationId,",
  "    });",
  "  } catch (err) {",
  "    console.error('[razorpay/order] error:', err);",
  "    const msg = err instanceof Error ? err.message : 'Internal error';",
  "    return NextResponse.json({ error: msg }, { status: 500 });",
  "  }",
  "}",
  "",
].join("\n");
write("src/app/api/razorpay/order/route.ts", ORDER_TS);

// =====================================================================
// src/app/api/razorpay/verify/route.ts  (REFACTORED)
// =====================================================================
const VERIFY_TS = [
  "import { NextRequest, NextResponse } from 'next/server';",
  "import crypto from 'crypto';",
  "import { FieldValue, Timestamp } from 'firebase-admin/firestore';",
  "import { adminAuth, adminDb } from '@/lib/razorpay/client';",
  "",
  "export const runtime = 'nodejs';",
  "export const dynamic = 'force-dynamic';",
  "",
  "export async function POST(req: NextRequest) {",
  "  try {",
  "    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');",
  "    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {",
  "      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });",
  "    }",
  "    const idToken = authHeader.slice(7).trim();",
  "",
  "    let uid: string;",
  "    try {",
  "      const decoded = await adminAuth().verifyIdToken(idToken);",
  "      uid = decoded.uid;",
  "    } catch {",
  "      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });",
  "    }",
  "",
  "    const body = await req.json().catch(() => ({}));",
  "    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =",
  "      body as Record<string, string>;",
  "",
  "    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {",
  "      return NextResponse.json({ error: 'Missing signature params' }, { status: 400 });",
  "    }",
  "",
  "    const secret = process.env.RAZORPAY_KEY_SECRET;",
  "    if (!secret) {",
  "      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });",
  "    }",
  "",
  "    // HMAC-SHA256(order_id + '|' + payment_id, key_secret)",
  "    const expected = crypto",
  "      .createHmac('sha256', secret)",
  "      .update(razorpay_order_id + '|' + razorpay_payment_id)",
  "      .digest('hex');",
  "",
  "    if (expected !== razorpay_signature) {",
  "      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });",
  "    }",
  "",
  "    const db = adminDb();",
  "    const pendingRef = db.collection('pending_orders').doc(razorpay_order_id);",
  "    const pendingSnap = await pendingRef.get();",
  "    if (!pendingSnap.exists) {",
  "      // webhook already processed, or replay attempt",
  "      const existing = await db.collection('payments').doc(razorpay_payment_id).get();",
  "      if (existing.exists) {",
  "        return NextResponse.json({ ok: true, alreadyApplied: true });",
  "      }",
  "      return NextResponse.json({ error: 'Order metadata not found' }, { status: 404 });",
  "    }",
  "    const meta = pendingSnap.data() as {",
  "      uid: string;",
  "      organizationId: string;",
  "      plan: string;",
  "      cycle: 'monthly' | 'annual';",
  "      employeeCount: number;",
  "      amount: number;",
  "    };",
  "",
  "    if (meta.uid !== uid) {",
  "      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });",
  "    }",
  "",
  "    const { organizationId, plan, cycle, employeeCount, amount } = meta;",
  "    const now = FieldValue.serverTimestamp();",
  "    const periodMs =",
  "      cycle === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;",
  "    const periodEnd = Timestamp.fromDate(new Date(Date.now() + periodMs));",
  "",
  "    const batch = db.batch();",
  "",
  "    batch.set(",
  "      db.collection('payments').doc(razorpay_payment_id),",
  "      {",
  "        uid,",
  "        organizationId,",
  "        razorpayOrderId: razorpay_order_id,",
  "        razorpayPaymentId: razorpay_payment_id,",
  "        razorpaySignature: razorpay_signature,",
  "        amount,",
  "        currency: 'INR',",
  "        plan,",
  "        cycle,",
  "        employeeCount,",
  "        status: 'verified',",
  "        verifiedVia: 'client_callback',",
  "        createdAt: now,",
  "      },",
  "      { merge: true }",
  "    );",
  "",
  "    batch.set(",
  "      db.collection('organizations').doc(organizationId),",
  "      {",
  "        plan,",
  "        billingCycle: cycle,",
  "        paidEmployeeSlots: employeeCount,",
  "        subscriptionStatus: 'active',",
  "        currentPeriodStart: now,",
  "        currentPeriodEnd: periodEnd,",
  "        lastPaymentId: razorpay_payment_id,",
  "        lastPaymentAt: now,",
  "        updatedAt: now,",
  "      },",
  "      { merge: true }",
  "    );",
  "",
  "    batch.delete(pendingRef);",
  "    await batch.commit();",
  "",
  "    return NextResponse.json({",
  "      ok: true,",
  "      plan,",
  "      cycle,",
  "      employeeCount,",
  "      currentPeriodEnd: periodEnd.toDate().toISOString(),",
  "    });",
  "  } catch (err) {",
  "    console.error('[razorpay/verify] error:', err);",
  "    const msg = err instanceof Error ? err.message : 'Internal error';",
  "    return NextResponse.json({ error: msg }, { status: 500 });",
  "  }",
  "}",
  "",
].join("\n");
write("src/app/api/razorpay/verify/route.ts", VERIFY_TS);

// =====================================================================
// src/app/api/razorpay/webhook/route.ts  (REFACTORED)
// =====================================================================
const WEBHOOK_TS = [
  "import { NextRequest, NextResponse } from 'next/server';",
  "import crypto from 'crypto';",
  "import { FieldValue, Timestamp } from 'firebase-admin/firestore';",
  "import { adminDb, RAZORPAY_WEBHOOK_SECRET } from '@/lib/razorpay/client';",
  "",
  "export const runtime = 'nodejs';",
  "export const dynamic = 'force-dynamic';",
  "",
  "/**",
  " * Razorpay webhook receiver.",
  " * Auth = HMAC signature only. Configure secret in Razorpay dashboard and set",
  " * RAZORPAY_WEBHOOK_SECRET in env.",
  " *",
  " * Acts as a FALLBACK to /verify. Idempotent with verify - whichever runs first wins,",
  " * the other detects the existing payments doc and exits cleanly.",
  " */",
  "export async function POST(req: NextRequest) {",
  "  if (!RAZORPAY_WEBHOOK_SECRET) {",
  "    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET not set');",
  "    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });",
  "  }",
  "",
  "  const rawBody = await req.text();",
  "  const signature = req.headers.get('x-razorpay-signature');",
  "",
  "  if (!signature) {",
  "    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });",
  "  }",
  "",
  "  const expected = crypto",
  "    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)",
  "    .update(rawBody)",
  "    .digest('hex');",
  "",
  "  if (expected !== signature) {",
  "    console.warn('[razorpay/webhook] Signature mismatch');",
  "    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });",
  "  }",
  "",
  "  type WebhookEvent = {",
  "    event?: string;",
  "    id?: string;",
  "    payload?: {",
  "      payment?: { entity?: Record<string, unknown> };",
  "      order?: { entity?: Record<string, unknown> };",
  "    };",
  "  };",
  "",
  "  let event: WebhookEvent;",
  "  try {",
  "    event = JSON.parse(rawBody);",
  "  } catch {",
  "    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });",
  "  }",
  "",
  "  const db = adminDb();",
  "  const eventType = event.event;",
  "  const payment = event.payload?.payment?.entity as Record<string, unknown> | undefined;",
  "",
  "  try {",
  "    await db.collection('razorpay_webhook_log').add({",
  "      eventType: eventType || null,",
  "      eventId: event.id || null,",
  "      paymentId: (payment?.id as string) || null,",
  "      orderId: (payment?.order_id as string) || null,",
  "      receivedAt: FieldValue.serverTimestamp(),",
  "    });",
  "",
  "    if (eventType === 'payment.captured' && payment) {",
  "      const paymentId = payment.id as string;",
  "      const orderId = payment.order_id as string;",
  "      const pendingRef = db.collection('pending_orders').doc(orderId);",
  "      const pendingSnap = await pendingRef.get();",
  "      const paymentRef = db.collection('payments').doc(paymentId);",
  "",
  "      if (pendingSnap.exists) {",
  "        const meta = pendingSnap.data() as {",
  "          uid: string;",
  "          organizationId: string;",
  "          plan: string;",
  "          cycle: 'monthly' | 'annual';",
  "          employeeCount: number;",
  "        };",
  "        const { uid, organizationId, plan, cycle, employeeCount } = meta;",
  "        const periodMs =",
  "          cycle === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;",
  "        const periodEnd = Timestamp.fromDate(new Date(Date.now() + periodMs));",
  "",
  "        const batch = db.batch();",
  "        batch.set(",
  "          paymentRef,",
  "          {",
  "            uid,",
  "            organizationId,",
  "            razorpayOrderId: orderId,",
  "            razorpayPaymentId: paymentId,",
  "            amount: payment.amount,",
  "            currency: payment.currency,",
  "            plan,",
  "            cycle,",
  "            employeeCount,",
  "            status: 'captured',",
  "            method: payment.method,",
  "            email: payment.email,",
  "            contact: payment.contact,",
  "            capturedAt: FieldValue.serverTimestamp(),",
  "            verifiedVia: 'webhook',",
  "          },",
  "          { merge: true }",
  "        );",
  "        batch.set(",
  "          db.collection('organizations').doc(organizationId),",
  "          {",
  "            plan,",
  "            billingCycle: cycle,",
  "            paidEmployeeSlots: employeeCount,",
  "            subscriptionStatus: 'active',",
  "            currentPeriodStart: FieldValue.serverTimestamp(),",
  "            currentPeriodEnd: periodEnd,",
  "            lastPaymentId: paymentId,",
  "            lastPaymentAt: FieldValue.serverTimestamp(),",
  "            updatedAt: FieldValue.serverTimestamp(),",
  "          },",
  "          { merge: true }",
  "        );",
  "        batch.delete(pendingRef);",
  "        await batch.commit();",
  "      } else {",
  "        // verify already ran - just confirm capture",
  "        await paymentRef.set(",
  "          {",
  "            razorpayPaymentId: paymentId,",
  "            razorpayOrderId: orderId,",
  "            amount: payment.amount,",
  "            currency: payment.currency,",
  "            status: 'captured',",
  "            method: payment.method,",
  "            capturedAt: FieldValue.serverTimestamp(),",
  "          },",
  "          { merge: true }",
  "        );",
  "      }",
  "    } else if (eventType === 'payment.failed' && payment) {",
  "      await db.collection('payments').doc(payment.id as string).set(",
  "        {",
  "          razorpayPaymentId: payment.id,",
  "          razorpayOrderId: payment.order_id,",
  "          amount: payment.amount,",
  "          currency: payment.currency,",
  "          status: 'failed',",
  "          errorCode: payment.error_code,",
  "          errorDescription: payment.error_description,",
  "          errorSource: payment.error_source,",
  "          failedAt: FieldValue.serverTimestamp(),",
  "        },",
  "        { merge: true }",
  "      );",
  "    }",
  "",
  "    return NextResponse.json({ ok: true });",
  "  } catch (err) {",
  "    console.error('[razorpay/webhook] handler error:', err);",
  "    return NextResponse.json({ error: 'Handler error' }, { status: 500 });",
  "  }",
  "}",
  "",
].join("\n");
write("src/app/api/razorpay/webhook/route.ts", WEBHOOK_TS);

// =====================================================================
// .env.local.example  (v3: uses ADC via GOOGLE_APPLICATION_CREDENTIALS)
// =====================================================================
const ENV_EXAMPLE = [
  "# === Razorpay (Phase 1) ===",
  "# Get test keys: dashboard.razorpay.com > Account & Settings > API Keys > Generate Test Key",
  "RAZORPAY_KEY_ID=rzp_test_REPLACE_ME",
  "RAZORPAY_KEY_SECRET=REPLACE_ME",
  "",
  "# Webhook secret - set the real value AFTER creating the webhook in Razorpay dashboard.",
  "# Webhook URL to register: https://niyamhr.in/api/razorpay/webhook",
  "RAZORPAY_WEBHOOK_SECRET=pending",
  "",
  "# Client-side Checkout SDK (Phase 2)",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_REPLACE_ME",
  "",
  "# === Firebase Admin (Application Default Credentials) ===",
  "# Local dev only: path to the service account JSON you downloaded from",
  "# Firebase Console > Project Settings > Service Accounts > Generate New Private Key.",
  "# In production (App Hosting), credentials are auto-attached - this var is ignored.",
  "# IMPORTANT: add the JSON filename to .gitignore - NEVER commit it.",
  "GOOGLE_APPLICATION_CREDENTIALS=D:/projects/NiyamHRAI/service-account.json",
  "",
  "# === Firebase Web SDK (needed for local 'npm run build' to succeed) ===",
  "# In production these come from apphosting.yaml. For local dev copy from",
  "# Firebase Console > Project Settings > Your apps > Web app > Config.",
  "NEXT_PUBLIC_FIREBASE_API_KEY=",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-731784467-aba01",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=",
  "NEXT_PUBLIC_FIREBASE_APP_ID=",
  "",
].join("\n");
write(".env.local.example", ENV_EXAMPLE);
write(".env.local", ENV_EXAMPLE, { skipIfExists: true });

// Append service-account.json to .gitignore (idempotent)
const giPath = path.join(ROOT, ".gitignore");
if (fs.existsSync(giPath)) {
  const gi = fs.readFileSync(giPath, "utf8");
  if (!gi.split(/\r?\n/).some(function (l) { return l.trim() === "service-account.json"; })) {
    const sep = gi.endsWith("\n") ? "" : "\n";
    fs.writeFileSync(giPath, gi + sep + "\n# Firebase Admin service account (NEVER commit)\nservice-account.json\n", "utf8");
    console.log("  patch  .gitignore: added service-account.json");
  } else {
    console.log("  ok     .gitignore: service-account.json already ignored");
  }
} else {
  console.log("  WARN   .gitignore not found - add 'service-account.json' manually");
}

// =====================================================================
// firestore.rules  (in-place patch, idempotent)
// =====================================================================
const rulesPath = path.join(ROOT, "firestore.rules");
if (!fs.existsSync(rulesPath)) {
  console.log("  skip   firestore.rules (not found - patch manually)");
} else {
  let rules = fs.readFileSync(rulesPath, "utf8");
  let changed = false;

  // --- (a) Tighten organizations update rule to block client billing writes ---
  const OLD_UPDATE = "      allow update: if isAdminOfOrg(orgId);";
  const NEW_UPDATE = [
    "      allow update: if isAdminOfOrg(orgId)",
    "        && !request.resource.data.diff(resource.data).affectedKeys().hasAny([",
    "          'plan', 'billingCycle', 'paidEmployeeSlots',",
    "          'subscriptionStatus', 'currentPeriodStart', 'currentPeriodEnd',",
    "          'lastPaymentId', 'lastPaymentAt'",
    "        ]);",
  ].join("\n");

  if (rules.includes(NEW_UPDATE)) {
    console.log("  ok     firestore.rules: organizations update rule already tightened");
  } else if (rules.includes(OLD_UPDATE)) {
    rules = rules.replace(OLD_UPDATE, NEW_UPDATE);
    changed = true;
    console.log("  patch  firestore.rules: organizations update rule tightened");
  } else {
    console.log("  WARN   firestore.rules: could not locate organizations update rule to patch");
    console.log("         (looking for: '      allow update: if isAdminOfOrg(orgId);')");
    console.log("         You will need to add the billing-field block manually.");
  }

  // --- (b) Append new Razorpay collection matches before the deny-all ---
  const DENY_MARKER = "    // Deny everything else\n    match /{document=**} {";
  const NEW_MATCHES = [
    "    // === Razorpay Payments (server writes only; org admins + payer can read) ===",
    "    match /payments/{paymentId} {",
    "      allow read: if isSignedIn() && (",
    "        resource.data.uid == request.auth.uid ||",
    "        isAdminOfOrg(resource.data.organizationId)",
    "      );",
    "      allow write: if false;",
    "    }",
    "",
    "    // === Razorpay Pending Orders (server-only; transient) ===",
    "    match /pending_orders/{orderId} {",
    "      allow read, write: if false;",
    "    }",
    "",
    "    // === Razorpay Webhook Audit Log (server-only) ===",
    "    match /razorpay_webhook_log/{logId} {",
    "      allow read, write: if false;",
    "    }",
    "",
    "",
  ].join("\n");

  if (rules.includes("match /payments/{paymentId}")) {
    console.log("  ok     firestore.rules: razorpay collection matches already present");
  } else if (rules.includes(DENY_MARKER)) {
    rules = rules.replace(DENY_MARKER, NEW_MATCHES + DENY_MARKER);
    changed = true;
    console.log("  patch  firestore.rules: added payments, pending_orders, razorpay_webhook_log matches");
  } else {
    console.log("  WARN   firestore.rules: could not locate deny-all marker to insert before");
    console.log("         Add the three matches manually before 'match /{document=**}'.");
  }

  if (changed) {
    const bak = rulesPath + ".bak." + Date.now();
    fs.copyFileSync(rulesPath, bak);
    console.log("  bak    " + path.basename(bak));
    fs.writeFileSync(rulesPath, rules, "utf8");
    console.log("  write  firestore.rules");
  }
}

console.log("");
console.log("=== Done. ===");
console.log("");
console.log("Razorpay secrets are already wired via 'firebase apphosting:secrets:set' -");
console.log("the CLI auto-bound them in apphosting.yaml. Firebase Admin uses Application");
console.log("Default Credentials, so no explicit FIREBASE_* env vars are needed.");
console.log("");
console.log("Next steps:");
console.log("  1. Fill .env.local with values:");
console.log("     - RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (test keys)");
console.log("     - NEXT_PUBLIC_RAZORPAY_KEY_ID (same as RAZORPAY_KEY_ID)");
console.log("     - GOOGLE_APPLICATION_CREDENTIALS (path to your service-account JSON)");
console.log("     - NEXT_PUBLIC_FIREBASE_* (from Firebase Console > Web app config)");
console.log("");
console.log("  2. Move your downloaded service-account JSON into the repo root and");
console.log("     rename it to service-account.json (matches the path in .env.local).");
console.log("     The .gitignore was patched to exclude this file.");
console.log("");
console.log("  3. Deploy firestore rules:");
console.log("     firebase deploy --only firestore:rules");
console.log("");
console.log("  4. Commit and push (App Hosting auto-builds on push):");
console.log("     git add -A");
console.log("     git commit -m 'Razorpay Phase 1 backend (organizations schema + ADC)'");
console.log("     git push");
console.log("");
console.log("  5. After App Hosting build completes, register the webhook:");
console.log("     dashboard.razorpay.com > Webhooks > Add new");
console.log("     URL: https://niyamhr.in/api/razorpay/webhook");
console.log("     Events: payment.captured, payment.failed");
console.log("     Set a secret (you choose the value, save it).");
console.log("     Then: firebase apphosting:secrets:set RAZORPAY_WEBHOOK_SECRET");
console.log("     (creates new version with real value; redeploy to pick it up)");
console.log("");
console.log("Note: FIREBASE_CLIENT_EMAIL secret is orphaned in Secret Manager (unused).");
console.log("To clean up later: firebase apphosting:secrets:destroy FIREBASE_CLIENT_EMAIL");
console.log("");
