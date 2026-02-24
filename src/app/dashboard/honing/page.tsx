'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFounderDNA, saveHoningSession, getHoningSessions } from '@/lib/firestore-service';

const TRAITS = ['Decision Architecture', 'People Philosophy', 'Risk & Innovation', 'Execution DNA', 'Culture Code', 'Growth Orientation'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function HoningLabPage() {
  const { niyamUser } = useAuth();
  const [phase, setPhase] = useState<'select'|'scenario'|'evaluate'|'result'>('select');
  const [selectedTrait, setSelectedTrait] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [scenario, setScenario] = useState<any>(null);
  const [userResponse, setUserResponse] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!niyamUser) return;
    getHoningSessions(niyamUser.uid, 5).then(setHistory).catch(console.error);
  }, [niyamUser]);

  const generateScenario = async () => {
    setLoading(true);
    try {
      const orgId = niyamUser?.organizationId || niyamUser?.uid || '';
      const founderDNA = await getFounderDNA(orgId).catch(() => null);

      const res = await fetch('/api/honing/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trait: selectedTrait, difficulty, founderDNA }),
      });
      const data = await res.json();
      setScenario(data);
      setPhase('scenario');
    } catch (err) {
      console.error(err);
      setScenario({ scenario: 'A key client threatens to leave unless you match a competitor\'s price. Your team says the competitor is unsustainable. What do you do?', trait: selectedTrait, difficulty, options: ['Match price', 'Hold firm on value', 'Offer alternatives', 'Let them go'] });
      setPhase('scenario');
    } finally { setLoading(false); }
  };

  const submitResponse = async () => {
    if (!userResponse.trim()) return;
    setLoading(true);
    try {
      const orgId = niyamUser?.organizationId || niyamUser?.uid || '';
      const founderDNA = await getFounderDNA(orgId).catch(() => null);

      const res = await fetch('/api/honing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenario?.scenario, response: userResponse, trait: selectedTrait, founderDNA }),
      });
      const data = await res.json();
      setEvaluation(data);
      setPhase('result');

      // Save session
      if (niyamUser) {
        await saveHoningSession(niyamUser.uid, {
          scenario: scenario?.scenario,
          response: userResponse,
          evaluation: data.evaluation,
          traitTargeted: selectedTrait,
          alignmentScore: data.alignmentScore,
        });
        const sessions = await getHoningSessions(niyamUser.uid, 5);
        setHistory(sessions);
      }
    } catch (err) {
      console.error(err);
      setEvaluation({ evaluation: 'Your response has been saved.', alignmentScore: 50, founderWouldSay: '', improvementTip: 'Keep practicing.' });
      setPhase('result');
    } finally { setLoading(false); }
  };

  const reset = () => { setPhase('select'); setScenario(null); setUserResponse(''); setEvaluation(null); };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4">⚡</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Neural Honing Lab</h1>
        <p className="text-white/50 text-sm sm:text-base mt-2">Bridge behavioral drift through founder-calibrated simulations.</p>
      </div>

      {/* Select Phase */}
      {phase === 'select' && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
          <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">Select a Trait to Hone</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6">
            {TRAITS.map(t => (
              <button key={t} onClick={() => setSelectedTrait(t)} className={`py-3 sm:py-4 px-4 rounded-xl sm:rounded-2xl border-2 text-left text-xs sm:text-sm font-bold transition-all ${selectedTrait === t ? 'bg-amber-500 border-amber-500 text-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300'}`}>{t}</button>
            ))}
          </div>

          <h3 className="text-sm font-bold text-slate-500 mb-2">Difficulty</h3>
          <div className="flex gap-2 mb-6">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${difficulty === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{d}</button>
            ))}
          </div>

          <button onClick={generateScenario} disabled={!selectedTrait || loading} className="w-full py-3.5 sm:py-4 bg-amber-500 text-black rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest disabled:opacity-30 hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating...</> : 'Generate Scenario'}
          </button>
        </div>
      )}

      {/* Scenario Phase */}
      {phase === 'scenario' && scenario && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] sm:text-xs font-black uppercase">{scenario.trait}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] sm:text-xs font-bold uppercase">{scenario.difficulty}</span>
          </div>

          <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed mb-6">{scenario.scenario}</p>

          {scenario.options?.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Options (or write your own below)</p>
              {scenario.options.map((opt: string, i: number) => (
                <button key={i} onClick={() => setUserResponse(opt)} className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 text-xs sm:text-sm transition-all ${userResponse === opt ? 'bg-amber-50 border-amber-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-200'}`}>{opt}</button>
              ))}
            </div>
          )}

          <textarea value={userResponse} onChange={e => setUserResponse(e.target.value)} className="w-full h-28 sm:h-36 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-amber-500 transition-all outline-none resize-none" placeholder="Or describe your approach in your own words..." />

          <div className="flex gap-3 mt-4">
            <button onClick={reset} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all">← Back</button>
            <button onClick={submitResponse} disabled={!userResponse.trim() || loading} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Evaluating...</> : 'Submit Response'}
            </button>
          </div>
        </div>
      )}

      {/* Result Phase */}
      {phase === 'result' && evaluation && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Evaluation</h2>
              <span className={`text-2xl sm:text-3xl font-black ${evaluation.alignmentScore >= 70 ? 'text-emerald-500' : evaluation.alignmentScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{evaluation.alignmentScore}%</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4">{evaluation.evaluation}</p>

            {evaluation.founderWouldSay && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Founder Would Say</p>
                <p className="text-xs sm:text-sm text-amber-900 italic">&ldquo;{evaluation.founderWouldSay}&rdquo;</p>
              </div>
            )}

            {evaluation.improvementTip && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Improvement Tip</p>
                <p className="text-xs sm:text-sm text-indigo-800">{evaluation.improvementTip}</p>
              </div>
            )}
          </div>

          <button onClick={reset} className="w-full py-3.5 sm:py-4 bg-amber-500 text-black rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-amber-400 transition-all">Try Another Scenario</button>
        </div>
      )}

      {/* Session History */}
      {history.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700">{h.traitTargeted}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">{h.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Recent'}</p>
                </div>
                <span className={`text-lg font-black ${(h.alignmentScore || 0) >= 70 ? 'text-emerald-500' : (h.alignmentScore || 0) >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{h.alignmentScore || '—'}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
