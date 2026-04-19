'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    name: 'Starter',
    tagline: 'For early-stage startups',
    monthlyPrice: 1199,
    annualPrice: 999,
    employees: 'Up to 10 employees',
    features: [
      'CorePersonaDNA Founder Diagnostic',
      'Employee DNA Mapping',
      'Weekly AI Mentorship (Claude)',
      'Neural Honing Lab',
      'Synergy Dashboard',
      'Monthly Employee Reports',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    tagline: 'For scaling organisations',
    monthlyPrice: 1899,
    annualPrice: 1699,
    employees: 'Up to 100 employees',
    features: [
      'Everything in Starter',
      'Org Neural Insights Dashboard',
      'Manager Team Reports',
      'Quarterly Founder Reports',
      'Burnout Detection Alerts',
      'Custom Competency Frameworks',
      'Priority Support',
      'API Access',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For large organisations',
    monthlyPrice: 2999,
    annualPrice: 2799,
    employees: 'Unlimited employees',
    features: [
      'Everything in Growth',
      'White-Label Branding',
      'Custom Domain Mapping',
      'SSO (SAML / OIDC)',
      'Twilio Voice Diagnostics',
      'Dedicated Instance Option',
      'Custom Report Templates',
      'SLA with 99.9% Uptime',
      'Data Residency (India/Global)',
      'Dedicated Account Manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingSection() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0a0a0f] relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">Built for Indian Businesses</h2>
          <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto">30-day free trial on all plans. No credit card required.</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-bold ${!annual ? 'text-white' : 'text-white/30'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`w-14 h-7 rounded-full relative transition-all ${annual ? 'bg-amber-500' : 'bg-white/20'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${annual ? 'left-8' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-bold ${annual ? 'text-white' : 'text-white/30'}`}>Annual</span>
            {annual && <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">Save 20%</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 border ${plan.popular ? 'bg-white/[0.06] border-amber-500/50 shadow-xl shadow-amber-500/10' : 'bg-white/[0.03] border-white/[0.06]'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">Most Popular</span>
              )}

              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-white">{plan.name}</h3>
                <p className="text-white/40 text-xs sm:text-sm mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹{annual ? plan.annualPrice : plan.monthlyPrice}</span>
                  <span className="text-white/30 text-sm mb-1">/emp/mo</span>
                </div>
                <p className="text-white/20 text-xs mt-1">{plan.employees}</p>
                {annual && <p className="text-emerald-400 text-xs mt-1">Billed annually</p>}
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-white/50">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.name === 'Enterprise' ? window.open('mailto:hello@niyamai.com?subject=Enterprise Inquiry') : router.push('/login')}
                className={`w-full py-3.5 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95 ${plan.popular ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Cost Transparency */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-white/20 text-xs sm:text-sm max-w-2xl mx-auto">
            All pricing in INR. Includes AI mentorship powered by Claude + Gemini, unlimited honing sessions, and real-time synergy tracking. Enterprise includes Twilio voice diagnostics and white-label branding. Volume discounts available for 500+ employees.
          </p>
        </div>
      </div>
    </section>
  );
}
