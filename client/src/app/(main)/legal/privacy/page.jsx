'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Legal</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Privacy Policy</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12 text-sm">Last updated: January 2026</p>

        <div className="space-y-8 text-[#6b6b66]">
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-0 mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed text-sm">
              When you create a CREWUPFILMS account, we collect information you provide directly, including your name, email address, location, portfolio links, and profile information. We also collect information about your interactions with the platform, such as projects you view, creators you connect with, and messages you send. Additionally, we automatically collect technical information like your IP address, browser type, and device information through cookies and similar technologies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed text-sm">
              We use the information we collect to provide and improve CREWUPFILMS, to match you with collaborators, to send you updates and notifications, and to enforce our terms and policies. We analyze user behavior to enhance our features and user experience. We never sell your personal information to third parties, but we may share anonymized data to improve our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">3. Data Sharing</h2>
            <p className="leading-relaxed text-sm">
              Your profile information is visible to other CREWUPFILMS users to facilitate connections and collaborations. We may share information with service providers who help us operate the platform, such as hosting providers and analytics companies. We only share the minimum information necessary and require these providers to protect your data. We do not sell your data to advertisers or data brokers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">4. Cookies</h2>
            <p className="leading-relaxed text-sm">
              We use cookies to enhance your experience on CREWUPFILMS, to remember your preferences, and to analyze how you use the platform. You can control cookie settings through your browser. Some cookies are essential for the platform to function, while others help us understand user behavior and improve our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">5. Data Retention</h2>
            <p className="leading-relaxed text-sm">
              We retain your personal information as long as your account is active and for as long as necessary to provide our services. You can request deletion of your account and associated data at any time. Some information may be retained for legal or business purposes, and backup copies may persist for a period of time after deletion.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">6. Your Rights</h2>
            <p className="leading-relaxed text-sm">
              You have the right to access, update, and delete your personal information. You can control your privacy settings and communication preferences through your account dashboard. You have the right to withdraw consent for certain uses of your data. To exercise these rights, please contact us at hello@crewup.in.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">7. Security</h2>
            <p className="leading-relaxed text-sm">
              We implement industry-standard security measures to protect your personal information, including encryption and secure servers. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security. We encourage you to use strong passwords and to report any security concerns immediately.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">8. Contact</h2>
            <p className="leading-relaxed text-sm">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at hello@crewup.in. We will respond to your inquiry within 30 days. You also have the right to lodge a complaint with your local data protection authority if you believe we have mishandled your data.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm">
            <Link href="/legal/terms" className="text-[#111110] underline hover:no-underline">Terms of Service</Link> | <Link href="/legal/cookies" className="text-[#111110] underline hover:no-underline">Cookie Policy</Link> | <Link href="/contact" className="text-[#111110] underline hover:no-underline">Contact Us</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
