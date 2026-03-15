'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  {
    icon: '🚀',
    title: 'Getting Started',
    description: 'New to CREWUPFILMS? Learn the basics and get started collaborating.',
    faqs: [
      {
        q: 'How do I create a profile?',
        a: `After signing up, go to your profile page by clicking your avatar in the top-right corner and selecting "View Profile". Click "Edit Profile" to add your bio, skills, location, experience level, and portfolio links. A complete profile gets significantly more responses from project creators — make sure to add at least a profile photo, your role (Actor, Director, Editor, etc.), and a short bio.`,
      },
      {
        q: 'How do I browse projects?',
        a: `Click "Projects" in the top navigation bar. You'll see all active listings. Use the filters to narrow by role (Actor, Cinematographer, etc.), project type (Short Film, Music Video, Commercial, etc.), compensation (paid / unpaid), and location. You can also use the search bar to find specific projects by keyword. Click any project card to see full details, crew requirements, and the "Apply" button.`,
      },
      {
        q: 'What role should I choose?',
        a: `Choose the role that best describes your primary creative skill. Common roles include: Actor, Director, Cinematographer, Editor, Sound Designer, Production Designer, Makeup Artist, Writer, Producer, and more. You can update your role at any time in Settings → Profile. Pick the role you want to be hired for — this is what project creators see when you apply.`,
      },
      {
        q: 'How do I apply to a project?',
        a: `Open a project listing and click "Apply for this Role". Select the specific role you're applying for, write a short message to the creator (introduce yourself, mention relevant experience), and submit. You can track the status of all your applications in your Dashboard → Applications tab. The project creator will either accept, decline, or leave your application pending.`,
      },
    ],
  },
  {
    icon: '👤',
    title: 'Account & Profile',
    description: 'Manage your account, profile, and privacy settings.',
    faqs: [
      {
        q: 'How do I edit my profile?',
        a: `Go to your profile page (click your avatar → View Profile → Edit Profile) or visit the Profile Edit page directly. You can update your bio, skills, location, experience level, portfolio links, and social media handles. Profile changes are saved immediately. To update your name or date of birth, go to Settings → Profile tab.`,
      },
      {
        q: 'How do I change my password?',
        a: `Go to Settings → Security tab → "Change Password" section. Enter your current password, then your new password (minimum 8 characters — use a mix of uppercase, lowercase, numbers, and symbols for a strong password). Click "Change Password". If you've forgotten your current password, log out and use the "Forgot Password" link on the login page.`,
      },
      {
        q: 'How do I delete my account?',
        a: `Go to Settings → Account tab → scroll down to "Danger Zone". Click "Delete Account". You'll be asked to type your username to confirm — this is permanent and cannot be undone. All your projects, applications, messages, and profile data will be permanently removed. Make sure to download anything you want to keep before proceeding.`,
      },
      {
        q: 'Can I have multiple profiles?',
        a: `No — each person can have one CREWUPFILMS account. This policy exists to maintain trust and accountability on the platform. If you work in multiple roles (e.g., both Director and Editor), you can list multiple skills on a single profile. If you manage a production company, contact us at crewupfilms@gmail.com to discuss options.`,
      },
    ],
  },
  {
    icon: '🎬',
    title: 'Projects & Teams',
    description: 'Create projects, manage teams, and collaborate effectively.',
    faqs: [
      {
        q: 'How do I post a project?',
        a: `Click "Post a Project" in the navigation or Dashboard. Fill in the project title, type (Short Film, Music Video, Web Series, etc.), description, shooting location, dates, and compensation details. Add the crew roles you need and for each role you can specify requirements (age range, skills, specialties) and the number of positions. Your project goes live instantly and is visible to all creators on the platform. You must have a verified email and phone number to post.`,
      },
      {
        q: 'How do I invite collaborators?',
        a: `Once you've posted a project and received applications, go to your Dashboard → your project → Applications. Review each applicant's profile and message, then click "Accept" to add them to your crew or "Decline" to pass. Accepted collaborators are added to your project team and can access the project board. You can also directly message any creator on the platform and share your project link with them.`,
      },
      {
        q: 'How do I use the project board?',
        a: `After your project is created, go to Dashboard → your project → Project Board. Here you can post updates, share production documents, create tasks, and communicate with your confirmed crew. The board is only visible to accepted team members. Use it to share call sheets, scripts, location details, and important announcements — all in one place instead of scattered across WhatsApp groups.`,
      },
      {
        q: 'How do I manage shooting schedules?',
        a: `In your project dashboard, you can add shooting dates during project creation or edit them later. Share specific schedule details (call times, locations, scenes) through the project board so all confirmed crew members receive them. We recommend finalising your crew at least 1 week before the shoot and sending a call sheet through the board 24–48 hours in advance. For complex productions, use the task feature to assign prep work to individual crew members.`,
      },
    ],
  },
  {
    icon: '🔧',
    title: 'Technical Issues',
    description: 'Troubleshoot problems and report bugs.',
    faqs: [
      {
        q: 'The app is not loading',
        a: `Try these steps in order: (1) Hard-refresh the page — press Ctrl+Shift+R on Windows/Linux or Cmd+Shift+R on Mac. (2) Clear your browser cache and cookies for crewupfilms.com. (3) Try a different browser (Chrome, Firefox, Safari). (4) Disable browser extensions, especially ad-blockers. (5) Check your internet connection. If the problem persists for more than 10 minutes, we may be experiencing an outage — email crewupfilms@gmail.com with a description and screenshot.`,
      },
      {
        q: "I can't send messages",
        a: `Messaging has a few requirements: (1) Both your email and phone number must be verified — go to Settings → Security to check. (2) You can only initiate a message request to someone you haven't messaged before — they must accept it first. (3) If a user has blocked you, you won't be able to message them. (4) Some users may have restricted messages to verified creators only. If you've met all requirements and still can't message, email crewupfilms@gmail.com with the username you're trying to contact.`,
      },
      {
        q: 'My profile is not appearing in search',
        a: `Profiles appear in search and Explore after meeting these conditions: (1) Your email must be verified. (2) Your profile must be complete — add a bio, at least one skill, and a role. (3) New profiles may take a few minutes to be indexed after creation. (4) Make sure your profile is set to public (check Profile → Edit → Privacy). If your profile has been active for more than 24 hours and still isn't showing, email crewupfilms@gmail.com with your username.`,
      },
      {
        q: 'Report a bug',
        a: `We appreciate bug reports — they help us improve the platform. Please email crewupfilms@gmail.com with: (1) A description of what happened and what you expected to happen. (2) The page/feature where the bug occurred. (3) Your browser and device type. (4) A screenshot or screen recording if possible. You can also use the Report an Issue button below. Critical bugs (data loss, security issues) are prioritised and typically fixed within 24 hours.`,
      },
    ],
  },
];

