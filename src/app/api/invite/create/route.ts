import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify caller
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!idToken) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    // Load caller's user doc
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (!userSnap.exists) return NextResponse.json({ error: 'NO_PROFILE' }, { status: 403 });
    const user = userSnap.data()!;
    if (!['FOUNDER', 'HR_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ error: 'NO_ORG' }, { status: 400 });

    // Body
    const { email, role, level, managerId } = await req.json();
    if (!email || !role || !level) return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    if (!['HR_ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
    }
    if (!['TOP', 'SENIOR', 'MIDDLE', 'JUNIOR'].includes(level)) {
      return NextResponse.json({ error: 'INVALID_LEVEL' }, { status: 400 });
    }

    // Generate token
    const token = randomBytes(24).toString('base64url');
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Load org name for the email-facing UI
    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    const orgName = orgSnap.exists ? (orgSnap.data()!.name || 'your organisation') : 'your organisation';

    await adminDb.doc(`invites/${token}`).set({
      email: String(email).toLowerCase().trim(),
      role,
      level,
      managerId: managerId || null,
      organizationId: orgId,
      orgName,
      invitedBy: decoded.uid,
      invitedByName: user.displayName || user.email || '',
      createdAt: now,
      expiresAt,
      acceptedAt: null,
      acceptedBy: null,
    });

    // Build URL from request origin
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const url = `${origin}/login?invite=${token}`;

    return NextResponse.json({ token, url, expiresAt, orgName });
  } catch (err: any) {
    console.error('Invite create error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', detail: err.message }, { status: 500 });
  }
}
