'use client';
import Link from 'next/link';

export default function TermsPage() {
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
          <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Terms of Service</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-4 mb-8">The basics of using NiyamAI.</h1>

          <div className="space-y-6 text-white/60 leading-relaxed">
            <p className="text-lg">
              <strong className="text-white">Last updated:</strong> April 2026
            </p>

            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of NiyamAI (&ldquo;the Service&rdquo;), operated by SmartDNA Business Intelligence & Advisory (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing or using the Service, you agree to these Terms.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">1. Early Access</h2>
            <p>
              NiyamAI is currently in Early Access. The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Features may change, and occasional service interruptions are possible. We will communicate material changes in advance where practical.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">2. Your account</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You are responsible for all activity under your account</li>
              <li>You agree to provide accurate information and keep it up to date</li>
              <li>You must be at least 18 years old to use NiyamAI</li>
              <li>You must notify us immediately of any unauthorised use of your account</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">3. Acceptable use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, decompile, or extract the underlying algorithms</li>
              <li>Submit deliberately misleading or fraudulent reflections or diagnostic responses</li>
              <li>Impersonate other team members or misrepresent your role</li>
              <li>Use the Service to harass, abuse, or discriminate against others</li>
              <li>Attempt to bypass authentication, authorisation, or rate limits</li>
              <li>Introduce malware, viruses, or malicious code</li>
              <li>Scrape or extract data through automated means without written permission</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">4. AI-generated content</h2>
            <p>
              NiyamAI uses large language models (Anthropic Claude) to generate mentorship responses, DNA mappings, and analyses. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-generated content reflects pattern-matching against data, not professional advice</li>
              <li>NiyamAI is not a substitute for licensed HR, legal, medical, psychological, or financial advice</li>
              <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated insights for any specific decision</li>
              <li>Important decisions about personnel, strategy, or compensation should involve qualified human judgment</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">5. Intellectual property</h2>
            <p>
              NiyamAI&apos;s platform, including the SmartDNA framework, algorithms, branding, and content, is owned by SmartDNA Business Intelligence & Advisory. You retain ownership of data you submit. You grant us a limited licence to process your data solely to provide the Service.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">6. Payments and billing</h2>
            <p>
              During Early Access, NiyamAI may be offered free or at introductory pricing. Once formal paid plans are activated, you will be notified in advance of any billing changes. Pricing and billing terms will be governed by a separate subscription agreement at that time.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">7. Termination</h2>
            <p>
              You may stop using NiyamAI at any time by contacting us at <a href="mailto:onsury@gmail.com" className="text-amber-500 hover:text-amber-400">onsury@gmail.com</a>. We may suspend or terminate accounts that violate these Terms, pose security risks, or engage in fraudulent behaviour.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by Indian law, NiyamAI and SmartDNA Business Intelligence & Advisory shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability for any claim is limited to the amount you paid us in the twelve months prior to the claim, or ₹10,000, whichever is greater.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless SmartDNA Business Intelligence & Advisory from any claims arising from your misuse of the Service, violation of these Terms, or infringement of third-party rights.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">10. A note on our stage</h2>
            <p>
              NiyamAI is a startup in Early Access. As we grow, these Terms may be refined to reflect a more mature enterprise relationship. We commit to notifying you of any material changes. See our <Link href="/security" className="text-amber-500 hover:text-amber-400">Security page</Link> for our compliance roadmap.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">11. Governing law and jurisdiction</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes will be resolved under the exclusive jurisdiction of courts in Chennai, Tamil Nadu.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">12. Changes to these Terms</h2>
            <p>
              We may update these Terms as the Service evolves. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">13. Contact</h2>
            <p>
              Questions about these Terms? Contact us at <a href="mailto:onsury@gmail.com" className="text-amber-500 hover:text-amber-400">onsury@gmail.com</a>.
            </p>

            <p className="text-sm text-white/40 mt-10 pt-6 border-t border-white/10">
              SmartDNA Business Intelligence & Advisory · Chennai, Tamil Nadu, India
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}