export default function SupportPage() {
  const [openItem, setOpenItem] = useState(null); // "catIdx-faqIdx"

  const toggle = (key) => setOpenItem((prev) => (prev === key ? null : key));

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div
        className="relative bg-[#0e0e0d] py-20 overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">We&apos;re Here to Help</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>Help Center</h1>
          <p className="text-white/50 text-lg mb-8">Find answers to common questions about CREWUPFILMS.</p>
          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <a
                key={c.title}
                href={`#${c.title.replace(/\s+/g, '-').toLowerCase()}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/70 hover:text-white transition-all"
              >
                <span>{c.icon}</span> {c.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* FAQ Categories */}
        {CATEGORIES.map((cat, ci) => (
          <section key={cat.title} id={cat.title.replace(/\s+/g, '-').toLowerCase()}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f0eeff] border border-[#e0dbff] flex items-center justify-center text-xl flex-shrink-0">
                {cat.icon}
              </div>
              <div>
                <h2 className="text-xl font-black text-[#111110]" style={{ fontFamily: 'Playfair Display' }}>{cat.title}</h2>
                <p className="text-sm text-[#6b6b66]">{cat.description}</p>
              </div>
            </div>

            {/* Accordion */}
            <div className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden divide-y divide-[#efefed]">
              {cat.faqs.map((faq, fi) => {
                const key = `${ci}-${fi}`;
                const isOpen = openItem === key;
                return (
                  <div key={fi}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#fafaf9] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[#111110] pr-6">{faq.q}</span>
                      <span className={`text-[#6b6b66] flex-shrink-0 text-lg leading-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 bg-[#fafaf9] border-t border-[#efefed]">
                        <p className="text-sm text-[#444442] leading-relaxed pt-4 whitespace-pre-line">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Still need help */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0e0e0d', backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          <div className="px-10 py-10 text-center">
            <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Playfair Display' }}>Still need help?</h2>
            <p className="text-white/50 mb-1 text-sm">Email our support team at <span className="text-[#6C63FF] font-medium">crewupfilms@gmail.com</span></p>
            <p className="text-white/40 text-xs mb-8">We typically respond within 24 hours.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:crewupfilms@gmail.com"
                className="inline-flex items-center gap-2 bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                📧 Email Support
              </a>
              <Link
                href="/support/report"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                ⚑ Report an Issue
              </Link>
              <Link
                href="/safety"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                🛡 Safety Guide
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-4 justify-center pb-4 text-sm text-[#6b6b66]">
          {[
            { href: '/settings?tab=help',    label: '⚙️ Settings Help' },
            { href: '/legal/guidelines',     label: 'Community Guidelines' },
            { href: '/legal/terms',          label: 'Terms of Service' },
            { href: '/legal/privacy',        label: 'Privacy Policy' },
          ].map(({ href, label }, i, arr) => (
            <span key={href} className="flex items-center gap-4">
              <Link href={href} className="hover:text-[#111110] transition-colors">{label}</Link>
              {i < arr.length - 1 && <span className="text-[#d0d0cc]">·</span>}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
