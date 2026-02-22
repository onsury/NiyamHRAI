'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getEmployeeDNA, getFounderDNA, saveHoningSession, saveEmployeeDNA } from '@/lib/firestore-service';
import { generateHoningScenario } from '@/ai/flows/generate-honing-scenario';
import { evaluateHoningResponse } from '@/ai/flows/evaluate-honing-response';
import type { EmployeeDNA, FounderDNA } from '@/types';

export default function HoningLabPage() {
  const { niyamUser } = useAuth();
  const [employeeDna, setEmployeeDna] = useState<EmployeeDNA|null>(null);
  const [founderDna, setFounderDna] = useState<FounderDNA|null>(null);
  const [selectedTrait, setSelectedTrait] = useState<string|null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try { const [d,f]=await Promise.all([getEmployeeDNA(niyamUser.uid),getFounderDNA(niyamUser.organizationId)]); setEmployeeDna(d);setFounderDna(f); } catch(e){console.error(e);}
      finally{setPageLoading(false);}
    }; load();
  }, [niyamUser]);

  const startHoning = async (traitName:string) => {
    setSelectedTrait(traitName); setLoadingScenario(true); setResult(null); setResponse('');
    try { const sim = await generateHoningScenario({traitName,employeeLevel:niyamUser?.level,founderPhilosophy:founderDna?.philosophy}); setScenario(sim); } catch(e){console.error(e);}
    finally{setLoadingScenario(false);}
  };

  const handleEvaluate = async () => {
    if (!selectedTrait||!employeeDna||!founderDna) return;
    setEvaluating(true);
    try {
      const evalResult = await evaluateHoningResponse({response,traitName:selectedTrait,scenario:scenario?.scenario||'',founderDna,employeeDna});
      setResult(evalResult);
      if (niyamUser) {
        await saveHoningSession(niyamUser.uid, {traitName:selectedTrait,scenario:scenario?.scenario,response,feedback:evalResult.feedback,synergyDelta:evalResult.synergyDelta,traitGain:evalResult.traitGain});
        const updatedTraits = employeeDna.selectedTraits.map(t=>t.name===selectedTrait?{...t,score:Math.min(100,Math.max(0,t.score+evalResult.traitGain))}:t);
        const updatedDna = {...employeeDna, selectedTraits:updatedTraits, synergyScore:Math.min(100,Math.max(0,employeeDna.synergyScore+evalResult.synergyDelta))};
        await saveEmployeeDNA(niyamUser.uid, updatedDna); setEmployeeDna(updatedDna);
      }
    } catch(e){console.error(e);}
    finally{setEvaluating(false);}
  };

  if (pageLoading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" /></div>;

  if (!selectedTrait) return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-slate-900 p-12 xl:p-16 rounded-[40px] text-white shadow-2xl relative overflow-hidden text-center mb-10 border border-slate-800">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"><svg className="w-8 h-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
          <h3 className="text-4xl xl:text-5xl font-black tracking-tighter mb-4 uppercase">Neural Honing Lab</h3>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">Bridge behavioral drift through founder-calibrated simulations.</p>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employeeDna?.selectedTraits.map((t,i)=>(<button key={i} onClick={()=>startHoning(t.name)} className="p-8 bg-white rounded-[32px] border border-slate-200 hover:border-indigo-500 hover:shadow-2xl transition-all text-left group"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 block">{t.cluster}</span><h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-4">{t.name}</h4><div className="flex items-center gap-4"><div className="flex-1 bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100"><div className="h-full bg-slate-900" style={{width:`${t.score}%`}} /></div><span className="text-xs font-black text-slate-900">{t.score}%</span></div></button>))}
        {(!employeeDna||employeeDna.selectedTraits.length===0) && <div className="col-span-2 text-center py-20 bg-white border-4 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-black uppercase tracking-[0.4em] text-sm">Complete onboarding to unlock traits</div>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-800">
        {loadingScenario ? (
          <div className="flex flex-col items-center justify-center p-20 text-white"><div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" /><p className="text-amber-500 font-bold tracking-widest uppercase text-xs">Calibrating for {selectedTrait}...</p></div>
        ) : !result ? (
          <div className="p-10 xl:p-12">
            <div className="flex justify-between items-start mb-10"><div><span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Neural Trait Honing</span><h3 className="text-2xl font-black text-white mt-1">Bridging: {selectedTrait}</h3></div>
              <button onClick={()=>{setSelectedTrait(null);setScenario(null);}} className="text-slate-500 hover:text-white transition-colors"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 rounded-[24px] border border-white/10"><h4 className="text-xs font-bold text-indigo-400 uppercase mb-4">Challenge</h4><p className="text-slate-300 leading-relaxed text-lg">{scenario?.scenario}</p><div className="mt-6 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20"><p className="text-amber-500 font-bold text-sm">{scenario?.challenge}</p></div></div>
              <div className="flex flex-col"><h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Your Response</h4>
                <textarea value={response} onChange={e=>setResponse(e.target.value)} className="flex-1 min-h-[250px] p-6 bg-slate-800 border-2 border-slate-700 rounded-[24px] text-white focus:border-amber-500 transition-all text-lg resize-none" placeholder="How would the founder approach this?" />
                <button onClick={handleEvaluate} disabled={response.length<20||evaluating} className="mt-4 py-5 bg-amber-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center justify-center gap-3">{evaluating?<><div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"/>Evaluating...</>:'Execute Neural Shift'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 xl:p-12 text-white">
            <h3 className="text-2xl font-black tracking-tighter mb-6">Evaluation Complete</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center"><p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Synergy Delta</p><p className={`text-3xl font-black ${result.synergyDelta>=0?'text-emerald-400':'text-red-400'}`}>{result.synergyDelta>=0?'+':''}{result.synergyDelta}</p></div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center"><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Trait Gain</p><p className="text-3xl font-black text-indigo-400">+{result.traitGain}</p></div>
            </div>
            <div className="p-6 bg-white/5 rounded-[20px] border border-white/10 mb-8"><p className="text-slate-300 leading-relaxed">{result.feedback}</p></div>
            <div className="flex gap-4">
              <button onClick={()=>startHoning(selectedTrait!)} className="flex-1 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-all">Try Again</button>
              <button onClick={()=>{setSelectedTrait(null);setScenario(null);setResult(null);}} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all">Choose Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
