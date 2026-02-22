'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { niyamUser } = useAuth();
  const handleLaunch = () => router.push(niyamUser ? '/dashboard' : '/login');

  return (
    <div className="bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 lg:px-20 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">N</div>
          <span className="text-2xl font-black tracking-tighter">NIYAM</span>
        </div>
        <div className="hidden lg:flex gap-12 items-center">
          {['Problem', 'Engine', 'How It Works'].map(l => (
            <button key={l} onClick={() => document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className="text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em]">{l}</button>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button onClick={handleLaunch} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">Launch Platform</button>
        </div>
        <button onClick={handleLaunch} className="lg:hidden px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Launch</button>
      </nav>

      <section className="relative pt-48 pb-32 px-6 lg:px-20 min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full mb-12 border border-indigo-100 animate-fade-in-up">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Powered by Claude + Gemini Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-[120px] lg:text-[140px] font-black tracking-tighter leading-[0.85] mb-12 animate-fade-in-up animation-delay-100">BRIDGING THE<br /><span className="text-indigo-600 italic">NEURAL</span> DRIFT.</h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-16 font-medium animate-fade-in-up animation-delay-200">NiyamAI is the first <span className="text-slate-900 font-bold italic">Founder-Centric AI Mentor</span> for enterprises. We measure how far every employee&apos;s behavior has drifted from the founder&apos;s strategic DNA — and close the gap continuously.</p>
          <button onClick={handleLaunch} className="px-14 py-7 bg-slate-900 text-white rounded-[32px] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 animate-fade-in-up animation-delay-300">Initialize Platform</button>
        </div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-amber-400/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/4" />
      </section>

      <section id="problem" className="py-32 px-6 lg:px-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6">The $8.8 Trillion Problem</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-16">As organizations scale,<br /><span className="text-slate-400">founder intent dilutes.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {[{n:'01',t:'Behavioral Drift',d:'Employees lack continuous guidance aligned to founder thinking. The gap widens invisibly.'},{n:'02',t:'Generic HR Tools',d:'Traditional platforms track activity, not growth alignment with the founder vision.'},{n:'03',t:'Cognitive Disconnect',d:'Between the founder blueprint and each employee lies an unmeasured chasm.'}].map(i=>(
              <div key={i.n} className="bg-white p-12 rounded-[40px] border border-slate-200 hover:border-indigo-200 hover:shadow-xl transition-all group">
                <span className="text-6xl font-black text-slate-100 group-hover:text-indigo-100 transition-colors">{i.n}</span>
                <h3 className="text-2xl font-black tracking-tighter mt-6 mb-4">{i.t}</h3>
                <p className="text-slate-500 leading-relaxed">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="engine" className="py-32 px-6 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-6">The NiyamAI Engine</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-16">Five intelligence functions.<br /><span className="text-slate-400">One aligned organization.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[{i:'🧬',t:'Founder DNA Diagnostic',d:'Deep probe maps cognitive blueprint across 67 traits.',g:'Claude'},{i:'🔬',t:'Employee DNA Mapping',d:'Maps each employee against founder benchmark.',g:'Gemini Flash'},{i:'🧭',t:'Weekly AI Mentorship',d:'Claude holds both founder and employee DNA in context.',g:'Claude Sonnet'},{i:'⚡',t:'Neural Honing Lab',d:'Simulations evaluated against founder first principles.',g:'Claude + Gemini'},{i:'📊',t:'HR Neural Insights',d:'Org-wide drift analytics and burnout detection.',g:'Gemini Pro'}].map(f=>(
              <div key={f.t} className="bg-slate-900 p-10 rounded-[32px] text-white border border-slate-800 hover:border-indigo-500/50 transition-all">
                <div className="text-4xl mb-6">{f.i}</div>
                <h3 className="text-xl font-black tracking-tight mb-3">{f.t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{f.d}</p>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] px-3 py-1 bg-amber-500/10 rounded-full">{f.g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 px-6 lg:px-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-20">Three layers of<br /><span className="text-indigo-400">organizational intelligence.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {[{s:'01',t:'CorePersonaDNA',d:'Map the founder cognitive signature across 67 traits.'},{s:'02',t:'FunctionPersonaDNA',d:'Calibrate the framework to each department and role level.'},{s:'03',t:'EmployeePersonaDNA',d:'Continuously measure, mentor, and close the drift.'}].map(s=>(
              <div key={s.s} className="text-left"><span className="text-7xl font-black text-white/10">{s.s}</span><h3 className="text-2xl font-black tracking-tighter mt-4 mb-4 text-amber-500">{s.t}</h3><p className="text-slate-400 leading-relaxed">{s.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 lg:px-20 bg-indigo-600 text-white text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-8">Ready to align your organization?</h2>
          <button onClick={handleLaunch} className="px-14 py-7 bg-white text-indigo-600 rounded-[32px] font-black text-xl hover:bg-slate-50 transition-all shadow-2xl active:scale-95">Begin Diagnostic</button>
        </div>
      </section>

      <footer className="py-12 px-6 bg-slate-900 text-slate-500 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-900 font-black text-lg">N</div>
          <span className="text-lg font-black text-white tracking-tighter">NIYAM</span>
        </div>
        <p className="text-xs">Built by SmartDNA Business Intelligence. Powered by Anthropic Claude &amp; Google Gemini.</p>
      </footer>
    </div>
  );
}
