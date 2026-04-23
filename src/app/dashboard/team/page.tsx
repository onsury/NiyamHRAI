'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot, doc, getDoc, orderBy,
} from 'firebase/firestore';

type TeamMember = {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  level: string;
  onboarded: boolean;
  managerId?: string | null;
  hrRating?: { score: number; notes?: string; updatedAt?: number };
  managerRating?: { score: number; notes?: string; updatedAt?: number };
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  level: string;
  expiresAt: number;
  acceptedAt: number | null;
};

const ROLES = ['HR_ADMIN', 'MANAGER', 'EMPLOYEE'];
const LEVELS = ['TOP', 'SENIOR', 'MIDDLE', 'JUNIOR'];

export default function TeamPage() {
  const { niyamUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dnaByUid, setDnaByUid] = useState<Record<string, { synergyScore?: number }>>({});
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteLevel, setInviteLevel] = useState('MIDDLE');
  const [inviteManagerId, setInviteManagerId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [invitesListError, setInvitesListError] = useState<string | null>(null);

  // Rating form (per member)
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(60);
  const [ratingNotes, setRatingNotes] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);

  const isAdmin = niyamUser?.role === 'FOUNDER' || niyamUser?.role === 'HR_ADMIN';
  const orgId = niyamUser?.organizationId || niyamUser?.uid;

  // Subscribe to team
  useEffect(() => {
    if (!isAdmin || !orgId) return;
    const q = query(collection(db, 'users'), where('organizationId', '==', orgId));
    const unsub = onSnapshot(q, async (snap) => {
      const rows: TeamMember[] = snap.docs.map((d) => ({
        uid: d.id,
        email: d.data().email || '',
        displayName: d.data().displayName || d.data().email?.split('@')[0] || 'User',
        role: d.data().role || 'EMPLOYEE',
        level: d.data().level || 'MIDDLE',
        onboarded: d.data().onboarded || false,
        managerId: d.data().managerId || null,
        hrRating: d.data().hrRating,
        managerRating: d.data().managerRating,
      }));
      setMembers(rows);

      // M-4: synergyScore is denormalized onto the user doc.
      // No per-user subcollection fetch needed (was N+1 at admin scale).
      const dnaMap: Record<string, { synergyScore?: number }> = {};
      for (const d of snap.docs) {
        const s = d.data().synergyScore;
        if (typeof s === 'number') dnaMap[d.id] = { synergyScore: s };
      }
      setDnaByUid(dnaMap);
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin, orgId]);

  // Subscribe to invites
  useEffect(() => {
    if (!isAdmin || !orgId) return;
    const q = query(
      collection(db, 'invites'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setInvitesListError(null);
      setInvitesListError(null);
      setInvites(snap.docs.map((d) => ({
        id: d.id,
        email: d.data().email,
        role: d.data().role,
        level: d.data().level,
        expiresAt: d.data().expiresAt,
        acceptedAt: d.data().acceptedAt,
      })));
    }, (err) => {
      // Rules will prevent reads until deployed; non-fatal
      console.warn('Invites read failed (rules not yet deployed?):', err.message);
      setInvitesListError('Invite list unavailable -- please verify Firestore rule deployment.');
      setInvitesListError('Invite list unavailable -- please verify Firestore rule deployment.');
    });
    return () => unsub();
  }, [isAdmin, orgId]);

  const createInvite = async () => {
    setInviteError('');
    setLastInviteUrl('');
    if (!auth.currentUser) return;
    if (!inviteEmail.trim()) { setInviteError('Email required.'); return; }
    setInviting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          level: inviteLevel,
          managerId: inviteManagerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error || 'Failed'); return; }
      setLastInviteUrl(data.url);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message);
    } finally { setInviting(false); }
  };

  const copyUrl = () => {
    if (!lastInviteUrl) return;
    navigator.clipboard.writeText(lastInviteUrl).catch(() => {});
  };

  const submitHrRating = async (targetUid: string) => {
    if (!auth.currentUser) return;
    setRatingSaving(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ targetUid, score: ratingScore, notes: ratingNotes, kind: 'hr' }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Save failed: ' + (data.error || res.status));
      } else {
        setRatingFor(null);
        setRatingNotes('');
        setRatingScore(60);
      }
    } finally { setRatingSaving(false); }
  };

  const variance = (ai?: number, other?: number) => {
    if (ai == null || other == null) return null;
    return Math.abs(ai - other);
  };

  const managers = members.filter((m) => m.role === 'MANAGER' || m.role === 'FOUNDER' || m.role === 'HR_ADMIN');

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-slate-500">This page is for founders and HR admins only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Team Members</h1>
        <p className="text-slate-500 text-sm mt-1">Invite people, assign managers, and compare AI vs HR vs Manager assessments.</p>
      </div>

      {/* Invite form */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
        <h2 className="text-lg font-black text-slate-900 mb-4">Invite a team member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com"
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-amber-500 transition-all outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Level</label>
            <select value={inviteLevel} onChange={(e) => setInviteLevel(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Reports to (optional)</label>
            <select value={inviteManagerId} onChange={(e) => setInviteManagerId(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none">
              <option value="">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â None ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â</option>
              {managers.map((m) => <option key={m.uid} value={m.uid}>{m.displayName} ({m.role})</option>)}
            </select>
          </div>
        </div>
        {inviteError && <p className="mt-3 text-sm font-bold text-red-500">{inviteError}</p>}
        <button onClick={createInvite} disabled={inviting || !inviteEmail.trim()}
          className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-40">
          {inviting ? 'Creating inviteÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'Generate invite link'}
        </button>

        {lastInviteUrl && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Invite link ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â send this to your team member</p>
            <div className="flex gap-2 items-center">
              <input readOnly value={lastInviteUrl}
                className="flex-1 p-2 bg-white border border-emerald-200 rounded text-xs font-mono" />
              <button onClick={copyUrl} className="px-3 py-2 bg-emerald-600 text-white rounded text-xs font-bold">Copy</button>
            </div>
            <p className="text-[10px] text-emerald-600 mt-2">Expires in 7 days. Only the invited email can claim it.</p>
          </div>
        )}
      </div>

      {/* Team list with three-way assessment */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900">Current team ({members.length})</h2>
          <div className="hidden sm:flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>AI</span><span>HR</span><span>Manager</span>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">LoadingÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No members yet. Invite your first person above.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const ai = dnaByUid[m.uid]?.synergyScore;
              const hr = m.hrRating?.score;
              const mgr = m.managerRating?.score;
              const vHR = variance(ai, hr);
              const vMgr = variance(ai, mgr);
              const flagged = (vHR != null && vHR > 25) || (vMgr != null && vMgr > 25);

              return (
                <div key={m.uid} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{m.displayName}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{m.role}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{m.level}</span>
                        {flagged && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase">Variance</span>}
                        {!m.onboarded && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Pending</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{m.email}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-6 text-right min-w-[200px]">
                      <Cell score={ai} label="AI" />
                      <Cell score={hr} label="HR" />
                      <Cell score={mgr} label="Mgr" />
                    </div>
                    <button onClick={() => { setRatingFor(ratingFor === m.uid ? null : m.uid); setRatingScore(hr || 60); setRatingNotes(m.hrRating?.notes || ''); }}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg">
                      {ratingFor === m.uid ? 'Cancel' : hr != null ? 'Update HR rating' : 'Add HR rating'}
                    </button>
                  </div>

                  {ratingFor === m.uid && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">HR Score: {ratingScore}</label>
                      <input type="range" min={0} max={100} value={ratingScore} onChange={(e) => setRatingScore(parseInt(e.target.value))}
                        className="w-full mb-3" />
                      <textarea value={ratingNotes} onChange={(e) => setRatingNotes(e.target.value)} placeholder="Notes (optional)"
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm resize-none h-20 outline-none focus:border-amber-500" />
                      <button onClick={() => submitHrRating(m.uid)} disabled={ratingSaving}
                        className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40">
                        {ratingSaving ? 'SavingÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'Save rating'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invitesListError && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm font-bold text-red-800">Invite list unavailable</p>
          <p className="text-xs text-red-700 mt-1">{invitesListError}</p>
        </div>
      )}
      
      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Invites ({invites.filter((i) => !i.acceptedAt).length} pending)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {invites.map((i) => {
              const expired = i.expiresAt < Date.now();
              return (
                <div key={i.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{i.email}</p>
                    <p className="text-xs text-slate-400">{i.role.replace('_', ' ')} ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {i.level}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    i.acceptedAt ? 'bg-emerald-100 text-emerald-700'
                      : expired ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {i.acceptedAt ? 'Accepted' : expired ? 'Expired' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ score, label }: { score?: number; label: string }) {
  const color =
    score == null ? 'text-slate-300'
      : score >= 70 ? 'text-emerald-500'
      : score >= 40 ? 'text-amber-500'
      : 'text-red-500';
  return (
    <div>
      <div className={`text-lg font-black ${color}`}>{score != null ? `${score}%` : 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â'}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
