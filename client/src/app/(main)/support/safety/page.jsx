'use client';

import Link from 'next/link';

export default function Safety() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Trust & Safety</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Safety & Trust</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12">Your safety is our priority. Learn how CREWUPFILMS protects you and how to collaborate safely on our platform.</p>

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-4">Our Commitment to Safety</h2>
            <p className="text-[#6b6b66] leading-relaxed text-sm">
              CREWUPFILMS is built with safety in mind. We use automated systems and human moderation to prevent fraud, harassment, and illegal activity. Our team works 24/7 to investigate reports and remove harmful content. We take every report seriously and take swift action against violators. Your trust is what makes CREWUPFILMS work, and we're committed to maintaining it.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-4">How We Protect You</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-[#111110] pl-4">
                <h3 className="text-lg font-semibold text-[#111110] mb-2">Profile Verification</h3>
                <p className="text-[#6b6b66] text-sm leading-relaxed">
                  We encourage creators to verify their profiles through email confirmation and identity verification. Verified profiles display a badge, helping you identify trusted collaborators.
                </p>
              </div>
              <div className="border-l-4 border-[#111110] pl-4">
                <h3 className="text-lg font-semibold text-[#111110] mb-2">Reporting Tools</h3>
                <p className="text-[#6b6b66] text-sm leading-relaxed">
                  Every profile and project has a report button. If you encounter suspicious activity, inappropriate content, or harassment, report it immediately. We review and act on reports within hours.
                </p>
              </div>
              <div className="border-l-4 border-[#111110] pl-4">
                <h3 className="text-lg font-semibold text-[#111110] mb-2">Moderation Team</h3>
                <p className="text-[#6b6b66] text-sm leading-relaxed">
                  Our dedicated moderation team reviews reported content and accounts. We remove fake profiles, spam, harassment, and other violations. Repeated offenders are suspended or banned permanently.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-6">Tips for Safe Collaboration</h2>
            <div className="grid gap-4">
              {[
                {
                  icon: '💬',
                  title: "Don't Share Personal Contact Info Too Early",
                  body: "Use CREWUPFILMS's messaging system for all initial conversations. Once you've built trust and confirmed the collaboration, then exchange phone numbers or social media handles. Never feel pressured to give out personal contact details before you're ready.",
                },
                {
                  icon: '🤝',
                  title: 'Meet in Public for First Meetings',
                  body: "When meeting a collaborator for the first time in person, choose public locations like coffee shops or studios. Let someone you trust know where you'll be. Video calls are a great way to verify and connect before meeting in person.",
                },
                {
                  icon: '🧭',
                  title: 'Trust Your Instincts',
                  body: "If something feels off about a creator or project, don't proceed. Check their reviews and past projects. A legitimate collaborator will have a track record on the platform. You can always walk away — no collaboration is worth your safety.",
                },
                {
                  icon: '⭐',
                  title: 'Check Profiles & Reviews',
                  body: 'Before collaborating, review their profile, portfolio, and past reviews. New creators may have limited history, but established creators should have positive feedback from previous collaborations. Look for consistency and detail in their work.',
                },
              ].map((tip, i) => (
                <div key={i} className="flex gap-5 bg-[#fafaf9] border border-[#efefed] p-6">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <h3 className="text-base font-semibold text-[#111110] mb-2">{tip.title}</h3>
                    <p className="text-[#6b6b66] text-sm leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-4">How to Report</h2>
            <p className="text-[#6b6b66] leading-relaxed text-sm mb-4">
              If you encounter a problem, report it immediately. Use our in-app reporting tools or email our moderation team. Never try to resolve serious issues privately—let us help.
            </p>
            <Link href="/support/report" className="inline-block bg-[#111110] text-white text-sm font-medium px-6 py-3 hover:bg-[#2d2d2b] transition">
              Report an Issue
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <h3 className="text-lg font-semibold text-[#111110] mb-4">Need Help?</h3>
          <p className="text-[#6b6b66] text-sm mb-4">
            If you're experiencing harassment, threats, or other safety concerns, contact us immediately at <span className="text-[#111110] font-medium">support@crewup.in</span>.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/legal/guidelines" className="text-[#111110] font-medium hover:underline">
              Community Guidelines
            </Link>
            <Link href="/support" className="text-[#111110] font-medium hover:underline">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
