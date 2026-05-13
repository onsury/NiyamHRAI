'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getEmployeeDNA, getDNAHistory } from '@/lib/firestore-service';
import type { TraitScore } from '@/types';

export default function MyDNAPage() {
  const { niyamUser } = useAuth();
  const [dna, setDna] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const [dnaData, hist] = await Promise.all([
          getEmployeeDNA(niyamUser.uid).catch(() => null),
          getDNAHistory(niyamUser.uid).catch(() => []),
        ]);
        setDna(dnaData);
        setHistory(hist);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [niyamUser]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  const synergyScore = dna?.synergyScore || 50;
  const traits = dna?.traits || [];
  const driftAreas = dna?.driftAreas || ['Awaiting first assessment'];
  const strengths = dna?.strengths || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Neural DNA</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Your behavioral signature aligned to the founder benchmark.</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl sm:text-4xl font-black ${synergyScore >= 70 ? 'text-emerald-500' : synergyScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{synergyScore}%</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Synergy Score</div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Alignment Summary</p>
        <p className="text-sm sm:text-base italic text-white/80">
          {dna ? `Your synergy score is ${synergyScore}%. ${driftAreas.length > 0 ? `Focus areas: ${driftAreas.join(', ')}.` : ''} ${strengths.length > 0 ? `Strengths: ${strengths.join(', ')}.` : ''}` : 'Initial baseline. Complete weekly check-ins to refine.'}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${!dna ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          {!dna ? 'Ã¢Å¡Â  Awaiting First Assessment' : 'Ã¢Å“â€œ DNA Mapped'}
        </span>
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">Trait Scores</h2>
          <div className="space-y-3">
            {traits.map((t: TraitScore, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm font-semibold text-slate-600">{t.name}</span>
                  <span className="text-xs font-bold text-slate-400">{t.score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${t.score >= 70 ? 'bg-emerald-500' : t.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${t.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DNA Evolution */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">DNA Evolution</h2>
        {history.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-sm">0</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Onboarding</p>
              <p className="text-xs text-slate-400">Synergy: {synergyScore}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs">{history.length - i}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{h.trigger || 'Check-in'}</p>
                  <p className="text-xs text-slate-400">{h.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Recent'}</p>
                </div>
                <span className="text-sm font-black text-slate-600">{h.synergyScore || 50}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
