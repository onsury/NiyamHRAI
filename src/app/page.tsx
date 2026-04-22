'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { niyamUser } = useAuth();
  const handleLaunch = () => router.push(niyamUser ? '/dashboard' : '/login');
  const [billing, setBilling] = useState<'monthly'|'annual'>('annual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-x-hidden">

      {/* === NAV === */}
      {/* === NAV === */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-6 lg:px-16 py-3 md:py-4 flex justify-between items-center gap-2">
        <a href="/" className="flex items-center cursor-pointer flex-shrink-0">
          <img 
            src="/niyamhr-logo.png" 
            alt="NiyamHR — AI that powers people" 
            className="h-14 md:h-20 w-auto object-contain"
          />
        </a>
        
        {/* Desktop menu */}
        <div className="hidden lg:flex gap-10 items-center">
          {['Problem', 'How It Works', 'Features', 'Pricing'].map(l => (
            <button key={l} onClick={() => document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-white/50 hover:text-white transition-all font-medium">{l}</button>
          ))}
          <button onClick={handleLaunch} className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-amber-500 hover:text-black transition-all">Get Started Free</button>
        </div>
        
        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
          <button onClick={handleLaunch} className="px-4 py-2 bg-white text-black rounded-full font-bold text-xs md:text-sm whitespace-nowrap">Start Free</button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-[68px] md:top-[96px] left-0 w-full z-40 bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/10 lg:hidden">
          <div className="px-6 py-6 space-y-1">
            {['Problem', 'How It Works', 'Features', 'Pricing'].map(l => (
              <button 
                key={l} 
                onClick={() => {
                  document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }} 
                className="block w-full text-left px-4 py-3 text-base text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === HERO === */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-4 md:px-6 lg:px-16 min-h-screen flex flex-col justify-center">
        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6 md:mb-8">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm text-amber-500 font-semibold">Now in Early Access</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[88px] font-black leading-[1.05] md:leading-[0.95] tracking-tight mb-6 md:mb-8 break-words">
            Every employee&apos;s<br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">personal AI mentor.</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-white/50 max-w-2xl leading-relaxed mb-10 md:mb-12">
            NiyamHR gives every employee a personal AI mentor — calibrated to your organisation&apos;s DNA, focused on daily growth, and always in sync with where the company is going.
          </p>

          <div className="flex flex-wrap gap-3 md:gap-4 mb-16 md:mb-20">
            <button onClick={handleLaunch} className="px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-base md:text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all active:scale-95">Start Free Trial</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-base md:text-lg hover:bg-white/10 transition-all">See How It Works</button>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl p-2 shadow-2xl">
              <div className="bg-[#12121a] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-4 text-xs text-white/30 font-mono truncate">app.niyamhr.in/dashboard</span>
                </div>
                <div className="p-6 md:p-8 lg:p-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 rounded-2xl p-6 md:p-8 text-center">
                      <div className="text-5xl md:text-6xl font-black text-amber-500 mb-2">87%</div>
                      <div className="text-xs md:text-sm text-amber-500/70 font-bold uppercase tracking-widest">Org Synergy Score</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                      <div className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-widest mb-4">Top Drift Areas</div>
                      {['Strategic Thinking', 'Customer Empathy', 'Speed of Execution'].map((t, i) => (
                        <div key={i} className="flex items-center gap-3 mb-3">
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: i === 0 ? '72%' : i === 1 ? '45%' : '23%' }} /></div>
                          <span className="text-xs text-white/50 whitespace-nowrap">{t}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                      <div className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-widest mb-4">Team Alignment</div>
                      {[{n:'Priya R.',s:92,c:'bg-emerald-500'},{n:'Arjun K.',s:78,c:'bg-amber-500'},{n:'Meera S.',s:61,c:'bg-orange-500'},{n:'Raj T.',s:44,c:'bg-red-500'}].map((e, i) => (
                        <div key={i} className="flex items-center gap-3 mb-3">
                          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/60">{e.n[0]}</div>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${e.c}`} style={{ width: `${e.s}%` }} /></div>
                          <span className="text-xs text-white/50 font-bold">{e.s}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-20 left-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
            <div className="absolute -bottom-20 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
        </div>
      </section>

      {/* === SOCIAL PROOF === */}
      <section className="py-12 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-white/30 font-medium uppercase tracking-widest mb-6">Built for founder-led organisations across</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-white/20 font-bold text-lg">
            {['Technology', 'Manufacturing', 'Consulting', 'Healthcare', 'Finance', 'Education'].map(i => (
              <span key={i} className="hover:text-white/40 transition-colors">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {/* === PROBLEM === */}
      <section id="problem" className="py-20 md:py-32 px-4 md:px-6 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">The Hidden Problem</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 leading-tight">Employees are drifting<br /><span className="text-white/30">from your vision. Every day.</span></h2>
            <p className="text-lg md:text-xl text-white/40 mt-6 max-w-2xl mx-auto leading-relaxed">As organisations scale, strategic intent gets diluted across layers. By the time it reaches the frontline, it&apos;s unrecognisable. This invisible &ldquo;alignment drift&rdquo; costs enterprises crores in misaligned effort.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📉', stat: '73%', title: 'of employees can\'t articulate their company\'s strategy', desc: 'Harvard Business Review found that alignment breaks down within the first two management layers.' },
              { icon: '💸', stat: '₹74L Cr', title: 'lost globally to disengaged workers', desc: 'Gallup estimates that disengagement — largely caused by misalignment — destroys more value than most recessions.' },
              { icon: '🔄', stat: '6–18 mo', title: 'to recover from a misaligned hire', desc: 'When employees operate on different mental models than the organisation, rework and attrition become inevitable.' },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-10 hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all group">
                <span className="text-4xl">{item.icon}</span>
                <div className="text-3xl md:text-4xl font-black text-white mt-6 mb-2">{item.stat}</div>
                <h3 className="text-lg font-bold text-white/80 mb-3">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section id="how-it-works" className="py-20 md:py-32 px-4 md:px-6 lg:px-16 bg-gradient-to-b from-transparent via-amber-500/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 leading-tight">Three layers.<br /><span className="text-white/30">One aligned organisation.</span></h2>
          </div>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Map Your Organisation&apos;s DNA', desc: 'Through a deep diagnostic conversation, NiyamHR extracts decision-making patterns, values, risk appetite, and non-negotiables — creating a living cognitive blueprint across 67 behavioral traits.', visual: '🧬', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/20' },
              { step: '02', title: 'Benchmark Every Employee', desc: 'Each team member goes through their own diagnostic. NiyamHR maps their behavioral patterns against the organisation\'s benchmark — identifying exact drift areas, hidden strengths, and growth opportunities.', visual: '🔬', color: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/20' },
              { step: '03', title: 'Grow Continuously', desc: 'Weekly AI-powered mentorship sessions, scenario simulations, and personalised growth paths keep every employee moving in the right direction — with real-time drift tracking and burnout detection.', visual: '🚀', color: 'from-emerald-500/20 to-green-500/10', border: 'border-emerald-500/20' },
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-r ${item.color} border ${item.border} rounded-3xl p-8 md:p-10 lg:p-14 flex flex-col md:flex-row gap-6 md:gap-8 items-start hover:scale-[1.01] transition-all`}>
                <div className="flex-shrink-0">
                  <div className="text-5xl md:text-6xl mb-4">{item.visual}</div>
                  <span className="text-6xl md:text-7xl font-black text-white/5">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight mb-4" dangerouslySetInnerHTML={{__html: item.title}} />
                  <p className="text-base md:text-lg text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="py-20 md:py-32 px-4 md:px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 leading-tight">Everything you need to<br /><span className="text-white/30">grow every employee.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🧬', title: 'Organisation DNA Diagnostic', desc: 'A deep-probe conversation that maps the cognitive blueprint across 67 behavioral traits — decision patterns, values, risk appetite, and non-negotiables.' },
              { icon: '📈', title: 'Performance Timeline', desc: 'Daily, weekly, monthly, quarterly, half-yearly, and yearly views of every employee\'s alignment trajectory — all in one dashboard. No more quarterly-review-week scramble.' },
              { icon: '🧭', title: 'AI Mentorship Engine', desc: 'Every employee gets a weekly AI mentor that understands both the organisation\'s DNA and their own — providing personalised guidance that no generic HR tool can match.' },
              { icon: '⚡', title: 'Honing Lab', desc: 'Scenario-based simulations calibrated to your organisation\'s first principles. Employees practice real decisions and get evaluated against your thinking patterns.' },
              { icon: '⚖️', title: 'Three-Way Assessment', desc: 'AI synergy score, HR rating, and Manager rating — side by side. When the three disagree by more than 25 points, NiyamHR surfaces the variance. The disagreement itself is the signal worth acting on.' },
              { icon: '📊', title: 'Org-Wide Intelligence', desc: 'HR dashboards showing team synergy scores, critical drift alerts, top performers, stagnation signals, and strategic recommendations — all in real time.' },
            ].map((f, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 hover:border-white/10 hover:bg-white/[0.05] transition-all group">
                <span className="text-3xl block mb-5">{f.icon}</span>
                <h3 className="text-xl font-black tracking-tight mb-3">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === COMPARISON === */}
      <section className="py-20 md:py-32 px-4 md:px-6 lg:px-16 bg-gradient-to-b from-transparent via-red-500/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Why NiyamHR</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mt-4">This is not another HR tool.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 md:p-10">
              <h3 className="text-lg font-black text-red-400 uppercase tracking-widest mb-6">Traditional HR Platforms</h3>
              <ul className="space-y-4">
                {['Track attendance and activity', 'Generic engagement surveys', 'One-size-fits-all L&D content', 'Annual reviews nobody reads', 'Measure output, not alignment', 'No connection to organisation vision'].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/40"><span className="text-red-400 mt-0.5">✕</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 md:p-10">
              <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest mb-6">NiyamHR</h3>
              <ul className="space-y-4">
                {['Maps organisation\'s cognitive DNA as benchmark', 'Personalised behavioral alignment scoring', 'AI mentorship tailored to each person', 'Weekly growth conversations with drift tracking', 'Measures strategic thinking alignment', 'Every insight tied to organisation principles'].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70"><span className="text-emerald-400 mt-0.5">✓</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === PRICING === */}
      <section id="pricing" className="py-20 md:py-32 px-4 md:px-6 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4">Simple, transparent pricing.</h2>

            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-white' : 'text-white/40'}`}>Monthly</span>
              <button onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')} className="w-14 h-8 bg-white/10 rounded-full relative transition-all">
                <div className={`w-6 h-6 bg-amber-500 rounded-full absolute top-1 transition-all ${billing === 'annual' ? 'left-7' : 'left-1'}`} />
              </button>
              <span className={`text-sm font-bold ${billing === 'annual' ? 'text-white' : 'text-white/40'}`}>Annual</span>
              {billing === 'annual' && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Save 20%</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter', 
                desc: 'Up to 10 employees',
                price: billing === 'monthly' ? '₹1,249' : '₹999', 
                unit: 'per employee / month',
                features: [
                  'Organisation DNA Diagnostic',
                  'Employee DNA Mapping',
                  'Weekly AI Mentorship',
                  'Honing Lab',
                  'Synergy Dashboard',
                  'Monthly Reports',
                  'Email Support'
                ],
                cta: 'Start Free Trial', 
                highlight: false,
              },
              {
                name: 'Growth', desc: 'For scaling teams that need deep alignment.',
                price: billing === 'monthly' ? '₹2,499' : '₹1,999', unit: 'per employee / month',
                features: ['Up to 100 employees', 'Full 67-trait mapping', 'AI Mentorship Engine', 'Honing Lab', 'HR intelligence dashboard', 'Priority support'],
                cta: 'Start Free Trial', highlight: true,
              },
              {
                name: 'Enterprise', desc: 'For large organisations with custom needs.',
                price: null, unit: 'Custom pricing',
                features: ['Unlimited employees', 'Custom trait frameworks', 'API access', 'SSO & SCIM', 'Dedicated success manager', 'Custom integrations', 'SLA guarantee', 'On-premise option'],
                cta: 'Contact Sales', highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`rounded-3xl p-8 md:p-10 flex flex-col ${plan.highlight ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-2 border-amber-500/30 relative' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                {plan.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black rounded-full text-xs font-black uppercase tracking-widest">Most Popular</div>}
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-6">{plan.desc}</p>
                <div className="mb-8">
                  {plan.price !== null ? (
                    <><span className="text-4xl font-black">{plan.price}</span><span className="text-white/40 text-sm ml-2">{plan.unit}</span></>
                  ) : (
                    <span className="text-3xl font-black text-white/60">{plan.unit}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-white/60"><svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{f}</li>
                  ))}
                </ul>
                <button onClick={handleLaunch} className={`w-full py-4 rounded-full font-bold text-sm transition-all ${plan.highlight ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>{plan.cta}</button>
                <p className="text-center text-white/30 text-xs mt-4">30-day free trial, no credit card required</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === QUOTE === */}
      <section className="py-20 md:py-32 px-4 md:px-6 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-8">💡</div>
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white/80 italic">
            &ldquo;The biggest risk in scaling isn&apos;t losing customers — it&apos;s losing the thinking patterns that won them in the first place.&rdquo;
          </blockquote>
          <p className="text-white/30 mt-8 font-bold">— The NiyamHR Philosophy</p>
        </div>
      </section>

      {/* === CTA === */}
      <section className="py-20 md:py-32 px-4 md:px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[40px] p-10 md:p-16 lg:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight leading-tight mb-6">Ready to grow<br />every employee?</h2>
              <p className="text-black/60 text-lg md:text-xl mb-10 max-w-lg mx-auto">Start with the Organisation DNA Diagnostic. It takes 10 minutes. The insights last forever.</p>
              <button onClick={handleLaunch} className="px-10 md:px-12 py-4 md:py-5 bg-black text-white rounded-full font-black text-base md:text-lg hover:bg-black/80 transition-all active:scale-95 shadow-2xl">Start Your Free Diagnostic</button>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full -ml-10 -mb-10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-16 px-4 md:px-6 lg:px-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
            <div>
              <a href="/" className="inline-block mb-4 cursor-pointer">
                <img 
                  src="/niyamhr-logo.png" 
                  alt="NiyamHR — AI that powers people" 
                  className="h-24 md:h-28 w-auto object-contain"
                />
              </a>
              <p className="text-white/30 text-sm leading-relaxed">AI-powered employee mentorship. Every person, every day, aligned with your organisation&apos;s DNA.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2 text-white/30 text-sm">
                <li><a href="#problem" className="hover:text-white/60 transition-colors">Organisation Diagnostic</a></li>
                <li><a href="#how-it-works" className="hover:text-white/60 transition-colors">Employee Mapping</a></li>
                <li><a href="#features" className="hover:text-white/60 transition-colors">AI Mentorship</a></li>
                <li><a href="#features" className="hover:text-white/60 transition-colors">Honing Lab</a></li>
                <li><a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-2 text-white/30 text-sm">
                <li><a href="/about" className="hover:text-white/60 transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white/60 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2 text-white/30 text-sm">
                <li><a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a></li>
                <li><a href="/security" className="hover:text-white/60 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/20 text-sm text-center md:text-left">© 2026 NiyamHR by SmartDNA Business Intelligence. All rights reserved.</p>
            <div className="flex gap-6 text-white/20">
              <a href="https://www.linkedin.com/in/onsury" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white/40 transition-colors">LinkedIn</a>
              <a href="mailto:onsury@gmail.com" className="text-sm hover:text-white/40 transition-colors">Email</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}