import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * In-memory rate limiter for /api/invite/validate (M-6).
 *
 * Cloud Run instances each hold their own Map. For low-traffic endpoints
 * like invite validation, Cloud Run rarely scales beyond 1 instance, so
 * this effectively caps a bot at 20 attempts/hour from a single IP.
 *
 * Warm-instance bypass is inherent to in-memory limiters on serverless.
 * If abuse escalates, migrate to a Firestore-backed counter.
 */
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitBuckets.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

function getClientIp(req: NextRequest): string {
  // Cloud Run sets x-forwarded-for with the real client IP first
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function GET(req: NextRequest) {
  // Rate limit first (cheapest rejection)
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec || 3600) } }
    );
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 400 });

  try {
    const snap = await adminDb.doc(`invites/${token}`).get();
    if (!snap.exists) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    const data = snap.data()!;
    if (data.acceptedAt) {
      return NextResponse.json({ error: 'ALREADY_USED' }, { status: 410 });
    }
    if (data.expiresAt && data.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'EXPIRED' }, { status: 410 });
    }

    // M-6: organizationId removed from response. Signup flow does not need it
    // on the client; /api/invite/accept reads it from the stored invite doc.
    // Only surface fields the signup page actually renders.
    return NextResponse.json({
      email: data.email,
      role: data.role,
      level: data.level,
      managerId: data.managerId || null,
      orgName: data.orgName || '',
      invitedByName: data.invitedByName || '',
    });
  } catch (err: any) {
    console.error('Invite validate error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
