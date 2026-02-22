'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getEmployeeDNA, getCheckIns, getFounderDNA } from '@/lib/firestore-service';
import type { EmployeeDNA, CheckIn, FounderDNA } from '@/types';
import { UserRole } from '@/types';

export default function DashboardPage() {
  const { niyamUser } = useAuth();
  const [employeeDna, setEmployeeDna] = useState<EmployeeDNA|null>(null);
  const [founderDna, setFounderDna] = useState<FounderDNA|null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const [dna,cis,fDna] = await Promise.all([getEmployeeDNA(niyamUser.uid), getCheckIns(niyamUser.uid,6), niyamUser.organizationId?getFounderDNA(niyamUser.organizationId):null]);
        setEmployeeDna(dna); setCheckIns(cis); setFounderDna(fDna);
      } catch(err){console.error(err);}
      finally{setLoading(false);}
    }; load();
  }, [niyamUser]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const synergy = employeeDna?.synergyScore||0;
  const firstName = niyamUser?.displayName?.split(' ')[0]||'Professional';
  const topDrift = employeeDna?.driftAreas?.[0]||'Strategic Alignment';

  if (niyamUser?.role === UserRole.FOUNDER || niyamUser?.role === UserRole.HR_ADMIN) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10">
            <div className="px-4 py-1 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg inline-block mb-6">Founder Console</div>
            <h3 className="text-3xl xl:text-4xl font-black mb-4 tracking-tighter">Welcome, {firstName}.</h3>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">{founderDna?`Your CorePersonaDNA has ${founderDna.signatureTraits.length} signature traits. Navigate to Org Insights to see team alignment.`:'Your Founder DNA diagnostic is saved. Your cognitive blueprint is now the benchmark.'}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/hr" className="px-8 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-sm hover:bg-amber-400 transition-all shadow-xl active:scale-95">View Org Insights</Link>
              <Link href="/dashboard/founder-compass" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all active:scale-95">View My DNA</Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Active Session</div>
              <span className="text-slate-500 font-bold">•</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Synergy: {synergy}%</span>
            </div>
            <h3 className="text-3xl xl:text-4xl font-black mb-4 tracking-tighter">Welcome back, {firstName}.</h3>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">{employeeDna?<>Your primary drift area is <span className="text-white font-bold italic">{topDrift}</span>.</>:'Complete onboarding to activate neural alignment.'}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/honing" className="px-8 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-sm hover:bg-amber-400 transition-all shadow-xl active:scale-95 flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Enter Honing Lab</Link>
              <Link href="/dashboard/checkin" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all active:scale-95">Weekly Check-in</Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
        </div>
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Neural Pulse</h4>
            <div className="space-y-5">
              {[{l:'Synergy Score',v:synergy,c:'bg-amber-500'},{l:'Check-ins',v:Math.min(checkIns.length*16,100),c:'bg-indigo-500',d:checkIns.length},{l:'Traits',v:Math.min((employeeDna?.selectedTraits?.length||0)*8,100),c:'bg-emerald-500',d:employeeDna?.selectedTraits?.length||0}].map((m,i)=>(<div key={i}><div className="flex justify-between text-[10px] font-bold mb-1.5"><span className="text-slate-500">{m.l}</span><span className="text-slate-900">{m.d!==undefined?m.d:`${m.v}%`}</span></div><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`${m.c} h-full transition-all duration-1000`} style={{width:`${m.v}%`}} /></div></div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 text-center"><p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Level</p><p className="text-sm font-black text-slate-900 uppercase">{niyamUser?.level||'MIDDLE'}</p></div>
        </div>
      </div>

      {employeeDna && employeeDna.selectedTraits.length > 0 && (
        <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8">Neural Drift Mapping</h3>
          <div className="space-y-5">
            {employeeDna.selectedTraits.slice(0,5).map((t,i)=>(<div key={i} className="flex items-center gap-5 group hover:bg-slate-50 p-3 rounded-2xl transition-all"><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg ${t.score<60?'bg-red-500':t.score<75?'bg-amber-500':'bg-emerald-500'}`}>{t.score}</div><div className="flex-1"><h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">{t.name}</h4><div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-slate-900 transition-all duration-1000" style={{width:`${t.score}%`}} /></div></div><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gap</p><p className="text-xs font-black text-slate-900">{t.founderBenchmark-t.score}%</p></div></div>))}
          </div>
        </div>
      )}

      <div className="bg-indigo-600 p-10 rounded-[32px] shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Growth Vector</h4><p className="text-2xl font-black tracking-tighter leading-tight italic">&ldquo;Bridge the drift in {topDrift}. Your founder sees this as a core capability.&rdquo;</p></div>
          <div className="flex justify-end"><Link href="/dashboard/honing" className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">Enter Honing Lab</Link></div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
      </div>
    </div>
  );
}
