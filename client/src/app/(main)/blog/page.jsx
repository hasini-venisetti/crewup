'use client';

import Link from 'next/link';

export default function Blog() {
  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Stories & Updates</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Blog</h1>
        
        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-12">
          <h2 className="text-3xl font-[Playfair_Display] text-[#111110] mb-3">Coming Soon</h2>
          
          <p className="text-[#6b6b66] leading-relaxed mb-8 text-lg">
            We're working on bringing you the best articles, creator spotlights, platform updates, and industry insights.
          </p>

          <p className="text-[#6b6b66] mb-8">
            Check back soon for stories about creators on CREWUPFILMS, tips for collaborating effectively, and updates about new features rolling out.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/contact" className="inline-block bg-[#111110] text-white text-sm font-medium px-6 py-3 hover:bg-[#2d2d2b] transition">
              Suggest a Topic
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-[#6b6b66]">
            In the meantime, <Link href="/about" className="text-[#111110] underline hover:no-underline">learn more about CREWUPFILMS</Link> or <Link href="/support" className="text-[#111110] underline hover:no-underline">explore our help center</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
