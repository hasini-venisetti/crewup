'use client';

import Link from 'next/link';

export default function CommunityGuidelines() {
  const guidelines = [
    {
      title: 'Be Respectful',
      description: 'Treat all creators with respect and kindness. Disagreements happen, but keep interactions professional and constructive. No personal attacks, hate speech, or discrimination of any kind.'
    },
    {
      title: 'Post Real Opportunities',
      description: 'Only post genuine projects, collaborations, and opportunities. Misleading posts waste everyone\'s time and damage trust in the community. Be clear about project details, timelines, and compensation.'
    },
    {
      title: 'No Spam',
      description: 'Don\'t spam other users with unsolicited messages or repeatedly post the same content. Mass messaging to promote yourself damages the platform. Focus on genuine connections and meaningful conversations.'
    },
    {
      title: 'No Harassment',
      description: 'Don\'t harass, threaten, or intimidate other creators. This includes unsolicited sexual content, persistent unwanted contact, or aggressive behavior. We take harassment seriously and will suspend violating accounts.'
    },
    {
      title: 'Protect Privacy',
      description: 'Don\'t share other people\'s personal information, contact details, or private messages without permission. Use the platform\'s messaging system to communicate. Respect each other\'s privacy boundaries.'
    },
    {
      title: 'Report Issues',
      description: 'See something that violates these guidelines? Report it. Use our reporting tools to flag inappropriate content or behavior. Our moderation team reviews reports and takes action quickly.'
    }
  ];

  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Community Standards</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Community Guidelines</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12">These guidelines help us maintain a safe, respectful, and productive community for all creators on CREWUPFILMS.</p>

        <div className="space-y-10">
          {guidelines.map((guideline, index) => (
            <div key={index} className="border-l-4 border-[#111110] pl-6">
              <h2 className="text-xl font-semibold text-[#111110] mb-2">{guideline.title}</h2>
              <p className="text-[#6b6b66] leading-relaxed text-sm">{guideline.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-6 mt-12">
          <h3 className="text-lg font-semibold text-[#111110] mb-3">Violations & Enforcement</h3>
          <p className="text-[#6b6b66] text-sm leading-relaxed mb-4">
            Violations of these guidelines may result in account warnings, content removal, or suspension. Serious violations, such as harassment or illegal activity, will result in immediate termination. We believe in second chances, but persistent violations will not be tolerated.
          </p>
          <p className="text-[#6b6b66] text-sm">
            If you believe your account was suspended unfairly, <Link href="/contact" className="text-[#111110] underline hover:no-underline">contact us</Link> with details.
          </p>
        </div>

        <div className="mt-16 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm">
            <Link href="/legal/terms" className="text-[#111110] underline hover:no-underline">Terms of Service</Link> | <Link href="/legal/privacy" className="text-[#111110] underline hover:no-underline">Privacy Policy</Link> | <Link href="/support/report" className="text-[#111110] underline hover:no-underline">Report Content</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
