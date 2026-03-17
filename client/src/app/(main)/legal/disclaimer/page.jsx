import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer — CREWUPFILMS',
  description: 'CREWUPFILMS platform disclaimer. Understand the limits of our liability and the nature of creator collaborations facilitated on our platform.',
};

export default function Disclaimer() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Legal</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Disclaimer</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12 text-sm">Last updated: March 2026</p>

        <div className="space-y-8 text-[#6b6b66]">

          {/* 1 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-0 mb-3">1. General Disclaimer</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS is a platform that connects independent creative professionals — including directors, editors, actors, musicians, photographers, and other filmmakers — for the purpose of discovering and collaborating on creative projects. CREWUPFILMS does not itself produce, commission, or participate in any creative collaboration facilitated through the platform.
            </p>
            <p className="leading-relaxed text-sm mt-3">
              The information, services, and content available on CREWUPFILMS are provided on an <strong className="text-[#111110]">"as is" and "as available"</strong> basis without any representation or warranty of any kind, express or implied. We make no warranties regarding the accuracy, completeness, reliability, or suitability of any content on the platform.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">2. No Vetting of Users</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS does <strong className="text-[#111110]">not verify, vet, endorse, or vouch for</strong> any user's identity, qualifications, skills, portfolio claims, or professional background. Profile content — including names, profile images, portfolio links, claimed roles, and work history — is provided entirely by users themselves and has not been independently verified by CREWUPFILMS.
            </p>
            <p className="leading-relaxed text-sm mt-3">
              Users are solely responsible for conducting their own due diligence before entering into any collaboration, agreement, or arrangement with another user on the platform. We strongly recommend reviewing profiles, ratings, and reviews carefully, and communicating thoroughly before committing to any project.
            </p>
          </div>

          {/* 3 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">3. No Agency or Employment Relationship</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS is not an employment agency, talent agency, staffing firm, or casting service. We do not place, employ, or represent any user. No user of CREWUPFILMS is an employee, agent, contractor, or representative of CREWUPFILMS as a result of using the platform.
            </p>
            <p className="leading-relaxed text-sm mt-3">
              Any collaboration, contract, or working relationship formed between users is entirely independent of CREWUPFILMS. Users are responsible for negotiating and agreeing on their own terms, compensation, and conditions for any project they undertake together.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">4. No Guarantee of Outcomes</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS makes no guarantee that using the platform will result in successful collaborations, completed projects, employment, income, creative opportunities, or any other specific outcome. Project owners and applicants may withdraw from a project at any time, and CREWUPFILMS has no control over or liability for such decisions.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">5. User Disputes</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS is not a party to any dispute, disagreement, or legal claim between users. Any disputes arising between users — including those related to project quality, payment, intellectual property, contracts, or conduct — must be resolved directly between the parties involved. CREWUPFILMS is not responsible for mediating, arbitrating, or resolving such disputes, and shall not be held liable for the actions, omissions, or conduct of any user.
            </p>
          </div>

          {/* 6 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">6. Safety & In-Person Meetings</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS strongly encourages users to exercise caution when meeting collaborators in person. Always meet for the first time in a public place, inform a trusted person of your plans, and use video calls before meeting. CREWUPFILMS is not responsible for any incident, injury, harm, or loss that occurs as a result of in-person meetings arranged through the platform.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">7. Third-Party Links and Services</h2>
            <p className="leading-relaxed text-sm">
              The platform may contain links to third-party websites, portfolios, or services. These links are provided for convenience only. CREWUPFILMS does not endorse, control, or assume any responsibility for the content or privacy practices of third-party sites. Accessing third-party content is done entirely at your own risk.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">8. Intellectual Property of User Content</h2>
            <p className="leading-relaxed text-sm">
              CREWUPFILMS does not claim ownership of any creative work, project, or intellectual property that users create or collaborate on through the platform. Users retain all rights to their own content. Any disputes regarding ownership of jointly created works are the sole responsibility of the collaborating users and should be addressed through a written agreement between parties before the project begins.
            </p>
          </div>

          {/* 9 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">9. Limitation of Liability</h2>
            <p className="leading-relaxed text-sm">
              To the fullest extent permitted by applicable law, CREWUPFILMS, its directors, employees, partners, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of profits, data, reputation, creative work, or business opportunities — arising out of or related to your use of, or inability to use, the platform.
            </p>
          </div>

          {/* 10 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">10. Changes to This Disclaimer</h2>
            <p className="leading-relaxed text-sm">
              We may update this Disclaimer from time to time to reflect changes in our practices or legal requirements. The "last updated" date at the top of this page indicates when the most recent revision was made. Your continued use of CREWUPFILMS after any changes constitutes your acceptance of the revised Disclaimer.
            </p>
          </div>

          {/* 11 */}
          <div>
            <h2 className="text-xl font-semibold text-[#111110] mt-10 mb-3">11. Contact</h2>
            <p className="leading-relaxed text-sm">
              If you have any questions about this Disclaimer, please reach out to us at{' '}
              <a href="mailto:hello@crewup.in" className="text-[#111110] underline hover:no-underline">hello@crewup.in</a>.
            </p>
          </div>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/legal/terms"      className="text-[#111110] underline hover:no-underline">Terms of Service</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/legal/privacy"    className="text-[#111110] underline hover:no-underline">Privacy Policy</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/legal/guidelines" className="text-[#111110] underline hover:no-underline">Community Guidelines</Link>
            <span className="text-[#d0d0cc]">|</span>
            <Link href="/contact"          className="text-[#111110] underline hover:no-underline">Contact Us</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
