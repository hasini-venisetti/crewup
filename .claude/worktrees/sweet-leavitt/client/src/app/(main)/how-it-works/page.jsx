'use client';

import Link from 'next/link';

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description:
      "Sign up and tell the world who you are. Add your skills, experience, portfolio links, and the roles you're looking for. Your profile is your first impression on CREWUPFILMS.",
    icon: '✦',
  },
  {
    number: '02',
    title: 'Browse & Post Projects',
    description:
      'Explore projects from other creators or post your own. Filter by role, location, project type, or budget. Find opportunities that match your expertise and interests.',
    icon: '✦',
  },
  {
    number: '03',
    title: 'Apply or Invite',
    description:
      'Apply to projects that excite you or invite creators directly to your team. Review portfolios, ratings, and past work to find the perfect collaborators. Use role-based matching to find exactly what you need.',
    icon: '✦',
  },
  {
    number: '04',
    title: 'Collaborate & Communicate',
    description:
      "Use CREWUPFILMS's real-time messaging to stay connected with your team. Manage shooting schedules, share files, and organize your project timeline all in one place. Keep everyone on the same page.",
    icon: '✦',
  },
  {
    number: '05',
    title: 'Complete & Review',
    description:
      "Finish your project and celebrate the work you've done together. Leave honest reviews for your collaborators based on your experience. Build trust and credibility on the platform.",
    icon: '✦',
  },
  {
    number: '06',
    title: 'Grow Your Network',
    description:
      'Every collaboration strengthens your network and opens new doors. Build relationships with creators from around the world. Access mentorship, features, and opportunities as you grow.',
    icon: '✦',
  },
];

export default function HowItWorks() {
  return (
    <main className="bg-[#fafaf9]">
      {/* Hero */}
      <div
        className="bg-[#0e0e0d] py-24 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">Getting Started</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4 leading-tight max-w-2xl">
            How It Works
          </h1>
          <p className="text-white/50 text-lg max-w-xl leading-relaxed">
            CREWUPFILMS makes finding collaborators simple. From creating your profile to completing your first project — here's how.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[2.25rem] top-6 bottom-6 w-px bg-[#efefed] hidden md:block" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-6 md:gap-10 group">
                {/* Step circle */}
                <div className="flex-shrink-0 flex flex-col items-center z-10">
                  <div className={`w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center font-[Playfair_Display] font-bold text-xl transition-all duration-300 ${
                    i === 0
                      ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                      : 'bg-white border border-[#efefed] text-[#a3a39e] group-hover:border-[#6C63FF]/40 group-hover:text-[#5750D4]'
                  }`}>
                    {step.number}
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 bg-white rounded-xl border border-[#efefed] p-8 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-[#d0d0ce] transition-all duration-300 mb-2">
                  <h2 className="text-2xl font-[Playfair_Display] text-[#0e0e0d] mb-3">{step.title}</h2>
                  <p className="text-[#6b6b66] leading-relaxed text-[15px]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 bg-[#0e0e0d] rounded-2xl p-12 text-center relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl font-[Playfair_Display] text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/50 mb-8">
              Join CREWUPFILMS today and find your next great collaborator.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-[#6C63FF] hover:bg-[#7C75FF] text-white font-semibold text-sm px-8 py-3.5 rounded-lg shadow-lg shadow-[#6C63FF]/25 transition-all duration-200 active:scale-[0.98]"
            >
              Create Your Free Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
