'use client';

import Link from 'next/link';

export default function Support() {
  const categories = [
    {
      title: 'Getting Started',
      description: 'New to CREWUPFILMS? Learn the basics and get started collaborating.',
      links: [
        'How do I create a profile?',
        'How do I browse projects?',
        'What role should I choose?',
        'How do I apply to a project?'
      ]
    },
    {
      title: 'Account & Profile',
      description: 'Manage your account, profile, and privacy settings.',
      links: [
        'How do I edit my profile?',
        'How do I change my password?',
        'How do I delete my account?',
        'Can I have multiple profiles?'
      ]
    },
    {
      title: 'Projects & Teams',
      description: 'Create projects, manage teams, and collaborate effectively.',
      links: [
        'How do I post a project?',
        'How do I invite collaborators?',
        'How do I use the project board?',
        'How do I manage shooting schedules?'
      ]
    },
    {
      title: 'Technical Issues',
      description: 'Troubleshoot problems and report bugs.',
      links: [
        'The app is not loading',
        'I can\'t send messages',
        'My profile is not appearing in search',
        'Report a bug'
      ]
    }
  ];

  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">We're Here to Help</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Help Center</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12">Find answers to common questions and learn how to make the most of CREWUPFILMS.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {categories.map((category, index) => (
            <div key={index} className="border border-[#efefed] p-6 rounded-sm hover:border-[#111110] transition">
              <h3 className="text-lg font-semibold text-[#111110] mb-2">{category.title}</h3>
              <p className="text-[#6b6b66] text-sm mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="text-[#111110] text-sm hover:underline cursor-pointer">
                    • {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-8">
          <h2 className="text-xl font-semibold text-[#111110] mb-2">Still need help?</h2>
          <p className="text-[#6b6b66] mb-6">
            Email our support team at <span className="text-[#111110] font-medium">support@crewup.in</span> and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/support/report" className="text-[#111110] font-medium hover:underline">
              Report an Issue
            </Link>
            <Link href="/support/safety" className="text-[#111110] font-medium hover:underline">
              Safety & Trust
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
