'use client';

import Link from 'next/link';

const DO_DONT = [
  {
    do:   'Verify your email before messaging others',
    dont: 'Share your login credentials with anyone',
  },
  {
    do:   'Use built-in messages for all communication',
    dont: 'Move conversations to WhatsApp or email early on',
  },
  {
    do:   'Meet in public places for first in-person meetings',
    dont: 'Go to a private home or unfamiliar location alone',
  },
  {
    do:   'Check for a Verified Creator badge on paid projects',
    dont: 'Pay any fee to audition, apply, or join a project',
  },
  {
    do:   'Report suspicious profiles with the ⚑ button',
    dont: 'Send money via UPI, crypto, or wire transfer to strangers',
  },
  {
    do:   'Have a parent or guardian present for minors at all meets',
    dont: 'Share your personal phone number before building trust',
  },
];

const SECTIONS = [
  {
    icon: '🔐',
    title: 'Account Safety',
    color: '#e8f4ff',
    border: '#bee3ff',
    dos: [
      'Verify your email to unlock full platform access and messaging.',
      'Use a strong, unique password — never reuse passwords across platforms.',
      'Enable phone verification in Settings for extra account protection.',
      'Log out of shared devices after every session.',
    ],
    donts: [
      "Share your password with anyone — CREWUPFILMS will never ask for it.",
      'Click suspicious links sent via messages or emails claiming to be from us.',
      'Use your real date of birth as part of a password or username.',
    ],
  },
  {
    icon: '📋',
    title: 'Evaluating Casting Calls',
    color: '#fff8e8',
    border: '#ffe4a0',
    dos: [
      'Check that every casting call clearly states compensation (paid or unpaid).',
      'Verify the production type (student / indie / commercial) matches the description.',
      'Look for a specific shooting location — vague locations are a red flag.',
      'Research the creator — check their profile, reviews, and portfolio before applying.',
    ],
    donts: [
      'Pay any registration fee, audition fee, or upfront cost — it\'s a scam.',
      'Accept a casting call that asks you to meet at a private home for auditions.',
      'Ignore a project with zero portfolio, zero reviews, and a large promised payment.',
    ],
  },
  {
    icon: '💬',
    title: 'Safe Messaging',
    color: '#f0fff4',
    border: '#b2f5c8',
    dos: [
      'Keep all communication inside CREWUPFILMS — our system filters and logs messages.',
      'Report any message that requests payment, fees, or financial information.',
      'Use the platform\'s message request system before opening a direct chat.',
      'Save screenshots if you receive suspicious or threatening messages.',
    ],
    donts: [
      'Share your personal phone number or email until you\'ve built real trust.',
      'Respond to messages requesting money, wire transfers, or cryptocurrency.',
      'Assume a profile is genuine just because it has a photo and bio.',
    ],
  },
  {
    icon: '🤝',
    title: 'Meeting In Person',
    color: '#fff0f8',
    border: '#ffc0e0',
    dos: [
      'Choose a public location for first meetings: café, co-working space, or studio.',
      'Video call before meeting in person to verify who you\'re meeting.',
      'Let a trusted friend or family member know where you\'re going.',
      'Confirm that productions have at least two people present during auditions.',
    ],
    donts: [
      'Meet alone with someone you\'ve only spoken to online at a private location.',
      'Ignore your instincts — if something feels wrong, leave immediately.',
      'Allow minors to attend in-person meetings without a parent or guardian.',
    ],
  },
  {
    icon: '💰',
    title: 'Payment & Scam Prevention',
    color: '#fffff0',
    border: '#f0e060',
    dos: [
      'Agree on payment terms in writing before starting any project.',
      'Use official invoicing and bank transfers for large payments.',
      'Contact your bank immediately if you suspect you\'ve been defrauded.',
      'Report scam profiles on the platform so we can remove them quickly.',
    ],
    donts: [
      'Send money to someone you\'ve never met in person via Western Union, UPI, or crypto.',
      'Pay upfront for roles, equipment access, or "production registration."',
      'Trust promises of unusually high pay with very little project information.',
    ],
  },
  {
    icon: '🧒',
    title: 'Protection for Minors',
    color: '#f0f4ff',
    border: '#c0d0ff',
    dos: [
      'Ensure minors always have a parent or guardian present at all in-person meets.',
      'Obtain written guardian consent before including minors in any production.',
      'Report immediately if you believe a minor is being targeted or exploited.',
      'Follow applicable child labour and protection laws in your region.',
    ],
    donts: [
      "Contact a minor's account without first verifying your own email on the platform.",
      'Ask a minor to meet alone or share personal contact details.',
      'Include minors in productions involving late nights, risky locations, or adult themes.',
    ],
  },
];

