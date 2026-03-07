'use client';

import Link from 'next/link';

export default function Support() {
  const categories = [
    {
      icon: '🚀',
      title: 'Getting Started',
      description: 'New to CREWUPFILMS? Learn the basics and get started collaborating.',
      links: [
        'How do I create a profile?',
        'How do I browse projects?',
        'What role should I choose?',
        'How do I apply to a project?',
      ],
    },
    {
      icon: '👤',
      title: 'Account & Profile',
      description: 'Manage your account, profile, and privacy settings.',
      links: [
        'How do I edit my profile?',
        'How do I change my password?',
        'How do I delete my account?',
        'Can I have multiple profiles?',
      ],
    },
    {
      icon: '🎬',
      title: 'Projects & Teams',
      description: 'Create projects, manage teams, and collaborate effectively.',
      links: [
        'How do I post a project?',
        'How do I invite collaborators?',
        'How do I use the project board?',
        'How do I manage shooting schedules?',
      ],
    },
    {
      icon: '🔧',
      title: 'Technical Issues',
      description: 'Troubleshoot problems and report bugs.',
      links: [
        'The app is not loading',
        "I can't send messages",
        'My profile is not appearing in search',
        'Report a bug',
      ],
    },
  ];

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
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">We're Here to Help</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4">Help Center</h1>
          <p className="text-white/50 text-lg">Find answers to common questions about CREWUPFILMS.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-white rounded-2xl border border-[#efefed] p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-[#f0eeff] flex items-center justify-center text-lg">
                  {category.icon}
                </span>
                <h3 className="font-[Playfair_Display] text-lg font-bold text-[#111110]">{category.title}</h3>
              </div>
              <p className="text-[#6b6b66] text-sm mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.links.map((link) => (
                  <li key={link} className="flex items-center gap-2 text-sm text-[#6b6b66] hover:text-[#6C63FF] cursor-pointer transition-colors">
                    <span className="w-1 h-1 rounded-full bg-[#6C63FF]/50 flex-shrink-0" />
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#0e0e0d',
            backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="px-10 py-10 text-center">
            <h2 className="text-2xl font-[Playfair_Display] text-white mb-3">Still need help?</h2>
            <p className="text-white/50 mb-2 text-sm">
              Email our support team at{' '}
              <span className="text-[#6C63FF] font-medium">support@crewup.in</span>
            </p>
            <p className="text-white/40 text-xs mb-8">We'll get back to you within 24 hours.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/support/report"
                className="inline-block bg-[#6C63FF] hover:bg-[#7C75FF] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Report an Issue
              </Link>
              <Link
                href="/contact"
                className="inline-block bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
