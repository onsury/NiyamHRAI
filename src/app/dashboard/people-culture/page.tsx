'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFounderDNA } from '@/lib/firestore-service';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PRACTICE_CATEGORIES = [
  { id: 'hiring_onboarding', label: 'Hiring & Onboarding', icon: '🎯', placeholder: 'Describe your current hiring process, interview stages, offer process, and how new employees are onboarded (first day, first week, training)..' },
  { id: 'compensation_benefits', label: 'Compensation & Benefits', icon: '💰', placeholder: 'Describe salary structure, increments, bonuses, insurance, PF, gratuity, reimbursements, perks offered...' },
  { id: 'leave_attendance', label: 'Leave & Attendance', icon: '📅', placeholder: 'Describe leave types (CL, SL, EL, etc.), work timings, WFH policy, attendance tracking, comp-off rules...' },
  { id: 'performance_management', label: 'Performance Management', icon: '📊', placeholder: 'Describe KRA/KPI setting, appraisal cycle, rating system, promotion criteria, PIP process...' },
  { id: 'learning_development', label: 'Learning & Development', icon: '📚', placeholder: 'Describe training programs, budget, certifications, mentoring, leadership development...' },
  { id: 'compliance_legal', label: 'Compliance & Legal', icon: '⚖️', placeholder: 'Describe PF/ESI status, POSH committee, labour law compliance, standing orders, contract labour management...' },
  { id: 'exit_offboarding', label: 'Exit & Offboarding', icon: '🚪', placeholder: 'Describe resignation process, notice period, knowledge transfer, exit interview, F&F settlement, experience letter...' },
  { id: 'culture_engagement', label: 'Culture & Engagement', icon: '🎉', placeholder: 'Describe team events, town halls, pulse surveys, recognition programs, communication channels, values...' },
  { id: 'diversity_inclusion', label: 'Diversity & Inclusion', icon: '🌍', placeholder: 'Describe D&I initiatives, equal opportunity practices, accessibility, anti-discrimination measures...' },
  { id: 'grievance_discipline', label: 'Grievance & Discipline', icon: '🔒', placeholder: 'Describe grievance mechanism, disciplinary process, whistle-blower policy, escalation matrix...' },
];

