'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getEmployeeDNA, getDNAHistory } from '@/lib/firestore-service';
import type { EmployeeDNA, DNASnapshot } from '@/types';

export default function DNAProfilePage() {
  const { niyamUser } = useAuth();
  const [dna, setDna] = useState<EmployeeDNA|null>(null);
  const [history, setHistory] = useState<DNASnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => { try { const [d,h]=await Promise.all([getEmployeeDNA(niyamUser.uid),getDNAHistory(niyamUser.uid,10)]); setDna(d);setHistory(h); } catch(e){console.error(e);} finally{setLoading(false);} }; load();
  }, [niyamUser]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!dna) return <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in-up"><div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mb-8 text-slate-400"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div><h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Neural Signature Incomplete</h3><p className="text-slate-500 text-lg max-w-sm">Complete onboarding to unlock DNA mapping.</p></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-start"><div><h2 className="text-3xl font-black tracking-tighter">My Neural DNA</h2><p className="text-slate-500 mt-1">Your behavioral signature aligned to the founder benchmark.</p></div><div className="text-right"><p className="text-4xl font-black text-amber-500">{dna.synergyScore}%</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synergy Score</p></div></div>

      {dna.alignmentSummary && <div className="bg-indigo-600 p-8 rounded-[24px] text-white relative overflow-hidden"><p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">Alignment Summary</p><p className="text-lg font-bold leading-relaxed italic">&ldquo;{dna.alignmentSummary}&rdquo;</p></div>}

      {dna.driftAreas.length>0 && <div className="flex flex-wrap gap-3">{dna.driftAreas.map((a,i)=>(<span key={i} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest border border-amber-200">⚠ {a}</span>))}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dna.selectedTraits.map((t,i)=>{
          const gap=t.founderBenchmark-t.score;
          const st=gap<=10?'Aligned':gap<=25?'Drifting':'Critical';
          const sc=gap<=10?'text-emerald-600 bg-emerald-50':gap<=25?'text-amber-600 bg-amber-50':'text-red-600 bg-red-50';
          return (
            <div key={i} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-3"><div><p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t.cluster}</p><h4 className="text-lg font-black tracking-tight mt-1">{t.name}</h4></div><span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${sc}`}>{st}</span></div>
              <div className="space-y-2"><div className="flex justify-between text-[10px] font-bold text-slate-500"><span>You: {t.score}%</span><span>Founder: {t.founderBenchmark}%</span></div>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden"><div className="absolute h-full bg-slate-300 rounded-full" style={{width:`${t.founderBenchmark}%`}} /><div className={`absolute h-full rounded-full ${gap<=10?'bg-emerald-500':gap<=25?'bg-amber-500':'bg-red-500'}`} style={{width:`${t.score}%`}} /></div></div>
            </div>
          );
        })}
      </div>

      {history.length>0 && (
        <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black tracking-tighter mb-6">DNA Evolution</h3>
          <div className="space-y-3">{history.map((s,i)=>(<div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white ${s.delta>0?'bg-emerald-500':s.delta<0?'bg-red-500':'bg-slate-400'}`}>{s.delta>0?'+':''}{s.delta}</div><div className="flex-1"><p className="text-sm font-bold text-slate-900 capitalize">{s.trigger}</p><p className="text-xs text-slate-400">Synergy: {s.synergyScore}%</p></div></div>))}</div>
        </div>
      )}
    </div>
  );
}
