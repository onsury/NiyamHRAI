import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Shared auth gate for server-side API routes.
 *
 * Usage:
 *   const authResult = await requireAuth(req);
 *   if (authResult.error) return authResult.error;
 *   const uid = authResult.uid;
 *
 * Matches the pattern in /api/ratings/route.ts (token validity check only;
 * does NOT enforce email_verified yet -- Phase 2 with H-1 will add that).
 */
export interface AuthSuccess {
  error?: undefined;
  uid: string;
  decoded: DecodedIdToken;
}

export interface AuthFailure {
  error: NextResponse;
  uid?: undefined;
  decoded?: undefined;
}

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '');

  if (!idToken) {
    return {
      error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }

  const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);

  if (!decoded) {
    return {
      error: NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 }),
    };
  }

  return { uid: decoded.uid, decoded };
}
