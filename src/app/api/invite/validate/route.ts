import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
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

    // Return only the fields the signup page needs — never include admin-only metadata
    return NextResponse.json({
      email: data.email,
      role: data.role,
      level: data.level,
      organizationId: data.organizationId,
      managerId: data.managerId || null,
      orgName: data.orgName || '',
      invitedByName: data.invitedByName || '',
    });
  } catch (err: any) {
    console.error('Invite validate error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
