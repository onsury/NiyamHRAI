'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const POLICIES = [
  { id: 'employee_handbook', label: 'Employee Handbook', icon: 'ðŸ“–', desc: 'Complete handbook covering all policies' },
  { id: 'onboarding_checklist', label: '30-60-90 Onboarding', icon: 'ðŸŽ¯', desc: 'Structured onboarding with milestones' },
  { id: 'performance_framework', label: 'Performance Framework', icon: 'ðŸ“Š', desc: 'KRA, appraisal, promotion criteria' },
  { id: 'leave_policy', label: 'Leave Policy', icon: 'ðŸ“…', desc: 'All leave types, Indian law compliant' },
  { id: 'posh_policy', label: 'POSH Policy', icon: 'âš–ï¸', desc: 'Sexual Harassment prevention (2013 Act)' },
  { id: 'exit_process', label: 'Exit Process', icon: 'ðŸšª', desc: 'Resignation to F&F settlement' },
  { id: 'code_of_conduct', label: 'Code of Conduct', icon: 'ðŸ¤', desc: 'Ethics, behavior, discipline' },
  { id: 'compensation_structure', label: 'Compensation Philosophy', icon: 'ðŸ’°', desc: 'Salary bands, benefits, increments' },
  { id: 'learning_development', label: 'L&D Framework', icon: 'ðŸ“š', desc: 'Training, certifications, budget' },
  { id: 'diversity_inclusion', label: 'D&I Policy', icon: 'ðŸŒ', desc: 'Equal opportunity, accessibility' },
];

export default function PoliciesPage() {
  const { niyamUser, firebaseUser } = useAuth();
  const [generating, setGenerating] = useState('');
  const [policy, setPolicy] = useState<any>(null);

  const generate = async (policyType: string) => {
    setGenerating(policyType);
    setPolicy(null);
    try {
      const idToken = await firebaseUser?.getIdToken();
      const res = await fetch('/api/practices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          policyType,
          orgName: '',
          industry: '',
          orgSize: '10-50',
        }),
      });
      const data = await res.json();
      setPolicy(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Policy Generator</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          AI-generated policies aligned with your founder DNA and existing practices. Indian law compliant.
        </p>
      </div>

      {!policy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {POLICIES.map(p => (
            <button
              key={p.id}
              onClick={() => generate(p.id)}
              disabled={!!generating}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm text-left hover:shadow-md hover:border-amber-300 transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                  {p.label}
                </h3>
              </div>
              <p className="text-xs text-slate-400">{p.desc}</p>
              {generating === p.id && (
                <div className="mt-3 flex items-center gap-2 text-amber-600">
                  <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                  <span className="text-xs font-bold">Generating...</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {policy && (
        <div>
          <button
            onClick={() => setPolicy(null)}
            className="mb-4 px-4 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            â† Back to All Policies
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">AI-Generated Policy</p>
              <h2 className="text-xl sm:text-2xl font-black">{policy.title}</h2>
              {policy.version && (
                <p className="text-white/40 text-xs mt-1">
                  Version {policy.version} Â· Effective: {policy.effectiveDate || 'Immediate'}
                </p>
              )}
            </div>

            {policy.founderAlignmentNote && (
              <div className="mx-5 sm:mx-8 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                  ðŸ§¬ Founder DNA Alignment
                </p>
                <p className="text-xs sm:text-sm text-amber-800">{policy.founderAlignmentNote}</p>
              </div>
            )}

            <div className="p-5 sm:p-8 space-y-6">
              {(policy.sections || []).map((section: any, i: number) => (
                <div key={i}>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-2">
                    {i + 1}. {section.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                  {section.subSections?.map((sub: any, j: number) => (
                    <div key={j} className="ml-4 mt-3">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-700">{sub.heading}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{sub.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {policy.complianceNotes?.length > 0 && (
              <div className="mx-5 sm:mx-8 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">
                  âš–ï¸ Indian Law Compliance Notes
                </p>
                <ul className="space-y-1.5">
                  {policy.complianceNotes.map((n: string, i: number) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">âœ“</span>{n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-5 sm:px-8 pb-6 text-xs text-slate-400">
              Review Cycle: {policy.reviewCycle || 'Annual'} Â· Generated by NiyamAI People &amp; Culture Intelligence
            </div>
          </div>
        </div>
      )}
    </div>
  );
}