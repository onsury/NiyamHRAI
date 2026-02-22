'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFounderDNA, getOrganization } from '@/lib/firestore-service';
import type { FounderDNA, Organization } from '@/types';

export default function FounderCompassPage() {
  const { niyamUser } = useAuth();
  const [founderDna, setFounderDna] = useState<FounderDNA|null>(null);
  const [org, setOrg] = useState<Organization|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => { try { const orgId=niyamUser.organizationId; if(orgId){const[d,o]=await Promise.all([getFounderDNA(orgId),getOrganization(orgId)]); setFounderDna(d);setOrg(o);} } catch(e){console.error(e);} finally{setLoading(false);} }; load();
  }, [niyamUser]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!founderDna) return <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in-up"><h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Founder DNA Not Mapped</h3><p className="text-slate-500 text-lg">The founder needs to complete the diagnostic first.</p></div>;

  const clusters: Record<string, typeof founderDna.signatureTraits> = {};
  founderDna.signatureTraits.forEach(t=>{if(!clusters[t.cluster])clusters[t.cluster]=[];clusters[t.cluster].push(t);});

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div><h2 className="text-3xl font-black tracking-tighter">Founder Compass</h2><p className="text-slate-500 mt-1">{org?.name?`${org.name}'s`:'Your organization\'s'} cognitive benchmark.</p></div>

      <div className="bg-slate-900 p-10 rounded-[32px] text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10"><p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4">Founder&apos;s Philosophy</p><p className="text-xl leading-relaxed italic text-slate-200 max-w-3xl">&ldquo;{founderDna.philosophy}&rdquo;</p></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40" />
      </div>

      {founderDna.negativeConstraints&&founderDna.negativeConstraints.length>0 && (
        <div className="bg-red-50 p-8 rounded-[24px] border border-red-200"><p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-4">Non-Negotiables</p><div className="flex flex-wrap gap-3">{founderDna.negativeConstraints.map((nc,i)=>(<span key={i} className="px-4 py-2 bg-white text-red-700 rounded-full text-sm font-bold border border-red-200">✕ {nc}</span>))}</div></div>
      )}

      {Object.entries(clusters).map(([cluster,traits])=>(<div key={cluster}><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">{cluster}</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{traits.map((t,i)=>(<div key={i} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-lg transition-all"><h4 className="text-base font-black tracking-tight mb-2">{t.name}</h4><p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{t.description}</p><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{width:`${t.score}%`}} /></div><span className="text-xs font-black text-slate-900">{t.score}</span></div></div>))}</div></div>))}
    </div>
  );
}
