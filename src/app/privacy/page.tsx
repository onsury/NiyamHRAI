'use client';
import Link from 'next/link';

export default function PrivacyPage() {
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
          <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Privacy Policy</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-4 mb-8">Your data, your control.</h1>

          <div className="space-y-6 text-white/60 leading-relaxed">
            <p className="text-lg"><strong className="text-white">Last updated:</strong> April 2026</p>

            <p>
              NiyamHR AI Mentor is a product of Madraz Buzz Media (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), built on the SmartDNA methodology framework. This Privacy Policy explains how we collect, use, and protect personal data when you use NiyamHR AI Mentor (&ldquo;the Service&rdquo;).
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">1. Information we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Account information:</strong> name, email address, organisation name, role and level</li>
              <li><strong className="text-white">Diagnostic data:</strong> responses to the Organisation DNA diagnostic, employee onboarding assessments, and behavioral trait mappings</li>
              <li><strong className="text-white">Usage data:</strong> weekly check-in reflections, honing lab responses, scenario interactions</li>
              <li><strong className="text-white">Technical data:</strong> IP address, browser type, device information, log data</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">2. How we use your data</h2>
            <p>We use your data only to provide and improve the Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate personalised organisation DNA and employee alignment analyses</li>
              <li>Deliver AI-powered mentorship calibrated to your organisation</li>
              <li>Produce organisational insights for authorised users in your organisation</li>
              <li>Maintain account security and prevent fraud</li>
              <li>Communicate with you about the Service</li>
            </ul>
            <p><strong className="text-white">We do not sell your data.</strong> We do not use your reflections or organisational data to train AI models.</p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">3. Third-party services</h2>
            <p>NiyamHR uses the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Google Firebase:</strong> Authentication, database (Firestore), and application hosting. Governed by <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">Firebase Privacy Policy</a>.</li>
              <li><strong className="text-white">Anthropic Claude API:</strong> Large language model for AI-generated mentorship and analyses. Per Anthropic&apos;s policy, data sent via their API is not used to train their models.</li>
            </ul>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">4. Data sharing</h2>
            <p>
              Within your organisation, data visibility is governed by role-based access control. Founders and authorised HR admins can view organisation-wide insights; managers can view their direct reports&apos; data; employees see only their own data. We do not share your personal data with anyone outside your organisation except as required by law.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">5. Your rights under DPDPA 2023</h2>
            <p>Under India&apos;s Digital Personal Data Protection Act 2023, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccuracies in your data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for processing</li>
              <li>Nominate another individual to exercise rights on your behalf</li>
              <li>Lodge a grievance with the Data Protection Board of India</li>
            </ul>
            <p>
              To exercise any of these rights, email us at <a href="mailto:support@niyamhr.in" className="text-amber-500 hover:text-amber-400">support@niyamhr.in</a>. We respond within 7 business days.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">6. International users</h2>
            <p>
              NiyamHR is operated from India. If you are accessing the Service from outside India, please note your data may be processed in countries where we or our service providers operate. We apply the same privacy protections regardless of your location.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">7. Data retention</h2>
            <p>
              We retain your data for as long as your account is active. If you close your account or request deletion, we delete your data within 30 days, except where we are required by law to retain certain records.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">8. Cookies</h2>
            <p>
              NiyamHR uses essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising cookies. By using the Service, you consent to our use of essential cookies.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">9. A note on our stage</h2>
            <p>
              NiyamHR is a startup in Early Access. While we apply enterprise-grade infrastructure and security practices from day one, we are continuously building out our compliance programs. See our <Link href="/security" className="text-amber-500 hover:text-amber-400">Security page</Link> for our detailed roadmap.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy as the Service evolves. When we make material changes, we will notify you via email or through the Service. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent revision.
            </p>

            <h2 className="text-2xl font-black text-white mt-10 mb-4">11. Contact us</h2>
            <p>
              Questions, concerns, or requests regarding this Privacy Policy? Contact our grievance officer at <a href="mailto:support@niyamhr.in" className="text-amber-500 hover:text-amber-400">support@niyamhr.in</a>.
            </p>

            <p className="text-sm text-white/40 mt-10 pt-6 border-t border-white/10">
              Madraz Buzz Media · Chennai, Tamil Nadu, India
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}