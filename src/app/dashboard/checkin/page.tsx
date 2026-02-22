'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getEmployeeDNA, getFounderDNA, getCheckIns, saveCheckIn } from '@/lib/firestore-service';
import { submitCheckIn } from '@/ai/flows/personalized-ai-mentorship';
import type { EmployeeDNA, FounderDNA, CheckIn } from '@/types';

export default function CheckInPage() {
  const { niyamUser } = useAuth();
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [employeeDna, setEmployeeDna] = useState<EmployeeDNA|null>(null);
  const [founderDna, setFounderDna] = useState<FounderDNA|null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const [dna,fDna,cis] = await Promise.all([getEmployeeDNA(niyamUser.uid), getFounderDNA(niyamUser.organizationId), getCheckIns(niyamUser.uid,6)]);
        setEmployeeDna(dna); setFounderDna(fDna); setRecentCheckIns(cis);
      } catch(err){console.error(err);}
      finally{setPageLoading(false);}
    }; load();
  }, [niyamUser]);

  const handleSubmit = async () => {
    if (!niyamUser||!employeeDna||!founderDna) return;
    setLoading(true); setError('');
    try {
      const aiResult = await submitCheckIn({ reflection, cadenceType:'weekly', founderDna, employeeDna, recentCheckIns: recentCheckIns.map(ci=>({reflection:ci.reflection,aiMentorship:ci.aiMentorship,alignmentScore:ci.alignmentScore,createdAt:ci.createdAt})) });
      setResult(aiResult);
      await saveCheckIn(niyamUser.uid, { reflection, aiMentorship:aiResult.mentorship, alignmentScore:aiResult.alignmentScore, burnoutFlag:aiResult.burnoutFlag, sentiment:aiResult.sentiment, driftUpdate:aiResult.driftUpdate, nextFocusArea:aiResult.nextFocusArea, createdAt:null });
    } catch(err:any){ console.error(err); setError('Failed to process check-in. Please try again.'); }
    finally{setLoading(false);}
  };

  if (pageLoading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto py-4">
      <h2 className="text-3xl font-black tracking-tighter mb-2">Weekly Rhythm</h2>
      <p className="text-slate-500 mb-10">Your reflection is analyzed against the founder&apos;s DNA and your behavioral profile.</p>

      {!result ? (
        <div className="bg-white p-10 xl:p-12 rounded-[32px] shadow-lg border border-slate-100 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
            <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synergy Protocol</h3><p className="text-slate-800 font-bold">Founder-Aligned Mentorship</p></div>
          </div>
          <h3 className="text-xl font-bold mb-6 text-slate-800 leading-tight">{employeeDna?.driftAreas?.[0]?`Reflect on how your work this week aligned with ${employeeDna.driftAreas[0]}.`:'Describe your key decisions, challenges, and growth moments this week.'}</h3>
          <textarea value={reflection} onChange={e=>setReflection(e.target.value)} className="w-full h-52 p-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-amber-500 transition-all text-slate-700 text-lg leading-relaxed placeholder:text-slate-300 resize-none" placeholder="Document your week — decisions, struggles, wins, learnings..." />
          {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold">{error}</div>}
          <button onClick={handleSubmit} disabled={reflection.length<20||loading} className="w-full mt-8 bg-slate-900 text-white py-5 rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-3">
            {loading?<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing with Claude...</>:'Submit Reflection'}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <div className="bg-slate-900 p-10 xl:p-12 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div><h3 className="text-2xl font-black tracking-tighter">Mentorship Synced</h3>
                  <div className="flex gap-3 mt-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${result.sentiment==='Positive'?'bg-emerald-500/20 text-emerald-400':result.sentiment==='Negative'?'bg-red-500/20 text-red-400':'bg-slate-500/20 text-slate-400'}`}>{result.sentiment}</span>
                    {result.burnoutFlag && <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/20 text-red-400">⚠ Burnout Signal</span>}
                  </div>
                </div>
                <div className="text-right"><span className="block text-4xl font-black text-amber-500">{result.alignmentScore}%</span><span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Alignment</span></div>
              </div>
              <div className="p-6 bg-white/5 rounded-[20px] border border-white/10 mb-6"><p className="text-indigo-200 text-lg leading-relaxed">{result.mentorship}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10"><p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Drift Update</p><p className="text-slate-300 text-sm leading-relaxed">{result.driftUpdate}</p></div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Next Focus</p><p className="text-slate-300 text-sm leading-relaxed">{result.nextFocusArea}</p></div>
              </div>
              <button onClick={()=>{setResult(null);setReflection('');}} className="w-full py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-all">New Reflection</button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          </div>
        </div>
      )}
    </div>
  );
}
