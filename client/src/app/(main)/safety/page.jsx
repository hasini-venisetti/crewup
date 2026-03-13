'use client';

import Link from 'next/link';

const sections = [
  {
    icon: '🔐',
    title: 'Account Safety',
    color: '#e8f4ff',
    border: '#bee3ff',
    items: [
      'Verify your email to unlock full platform access.',
      'Use a strong, unique password — never reuse passwords across platforms.',
      'Enable phone verification in your settings for extra account protection.',
      'CREWUPFILMS will never ask for your password via email, chat, or any message.',
      'If you receive a suspicious message asking for your login details, report it immediately.',
    ],
  },
  {
    icon: '📋',
    title: 'Evaluating Casting Calls',
    color: '#fff8e8',
    border: '#ffe4a0',
    items: [
      'Check that every casting call includes clear compensation (paid or unpaid — both are fine, but it must be stated).',
      'Verify the production type (student / indie / commercial) matches the project description.',
      'Auditions should be online, at a registered studio, or at a production office — never at a private home.',
      'If a casting call asks you to pay a registration fee, audition fee, or any upfront cost — it\'s a scam. Report it.',
      'Look for a shooting location (city at minimum). Vague locations with no details are a red flag.',
    ],
  },
  {
    icon: '💬',
    title: 'Safe Messaging',
    color: '#f0fff4',
    border: '#b2f5c8',
    items: [
      'Keep all communication inside CREWUPFILMS — our system filters and logs messages for your protection.',
      'Never share your personal phone number or email until you\'ve built trust with the other person.',
      'Phone numbers and emails are automatically removed from messages — this is to protect you.',
      'If you receive a message requesting payment, a wire transfer, or cryptocurrency — it\'s a scam. Do not respond.',
      'Chat history is stored securely and can be provided for dispute resolution if needed.',
    ],
  },
  {
    icon: '🤝',
    title: 'Meeting In Person',
    color: '#fff0f8',
    border: '#ffc0e0',
    items: [
      'For first in-person meetings, always choose a public location: a coffee shop, co-working space, or registered studio.',
      'Let a friend or family member know where you\'re going and who you\'re meeting.',
      'Video call before meeting in person — it\'s a simple way to verify the other person is who they say they are.',
      'Professional productions always have at least two people present during auditions. One person alone in a private space is a red flag.',
      'For minors: a parent or guardian should be present at all in-person meetings and auditions.',
    ],
  },
  {
    icon: '🚨',
    title: 'Red Flags to Watch For',
    color: '#fff5f5',
    border: '#ffc0c0',
    highlight: true,
    items: [
      'Being asked to pay any fee to audition, apply, or join a project.',
      'A casting call with no compensation details and no production type.',
      'Pressure to meet urgently at a private home or unfamiliar location.',
      'Requests for personal contact information very early in the conversation.',
      'A profile with no portfolio, no reviews, and no verified badge on a paid project.',
      'Promises of unusually high pay with very little information about the project.',
      'Being asked to keep the collaboration secret from others.',
    ],
  },
  {
    icon: '🧒',
    title: 'Protection for Minors',
    color: '#f0f4ff',
    border: '#c0d0ff',
    items: [
      'Accounts for users under 18 have automatic protections — unverified adults cannot initiate contact.',
      'Minors should always have a parent or guardian present at all in-person meetings and auditions.',
      'Guardian consent is required for minors to be included in any production.',
      'If you believe a minor is being targeted or exploited, use the one-tap Report button and contact local authorities.',
      'Productions involving minors must comply with applicable child labour and protection laws.',
    ],
  },
  {
    icon: '🛡',
    title: 'Reporting & Moderation',
    color: '#f5fff0',
    border: '#c0f0a0',
    items: [
      'Use the Report button (⚑) on any profile, project, or message — it takes one tap.',
      'Report categories include: scam, harassment, fake project, inappropriate content, and more.',
      'All reports are reviewed by our moderation team. Confirmed violations result in permanent bans.',
      'Your identity is kept confidential when you submit a report.',
      'If you believe you\'re in immediate danger, contact local emergency services (100 / 112 in India).',
    ],
  },
  {
    icon: '💰',
    title: 'Payment & Scam Prevention',
    color: '#fffff0',
    border: '#f0e060',
    items: [
      'CREWUPFILMS does not process any payments between users — all payment is arranged off-platform between parties.',
      'Legitimate productions never ask actors or crew to pay upfront.',
      'Never send money via Western Union, wire transfer, cryptocurrency, or UPI to someone you\'ve never met.',
      'Payment requests detected in messages are automatically flagged and reviewed.',
      'If you have already sent money and suspect fraud, contact your bank and local police immediately.',
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-[#0e0e0d] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-white text-sm font-medium">🛡 Safety Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Your Safety Comes First
          </h1>
          <p className="text-[#8b8b86] text-lg max-w-2xl leading-relaxed">
            CREWUPFILMS is built to be a safe space for creative collaboration. Read this guide to protect yourself and others on the platform.
          </p>
        </div>
      </div>

      {/* Quick notice */}
      <div className="bg-red-600 text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-sm font-semibold">
            Legitimate productions never ask you to pay. If anyone requests money, fees, or deposits — it's a scam. Report it immediately.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Report CTA */}
        <div className="bg-white border border-[#efefed] rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#111110] mb-1">See something suspicious?</h2>
            <p className="text-sm text-[#6b6b66]">Use the Report button on any profile, project, or message. Our moderation team reviews all reports.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/report"
              className="bg-[#111110] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#2d2d2b] transition-colors"
            >
              Report an Issue
            </Link>
            <Link
              href="/support"
              className="bg-white border border-[#e0e0dd] text-[#111110] text-sm font-semibold px-5 py-3 rounded-xl hover:border-[#111110] transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>

        {/* Safety sections */}
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden"
            >
              {/* Section header */}
              <div
                className="px-7 py-5 border-b"
                style={{ backgroundColor: section.color, borderColor: section.border }}
              >
                <h2 className="text-lg font-bold text-[#111110] flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  {section.title}
                </h2>
              </div>

              {/* Items */}
              <ul className="px-7 py-5 flex flex-col gap-3.5">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: section.highlight ? '#ef4444' : '#111110' }}
                    />
                    <span className={`text-sm leading-relaxed ${section.highlight ? 'text-[#111110] font-medium' : 'text-[#444442]'}`}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Emergency contacts */}
        <div className="mt-12 bg-[#111110] text-white rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span>🚨</span> Emergency & Reporting Contacts
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { label: 'Police (India)', number: '100', desc: 'For immediate physical danger' },
              { label: 'Emergency (India)', number: '112', desc: 'Unified emergency helpline' },
              { label: 'Women Helpline', number: '1091', desc: 'For harassment or assault' },
              { label: 'Cyber Crime', number: '1930', desc: 'For online fraud and scams' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-black text-white/80 font-mono">{c.number}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{c.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-6">
            CREWUPFILMS is not an emergency service. For immediate danger, always contact local emergency services first.
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/legal/community-guidelines" className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
            Community Guidelines
          </Link>
          <span className="text-[#d0d0cc]">·</span>
          <Link href="/legal/terms" className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
            Terms of Service
          </Link>
          <span className="text-[#d0d0cc]">·</span>
          <Link href="/legal/privacy" className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
            Privacy Policy
          </Link>
          <span className="text-[#d0d0cc]">·</span>
          <Link href="/report" className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
            Report an Issue
          </Link>
          <span className="text-[#d0d0cc]">·</span>
          <Link href="/support" className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
