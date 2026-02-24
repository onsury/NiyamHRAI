'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOrgUsers, getEmployeeDNA } from '@/lib/firestore-service';
import type { NiyamUser, EmployeeDNA } from '@/types';

interface EmpDNA extends NiyamUser { dna?: EmployeeDNA|null; }

export default function HRInsightsPage() {
  const { niyamUser } = useAuth();
  const [employees, setEmployees] = useState<EmpDNA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const emps = await getOrgUsers(niyamUser.organizationId);
        const empsWithDna: any[] = await Promise.all(emps.slice(0,20).map(async e=>({...e, dna: await getEmployeeDNA(e.uid)})));
        setEmployees(empsWithDna);
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    }; load();
  }, [niyamUser]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const onboarded = employees.filter(e=>e.onboarded&&e.dna);
  const avgSynergy = onboarded.length ? Math.round(onboarded.reduce((s,e)=>s+(e.dna?.synergyScore||0),0)/onboarded.length) : 0;
  const critical = onboarded.filter(e=>(e.dna?.synergyScore||0)<50);
  const stars = onboarded.filter(e=>(e.dna?.synergyScore||0)>=80);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div><h2 className="text-3xl font-black tracking-tighter">Org Neural Insights</h2><p className="text-slate-500 mt-1">Organization-wide drift analytics.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{l:'Employees',v:employees.length,c:'bg-slate-900 text-white'},{l:'Avg Synergy',v:`${avgSynergy}%`,c:'bg-amber-500 text-slate-900'},{l:'Critical Drift',v:critical.length,c:'bg-red-500 text-white'},{l:'Stars',v:stars.length,c:'bg-emerald-500 text-white'}].map((k,i)=>(<div key={i} className={`${k.c} p-6 rounded-[20px] shadow-lg`}><p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">{k.l}</p><p className="text-3xl font-black">{k.v}</p></div>))}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-lg font-black tracking-tighter">Employee Grid</h3><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{onboarded.length} mapped / {employees.length} total</span></div>
        <div className="divide-y divide-slate-50">
          {employees.length===0 ? <div className="p-12 text-center text-slate-400 font-bold">No employees yet.</div> :
          employees.map((e,i)=>(<div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all"><div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">{(e.displayName||'U')[0].toUpperCase()}</div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{e.displayName}</p><p className="text-xs text-slate-400 truncate">{e.email}</p></div><div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level</p><p className="text-xs font-bold text-slate-600">{e.level}</p></div><div className="text-center w-20">{e.dna?<><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1"><div className={`h-full rounded-full ${(e.dna.synergyScore)>=75?'bg-emerald-500':(e.dna.synergyScore)>=50?'bg-amber-500':'bg-red-500'}`} style={{width:`${e.dna.synergyScore}%`}} /></div><p className="text-xs font-black text-slate-900">{e.dna.synergyScore}%</p></>:<span className="text-[9px] font-bold text-slate-300 uppercase">Not mapped</span>}</div><div>{e.dna&&e.dna.synergyScore<50&&<span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-full">⚠ Drift</span>}{e.dna&&e.dna.synergyScore>=80&&<span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">★ Star</span>}</div></div>))}
        </div>
      </div>

      {critical.length>0 && (
        <div className="bg-red-50 p-8 rounded-[24px] border border-red-200">
          <h3 className="text-lg font-black text-red-900 tracking-tighter mb-4">⚠ Critical Drift Alerts</h3>
          <div className="space-y-3">{critical.map((e,i)=>(<div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-red-100"><div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-black text-sm">{(e.displayName||'U')[0]}</div><div className="flex-1"><p className="text-sm font-bold text-slate-900">{e.displayName}</p><p className="text-xs text-red-600">Synergy: {e.dna?.synergyScore}% • Drift: {e.dna?.driftAreas?.join(', ')}</p></div></div>))}</div>
        </div>
      )}
    </div>
  );
}
