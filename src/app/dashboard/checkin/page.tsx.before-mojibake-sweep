'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFounderDNA, getEmployeeDNA, saveCheckIn, getCheckIns } from '@/lib/firestore-service';

export default function CheckInPage() {
  const { niyamUser, firebaseUser } = useAuth();
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const checks = await getCheckIns(niyamUser.uid, 5);
        setHistory(checks);
      } catch (err) { console.error(err); }
      finally { setLoadingHistory(false); }
    };
    load();
  }, [niyamUser]);

  const handleSubmit = async () => {
    if (!niyamUser || !reflection.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const orgId = niyamUser.organizationId || niyamUser.uid;
      const [founderDNA, employeeDNA] = await Promise.all([
        getFounderDNA(orgId).catch(() => null),
        getEmployeeDNA(niyamUser.uid).catch(() => null),
      ]);

      const idToken = await firebaseUser?.getIdToken();
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reflection,
          founderDNA,
          employeeDNA,
          userName: niyamUser.displayName,
        }),
      });

      const data = await res.json();
      setResult(data);

      // Save to Firestore
      await saveCheckIn(niyamUser.uid, {
        reflection,
        aiResponse: data.mentorship,
        synergyDelta: data.synergyDelta || 0,
        driftAreas: data.driftAreas || [],
        strengths: data.strengths || [],
      });

      setReflection('');
      const checks = await getCheckIns(niyamUser.uid, 5);
      setHistory(checks);
    } catch (err) {
      console.error(err);
      setResult({ mentorship: 'Your reflection has been saved. AI mentorship will be available shortly.', synergyDelta: 0 });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Weekly Rhythm</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">Your reflection is analysed against the founder&apos;s DNA benchmark.</p>
      </div>

      {/* Submit Reflection */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl">âš¡</div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest">Synergy Protocol</p>
            <p className="text-sm sm:text-base font-bold text-slate-900">Founder-Aligned Mentorship</p>
          </div>
        </div>

        <p className="text-slate-700 font-semibold text-sm sm:text-base mb-4">Describe your key decisions, challenges, and growth this week.</p>

        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          className="w-full h-36 sm:h-48 p-4 sm:p-5 bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl text-slate-800 text-sm sm:text-base placeholder:text-slate-300 focus:border-amber-500 transition-all outline-none resize-none leading-relaxed"
          placeholder="This week I faced a situation where... I decided to... The outcome was... I learned that..."
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || reflection.trim().length < 20}
          className="w-full mt-4 py-3.5 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing...</> : 'Submit Reflection'}
        </button>
      </div>

      {/* AI Mentorship Result */}
      {result && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-6 sm:mb-8 animate-in">
          <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-3">AI Mentorship Response</p>
          <p className="text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">{result.mentorship}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Synergy Change</p>
              <p className={`text-xl sm:text-2xl font-black ${(result.synergyDelta || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(result.synergyDelta || 0) >= 0 ? '+' : ''}{result.synergyDelta || 0}%
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Drift Areas</p>
              {(result.driftAreas || []).map((d: string, i: number) => (
                <p key={i} className="text-xs sm:text-sm text-white/80">{d}</p>
              ))}
            </div>
            <div className="bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Strengths</p>
              {(result.strengths || []).map((s: string, i: number) => (
                <p key={i} className="text-xs sm:text-sm text-emerald-300">{s}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4">Recent Check-ins</h2>
        {loadingHistory ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No check-ins yet. Submit your first reflection above.</div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {history.map((h, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                <p className="text-xs text-slate-400 mb-2">{h.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Recent'}</p>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">&ldquo;{h.reflection}&rdquo;</p>
                {h.aiResponse && (
                  <div className="bg-indigo-50 rounded-lg p-3 mt-2">
                    <p className="text-xs font-bold text-indigo-600 mb-1">AI Mentorship:</p>
                    <p className="text-xs text-indigo-800 line-clamp-3">{h.aiResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
