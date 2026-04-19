import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — server-only.
 * Uses Application Default Credentials when deployed to Firebase App Hosting
 * (the runtime automatically exposes the service account).
 * Locally, falls back to FIREBASE_SERVICE_ACCOUNT env var (JSON string) if set.
 */
function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try {
      const sa = JSON.parse(saJson);
      return initializeApp({ credential: cert(sa), projectId: sa.project_id });
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT present but invalid JSON; falling back to ADC');
    }
  }
  return initializeApp({ credential: applicationDefault() });
}

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
