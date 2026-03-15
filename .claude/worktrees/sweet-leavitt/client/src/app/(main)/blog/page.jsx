'use client';

import Link from 'next/link';

export default function Blog() {
  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div
        className="relative bg-[#0e0e0d] py-20 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">Stories & Updates</p>
          </div>
          <h1 className="text-5xl font-[Playfair_Display] text-white mb-3">Blog</h1>
          <p className="text-white/50 text-lg">Creator spotlights, platform news, and industry insights.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#6C63FF] via-[#7C75FF] to-[#6C63FF]" />
          <div
            className="bg-[#0e0e0d] px-10 py-14 text-center"
            style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          >
            <div className="text-4xl mb-5">✦</div>
            <h2 className="text-3xl font-[Playfair_Display] text-white mb-4">Coming Soon</h2>
            <p className="text-white/50 leading-relaxed mb-8 max-w-md mx-auto">
              We're working on creator spotlights, platform updates, and industry insights. Check back soon.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-[#6C63FF] hover:bg-[#7C75FF] text-white text-sm font-semibold px-8 py-3 rounded-lg shadow-lg shadow-[#6C63FF]/25 transition-all duration-200"
            >
              Suggest a Topic
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#6b6b66] text-sm">
            In the meantime,{' '}
            <Link href="/about" className="text-[#6C63FF] hover:underline font-medium">learn more about CREWUPFILMS</Link>
            {' '}or{' '}
            <Link href="/support" className="text-[#6C63FF] hover:underline font-medium">explore our help center</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
