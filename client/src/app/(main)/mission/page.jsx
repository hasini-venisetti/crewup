'use client';

import Link from 'next/link';

export default function Mission() {
  const values = [
    {
      title: 'Accessibility',
      description: 'Creative collaboration should be open to everyone. Geography, budget, and network size shouldn\'t determine who gets to create. We\'re breaking down barriers so every creator has access to the collaborators they need.'
    },
    {
      title: 'Authenticity',
      description: 'We believe in real connections between real creators. Profiles are verified, reviews are honest, and relationships are built on genuine work together. No fake profiles, no scams, no shortcuts.'
    },
    {
      title: 'Community',
      description: 'We\'re building a community where creators lift each other up. Through mentorship, reviews, and shared projects, every member of CREWUPFILMS helps the community grow stronger. Together, we create better work.'
    }
  ];

  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Why We Exist</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Our Mission</h1>
        
        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-8 mb-16">
          <p className="text-xl text-[#111110] leading-relaxed font-medium">
            To make creative collaboration accessible to every independent creator, regardless of budget, location, or network.
          </p>
        </div>

        <p className="text-[#6b6b66] leading-relaxed mb-12">
          We're on a mission to transform how creators work together. Every feature we build, every decision we make, comes back to this single goal: empowering independent creators to find the collaborators they need and build amazing work together.
        </p>

        <div className="space-y-12 mb-16">
          {values.map((value, index) => (
            <div key={index} className="border-l-4 border-[#111110] pl-6">
              <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-3">{value.title}</h2>
              <p className="text-[#6b6b66] leading-relaxed text-sm">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-8">
          <h3 className="text-lg font-semibold text-[#111110] mb-3">Join Us</h3>
          <p className="text-[#6b6b66] mb-6">
            Help us build the future of creative collaboration. Every creator who joins CREWUPFILMS brings us closer to our mission.
          </p>
          <Link href="/signup" className="inline-block bg-[#111110] text-white text-sm font-medium px-6 py-3 hover:bg-[#2d2d2b] transition">
            Get Started
          </Link>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <h2 className="text-2xl font-[Playfair_Display] text-[#111110] mb-4">Learn More</h2>
          <div className="flex gap-6 flex-wrap">
            <Link href="/about" className="text-[#111110] font-medium hover:underline">
              About CREWUPFILMS
            </Link>
            <Link href="/contact" className="text-[#111110] font-medium hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
