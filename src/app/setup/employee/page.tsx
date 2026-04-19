'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { saveEmployeeDNA, addDNASnapshot, updateUser, getFounderDNA } from '@/lib/firestore-service';

const SKILLS = ['Leadership', 'Communication', 'Technical', 'Strategy', 'Creativity', 'Analytics', 'Teamwork', 'Problem Solving', 'Time Management', 'Customer Focus'];
const LEVELS = [
  { id: 'SENIOR', label: 'Senior / Head' },
  { id: 'MIDDLE', label: 'Manager / Lead' },
  { id: 'JUNIOR', label: 'Executive / Analyst' },
];

export default function EmployeeSetupPage() {
  const router = useRouter();
  const { niyamUser, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('MIDDLE');
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [goals, setGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 5 ? [...prev, s] : prev);
  };

  const handleComplete = async () => {
    if (!niyamUser) return;
    setSubmitting(true);

    try {
      const orgId = niyamUser.organizationId;
      const founderDNA = orgId ? await getFounderDNA(orgId).catch(() => null) : null;

      // Call AI DNA mapping
      const res = await fetch('/api/employee-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeData: { role: niyamUser.role, level, skills, experience, goals },
          founderDNA,
        }),
      });

      const dna = await res.json();

      // Save DNA profile
      await saveEmployeeDNA(niyamUser.uid, dna);

      // Save initial snapshot to history
      await addDNASnapshot(niyamUser.uid, {
        traits: dna.traits || [],
        synergyScore: dna.synergyScore || 50,
        trigger: 'onboarding',
      });

      // Mark user as onboarded
      await updateUser(niyamUser.uid, { onboarded: true, level });

      // Re-fetch profile so auth-context has onboarded:true before navigation
      await refreshUser();

      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      // Fallback: mark onboarded even if AI fails
      try {
        await saveEmployeeDNA(niyamUser.uid, {
          traits: [], synergyScore: 50, driftAreas: ['Initial assessment'], strengths: ['Onboarded'],
        });
        await updateUser(niyamUser.uid, { onboarded: true, level });
        await refreshUser();
        router.push('/dashboard');
      } catch (e) { console.error(e); }
    } finally { setSubmitting(false); }
  };

  const steps = [
    // Step 0: Level
    <div key="level" className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-black text-white">Your Level</h2>
      <p className="text-white/40 text-sm">This helps calibrate your DNA baseline.</p>
      <div className="space-y-3 mt-6">
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => setLevel(l.id)} className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${level === l.id ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}>
            <span className="font-black text-sm sm:text-base">{l.label}</span>
          </button>
        ))}
      </div>
    </div>,
    // Step 1: Skills
    <div key="skills" className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-black text-white">Core Skills</h2>
      <p className="text-white/40 text-sm">Select up to 5 that define you.</p>
      <div className="grid grid-cols-2 gap-2 mt-6">
        {SKILLS.map(s => (
          <button key={s} onClick={() => toggleSkill(s)} className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${skills.includes(s) ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>{s}</button>
        ))}
      </div>
      <p className="text-white/20 text-xs mt-2">{skills.length}/5 selected</p>
    </div>,
    // Step 2: Experience + Goals
    <div key="exp" className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-black text-white">Your Background</h2>
      <div>
        <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Experience Summary</label>
        <textarea value={experience} onChange={e => setExperience(e.target.value)} className="w-full h-28 p-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-sm placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none resize-none" placeholder="Brief summary of your professional experience..." />
      </div>
      <div>
        <label className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 block">Growth Goals</label>
        <textarea value={goals} onChange={e => setGoals(e.target.value)} className="w-full h-28 p-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-sm placeholder:text-white/15 focus:border-amber-500/50 transition-all outline-none resize-none" placeholder="What do you want to grow into at this organisation?" />
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 sm:p-8">
          {steps[step]}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-white/30 font-bold text-xs uppercase tracking-widest hover:text-white/50">Back</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-4 bg-amber-500 text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all">Continue</button>
            ) : (
              <button onClick={handleComplete} disabled={submitting} className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-xs uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Mapping Your DNA...</> : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
