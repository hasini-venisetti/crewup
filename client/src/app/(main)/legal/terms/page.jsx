'use client';

import Link from 'next/link';

export default function TermsOfService() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Legal</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Terms of Service</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12 text-sm">Last updated: January 2026</p>

        <div className="space-y-8 text-[#6b6b66]">
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-0 mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-sm">
              By accessing and using CREWUPFILMS, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use this platform. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">2. User Accounts</h2>
            <p className="leading-relaxed text-sm">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your profile and to update this information as needed. You must not create accounts for minors or impersonate any person or entity.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">3. Content & Conduct</h2>
            <p className="leading-relaxed text-sm">
              You are solely responsible for any content you post on CREWUPFILMS. You agree not to post content that is illegal, defamatory, harassing, hateful, or infringes on anyone's intellectual property rights. We reserve the right to remove any content and suspend or terminate accounts that violate these guidelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">4. Intellectual Property</h2>
            <p className="leading-relaxed text-sm">
              All content and materials on CREWUPFILMS, including logos, designs, and text, are owned by CREWUPFILMS or licensed to us. You retain all rights to content you create and post. By posting content on CREWUPFILMS, you grant us a non-exclusive license to display and distribute that content on our platform to facilitate collaboration and discovery.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">5. Prohibited Activities</h2>
            <p className="leading-relaxed text-sm">
              You agree not to use CREWUPFILMS for any unlawful purpose, to spam other users, to harass or threaten anyone, or to engage in fraud or deception. You may not attempt to gain unauthorized access to our systems, post malicious code, or use automated tools to scrape data from the platform. Any violation of these prohibitions may result in immediate suspension or termination.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">6. Termination</h2>
            <p className="leading-relaxed text-sm">
              We may terminate or suspend your account at any time, with or without cause, and without prior notice. Upon termination, your right to use CREWUPFILMS ends immediately. You remain liable for any outstanding obligations and claims against you from other users.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">7. Limitation of Liability</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Your sole remedy is to stop using CREWUPFILMS. We are not responsible for disputes between users or the quality of any collaborations resulting from the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">8. Changes to Terms</h2>
            <p className="leading-relaxed text-sm">
              We may update these Terms of Service from time to time. We will notify you of significant changes by posting the new terms and updating the "last updated" date. Your continued use of CREWUPFILMS after changes become effective constitutes your acceptance of the new terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">9. Contact</h2>
            <p className="leading-relaxed text-sm">
              If you have questions about these Terms of Service, please contact us at crewupfilms@gmail.com. We welcome your feedback and will address any concerns promptly.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/legal/privacy"     className="text-[#111110] underline hover:no-underline">Privacy Policy</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/legal/disclaimer"  className="text-[#111110] underline hover:no-underline">Disclaimer</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/legal/guidelines"  className="text-[#111110] underline hover:no-underline">Community Guidelines</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/contact"           className="text-[#111110] underline hover:no-underline">Contact Us</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
