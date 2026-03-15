'use client';

import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Legal</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Cookie Policy</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12 text-sm">Last updated: January 2026</p>

        <div className="space-y-8 text-[#6b6b66]">
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-0 mb-3">1. What Are Cookies?</h2>
            <p className="leading-relaxed text-sm">
              Cookies are small text files that are stored on your device when you visit a website. They help websites remember information about you, such as your preferences and login status. Cookies are not harmful and do not contain viruses. Most websites use cookies to enhance user experience and provide personalized features.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">2. What We Use</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS uses cookies to improve your experience on our platform. We use session cookies to keep you logged in, preference cookies to remember your settings, and analytics cookies to understand how users interact with CREWUPFILMS. These cookies help us identify technical issues and optimize our features.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">3. Essential Cookies</h2>
            <p className="leading-relaxed text-sm">
              Essential cookies are necessary for CREWUPFILMS to function properly. They enable you to log in, maintain your session, and access secure features. Without these cookies, we cannot provide our core services. You cannot disable essential cookies if you want to use CREWUPFILMS, but they do not track your behavior.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">4. Analytics Cookies</h2>
            <p className="leading-relaxed text-sm">
              We use analytics cookies to measure how users interact with CREWUPFILMS. These cookies help us understand which features are popular, where users click, and how long they stay on different pages. This information helps us improve our platform and create better experiences. Analytics data is anonymized and does not identify individuals.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">5. How to Control Cookies</h2>
            <p className="leading-relaxed text-sm">
              You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when a cookie is being set. You can delete existing cookies from your device at any time. However, disabling cookies may affect your ability to use certain features of CREWUPFILMS. For detailed instructions on managing cookies, visit your browser's help section.
            </p>
          </div>

          <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-6 mt-10">
            <h3 className="text-lg font-semibold text-[#111110] mb-3">Third-Party Cookies</h3>
            <p className="leading-relaxed text-sm">
              We may use third-party services, such as analytics providers, that set cookies on your device. These providers are bound by privacy agreements and can only use cookie data for the purposes we authorize. You can control third-party cookies through your browser settings.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm">
            <Link href="/legal/privacy" className="text-[#111110] underline hover:no-underline">Privacy Policy</Link> | <Link href="/legal/terms" className="text-[#111110] underline hover:no-underline">Terms of Service</Link> | <Link href="/contact" className="text-[#111110] underline hover:no-underline">Contact Us</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
