'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FounderSetupPage() {
  const router = useRouter();
  const { niyamUser, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ orgName:'', industry:'', philosophy:'', decisionStyle:'', nonNegotiables:'' });

  const handleComplete = async () => {
    if (!niyamUser) return;
    setLoading(true);
    try {
      const orgId = niyamUser.organizationId || niyamUser.uid;

      // M-5: Atomic founder setup. Previously three sequential client writes
      // (founderDNA, organization, user.onboarded) could partially succeed if
      // the network dropped mid-flow, leaving a founder with completed DNA
      // but onboarded:false - trapping them in the wizard on next login.
      // writeBatch() ensures all three writes land together or none do.
      const batch = writeBatch(db);

      batch.set(doc(db, 'organizations', orgId, 'founderDNA', 'current'), {
        philosophy: formData.philosophy + '\n\nDecision Style: ' + formData.decisionStyle,
        signatureTraits: [],
        negativeConstraints: formData.nonNegotiables.split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, 'organizations', orgId), {
        name: formData.orgName,
        industry: formData.industry,
      });

      batch.update(doc(db, 'users', niyamUser.uid), { onboarded: true });

      await batch.commit();

      // Try to refresh auth state, but don't block navigation if it fails.
      // Known issue: firebaseUser.reload() can throw if the user object has
      // gone stale after the updateUser() re-render. Dashboard will re-fetch
      // the profile on mount anyway, so a failed refresh here is cosmetic.
      try {
        await refreshUser();
      } catch (refreshErr) {
        console.warn('[founder-setup] refreshUser failed, continuing to dashboard:', refreshErr);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step===1) return formData.orgName && formData.industry;
    if (step===2) return formData.philosophy.length > 30;
    if (step===3) return formData.decisionStyle.length > 20;
    if (step===4) return formData.nonNegotiables.length > 10;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl p-12 md:p-16 relative z-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8" />
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mapping Your DNA...</h3>
            <p className="text-slate-500 mt-4 text-lg">Analyzing your cognitive blueprint across 67 behavioral traits.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <img
                  src="/niyamhr-logo.png"
                  alt="NiyamHR"
                  className="h-12 w-auto object-contain"
                />
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">Organisation DNA Diagnostic</h2>
              </div>
              <div className="flex gap-2">{[1,2,3,4].map(i=>(<div key={i} className={`w-8 h-1.5 rounded-full transition-all ${step>=i?'bg-indigo-600':'bg-slate-100'}`} />))}</div>
            </div>

            {step===1 && (
              <div className="space-y-8 animate-fade-in-up">
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Your Organisation.</h3><p className="text-slate-500 text-lg">We calibrate the 67-trait framework to your industry.</p></div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organisation Name</label>
                  <input type="text" value={formData.orgName} onChange={e=>setFormData({...formData,orgName:e.target.value})} placeholder="e.g. SmartDNA" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xl placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industry</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Technology','Manufacturing','Consulting','Finance','Healthcare','Other'].map(ind=>(
                      <button key={ind} onClick={()=>setFormData({...formData,industry:ind})} className={`py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${formData.industry===ind?'bg-slate-900 border-slate-900 text-white shadow-xl':'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>{ind}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="space-y-8 animate-slide-in-right">
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Your Philosophy.</h3><p className="text-slate-500 text-lg">How do you think about building your organisation?</p></div>
                <textarea value={formData.philosophy} onChange={e=>setFormData({...formData,philosophy:e.target.value})} placeholder="I believe in first principles thinking..." className="w-full h-56 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all leading-relaxed" />
              </div>
            )}

            {step===3 && (
              <div className="space-y-8 animate-slide-in-right">
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Your Decision Heuristics.</h3><p className="text-slate-500 text-lg">How do you make critical decisions?</p></div>
                <textarea value={formData.decisionStyle} onChange={e=>setFormData({...formData,decisionStyle:e.target.value})} placeholder="I always ask: what would we do if we had to decide in 24 hours?..." className="w-full h-56 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all leading-relaxed" />
              </div>
            )}

            {step===4 && (
              <div className="space-y-8 animate-slide-in-right">
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Your Non-Negotiables.</h3><p className="text-slate-500 text-lg">What behaviours are unacceptable?</p></div>
                <textarea value={formData.nonNegotiables} onChange={e=>setFormData({...formData,nonNegotiables:e.target.value})} placeholder="Dishonesty, passive-aggressive communication..." className="w-full h-56 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all leading-relaxed" />
              </div>
            )}

            <div className="flex justify-between mt-12">
              {step>1?<button onClick={()=>setStep(step-1)} className="px-8 py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-900 transition-all">Back</button>:<div/>}
              <button onClick={step<4?()=>setStep(step+1):handleComplete} disabled={!canProceed()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-30 active:scale-95">{step<4?'Continue':'Map My DNA'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
