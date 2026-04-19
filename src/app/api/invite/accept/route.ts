import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!idToken) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    const { token, displayName } = await req.json();
    if (!token) return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 400 });

    const inviteRef = adminDb.doc(`invites/${token}`);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    const invite = inviteSnap.data()!;

    if (invite.acceptedAt) return NextResponse.json({ error: 'ALREADY_USED' }, { status: 410 });
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'EXPIRED' }, { status: 410 });
    }
    if (invite.email !== (decoded.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'EMAIL_MISMATCH' }, { status: 403 });
    }

    // Atomic: create the user profile and mark invite used
    const batch = adminDb.batch();
    batch.set(adminDb.doc(`users/${decoded.uid}`), {
      email: decoded.email,
      displayName: displayName || decoded.email?.split('@')[0] || 'User',
      role: invite.role,
      level: invite.level,
      organizationId: invite.organizationId,
      managerId: invite.managerId || null,
      onboarded: false,
      createdAt: FieldValue.serverTimestamp(),
      invitedBy: invite.invitedBy,
    }, { merge: true });

    batch.update(inviteRef, {
      acceptedAt: Date.now(),
      acceptedBy: decoded.uid,
    });

    await batch.commit();

    return NextResponse.json({
      ok: true,
      role: invite.role,
      organizationId: invite.organizationId,
    });
  } catch (err: any) {
    console.error('Invite accept error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', detail: err.message }, { status: 500 });
  }
}
