'use client';

import Link from 'next/link';

const perks = [
  { icon: '✓', text: 'Unlimited project applications' },
  { icon: '✓', text: 'Real-time team messaging' },
  { icon: '✓', text: 'Full creator profile & portfolio' },
  { icon: '✓', text: 'Shooting schedule tools' },
  { icon: '✓', text: 'Reviews & ratings system' },
  { icon: '✓', text: 'Team dashboard & boards' },
  { icon: '✓', text: 'Mentorship matching' },
  { icon: '✓', text: 'Role waitlist notifications' },
];

export default function Pricing() {
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
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold">Simple & Fair</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4">Pricing</h1>
          <p className="text-white/50 text-lg">Transparent. Creator-first. Always.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Main Pricing Card */}
        <div className="relative rounded-2xl overflow-hidden mb-12">
          {/* Amber top accent */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

          <div
            className="bg-[#0e0e0d] px-10 py-12 text-center relative"
            style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {/* Badge */}
              <span className="inline-block bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-8">
                Early Access
              </span>

              <h2 className="text-5xl font-[Playfair_Display] text-white mb-2">Free</h2>
              <p className="text-white/40 text-sm uppercase tracking-widest mb-8">Forever, for early members</p>

              <p className="text-white/60 leading-relaxed mb-10 max-w-sm mx-auto">
                CREWUPFILMS is currently in early access and completely free for all creators. No hidden fees, no credit card required.
              </p>

              {/* Perks list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10 max-w-md mx-auto">
                {perks.map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xs font-bold flex-shrink-0">
                      {icon}
                    </span>
                    <span className="text-sm text-white/60">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-10 py-3.5 rounded-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 active:scale-[0.98]"
              >
                Sign Up for Free
              </Link>
            </div>
          </div>
        </div>

        {/* Future Plans Note */}
        <div className="bg-white rounded-xl border border-[#efefed] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-amber-500 font-bold mb-4">Looking Ahead</p>
          <h3 className="text-2xl font-[Playfair_Display] text-[#0e0e0d] mb-3">
            Pricing plans may come in the future
          </h3>
          <p className="text-[#6b6b66] text-sm leading-relaxed mb-6 max-w-md mx-auto">
            We're keeping CREWUPFILMS accessible to independent creators. Early members will always have special benefits.
          </p>
          <p className="text-[#6b6b66] text-sm">
            Questions?{' '}
            <Link href="/contact" className="text-[#0e0e0d] font-semibold hover:underline">
              Get in touch
            </Link>{' '}
            — we'd love to hear from you.
          </p>
        </div>
      </div>
    </main>
  );
}
