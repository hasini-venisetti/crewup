'use client';

import Link from 'next/link';

export default function Mission() {
  const values = [
    {
      title: 'Accessibility',
      description:
        "Creative collaboration should be open to everyone. Geography, budget, and network size shouldn't determine who gets to create. We're breaking down barriers so every creator has access to the collaborators they need.",
    },
    {
      title: 'Authenticity',
      description:
        "We believe in real connections between real creators. Profiles are verified, reviews are honest, and relationships are built on genuine work together. No fake profiles, no scams, no shortcuts.",
    },
    {
      title: 'Community',
      description:
        "We're building a community where creators lift each other up. Through mentorship, reviews, and shared projects, every member of CREWUPFILMS helps the community grow stronger. Together, we create better work.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div
        className="relative bg-[#0e0e0d] py-24 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">Why We Exist</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4 leading-tight">Our Mission</h1>
          <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
            To make creative collaboration accessible to every independent creator.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Mission Statement */}
        <div className="relative rounded-2xl overflow-hidden mb-16">
          <div className="h-1 bg-gradient-to-r from-[#6C63FF] to-[#7C75FF]" />
          <div className="bg-white border border-[#efefed] rounded-b-2xl p-8">
            <p className="text-xl text-[#111110] leading-relaxed font-medium">
              To make creative collaboration accessible to every independent creator, regardless of budget, location, or network.
            </p>
          </div>
        </div>

        <p className="text-[#6b6b66] leading-relaxed mb-16 text-[15px]">
          We're on a mission to transform how creators work together. Every feature we build, every decision we make, comes
          back to this single goal: empowering independent creators to find the collaborators they need and build amazing
          work together.
        </p>

        {/* Values */}
        <div className="space-y-8 mb-16">
          {values.map((value) => (
            <div key={value.title} className="border-l-4 border-[#6C63FF] pl-6">
              <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-3">{value.title}</h2>
              <p className="text-[#6b6b66] leading-relaxed text-sm">{value.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: '#0e0e0d',
            backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <h3 className="text-2xl font-[Playfair_Display] text-white mb-3">Join the Mission</h3>
          <p className="text-white/50 mb-8 text-sm max-w-md mx-auto">
            Help us build the future of creative collaboration. Every creator who joins CREWUPFILMS brings us closer to our goal.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#6C63FF] hover:bg-[#7C75FF] text-white text-sm font-semibold px-10 py-3.5 rounded-lg shadow-lg shadow-[#6C63FF]/25 transition-all duration-200"
          >
            Get Started Free
          </Link>
        </div>

        {/* Links */}
        <div className="mt-16 pt-12 border-t border-[#efefed] flex gap-6 flex-wrap">
          <Link href="/about" className="text-[#5750D4] font-semibold hover:underline text-sm">
            About CREWUPFILMS →
          </Link>
          <Link href="/contact" className="text-[#5750D4] font-semibold hover:underline text-sm">
            Contact Us →
          </Link>
        </div>
      </div>
    </main>
  );
}
