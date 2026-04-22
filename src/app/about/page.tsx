'use client';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-6 lg:px-16 py-3 md:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center cursor-pointer flex-shrink-0">
          <img 
            src="/niyamhr-logo.png" 
            alt="NiyamHR — AI that powers people" 
            className="h-14 md:h-20 w-auto object-contain"
          />
        </Link>
        <Link href="/" className="text-sm text-white/50 hover:text-white">← Back to Home</Link>
      </nav>

      <section className="pt-32 md:pt-40 pb-24 px-4 md:px-6 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">About NiyamHR</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-4 mb-10 leading-tight">
            Built on 30+ years<br />
            <span className="text-white/30">of organisational wisdom.</span>
          </h1>

          <div className="space-y-6 text-lg text-white/60 leading-relaxed">
            <p>
              NiyamHR is the flagship product of <strong className="text-white">SmartDNA Business Intelligence & Advisory</strong>, a Chennai-based strategic consulting and AI product studio founded by O N Suryanarayanan.
            </p>

            <p>
              Over three decades working with founders across cybersecurity, healthcare, edtech, and media, we noticed a pattern that no HR tool addresses: the thinking patterns that built the company get diluted as the company grows. By the second management layer, the founder&apos;s strategic intent is barely recognisable at the frontline — and employees lose the compass that makes their daily work meaningful.
            </p>

            <p>
              Most organisational tools measure output — attendance, tasks completed, goals hit. NiyamHR measures something more fundamental: <strong className="text-white">alignment of thinking</strong>. Using our proprietary three-layer Persona DNA framework — CorePersonaDNA, FunctionPersonaDNA, EmployeePersonaDNA — we map the organisation&apos;s cognitive blueprint and give every employee a personal AI mentor calibrated to it.
            </p>

            <p>
              This isn&apos;t about cloning the founder. It&apos;s about giving every team member a living mentor that understands both where the organisation is going AND where they personally need to grow — so individual careers compound with organisational direction rather than fighting it.
            </p>

            <p>
              We&apos;re in early access, partnering closely with a small set of founder-led organisations who care about depth of alignment and employee growth, not just breadth of headcount. If that sounds like you, we&apos;d love to talk.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/contact" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-full font-black text-sm hover:shadow-xl transition-all">
              Get in Touch
            </Link>
            <Link href="/" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all">
              Explore the Platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}