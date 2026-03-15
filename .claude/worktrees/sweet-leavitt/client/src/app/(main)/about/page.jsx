'use client';

import Link from 'next/link';

export default function About() {
  return (
    <main className="bg-[#fafaf9]">
      {/* Hero Section */}
      <div
        className="bg-[#0e0e0d] py-24"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">Our Story</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4 leading-tight">About CREWUPFILMS</h1>
          <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
            We believe the creative community deserves better tools to collaborate.
          </p>
        </div>
      </div>

      {/* Body Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Two Column Layout with Accent Sidebar */}
        <div className="flex gap-12">
          {/* Amber Accent Sidebar */}
          <div className="w-1 bg-gradient-to-b from-bg-[#f0eeff]0 to-[#c9c4ff] rounded-full flex-shrink-0 hidden sm:block" />

          {/* Content */}
          <div className="space-y-8 text-[#6b6b66] leading-relaxed flex-1 text-[15px]">
            <p>
              CREWUPFILMS was born from a simple observation: independent creators spend more time looking for
              collaborators than actually creating. Whether you're a filmmaker looking for a grip, a musician
              searching for a producer, or an editor waiting for projects, the process felt broken. You'd post on
              forums, slide into DMs, ask friends for referrals, and hope for the best.
            </p>
            <p>
              We built CREWUPFILMS because finding the right collaborator shouldn't be the hardest part of making
              something. Every creator deserves access to a global network of talented collaborators, regardless of
              their budget, location, or existing connections. We wanted to create a platform where skill and
              passion matter more than who you know.
            </p>
            <p>
              Today, CREWUPFILMS connects independent filmmakers, musicians, photographers, editors, animators,
              producers, and dozens of other creative professionals. Creators use CREWUPFILMS to find
              collaborators, manage projects, communicate with teams, and build lasting professional relationships.
              We're seeing incredible projects come to life — short films, music videos, podcasts, photography
              series — all because creators found each other on our platform.
            </p>
            <p>
              We're still early, but we're committed to building the most creator-friendly collaboration platform
              in the world. Your feedback shapes what we build next. This is just the beginning.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className="mt-20 rounded-2xl p-10 md:p-14 flex flex-col sm:flex-row justify-around items-center gap-10 bg-[#0e0e0d]"
          style={{
            backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {[
            { number: '1', label: 'Platform', amber: false },
            { number: '∞', label: 'Projects', amber: true },
            { number: '11+', label: 'Creator Roles', amber: false },
          ].map(({ number, label, amber }) => (
            <div key={label} className="text-center">
              <p className={`text-6xl md:text-7xl font-[Playfair_Display] mb-2 ${amber ? 'text-[#6C63FF]' : 'text-white'}`}>
                {number}
              </p>
              <p className="text-xs uppercase tracking-[0.15em] text-white/40 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Learn More Section */}
        <div className="mt-20">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold mb-6">Learn More</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { href: '/mission',      title: 'Our Mission',  body: 'Discover what drives us forward',    cta: 'Read more' },
              { href: '/how-it-works', title: 'How It Works', body: 'Get started in 6 simple steps',      cta: 'Explore' },
              { href: '/contact',      title: 'Contact Us',   body: "We'd love to hear from you",          cta: 'Get in touch' },
            ].map(({ href, title, body, cta }) => (
              <Link key={href} href={href}>
                <div className="bg-white rounded-xl border border-[#efefed] p-8 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:border-[#d0d0ce] transition-all duration-200 h-full flex flex-col">
                  <h3 className="text-xl font-[Playfair_Display] text-[#0e0e0d] mb-2">{title}</h3>
                  <p className="text-[#6b6b66] text-sm mb-6 flex-1">{body}</p>
                  <div className="flex items-center gap-1.5 text-[#5750D4] font-semibold text-sm">
                    {cta} <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
