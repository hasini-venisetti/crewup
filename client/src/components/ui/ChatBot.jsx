'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ════════════════════════════════════════════════════════════════════════════
   KNOWLEDGE BASE
   Each entry: id, category, keywords[], synonyms[], question, answer, link?, related[]
════════════════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: 'all',          label: 'All',          icon: '✦' },
  { id: 'start',        label: 'Get Started',  icon: '🚀' },
  { id: 'projects',     label: 'Projects',     icon: '🎬' },
  { id: 'applications', label: 'Applications', icon: '📨' },
  { id: 'safety',       label: 'Safety',       icon: '🛡' },
  { id: 'account',      label: 'Account',      icon: '👤' },
];

const FAQ = [
  /* ── Get Started ── */
  {
    id: 'what-is', category: 'start',
    keywords: ['what', 'crewup', 'about', 'platform', 'explain', 'overview', 'describe'],
    synonyms: ['crewupfilms', 'website', 'site', 'app'],
    question: 'What is CREWUPFILMS?',
    answer: 'CREWUPFILMS is a platform where independent film creators find their crew. Directors, editors, cinematographers, actors, musicians and more can connect, collaborate on projects, and build their portfolio — whether paid or unpaid.',
    related: ['how-apply', 'cost', 'roles'],
  },
  {
    id: 'cost', category: 'start',
    keywords: ['cost', 'price', 'free', 'subscription', 'plan', 'pricing', 'pay'],
    synonyms: ['money', 'charge', 'fee', 'paid to use'],
    question: 'Is CREWUPFILMS free?',
    answer: 'Yes! CREWUPFILMS is completely free during early access. All features — posting projects, applying, messaging, team chat, and portfolio building — are included at no cost.',
    link: { label: 'View Pricing →', href: '/pricing' },
    related: ['what-is', 'post-project', 'how-apply'],
  },
  {
    id: 'signup', category: 'start',
    keywords: ['sign', 'signup', 'register', 'create account', 'join', 'start'],
    synonyms: ['get started', 'new account', 'make account'],
    question: 'How do I sign up?',
    answer: 'Click "Sign Up" in the top navigation bar. Enter your name, email, and password. After registering, verify your email to unlock full platform access. Phone verification is required before posting projects.',
    link: { label: 'Sign Up →', href: '/auth/signup' },
    related: ['verification', 'profile', 'how-apply'],
  },
  {
    id: 'verification', category: 'start',
    keywords: ['verify', 'verification', 'verified', 'confirm', 'otp', 'code'],
    synonyms: ['email verify', 'phone verify', 'authenticate'],
    question: 'Why do I need to verify my account?',
    answer: 'Email, phone, and age verification are required before posting a project. This protects the community from fake listings. Go to Settings to complete your verifications — it only takes a few minutes.',
    link: { label: 'Go to Settings →', href: '/settings' },
    related: ['post-project', 'safety-overview', 'profile'],
  },
  {
    id: 'profile', category: 'start',
    keywords: ['profile', 'portfolio', 'bio', 'edit', 'skills', 'experience', 'setup'],
    synonyms: ['my page', 'about me', 'creator page'],
    question: 'How do I set up my profile?',
    answer: 'Go to Profile → Edit Profile. Add your bio, skills (up to 20), experience level, location, social links, and portfolio items (videos, images, links, certificates). A complete profile gets significantly more applications accepted.',
    link: { label: 'Edit Profile →', href: '/profile/edit' },
    related: ['roles', 'how-apply', 'mentor'],
  },
  {
    id: 'dashboard', category: 'start',
    keywords: ['dashboard', 'home', 'my projects', 'overview', 'manage'],
    synonyms: ['control panel', 'main page'],
    question: 'What is the Dashboard?',
    answer: 'Your Dashboard is your personal command centre. It shows your posted projects, drafts, incoming applications, your own applications, team activity, notifications, and recommendations — all in one place.',
    link: { label: 'Go to Dashboard →', href: '/dashboard' },
    related: ['post-project', 'how-apply', 'draft'],
  },

  /* ── Projects ── */
  {
    id: 'post-project', category: 'projects',
    keywords: ['post', 'create', 'publish', 'listing', 'new project', 'add project'],
    synonyms: ['make project', 'start project', 'launch project'],
    question: 'How do I post a project?',
    answer: 'Click "+ Post Project" in the nav bar. Fill in your project title, type (short film, music video, podcast, etc.), required roles, location, compensation, and safety details. You can publish immediately or save as a draft to finish later.',
    link: { label: 'Post a Project →', href: '/create-project' },
    related: ['draft', 'roles', 'paid', 'verification'],
  },
  {
    id: 'draft', category: 'projects',
    keywords: ['draft', 'save', 'unpublished', 'not live', 'incomplete'],
    synonyms: ['saved project', 'hidden project', 'work in progress'],
    question: 'What are draft projects?',
    answer: 'You can save a project as a draft while still filling in the details — only a title is required. Drafts are invisible to everyone else. When ready, go to your Dashboard and click "🚀 Publish" on the draft card to make it live.',
    related: ['post-project', 'dashboard', 'status-update'],
  },
  {
    id: 'paid', category: 'projects',
    keywords: ['paid', 'payment', 'compensation', 'money', 'collab', 'unpaid', 'revenue'],
    synonyms: ['get paid', 'salary', 'wage', 'earn', 'deferred', 'revenue share'],
    question: 'Are projects paid or unpaid?',
    answer: 'Both! Projects can be: 💰 Paid (fixed rate or day rate), 📊 Revenue Share (backend deal), ⏳ Deferred (paid upon sale/funding), 🤝 Unpaid collaboration, or ❓ Not specified yet. Paid projects must include clear compensation details.',
    related: ['post-project', 'roles', 'cost'],
  },
  {
    id: 'roles', category: 'projects',
    keywords: ['role', 'roles', 'director', 'editor', 'actor', 'cinematographer', 'musician', 'writer', 'position'],
    synonyms: ['job', 'occupation', 'crew role', 'what roles'],
    question: 'What roles can people apply for?',
    answer: 'Common roles include: Director, Cinematographer, Editor, Actor, Musician, Writer, Producer, Sound Designer, Colorist, VFX Artist, Animator, Scriptwriter, Production Designer, Costume Designer, and Makeup Artist. Creators can also add custom roles.',
    related: ['how-apply', 'post-project', 'profile'],
  },
  {
    id: 'project-types', category: 'projects',
    keywords: ['type', 'types', 'short film', 'music video', 'podcast', 'documentary', 'youtube', 'web series'],
    synonyms: ['genre', 'format', 'kind of project'],
    question: 'What types of projects are on CREWUPFILMS?',
    answer: 'The platform supports: 🎬 Short Film, 🎬 Feature Film, 📺 YouTube, 🎵 Music Video, 🎙 Podcast, 📺 Web Series, 🎥 Documentary, 💼 Commercial, 📷 Photography, 🎵 Music, and Other.',
    related: ['post-project', 'how-apply', 'films'],
  },
  {
    id: 'status-update', category: 'projects',
    keywords: ['update', 'status', 'notify', 'announcement', 'casting closed', 'filming started', 'news'],
    synonyms: ['project news', 'broadcast', 'inform team'],
    question: 'How do I post a project update?',
    answer: 'Open your project page and scroll to the "📢 Project Updates" section. Type your message (e.g. "Casting closed — filming starts next week!") and click Post Update. All pending applicants and team members are notified automatically.',
    related: ['team', 'post-project', 'applications-manage'],
  },
  {
    id: 'similar', category: 'projects',
    keywords: ['similar', 'related', 'discover', 'explore', 'find more', 'browse'],
    synonyms: ['more projects', 'other projects', 'like this'],
    question: 'How do I find similar projects?',
    answer: 'Scroll to the bottom of any project detail page — you\'ll see a "Similar Projects" section with 3 related projects of the same type. You can also filter the Projects page by category, role, paid/remote, or search by keyword.',
    link: { label: 'Browse Projects →', href: '/projects' },
    related: ['how-apply', 'roles', 'project-types'],
  },
  {
    id: 'remote', category: 'projects',
    keywords: ['remote', 'online', 'location', 'work from home', 'virtual', 'local'],
    synonyms: ['anywhere', 'in person', 'on site', 'distance'],
    question: 'Can I find remote projects?',
    answer: 'Yes! Toggle the "🌐 Remote" filter on the Projects page to see only remote-friendly projects. Many roles like editing, composing, sound design, and writing are fully remote.',
    link: { label: 'Filter Remote Projects →', href: '/projects' },
    related: ['how-apply', 'paid', 'roles'],
  },

  /* ── Applications ── */
  {
    id: 'how-apply', category: 'applications',
    keywords: ['apply', 'application', 'join', 'how to apply', 'submit', 'request'],
    synonyms: ['apply for', 'send application', 'apply to'],
    question: 'How do I apply to a project?',
    answer: 'Browse the Projects page, open a project, and click "Apply". Select the role you want, write a short message about why you\'re the right fit, and submit. The project owner reviews all applications and will accept or decline.',
    related: ['application-status', 'team', 'roles'],
  },
  {
    id: 'application-status', category: 'applications',
    keywords: ['accepted', 'rejected', 'declined', 'pending', 'status', 'heard back', 'response', 'decision'],
    synonyms: ['application result', 'outcome', 'approved', 'denied'],
    question: 'How do I check my application status?',
    answer: 'Go to Dashboard → My Applications. Each card shows its status: ⏳ Pending, ✅ Accepted, or ❌ Declined. If declined with a note from the creator, you\'ll see it in your notification and on the application card.',
    link: { label: 'View My Applications →', href: '/dashboard' },
    related: ['how-apply', 'team', 'notifications'],
  },
  {
    id: 'applications-manage', category: 'applications',
    keywords: ['manage', 'review', 'accept', 'reject', 'decline', 'incoming', 'applicants'],
    synonyms: ['approve applicant', 'handle applications', 'pick crew'],
    question: 'How do I manage applications to my project?',
    answer: 'Go to your project → Applications page. You\'ll see all applicants with their role, message, and profile. Click Accept to add them to your team, or Decline (with an optional note) to let them know kindly.',
    link: { label: 'View Project Applications →', href: '/dashboard' },
    related: ['team', 'status-update', 'rejection-note'],
  },
  {
    id: 'rejection-note', category: 'applications',
    keywords: ['rejection note', 'decline message', 'feedback', 'reason', 'explain decline'],
    synonyms: ['note to applicant', 'decline with reason'],
    question: 'Can I add a note when declining an applicant?',
    answer: 'Yes! When you click "Decline" on an application, a text box appears where you can write an optional note (up to 300 characters). The applicant sees it in their notification, so you can decline kindly and professionally.',
    related: ['applications-manage', 'how-apply', 'team'],
  },
  {
    id: 'team', category: 'applications',
    keywords: ['team', 'members', 'chat', 'group', 'collaborate', 'accepted', 'crew'],
    synonyms: ['my team', 'project team', 'crew members'],
    question: 'What happens after my application is accepted?',
    answer: 'You\'re added to the project team and get access to: 💬 Team Chat (group messaging), 👥 Team Page (members and roles), 📁 Shared Files, and 📅 Shoot Schedule. Once the creator releases the film, it appears in your portfolio automatically.',
    related: ['films', 'profile', 'status-update'],
  },
  {
    id: 'notifications', category: 'applications',
    keywords: ['notification', 'notify', 'alert', 'bell', 'message alert'],
    synonyms: ['updates', 'alerts', 'inbox'],
    question: 'How do notifications work?',
    answer: 'You get notifications for: new applications on your project, application decisions, team updates, project status posts, messages, and platform announcements. Check the bell icon in the navbar or visit the Notifications page.',
    link: { label: 'View Notifications →', href: '/notifications' },
    related: ['application-status', 'team', 'messages'],
  },
  {
    id: 'messages', category: 'applications',
    keywords: ['message', 'messages', 'dm', 'direct', 'chat', 'inbox', 'talk'],
    synonyms: ['private message', 'conversation', 'contact someone'],
    question: 'How do I message someone?',
    answer: 'Visit a creator\'s profile and click "Message". If you haven\'t chatted before, they\'ll receive a message request which they can accept or decline. Once accepted, you can chat freely in the Messages page.',
    link: { label: 'Go to Messages →', href: '/messages' },
    related: ['team', 'report', 'notifications'],
  },

  /* ── Safety ── */
  {
    id: 'safety-overview', category: 'safety',
    keywords: ['safe', 'safety', 'scam', 'fraud', 'trust', 'fake', 'suspicious', 'protect'],
    synonyms: ['how safe', 'is it safe', 'security', 'protection'],
    question: 'How does CREWUPFILMS keep me safe?',
    answer: 'Multiple layers of protection: 🔍 Risk scoring on every project, 🎭 Audition format transparency (studio/online only — no private residences), ⏱ Comment spam cooldown, 🚨 Report system with admin review, and ✅ Email/phone verification required to post.',
    link: { label: 'Read Safety Guide →', href: '/safety' },
    related: ['report', 'verification', 'audition'],
  },
  {
    id: 'report', category: 'safety',
    keywords: ['report', 'abuse', 'harassment', 'inappropriate', 'problem', 'issue', 'flag', 'dangerous'],
    synonyms: ['report user', 'report project', 'flag content'],
    question: 'How do I report a problem?',
    answer: 'Every project and profile page has a "Report" link at the bottom. You can also go to Support → Report an Issue. Choose a reason (scam, harassment, inappropriate content, etc.) and add details. Admins review reports within 48 hours.',
    link: { label: 'Report an Issue →', href: '/support/report' },
    related: ['safety-overview', 'messages', 'contact'],
  },
  {
    id: 'audition', category: 'safety',
    keywords: ['audition', 'casting', 'tryout', 'audition format', 'in person', 'meet'],
    synonyms: ['casting call', 'audition safety', 'meeting in person'],
    question: 'Are in-person auditions safe?',
    answer: 'CREWUPFILMS only allows studio, production office, or online audition formats — private residences are blocked. Always check the audition format badge on a project before applying, and read our safety guide for meetup tips.',
    link: { label: 'Safety Guide →', href: '/safety' },
    related: ['safety-overview', 'report', 'verification'],
  },

  /* ── Account ── */
  {
    id: 'mentor', category: 'account',
    keywords: ['mentor', 'mentorship', 'guide', 'learn', 'coach', 'advice'],
    synonyms: ['find mentor', 'be a mentor', 'mentoring'],
    question: 'How does mentorship work?',
    answer: 'Experienced creators can enable Mentor Mode on their profile. Browse the Mentors page to find one in your field. Send a request and if accepted, you\'ll be connected to work together through the platform.',
    link: { label: 'Find Mentors →', href: '/mentors' },
    related: ['profile', 'roles', 'what-is'],
  },
  {
    id: 'films', category: 'account',
    keywords: ['film', 'films', 'watch', 'released', 'youtube', 'finished', 'showcase', 'portfolio film'],
    synonyms: ['completed projects', 'released films', 'finished work'],
    question: 'Where can I watch completed films?',
    answer: 'Visit the Films page to browse all released projects. Once a creator links their YouTube video to a project, it automatically appears in the Films section and on every team member\'s profile — great for building your reel.',
    link: { label: 'Browse Films →', href: '/films' },
    related: ['team', 'profile', 'contest'],
  },
  {
    id: 'contest', category: 'account',
    keywords: ['contest', 'competition', 'win', 'prize', 'vote', 'leaderboard'],
    synonyms: ['film competition', 'challenge', 'award'],
    question: 'How do contests work?',
    answer: 'Contests are themed film competitions with prizes. Submit an eligible released project during the submission window. The community likes and votes on entries — top films win. Winners are announced when the contest ends.',
    link: { label: 'View Contests →', href: '/contests' },
    related: ['films', 'team', 'what-is'],
  },
  {
    id: 'leaderboard', category: 'account',
    keywords: ['leaderboard', 'ranking', 'top creators', 'best', 'rank'],
    synonyms: ['top users', 'creator rankings', 'high score'],
    question: 'What is the Leaderboard?',
    answer: 'The Leaderboard ranks creators based on their activity, completed projects, reviews, and community engagement. It\'s a great way to get discovered as a top creator in your field.',
    link: { label: 'View Leaderboard →', href: '/leaderboard' },
    related: ['profile', 'films', 'contest'],
  },
  {
    id: 'delete-account', category: 'account',
    keywords: ['delete', 'remove', 'deactivate', 'close account', 'quit'],
    synonyms: ['cancel account', 'leave platform', 'remove my data'],
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Account section. You\'ll find options to deactivate or permanently delete your account. Deletion removes all your data. If you need help, email us at crewupfilms@gmail.com.',
    link: { label: 'Go to Settings →', href: '/settings' },
    related: ['contact', 'profile', 'verification'],
  },
  {
    id: 'contact', category: 'account',
    keywords: ['contact', 'email', 'support', 'help', 'reach out', 'team', 'human'],
    synonyms: ['get help', 'talk to someone', 'customer support', 'admin'],
    question: 'How do I contact CREWUPFILMS?',
    answer: 'Email us at crewupfilms@gmail.com, use the Contact page, or go to the Support hub for guides and forms. We typically respond within 24–48 hours.',
    link: { label: 'Contact Us →', href: '/contact' },
    related: ['report', 'delete-account', 'safety-overview'],
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   SMART MATCHING ENGINE
   Scores: exact phrase (10) + exact word (3) + partial word (1) + synonym (2)
   Returns [{item, score}] sorted desc — top result is the answer
════════════════════════════════════════════════════════════════════════════ */
function scoreItem(item, tokens, q) {
  let score = 0;
  const allText = [item.question, ...item.keywords, ...(item.synonyms || [])].join(' ').toLowerCase();

  // Exact phrase match in question — highest weight
  if (item.question.toLowerCase().includes(q)) score += 10;

  // Per-keyword scoring
  for (const kw of item.keywords) {
    if (q.includes(kw)) score += 3;           // exact keyword phrase in query
    for (const t of tokens) {
      if (kw === t) score += 3;               // exact word match
      else if (kw.includes(t) && t.length > 2) score += 1; // partial
    }
  }

  // Synonym scoring
  for (const syn of item.synonyms || []) {
    if (q.includes(syn)) score += 2;
    for (const t of tokens) {
      if (syn.includes(t) && t.length > 2) score += 1;
    }
  }

  return score;
}

function findMatches(query, limit = 3) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);

  const scored = FAQ.map((item) => ({ item, score: scoreItem(item, tokens, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

function findAnswer(query) {
  const matches = findMatches(query, 1);
  return matches.length > 0 ? matches[0].item : null;
}

function findAlternatives(query, excludeId) {
  const matches = findMatches(query, 4);
  return matches.filter((m) => m.item.id !== excludeId).slice(0, 3).map((m) => m.item);
}

function getRelated(ids) {
  return ids.map((id) => FAQ.find((f) => f.id === id)).filter(Boolean).slice(0, 3);
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTOCOMPLETE — live question suggestions while typing
════════════════════════════════════════════════════════════════════════════ */
function Autocomplete({ query, onSelect }) {
  if (!query || query.length < 2) return null;
  const matches = findMatches(query, 5);
  if (!matches.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#efefed] rounded-xl shadow-xl overflow-hidden z-10">
      {matches.map(({ item }) => (
        <button
          key={item.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item.question); }}
          className="w-full text-left px-3 py-2.5 text-sm text-[#111110] hover:bg-[#f7f7f6] flex items-center gap-2 transition-colors border-b border-[#f5f5f3] last:border-0"
        >
          <span className="text-[#6C63FF] text-xs flex-shrink-0">
            {CATEGORIES.find((c) => c.id === item.category)?.icon || '✦'}
          </span>
          {item.question}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
════════════════════════════════════════════════════════════════════════════ */
function Bubble({ msg, onFeedback }) {
  const isBot = msg.from === 'bot';
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 group`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4740CC] flex items-center justify-center text-white text-[11px] font-bold mr-2 flex-shrink-0 mt-0.5 shadow-sm">
          C
        </div>
      )}
      <div className="flex flex-col max-w-[82%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isBot
              ? 'bg-white border border-[#efefed] text-[#111110] rounded-tl-sm'
              : 'bg-gradient-to-br from-[#6C63FF] to-[#4740CC] text-white rounded-tr-sm'
          }`}
        >
          {msg.text}
          {msg.link && (
            <Link
              href={msg.link.href}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#6C63FF] hover:text-[#4740CC] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              {msg.link.label}
            </Link>
          )}
        </div>

        {/* Related questions */}
        {msg.related?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.related.map((r) => (
              <button
                key={r.id}
                onClick={() => onFeedback('related', r)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f0eeff] border border-[#6C63FF]/20 text-[#4740CC] hover:bg-[#6C63FF]/15 transition-colors text-left"
              >
                {r.question}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + feedback */}
        <div className={`flex items-center gap-2 mt-1 ${isBot ? 'justify-start' : 'justify-end'}`}>
          <span className="text-[10px] text-[#c0c0bb]">{time}</span>
          {isBot && msg.canRate && !msg.rated && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onFeedback('up', msg)} title="Helpful"
                className="text-[11px] text-[#a3a39e] hover:text-green-500 transition-colors">👍</button>
              <button onClick={() => onFeedback('down', msg)} title="Not helpful"
                className="text-[11px] text-[#a3a39e] hover:text-red-400 transition-colors">👎</button>
            </div>
          )}
          {isBot && msg.rated === 'up' && <span className="text-[10px] text-green-500">👍 Thanks!</span>}
          {isBot && msg.rated === 'down' && <span className="text-[10px] text-[#a3a39e]">Got it, we'll improve!</span>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CATEGORY BROWSE VIEW — shown when user taps a category chip
════════════════════════════════════════════════════════════════════════════ */
function BrowseView({ category, onAsk }) {
  const items = category === 'all' ? FAQ : FAQ.filter((f) => f.category === category);
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAsk(item.question)}
          className="w-full text-left px-3.5 py-3 rounded-xl bg-white border border-[#efefed] hover:border-[#6C63FF]/30 hover:bg-[#f7f5ff] transition-all text-sm text-[#111110] flex items-center gap-2.5"
        >
          <span className="text-base flex-shrink-0">
            {CATEGORIES.find((c) => c.id === item.category)?.icon || '✦'}
          </span>
          <span className="leading-snug">{item.question}</span>
          <svg className="w-3.5 h-3.5 text-[#c0c0bb] ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN CHATBOT COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const INITIAL_MSG = {
  id: 'welcome',
  from: 'bot',
  text: "Hey! 👋 I'm the CREWUPFILMS assistant. Ask me anything or browse by category below.",
  ts: Date.now(),
  canRate: false,
};

export default function ChatBot() {
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState('chat');        // 'chat' | 'browse'
  const [browseCategory, setBrowseCategory] = useState('all');
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState([INITIAL_MSG]);
  const [typing, setTyping]       = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAuto, setShowAuto]   = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);
  const msgIdRef                  = useRef(0);

  const nextId = () => `msg-${++msgIdRef.current}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [open]);

  const pushBot = useCallback((text, extra = {}) => {
    const msg = { id: nextId(), from: 'bot', text, ts: Date.now(), canRate: true, ...extra };
    setMessages((prev) => [...prev, msg]);
    if (!open) setHasUnread(true);
  }, [open]);

  const handleSend = useCallback((text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text: trimmed, ts: Date.now() }]);
    setInput('');
    setShowAuto(false);
    setView('chat');
    setTyping(true);

    const delay = 400 + Math.min(trimmed.length * 8, 800);
    setTimeout(() => {
      setTyping(false);
      const match = findAnswer(trimmed);
      if (match) {
        const alts = findAlternatives(trimmed, match.id);
        const related = getRelated(match.related || []);
        pushBot(match.answer, {
          link: match.link || null,
          related: alts.length > 0 ? alts : related,
        });
      } else {
        // No match — show top guesses
        const guesses = findMatches(trimmed, 3).map((m) => m.item);
        pushBot(
          guesses.length > 0
            ? "I'm not sure I understood that. Did you mean one of these?"
            : "I didn't find an answer to that. Try rephrasing, or reach out to our team!",
          {
            link: guesses.length === 0 ? { label: 'Contact Support →', href: '/contact' } : null,
            related: guesses,
          }
        );
      }
    }, delay);
  }, [input, typing, pushBot]);

  const handleFeedback = useCallback((type, payload) => {
    if (type === 'related') {
      handleSend(payload.question);
      return;
    }
    setMessages((prev) => prev.map((m) =>
      m.id === payload.id ? { ...m, rated: type } : m
    ));
  }, [handleSend]);

  const clearChat = () => setMessages([INITIAL_MSG]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setShowAuto(false);
  };

  return (
    <>
      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] flex flex-col rounded-2xl shadow-2xl"
          style={{
            maxHeight: 'min(75vh, 620px)',
            border: '1px solid rgba(108,99,255,0.18)',
            background: '#fff',
            animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-2xl"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow-inner">C</div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#4740CC]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">CREWUP Assistant</p>
                <p className="text-white/55 text-[11px]">Answers instantly · Always available</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Browse toggle */}
              <button
                onClick={() => setView(view === 'browse' ? 'chat' : 'browse')}
                title="Browse all topics"
                className={`p-1.5 rounded-lg transition-colors ${view === 'browse' ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white hover:bg-white/15'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              {/* Clear */}
              <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                </svg>
              </button>
              {/* Close */}
              <button onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category tabs (always visible) */}
          <div className="flex gap-1 px-3 py-2 bg-[#fafaf9] border-b border-[#efefed] overflow-x-auto scrollbar-hide flex-shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setBrowseCategory(cat.id); setView('browse'); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  view === 'browse' && browseCategory === cat.id
                    ? 'bg-[#6C63FF] text-white'
                    : 'bg-white border border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/30 hover:text-[#4740CC]'
                }`}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Body — chat or browse */}
          <div className="flex-1 overflow-y-auto bg-[#f7f7f6]" style={{ minHeight: 0 }}>
            {view === 'browse' ? (
              <div className="px-3 py-3">
                <BrowseView category={browseCategory} onAsk={handleSend} />
              </div>
            ) : (
              <div className="px-4 py-4">
                {messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} onFeedback={handleFeedback} />
                ))}
                {typing && (
                  <div className="flex justify-start mb-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4740CC] flex items-center justify-center text-white text-[11px] font-bold mr-2 flex-shrink-0">C</div>
                    <div className="bg-white border border-[#efefed] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/60 animate-bounce" style={{ animationDelay: '160ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/60 animate-bounce" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-3 py-3 bg-white border-t border-[#efefed] flex-shrink-0 rounded-b-2xl">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setShowAuto(true); }}
                  onKeyDown={handleKey}
                  onFocus={() => setShowAuto(true)}
                  onBlur={() => setTimeout(() => setShowAuto(false), 150)}
                  placeholder="Ask me anything…"
                  maxLength={300}
                  className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-4 py-2.5 text-sm text-[#111110] placeholder:text-[#b0b0ab] focus:outline-none focus:border-[#6C63FF] focus:bg-white transition-all"
                />
                {showAuto && <Autocomplete query={input} onSelect={(q) => { setInput(q); handleSend(q); }} />}
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || typing}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#4740CC] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-35 transition-all flex-shrink-0 shadow-sm"
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-[#c0c0bb] text-center mt-1.5">
              Powered by CREWUPFILMS · {input.length > 0 ? `${input.length}/300` : 'Press Enter to send'}
            </p>
          </div>
        </div>
      )}

      {/* ── Floating trigger ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {hasUnread && (
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
