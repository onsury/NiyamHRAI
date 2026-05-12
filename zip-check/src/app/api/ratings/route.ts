import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/ratings
 * Body: { targetUid, score (0-100), notes, kind: 'hr' | 'manager' }
 * - 'hr' ratings: callable by FOUNDER or HR_ADMIN of same org
 * - 'manager' ratings: callable by the employee's managerId
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!idToken) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    const { targetUid, score, notes, kind } = await req.json();
    if (!targetUid || typeof score !== 'number' || !kind) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }
    if (score < 0 || score > 100) {
      return NextResponse.json({ error: 'BAD_SCORE' }, { status: 400 });
    }
    if (!['hr', 'manager'].includes(kind)) {
      return NextResponse.json({ error: 'BAD_KIND' }, { status: 400 });
    }

    // Load caller and target
    const [callerSnap, targetSnap] = await Promise.all([
      adminDb.doc(`users/${decoded.uid}`).get(),
      adminDb.doc(`users/${targetUid}`).get(),
    ]);
    if (!callerSnap.exists || !targetSnap.exists) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const caller = callerSnap.data()!;
    const target = targetSnap.data()!;

    if (caller.organizationId !== target.organizationId) {
      return NextResponse.json({ error: 'CROSS_ORG' }, { status: 403 });
    }

    if (kind === 'hr') {
      if (!['FOUNDER', 'HR_ADMIN'].includes(caller.role)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    } else {
      // manager
      if (target.managerId !== decoded.uid) {
        return NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 });
      }
    }

    const fieldKey = kind === 'hr' ? 'hrRating' : 'managerRating';
    await adminDb.doc(`users/${targetUid}`).set({
      [fieldKey]: {
        score,
        notes: notes || '',
        updatedAt: Date.now(),
        updatedBy: decoded.uid,
        updatedByName: caller.displayName || caller.email || '',
      },
    }, { merge: true });

    // Append to an immutable audit trail (ratings history)
    await adminDb.collection(`users/${targetUid}/ratingHistory`).add({
      kind,
      score,
      notes: notes || '',
      assessorUid: decoded.uid,
      assessorName: caller.displayName || caller.email || '',
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Rating submit error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', detail: err.message }, { status: 500 });
  }
}
