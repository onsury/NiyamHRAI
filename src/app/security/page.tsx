'use client';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5 px-6 lg:px-16 py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xl">N</div>
          <span className="text-xl font-black tracking-tight">NiyamAI</span>
        </Link>
        <Link href="/" className="text-sm text-white/50 hover:text-white">← Back to Home</Link>
      </nav>

      <section className="pt-40 pb-24 px-6 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Security</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-4 mb-8">How we protect your data.</h1>

          <div className="space-y-6 text-white/60 leading-relaxed">
            <p className="text-lg">
              <strong className="text-white">Last updated:</strong> April 2026
            </p>

            <p>
              NiyamAI is built on enterprise-grade infrastructure with security as a foundational principle — not an afterthought. Here&apos;s how your data is protected today.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Encryption</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">At rest:</strong> All user data stored in Google Cloud Firestore is encrypted using AES-256 with Google-managed encryption keys.</li>
              <li><strong className="text-white">In transit:</strong> All connections use TLS 1.3 HTTPS, including the application, data storage, authentication, and AI service integrations.</li>
              <li><strong className="text-white">Secrets:</strong> API keys and sensitive credentials are stored in Google Cloud Secret Manager with strict IAM-based access controls.</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Infrastructure</h2>
            <p>
              NiyamAI is hosted on <strong className="text-white">Google Cloud (Firebase App Hosting)</strong>, which maintains SOC 2 Type II, ISO 27001, ISO 27017, ISO 27018, and PCI-DSS certifications at the infrastructure layer. These certifications cover the physical data centres, network security, and platform services that NiyamAI runs on.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Authentication and access</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>User accounts protected by Firebase Authentication with email verification</li>
              <li>Role-based access control: Founders, HR admins, Managers, and Employees see only the data their role permits</li>
              <li>Organisation-level data isolation: no cross-organisation data leakage</li>
              <li>Session tokens are managed by Firebase with configurable expiry</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">AI service integration</h2>
            <p>
              NiyamAI uses Anthropic&apos;s Claude API for mentorship and DNA analysis. Per Anthropic&apos;s policy, your data is <strong className="text-white">not used to train their models</strong>. API calls are encrypted in transit and data is not retained for model training.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Data residency</h2>
            <p>
              User data is stored in Google Cloud&apos;s global infrastructure. Primary region for Indian users is us-central1. We are evaluating India-region data residency options as part of our DPDPA compliance roadmap.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Our security roadmap</h2>
            <p>
              NiyamAI is a startup in Early Access. We are transparent about where we are on our security journey and where we&apos;re headed:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Today:</strong> Google Cloud infrastructure certifications inherited; encryption at rest and in transit; role-based access control; secret management</li>
              <li><strong className="text-white">Next 3-6 months:</strong> Formal DPDPA 2023 compliance program; internal security policies and incident response documentation; vulnerability scanning</li>
              <li><strong className="text-white">6-12 months:</strong> Independent penetration testing; SOC 2 Type I gap assessment</li>
              <li><strong className="text-white">12-24 months:</strong> SOC 2 Type II certification aligned with enterprise requirements; ISO 27001 roadmap for global enterprise customers</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Responsible disclosure</h2>
            <p>
              If you believe you&apos;ve found a security vulnerability in NiyamAI, please report it responsibly to <a href="mailto:onsury@gmail.com" className="text-amber-500 hover:text-amber-400">onsury@gmail.com</a>. We take all reports seriously, respond within 48 hours, and work to address verified issues promptly.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">Incident response</h2>
            <p>
              In the event of a security incident that affects your data, we will notify affected users within 72 hours of discovery, in line with DPDPA 2023 requirements.
            </p>

            <p className="text-sm text-white/40 mt-10 pt-6 border-t border-white/10">
              Have specific security or compliance questions for your organisation? We&apos;re happy to discuss your requirements directly. Contact <a href="mailto:onsury@gmail.com" className="text-amber-500">onsury@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}