const RED_FLAGS = [
  'Any request to pay a fee to audition, apply, or join a project',
  'A casting call with no compensation details and no production type listed',
  'Pressure to meet urgently at a private home or unfamiliar address',
  'Requests for personal contact info very early in a conversation',
  'A profile with no portfolio, no reviews, and no Verified badge on a paid project',
  'Promises of unusually high pay with very little detail about the project',
  'Being asked to keep a collaboration secret from friends or family',
  'Requests to move conversation off-platform to WhatsApp or Telegram immediately',
  'A "producer" who cannot provide a production company name or registered address',
];

const PLATFORM_PROTECTIONS = [
  { icon: '🔍', title: 'Moderation Queue', desc: 'Every new project is reviewed by our team before it goes public.' },
  { icon: '🚫', title: 'Contact Info Filter', desc: 'Phone numbers and emails in messages are automatically removed.' },
  { icon: '⚠️', title: 'Scam Keyword Detection', desc: 'Messages containing payment requests are flagged and reviewed.' },
  { icon: '🔒', title: 'Minor Account Protection', desc: 'Unverified adults cannot send messages to users under 18.' },
  { icon: '✅', title: 'Verified Creator Badge', desc: 'Top creators can earn a verified badge through identity checks.' },
  { icon: '📁', title: 'Audit Trail', desc: 'All project edits are logged and applicants are notified of changes.' },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* ── Hero ── */}
      <div className="bg-[#0e0e0d] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#6055de]/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-sm font-medium">Safety Guide · CREWUPFILMS</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-5" style={{ fontFamily: 'Playfair Display' }}>
            Your Safety<br />
            <span className="text-[#8b82ff]">Comes First.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            CREWUPFILMS is built to be a safe space for creative collaboration. This guide tells you
            exactly what to do, what not to do, and how we protect you automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-7 py-3.5 rounded-xl transition-all"
            >
              Browse Safe Projects →
            </Link>
            <a
              href="#report"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:border-white/50 hover:text-white text-sm font-semibold px-7 py-3.5 rounded-xl transition-all"
            >
              ⚑ Report an Issue
            </a>
          </div>
        </div>
      </div>

      {/* ── Scam Warning Banner ── */}
      <div className="bg-red-600 text-white py-3.5 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3 justify-center text-center">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-sm font-semibold">
            Legitimate productions <strong>never</strong> ask you to pay. If anyone requests money, fees, or deposits — it&apos;s a scam. Report it immediately.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">

        {/* ── Quick Do / Don't Table ── */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-3">Quick Reference</p>
            <h2 className="text-3xl font-black text-[#0e0e0d]" style={{ fontFamily: 'Playfair Display' }}>
              Do&apos;s &amp; Don&apos;ts
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#efefed] overflow-hidden shadow-sm">
            {/* Header row */}
            <div className="grid grid-cols-2 border-b border-[#efefed]">
              <div className="px-6 py-4 bg-green-50 border-r border-[#efefed]">
                <p className="text-sm font-bold text-green-700 flex items-center gap-2">✅ DO</p>
              </div>
              <div className="px-6 py-4 bg-red-50">
                <p className="text-sm font-bold text-red-700 flex items-center gap-2">❌ DON&apos;T</p>
              </div>
            </div>
            {DO_DONT.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 ${i < DO_DONT.length - 1 ? 'border-b border-[#efefed]' : ''}`}
              >
                <div className="px-6 py-4 border-r border-[#efefed] flex items-start gap-3">
                  <span className="mt-0.5 text-green-500 flex-shrink-0 text-sm">✓</span>
                  <p className="text-sm text-[#111110] leading-relaxed">{row.do}</p>
                </div>
                <div className="px-6 py-4 flex items-start gap-3">
                  <span className="mt-0.5 text-red-400 flex-shrink-0 text-sm">✗</span>
                  <p className="text-sm text-[#111110] leading-relaxed">{row.dont}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Red Flags ── */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-red-800 flex items-center gap-3 mb-6">
            🚨 Red Flags — Leave Immediately If You See These
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {RED_FLAGS.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/60 rounded-xl px-4 py-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-sm text-red-900 font-medium leading-relaxed">{flag}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How the Platform Protects You ── */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-3">Built Into the Platform</p>
            <h2 className="text-3xl font-black text-[#0e0e0d]" style={{ fontFamily: 'Playfair Display' }}>
              How We Protect You Automatically
            </h2>
            <p className="text-[#6b6b66] text-sm mt-3 max-w-xl mx-auto">
              These safety systems run behind the scenes on every interaction — you don&apos;t need to do anything.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PLATFORM_PROTECTIONS.map((p, i) => (
              <div key={i} className="bg-white border border-[#efefed] rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] border border-[#e0dbff] flex items-center justify-center text-xl mb-4">
                  {p.icon}
                </div>
                <h3 className="text-sm font-bold text-[#0e0e0d] mb-1.5">{p.title}</h3>
                <p className="text-xs text-[#6b6b66] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Detailed Sections ── */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-3">Full Safety Guide</p>
            <h2 className="text-3xl font-black text-[#0e0e0d]" style={{ fontFamily: 'Playfair Display' }}>
              Section by Section
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            {SECTIONS.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden">
                {/* Header */}
                <div
                  className="px-7 py-5 border-b"
                  style={{ backgroundColor: section.color, borderColor: section.border }}
                >
                  <h2 className="text-lg font-bold text-[#111110] flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    {section.title}
                  </h2>
                </div>
                {/* Two-col Do/Don't */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#f0f0ee]">
                  <div className="px-7 py-5">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-4">✅ What to Do</p>
                    <ul className="flex flex-col gap-3">
                      {section.dos.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-sm text-[#333331] leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-7 py-5 bg-red-50/30">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-4">❌ What NOT to Do</p>
                    <ul className="flex flex-col gap-3">
                      {section.donts.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          <span className="text-sm text-[#333331] leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Report CTA ── */}
        <div id="report" className="bg-[#0e0e0d] text-white rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="text-4xl flex-shrink-0">⚑</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold mb-2">See something suspicious?</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Use the Report button on any profile, project, or message. Our moderation team reviews every report.
              Your identity is always kept confidential.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/projects"
              className="bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors text-center"
            >
              Browse Projects
            </Link>
            <Link
              href="/support"
              className="border border-white/20 hover:border-white/50 text-white/70 hover:text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors text-center"
            >
              Get Help
            </Link>
          </div>
        </div>

        {/* ── Emergency Contacts ── */}
        <div className="bg-white border border-[#efefed] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0e0e0d] mb-6 flex items-center gap-3">
            🚨 Emergency &amp; Reporting Contacts (India)
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Police',        number: '100',  desc: 'Immediate physical danger' },
              { label: 'Emergency',     number: '112',  desc: 'Unified emergency helpline' },
              { label: 'Women Helpline',number: '1091', desc: 'Harassment or assault' },
              { label: 'Cyber Crime',   number: '1930', desc: 'Online fraud and scams' },
            ].map((c) => (
              <div key={c.label} className="flex flex-col items-center text-center bg-[#fafaf9] border border-[#efefed] rounded-xl p-4">
                <p className="text-3xl font-black text-[#0e0e0d] font-mono mb-1">{c.number}</p>
                <p className="text-sm font-bold text-[#0e0e0d]">{c.label}</p>
                <p className="text-xs text-[#6b6b66] mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#a3a39e]">
            CREWUPFILMS is not an emergency service. For immediate danger, always contact local emergency services first.
          </p>
        </div>

        {/* ── Bottom links ── */}
        <div className="flex flex-wrap gap-4 justify-center pb-4">
          {[
            { href: '/legal/guidelines', label: 'Community Guidelines' },
            { href: '/legal/terms',      label: 'Terms of Service' },
            { href: '/legal/privacy',    label: 'Privacy Policy' },
            { href: '/support',          label: 'Contact Support' },
          ].map((l, i, arr) => (
            <span key={l.href} className="flex items-center gap-4">
              <Link href={l.href} className="text-sm text-[#6b6b66] hover:text-[#111110] transition-colors">
                {l.label}
              </Link>
              {i < arr.length - 1 && <span className="text-[#d0d0cc]">·</span>}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
