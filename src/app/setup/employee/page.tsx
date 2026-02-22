'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { saveEmployeeDNA, addDNASnapshot, updateUser } from '@/lib/firestore-service';
import { OrgLevel } from '@/types';

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const { niyamUser, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ role:'', level:OrgLevel.MIDDLE, skills:'', goals:'' });

  const handleComplete = async () => {
    if (!niyamUser) return;
    setLoading(true);
    try {
      const basicDna = {
        selectedTraits: [],
        synergyScore: 50,
        alignmentSummary: 'Initial baseline. Complete weekly check-ins to refine your DNA mapping.',
        driftAreas: ['Awaiting first assessment'],
      };
      await saveEmployeeDNA(niyamUser.uid, basicDna);
      await addDNASnapshot(niyamUser.uid, { userId: niyamUser.uid, dnaSnapshot: basicDna, synergyScore: 50, trigger: 'onboarding', delta: 0, timestamp: null });
      await updateUser(niyamUser.uid, { onboarded: true, level: formData.level });
      await refreshUser();
      router.push('/dashboard');
    } catch (err) { console.error('Onboarding error:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/4" />
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl p-12 md:p-16 relative z-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8" />
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Neural Sequencing...</h3>
            <p className="text-slate-500 mt-4 text-lg">Aligning your traits with the Founder DNA benchmark.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">N</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Employee DNA Mapping</h2>
              </div>
              <div className="flex gap-2">{[1,2,3].map(i=>(<div key={i} className={`w-8 h-1.5 rounded-full ${step>=i?'bg-indigo-600':'bg-slate-100'}`} />))}</div>
            </div>

            {step===1 && (
              <div className="space-y-8 animate-fade-in-up">
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Define Your Vector.</h3><p className="text-slate-500 text-lg">Every org level has a unique neural blueprint.</p></div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Professional Identity</label>
                  <input type="text" value={formData.role} onChange={e=>setFormData({...formData,role:e.target.value})} placeholder="e.g. Senior Product Manager" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xl placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizational Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(OrgLevel).map(lvl=>(
                      <button key={lvl} onClick={()=>setFormData({...formData,level:lvl})} className={`py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${formData.level===lvl?'bg-slate-900 border-slate-900 text-white shadow-xl':'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="space-y-8 animate-slide-in-right">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Your Capabilities.</h3>
                <textarea value={formData.skills} onChange={e=>setFormData({...formData,skills:e.target.value})} placeholder="Strategic Planning, Team Leadership, Data Analysis..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
              </div>
            )}

            {step===3 && (
              <div className="space-y-8 animate-slide-in-right">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Growth Aspirations.</h3>
                <textarea value={formData.goals} onChange={e=>setFormData({...formData,goals:e.target.value})} placeholder="I want to develop stronger strategic thinking, improve delegation..." className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg placeholder:text-slate-200 focus:border-indigo-500 transition-all" />
              </div>
            )}

            <div className="flex justify-between mt-12">
              {step>1?<button onClick={()=>setStep(step-1)} className="px-8 py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-900 transition-all">Back</button>:<div/>}
              <button onClick={step<3?()=>setStep(step+1):handleComplete} disabled={step===1?!formData.role:step===2?!formData.skills:!formData.goals} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-30 active:scale-95">{step<3?'Continue':'Map My DNA'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
