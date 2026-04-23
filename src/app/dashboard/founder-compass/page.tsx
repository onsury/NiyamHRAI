'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFounderDNA } from '@/lib/firestore-service';
import type { TraitScore } from '@/types';

const CLUSTER_LABELS: Record<string, { name: string; icon: string; color: string }> = {
  decision: { name: 'Decision Architecture', icon: 'Ã°Å¸Â§Â ', color: 'bg-amber-500' },
  people: { name: 'People Philosophy', icon: 'Ã°Å¸Â¤Â', color: 'bg-blue-500' },
  risk: { name: 'Risk & Innovation', icon: 'Ã¢Å¡Â¡', color: 'bg-emerald-500' },
  execution: { name: 'Execution DNA', icon: 'Ã°Å¸Å½Â¯', color: 'bg-red-500' },
  culture: { name: 'Culture Code', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â', color: 'bg-violet-500' },
  growth: { name: 'Growth Orientation', icon: 'Ã°Å¸â€œË†', color: 'bg-cyan-500' },
};

export default function FounderCompassPage() {
  const { niyamUser } = useAuth();
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const orgId = niyamUser.organizationId || niyamUser.uid;
        const data = await getFounderDNA(orgId);
        setDna(data);
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

  if (!dna || !dna.diagnosticComplete) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-5xl sm:text-6xl mb-4">Ã°Å¸Â§Â¬</span>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Founder DNA Not Mapped</h2>
      <p className="text-slate-500 text-sm sm:text-base">The founder needs to complete the CorePersonaDNA diagnostic first.</p>
    </div>
  );

  // Group traits by cluster
  const clusters: Record<string, any[]> = {};
  (dna.signatureTraits || []).forEach((t: TraitScore) => {
    if (!clusters[t.cluster]) clusters[t.cluster] = [];
    clusters[t.cluster].push(t);
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Founder Compass</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">The organisational DNA benchmark. Every decision aligns to this.</p>
      </div>

      {/* Philosophy / Voice Captures */}
      {dna.philosophy && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-6 sm:mb-8">
          <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Founder&apos;s Voice</p>
          <div className="space-y-3">
            {dna.philosophy.split('\n\n').filter(Boolean).map((p: string, i: number) => (
              <p key={i} className="text-sm sm:text-base text-white/80 italic leading-relaxed">{p}</p>
            ))}
          </div>
        </div>
      )}

      {/* Trait Clusters */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(clusters).map(([clusterId, traits]) => {
          const cluster = CLUSTER_LABELS[clusterId] || { name: clusterId, icon: 'Ã°Å¸â€œÅ ', color: 'bg-slate-500' };
          const avgScore = Math.round(traits.reduce((s, t) => s + t.score, 0) / traits.length);

          return (
            <div key={clusterId} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl">{cluster.icon}</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">{cluster.name}</h3>
                </div>
                <span className={`px-3 py-1 ${cluster.color} text-white rounded-full text-xs font-black`}>{avgScore}%</span>
              </div>
              <div className="space-y-3">
                {traits.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs sm:text-sm font-semibold text-slate-600">{t.name}</span>
                      <span className="text-xs font-bold text-slate-400">{t.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cluster.color} transition-all`} style={{ width: `${t.score}%` }} />
                    </div>
                    {t.description && <p className="text-[10px] sm:text-xs text-slate-400 mt-1 italic">{t.description}</p>}
                  </div>
                ))}
              </div>

              {/* Voice capture for this cluster */}
              {dna.voiceCaptures?.[clusterId] && (
                <div className="mt-4 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Founder&apos;s Words</p>
                  <p className="text-xs sm:text-sm text-amber-900 italic">&ldquo;{dna.voiceCaptures[clusterId]}&rdquo;</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Non-Negotiables */}
      {dna.negativeConstraints?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-black text-red-800 mb-4 flex items-center gap-2">
            <span>Ã°Å¸Å¡Â«</span> Non-Negotiables
          </h3>
          <ul className="space-y-2">
            {dna.negativeConstraints.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-red-700">
                <span className="text-red-500 mt-0.5 font-bold">Ã¢Å“â€¢</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