export default function PeopleCulturePage() {
  const { niyamUser } = useAuth();
  const [practices, setPractices] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState('hiring_onboarding');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [existingLoaded, setExistingLoaded] = useState(false);

  // Load existing practices
  useEffect(() => {
    if (!niyamUser) return;
    const load = async () => {
      try {
        const orgId = niyamUser.organizationId || niyamUser.uid;
        const snap = await getDoc(doc(db, 'organizations', orgId, 'settings', 'practices'));
        if (snap.exists()) {
          setPractices(snap.data().categories || {});
          if (snap.data().analysis) setAnalysis(snap.data().analysis);
        }
      } catch (err) { console.error(err); }
      finally { setExistingLoaded(true); }
    };
    load();
  }, [niyamUser]);

  const savePractices = async () => {
    if (!niyamUser) return;
    setSaving(true);
    try {
      const orgId = niyamUser.organizationId || niyamUser.uid;
      await setDoc(doc(db, 'organizations', orgId, 'settings', 'practices'), {
        categories: practices,
        updatedAt: serverTimestamp(),
        updatedBy: niyamUser.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const runAnalysis = async () => {
    if (!niyamUser) return;
    setAnalyzing(true);
    try {
      const orgId = niyamUser.organizationId || niyamUser.uid;
      const founderDNA = await getFounderDNA(orgId).catch(() => null);
      const org = await getDoc(doc(db, 'organizations', orgId));
      const orgData = org.exists() ? org.data() : {};

      const res = await fetch('/api/practices/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practices,
          industry: orgData?.industry || '',
          orgSize: '10-50',
          founderDNA,
        }),
      });
      const data = await res.json();
      setAnalysis(data);

      // Save analysis
      await setDoc(doc(db, 'organizations', orgId, 'settings', 'practices'), {
        analysis: data,
        analyzedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) { console.error(err); }
    finally { setAnalyzing(false); }
  };

  const filledCount = Object.values(practices).filter(v => v.trim().length > 20).length;
  const activeCat = PRACTICE_CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">People &amp; Culture Hub</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Share your existing HR practices. NiyamAI will benchmark them, identify gaps, and align them with the founder&apos;s DNA.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs sm:text-sm font-bold text-slate-700">Practice Documentation Progress</p>
          <p className="text-xs font-bold text-amber-600">{filledCount}/10 categories</p>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${filledCount * 10}%` }} />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Document at least 5 categories for meaningful analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories</p>
            </div>
            <div className="divide-y divide-slate-50">
              {PRACTICE_CATEGORIES.map(cat => {
                const hasContent = (practices[cat.id] || '').trim().length > 20;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${activeCategory === cat.id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                    <span className="text-lg">{cat.icon}</span>
                    <span className={`text-xs sm:text-sm font-semibold flex-1 ${activeCategory === cat.id ? 'text-amber-700' : 'text-slate-600'}`}>{cat.label}</span>
                    {hasContent ? (
                      <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="w-5 h-5 bg-slate-200 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{activeCat.icon}</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{activeCat.label}</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mb-4">Describe your current practices in this area. Be as detailed as possible — include processes, policies, tools used, and any pain points.</p>

            <textarea
              value={practices[activeCategory] || ''}
              onChange={e => setPractices({ ...practices, [activeCategory]: e.target.value })}
              className="w-full h-48 sm:h-64 p-4 sm:p-5 bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl text-slate-800 text-sm leading-relaxed placeholder:text-slate-300 focus:border-amber-500 transition-all outline-none resize-none"
              placeholder={activeCat.placeholder}
            />

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button onClick={savePractices} disabled={saving} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Progress'}
              </button>
              {filledCount >= 3 && (
                <button onClick={runAnalysis} disabled={analyzing} className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2">
                  {analyzing ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Analysing...</> : '🧠 Run AI Analysis'}
                </button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mt-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">💡 Why Document Existing Practices?</p>
            <ul className="text-xs text-amber-800 space-y-1.5 leading-relaxed">
              <li>• NiyamAI builds ON your practices, not against them</li>
              <li>• Your team sees familiar processes reflected in assessments</li>
              <li>• Compliance gaps are identified against Indian labour law</li>
              <li>• Founder DNA alignment reveals cultural mismatches</li>
              <li>• AI generates improved policies from your baseline</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">P&amp;C Benchmark Score</p>
                <h2 className="text-3xl sm:text-4xl font-black">{analysis.benchmarkScore || 50}%</h2>
              </div>
              <div className={`px-4 py-2 rounded-full text-xs font-black uppercase ${(analysis.benchmarkScore || 0) >= 70 ? 'bg-emerald-500 text-white' : (analysis.benchmarkScore || 0) >= 40 ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'}`}>
                {(analysis.benchmarkScore || 0) >= 70 ? 'Strong Foundation' : (analysis.benchmarkScore || 0) >= 40 ? 'Needs Strengthening' : 'Critical Gaps'}
              </div>
            </div>

            {/* Founder Alignment */}
            {analysis.founderAlignment && (
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Founder DNA Alignment</p>
                <p className="text-sm text-white/80 leading-relaxed">{analysis.founderAlignment}</p>
              </div>
            )}

            {/* Category Scores */}
            {analysis.categoryScores && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                {Object.entries(analysis.categoryScores).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className={`text-lg sm:text-xl font-black ${val.score >= 70 ? 'text-emerald-400' : val.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{val.score}%</div>
                    <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gaps + Strengths + Compliance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quick Wins */}
            {analysis.quickWins?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <h3 className="text-sm font-black text-emerald-800 mb-3 flex items-center gap-2"><span>⚡</span>Quick Wins</h3>
                <ul className="space-y-2">
                  {analysis.quickWins.map((w: string, i: number) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">→</span>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {analysis.gaps?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="text-sm font-black text-amber-800 mb-3 flex items-center gap-2"><span>⚠️</span>Key Gaps</h3>
                <ul className="space-y-2">
                  {analysis.gaps.map((g: string, i: number) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Flags */}
            {analysis.complianceFlags?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h3 className="text-sm font-black text-red-800 mb-3 flex items-center gap-2"><span>🚨</span>Compliance Alerts</h3>
                <ul className="space-y-2">
                  {analysis.complianceFlags.map((f: string, i: number) => (
                    <li key={i} className="text-xs text-red-700 flex items-start gap-2"><span className="text-red-500 mt-0.5">!</span>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                    <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{i + 1}</span>
                    <p className="text-xs sm:text-sm text-indigo-800">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
