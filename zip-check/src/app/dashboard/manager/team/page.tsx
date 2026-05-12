'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

type Report = {
  uid: string;
  email: string;
  displayName: string;
  level: string;
  hrRating?: { score: number };
  managerRating?: { score: number; notes?: string };
};

export default function ManagerTeamPage() {
  const { niyamUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [dnaByUid, setDnaByUid] = useState<Record<string, { synergyScore?: number }>>({});
  const [loading, setLoading] = useState(true);
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [score, setScore] = useState(60);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!niyamUser) return;
    const q = query(collection(db, 'users'), where('managerId', '==', niyamUser.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const rows: Report[] = snap.docs.map((d) => ({
        uid: d.id,
        email: d.data().email || '',
        displayName: d.data().displayName || d.data().email?.split('@')[0] || 'User',
        level: d.data().level || 'MIDDLE',
        hrRating: d.data().hrRating,
        managerRating: d.data().managerRating,
      }));
      setReports(rows);

      // M-4: synergyScore is denormalized onto the user doc.
      // No per-user subcollection fetch needed (was N+1 at manager scale).
      const dnaMap: Record<string, { synergyScore?: number }> = {};
      for (const d of snap.docs) {
        const s = d.data().synergyScore;
        if (typeof s === 'number') dnaMap[d.id] = { synergyScore: s };
      }
      setDnaByUid(dnaMap);
      setLoading(false);
    });
    return () => unsub();
  }, [niyamUser]);

  const submit = async (targetUid: string) => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ targetUid, score, notes, kind: 'manager' }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Save failed: ' + (data.error || res.status));
      } else {
        setRatingFor(null); setScore(60); setNotes('');
      }
    } finally { setSaving(false); }
  };

  const variance = (a?: number, b?: number) => (a == null || b == null ? null : Math.abs(a - b));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Team</h1>
        <p className="text-slate-500 text-sm mt-1">Your direct reports and your assessment of their alignment.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loadingâ€¦</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No direct reports yet. A founder or HR admin assigns people to you.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => {
              const ai = dnaByUid[r.uid]?.synergyScore;
              const mgr = r.managerRating?.score;
              const hr = r.hrRating?.score;
              const v = variance(ai, mgr);
              return (
                <div key={r.uid} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{r.displayName}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{r.level}</span>
                        {v != null && v > 25 && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase">Variance {v}pt</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{r.email}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-6 text-right min-w-[200px]">
                      <Cell score={ai} label="AI" />
                      <Cell score={hr} label="HR" />
                      <Cell score={mgr} label="You" />
                    </div>
                    <button onClick={() => { setRatingFor(ratingFor === r.uid ? null : r.uid); setScore(mgr || 60); setNotes(r.managerRating?.notes || ''); }}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg">
                      {ratingFor === r.uid ? 'Cancel' : mgr != null ? 'Update' : 'Rate'}
                    </button>
                  </div>

                  {ratingFor === r.uid && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Your Score: {score}</label>
                      <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(parseInt(e.target.value))} className="w-full mb-3" />
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's driving this rating?"
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm resize-none h-20 outline-none focus:border-amber-500" />
                      <button onClick={() => submit(r.uid)} disabled={saving}
                        className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40">
                        {saving ? 'Savingâ€¦' : 'Save rating'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
      <div className={`text-lg font-black ${color}`}>{score != null ? `${score}%` : 'â€”'}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
