'use client';
import Link from 'next/link';

export default function ContactPage() {
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
        <div className="max-w-2xl mx-auto">
          <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Get in Touch</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-4 mb-10 leading-tight">
            Let&apos;s talk about<br />
            <span className="text-white/30">your organisation.</span>
          </h1>

          <p className="text-lg text-white/60 leading-relaxed mb-10">
            Whether you&apos;re exploring NiyamHR for your team, evaluating it for enterprise deployment, or just want to understand how the Persona DNA framework works — we&apos;re happy to talk.
          </p>

          <div className="space-y-6 mb-10">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Email</div>
              <a href="mailto:onsury@gmail.com" className="text-xl font-black text-amber-500 hover:text-amber-400 transition-colors">onsury@gmail.com</a>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Company</div>
              <div className="text-white/80 font-bold">SmartDNA Business Intelligence & Advisory</div>
              <div className="text-white/40 text-sm mt-1">Chennai, Tamil Nadu, India</div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Response Time</div>
              <div className="text-white/60">Most enquiries are responded to within one business day.</div>
            </div>
          </div>

          <Link href="/" className="inline-block px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}