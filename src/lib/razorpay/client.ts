import Razorpay from 'razorpay';
import { getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth as adminGetAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('[razorpay/client] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing - order creation will fail.');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let adminApp: App | undefined;

/**
 * Firebase Admin SDK init via Application Default Credentials.
 * - Production (Firebase App Hosting): auto-picks up the attached service account.
 * - Local dev: requires GOOGLE_APPLICATION_CREDENTIALS env var pointing at the
 *   service-account JSON file you downloaded.
 * Reason: App Hosting reserves env vars prefixed with FIREBASE_ / X_GOOGLE_ / EXT_,
 * so we cannot pass FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY directly.
 */
export function ensureAdmin(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length) {
    adminApp = existing[0];
    return adminApp;
  }
  adminApp = initializeApp({
    credential: applicationDefault(),
  });
  return adminApp;
}

export function adminAuth() {
  ensureAdmin();
  return adminGetAuth();
}

export function adminDb() {
  ensureAdmin();
  return getFirestore();
}
