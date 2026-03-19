'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════════════════════
   GUIDED FLOWS  — multi-step walkthroughs
════════════════════════════════════════════════════════════════════════════ */
const FLOWS = {
  'post-first-project': {
    trigger: ['help me post', 'first project', 'how to start', 'get started posting', 'new to this'],
    steps: [
      { text: "Great! Let's get your first project live. First — have you verified your email and phone number? Both are required before posting. ✅", action: { label: 'Go to Settings →', href: '/settings' } },
      { text: "Perfect. Now head to the Create Project page. You'll need: a title, project type (short film, music video, etc.), and at least one required role. 🎬", action: { label: 'Create Project →', href: '/create-project' } },
      { text: "Fill in location (or tick Remote), compensation type, and the safety fields — audition format and shooting location type. These help applicants trust your listing. 🛡" },
      { text: "Hit 'Post Project →' to go live instantly, or 'Save as Draft' if you're not ready yet. That's it — your project is now visible to creators! 🚀", action: { label: 'Browse Projects →', href: '/projects' } },
    ],
  },
  'find-crew': {
    trigger: ['find crew', 'need crew', 'looking for crew', 'hire someone', 'recruit'],
    steps: [
      { text: "To find crew, post a project with the specific roles you need. Be detailed in your role descriptions — it gets better applicants. 🎯", action: { label: 'Post a Project →', href: '/create-project' } },
      { text: "Once your project is live, creators will apply. You'll get a notification for each application. Review them at Projects → Applications. 📨" },
      { text: "Accept the best fit — they're automatically added to your team and get access to team chat and shared files. 💬", action: { label: 'View Dashboard →', href: '/dashboard' } },
    ],
  },
  'apply-first-time': {
    trigger: ['first time applying', 'never applied', 'how to apply first', 'new applicant'],
    steps: [
      { text: "Welcome! Start by completing your profile — add a bio, skills, and portfolio links. Creators check profiles before accepting. 👤", action: { label: 'Edit Profile →', href: '/profile/edit' } },
      { text: "Browse projects and find one that matches your skills. Filter by role, category, or use the search bar at the top of the Projects page. 🔍", action: { label: 'Browse Projects →', href: '/projects' } },
      { text: "Open a project, choose the role you want, write a short message about why you're a great fit, and hit Apply. Keep it genuine — 3-4 sentences work well. ✉️" },
      { text: "You'll get a notification when the creator makes a decision. Track all your applications in Dashboard → My Applications. ⏳", action: { label: 'Go to Dashboard →', href: '/dashboard' } },
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE CONTEXT  — page-aware answer overrides
════════════════════════════════════════════════════════════════════════════ */
const PAGE_CONTEXT = {
  '/projects':        { hint: "You're on the Projects page. Use the filters at the top to narrow by category, role, paid, or remote.", extraKeywords: ['filter', 'search here', 'this page'] },
  '/create-project':  { hint: "You're creating a project right now! Fill in every field carefully — detailed listings get more qualified applicants.", extraKeywords: ['this form', 'here', 'now'] },
  '/dashboard':       { hint: "Your Dashboard shows your projects, drafts, incoming applications, and your own applications all in one place.", extraKeywords: ['dashboard', 'here', 'this'] },
  '/films':           { hint: "You're on the Films page — browse all completed projects that have been released. Click any film to watch it.", extraKeywords: ['watch', 'here', 'films'] },
  '/safety':          { hint: "You're reading the Safety Guide. It covers audition safety, scam prevention, and how to report problems.", extraKeywords: ['safety', 'here', 'this page'] },
  '/messages':        { hint: "You're in Messages. Click a conversation on the left to open it, or visit someone's profile to start a new one.", extraKeywords: ['chat', 'message', 'here'] },
  '/profile/edit':    { hint: "You're editing your profile. Fill in your bio, skills, and add portfolio items — a complete profile gets more responses.", extraKeywords: ['profile', 'here', 'this'] },
  '/contests':        { hint: "You're on the Contests page. Submit an eligible released film during the submission window to compete for prizes.", extraKeywords: ['contest', 'here'] },
  '/mentors':         { hint: "You're browsing Mentors. Find an experienced creator in your field and send them a mentorship request.", extraKeywords: ['mentor', 'here'] },
  '/support/report':  { hint: "You're on the Report page. Fill in the form to report a user, project, or message. Admins review reports within 48 hours.", extraKeywords: ['report', 'here'] },
};

/* ════════════════════════════════════════════════════════════════════════════
   KNOWLEDGE BASE
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
  { id: 'what-is', category: 'start',
    keywords: ['what', 'crewup', 'about', 'platform', 'explain', 'overview'],
    synonyms: ['crewupfilms', 'website', 'site', 'app'],
    question: 'What is CREWUPFILMS?',
    answer: 'CREWUPFILMS is a platform where independent film creators find their crew. Directors, editors, cinematographers, actors, musicians and more connect, collaborate on projects, and build their portfolio — paid or unpaid.',
    related: ['how-apply', 'cost', 'roles'] },

  { id: 'cost', category: 'start',
    keywords: ['cost', 'price', 'free', 'subscription', 'plan', 'pricing', 'pay'],
    synonyms: ['money', 'charge', 'fee'],
    question: 'Is CREWUPFILMS free?',
    answer: 'Yes! CREWUPFILMS is completely free during early access. All features — posting projects, applying, messaging, team chat, and portfolio building — are included at no cost.',
    link: { label: 'View Pricing →', href: '/pricing' },
    related: ['what-is', 'post-project', 'how-apply'] },

  { id: 'signup', category: 'start',
    keywords: ['sign', 'signup', 'register', 'create account', 'join', 'start'],
    synonyms: ['get started', 'new account', 'make account'],
    question: 'How do I sign up?',
    answer: 'Click "Sign Up" in the top navigation. Enter your name, email, and password. After registering, verify your email to unlock full access. Phone verification is required before posting projects.',
    link: { label: 'Sign Up →', href: '/auth/signup' },
    related: ['verification', 'profile', 'how-apply'] },

  { id: 'verification', category: 'start',
    keywords: ['verify', 'verification', 'verified', 'confirm', 'otp', 'code'],
    synonyms: ['email verify', 'phone verify'],
    question: 'Why do I need to verify my account?',
    answer: 'Email, phone, and age verification are required before posting. This protects the community from fake listings. Go to Settings to complete your verifications — it takes just a few minutes.',
    link: { label: 'Go to Settings →', href: '/settings' },
    related: ['post-project', 'safety-overview', 'profile'] },

  { id: 'profile', category: 'start',
    keywords: ['profile', 'portfolio', 'bio', 'edit', 'skills', 'experience', 'setup'],
    synonyms: ['my page', 'about me', 'creator page'],
    question: 'How do I set up my profile?',
    answer: 'Go to Profile → Edit Profile. Add your bio, skills (up to 20), experience level, location, social links, and portfolio items (videos, images, links, certificates). A complete profile gets significantly more applications accepted.',
    link: { label: 'Edit Profile →', href: '/profile/edit' },
    related: ['roles', 'how-apply', 'mentor'] },

  { id: 'dashboard', category: 'start',
    keywords: ['dashboard', 'home', 'my projects', 'overview', 'manage'],
    synonyms: ['control panel', 'main page'],
    question: 'What is the Dashboard?',
    answer: 'Your Dashboard is your personal command centre. It shows your posted projects, drafts, incoming applications, your own applications, team activity, and recommendations — all in one place.',
    link: { label: 'Go to Dashboard →', href: '/dashboard' },
    related: ['post-project', 'how-apply', 'draft'] },

  { id: 'post-project', category: 'projects',
    keywords: ['post', 'create', 'publish', 'listing', 'new project', 'add project'],
    synonyms: ['make project', 'start project', 'launch project'],
    question: 'How do I post a project?',
    answer: 'Click "+ Post Project" in the nav bar. Fill in your project title, type, required roles, location, compensation, and safety details. You can publish immediately or save as a draft to finish later.',
    link: { label: 'Post a Project →', href: '/create-project' },
    related: ['draft', 'roles', 'paid', 'verification'] },

  { id: 'draft', category: 'projects',
    keywords: ['draft', 'save', 'unpublished', 'not live', 'incomplete'],
    synonyms: ['saved project', 'hidden project'],
    question: 'What are draft projects?',
    answer: 'Save a project as a draft while still filling in the details — only a title is required. Drafts are invisible to everyone else. Go to Dashboard and click "🚀 Publish" on the draft card when ready.',
    related: ['post-project', 'dashboard', 'status-update'] },

  { id: 'paid', category: 'projects',
    keywords: ['paid', 'payment', 'compensation', 'money', 'collab', 'unpaid', 'revenue'],
    synonyms: ['get paid', 'salary', 'wage', 'earn'],
    question: 'Are projects paid or unpaid?',
    answer: 'Both! Options are: 💰 Paid (fixed/day rate), 📊 Revenue Share (backend deal), ⏳ Deferred (paid on sale), 🤝 Unpaid Collab, or ❓ Not Specified. Paid projects must include clear compensation details.',
    related: ['post-project', 'roles', 'cost'] },

  { id: 'roles', category: 'projects',
    keywords: ['role', 'roles', 'director', 'editor', 'actor', 'cinematographer', 'musician', 'writer', 'position'],
    synonyms: ['job', 'occupation', 'crew role'],
    question: 'What roles can people apply for?',
    answer: 'Common roles: Director, Cinematographer, Editor, Actor, Musician, Writer, Producer, Sound Designer, Colorist, VFX Artist, Animator, Scriptwriter, Production Designer, Costume Designer, Makeup Artist — plus custom roles.',
    related: ['how-apply', 'post-project', 'profile'] },

  { id: 'project-types', category: 'projects',
    keywords: ['type', 'types', 'short film', 'music video', 'podcast', 'documentary', 'youtube', 'web series'],
    synonyms: ['genre', 'format', 'kind'],
    question: 'What types of projects are there?',
    answer: 'Supported types: 🎬 Short Film, Feature Film, 📺 YouTube, 🎵 Music Video, 🎙 Podcast, 📺 Web Series, 🎥 Documentary, 💼 Commercial, 📷 Photography, 🎵 Music, and Other.',
    related: ['post-project', 'how-apply', 'films'] },

  { id: 'status-update', category: 'projects',
    keywords: ['update', 'status', 'notify', 'announcement', 'casting closed', 'news'],
    synonyms: ['project news', 'broadcast', 'inform team'],
    question: 'How do I post a project update?',
    answer: 'Open your project page and scroll to the "📢 Project Updates" section. Type your message and click Post Update. All pending applicants and team members are notified automatically.',
    related: ['team', 'post-project', 'applications-manage'] },

  { id: 'similar', category: 'projects',
    keywords: ['similar', 'related', 'discover', 'explore', 'find more', 'browse'],
    synonyms: ['more projects', 'other projects'],
    question: 'How do I find similar projects?',
    answer: 'Scroll to the bottom of any project detail page — you\'ll see 3 "Similar Projects" of the same type. You can also filter the Projects page by category, role, paid/remote, or keyword search.',
    link: { label: 'Browse Projects →', href: '/projects' },
    related: ['how-apply', 'roles', 'project-types'] },

  { id: 'remote', category: 'projects',
    keywords: ['remote', 'online', 'location', 'virtual', 'local', 'work from home'],
    synonyms: ['anywhere', 'in person', 'on site'],
    question: 'Can I find remote projects?',
    answer: 'Yes! Toggle "🌐 Remote" on the Projects page to filter remote-friendly projects. Roles like editing, composing, sound design, and writing are typically fully remote.',
    link: { label: 'Filter Remote Projects →', href: '/projects' },
    related: ['how-apply', 'paid', 'roles'] },

  { id: 'how-apply', category: 'applications',
    keywords: ['apply', 'application', 'join', 'how to apply', 'submit', 'request'],
    synonyms: ['apply for', 'send application'],
    question: 'How do I apply to a project?',
    answer: 'Browse projects, open one you like, and click "Apply". Select the role, write a short message about why you\'re the right fit, and submit. The owner reviews and will accept or decline.',
    related: ['application-status', 'team', 'roles'] },

  { id: 'application-status', category: 'applications',
    keywords: ['accepted', 'rejected', 'declined', 'pending', 'status', 'heard back', 'response'],
    synonyms: ['application result', 'outcome', 'approved'],
    question: 'How do I check my application status?',
    answer: 'Go to Dashboard → My Applications. Each card shows: ⏳ Pending, ✅ Accepted, or ❌ Declined. If declined with a note from the creator, you\'ll see it in your notification.',
    link: { label: 'View Applications →', href: '/dashboard' },
    related: ['how-apply', 'team', 'notifications'] },

  { id: 'applications-manage', category: 'applications',
    keywords: ['manage', 'review', 'accept', 'reject', 'decline', 'incoming', 'applicants'],
    synonyms: ['approve applicant', 'handle applications', 'pick crew'],
    question: 'How do I manage applications to my project?',
    answer: 'Go to your project → Applications page. See all applicants with their role, message, and profile link. Click Accept to add them to your team, or Decline (with an optional note) to let them know kindly.',
    link: { label: 'View Dashboard →', href: '/dashboard' },
    related: ['team', 'status-update', 'rejection-note'] },

  { id: 'rejection-note', category: 'applications',
    keywords: ['rejection note', 'decline message', 'feedback', 'reason', 'explain'],
    synonyms: ['note to applicant', 'decline with reason'],
    question: 'Can I add a note when declining?',
    answer: 'Yes! When you click "Decline" on an application, a text box appears for an optional note (up to 300 chars). The applicant sees it in their notification — a kind, brief explanation goes a long way.',
    related: ['applications-manage', 'how-apply', 'team'] },

  { id: 'team', category: 'applications',
    keywords: ['team', 'members', 'chat', 'group', 'collaborate', 'accepted', 'crew'],
    synonyms: ['my team', 'project team'],
    question: 'What happens after my application is accepted?',
    answer: 'You\'re added to the project team with access to: 💬 Team Chat, 👥 Team Page, 📁 Shared Files, and 📅 Shoot Schedule. Once the creator releases the film, it appears in your portfolio automatically.',
    related: ['films', 'profile', 'status-update'] },

  { id: 'notifications', category: 'applications',
    keywords: ['notification', 'notify', 'alert', 'bell'],
    synonyms: ['updates', 'alerts', 'inbox'],
    question: 'How do notifications work?',
    answer: 'Notifications are sent for: new applications, application decisions, team updates, project status posts, messages, and platform announcements. Check the bell icon in the navbar or visit the Notifications page.',
    link: { label: 'View Notifications →', href: '/notifications' },
    related: ['application-status', 'team', 'messages'] },

  { id: 'messages', category: 'applications',
    keywords: ['message', 'messages', 'dm', 'direct', 'chat', 'inbox', 'talk'],
    synonyms: ['private message', 'conversation', 'contact someone'],
    question: 'How do I message someone?',
    answer: 'Visit a creator\'s profile and click "Message". If you haven\'t chatted before, they\'ll get a message request to accept or decline. Once accepted, chat freely in the Messages page.',
    link: { label: 'Go to Messages →', href: '/messages' },
    related: ['team', 'report', 'notifications'] },

  { id: 'safety-overview', category: 'safety',
    keywords: ['safe', 'safety', 'scam', 'fraud', 'trust', 'fake', 'suspicious', 'protect'],
    synonyms: ['how safe', 'security', 'protection'],
    question: 'How does CREWUPFILMS keep me safe?',
    answer: 'Multiple layers of protection: 🔍 Risk scoring on every project, 🎭 Audition format transparency (studio/online only — no private residences), ⏱ Comment spam cooldown, 🚨 Report system, and ✅ Email/phone verification required to post.',
    link: { label: 'Read Safety Guide →', href: '/safety' },
    related: ['report', 'verification', 'audition'] },

  { id: 'report', category: 'safety',
    keywords: ['report', 'abuse', 'harassment', 'inappropriate', 'problem', 'issue', 'flag'],
    synonyms: ['report user', 'report project', 'flag content'],
    question: 'How do I report a problem?',
    answer: 'Every project and profile page has a "Report" link at the bottom. Or go to Support → Report an Issue. Choose a reason, add details, and submit. Admins review all reports within 48 hours.',
    link: { label: 'Report an Issue →', href: '/support/report' },
    related: ['safety-overview', 'messages', 'contact'] },

  { id: 'audition', category: 'safety',
    keywords: ['audition', 'casting', 'tryout', 'in person', 'meet', 'meetup'],
    synonyms: ['casting call', 'audition safety', 'meeting'],
    question: 'Are in-person auditions safe?',
    answer: 'Only studio, production office, or online audition formats are allowed — private residences are blocked. Always check the audition format badge on a project, and read our safety guide for meetup tips.',
    link: { label: 'Safety Guide →', href: '/safety' },
    related: ['safety-overview', 'report', 'verification'] },

  { id: 'mentor', category: 'account',
    keywords: ['mentor', 'mentorship', 'guide', 'learn', 'coach', 'advice'],
    synonyms: ['find mentor', 'be a mentor'],
    question: 'How does mentorship work?',
    answer: 'Experienced creators can enable Mentor Mode on their profile. Browse the Mentors page, find one in your field, and send a request. If accepted, you connect and work together through the platform.',
    link: { label: 'Find Mentors →', href: '/mentors' },
    related: ['profile', 'roles', 'what-is'] },

  { id: 'films', category: 'account',
    keywords: ['film', 'films', 'watch', 'released', 'youtube', 'finished', 'showcase'],
    synonyms: ['completed projects', 'released films', 'finished work'],
    question: 'Where can I watch completed films?',
    answer: 'Visit the Films page to browse all released projects. Once a creator links their YouTube video, it appears in Films and automatically on every team member\'s profile — great for building your reel.',
    link: { label: 'Browse Films →', href: '/films' },
    related: ['team', 'profile', 'contest'] },

  { id: 'contest', category: 'account',
    keywords: ['contest', 'competition', 'win', 'prize', 'vote', 'leaderboard'],
    synonyms: ['film competition', 'challenge', 'award'],
    question: 'How do contests work?',
    answer: 'Themed film competitions with prizes. Submit an eligible released project during the window. The community likes and votes on entries — top films win. Winners are announced when the contest ends.',
    link: { label: 'View Contests →', href: '/contests' },
    related: ['films', 'team', 'leaderboard'] },

  { id: 'leaderboard', category: 'account',
    keywords: ['leaderboard', 'ranking', 'top creators', 'rank', 'best'],
    synonyms: ['top users', 'creator rankings'],
    question: 'What is the Leaderboard?',
    answer: 'The Leaderboard ranks creators based on activity, completed projects, reviews, and community engagement — a great way to get discovered as a top creator in your field.',
    link: { label: 'View Leaderboard →', href: '/leaderboard' },
    related: ['profile', 'films', 'contest'] },

  { id: 'delete-account', category: 'account',
    keywords: ['delete', 'remove', 'deactivate', 'close account', 'quit'],
    synonyms: ['cancel account', 'leave platform'],
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Account section. You\'ll find options to deactivate or permanently delete your account. Deletion removes all your data. Email crewupfilms@gmail.com if you need help.',
    link: { label: 'Go to Settings →', href: '/settings' },
    related: ['contact', 'profile'] },

  { id: 'contact', category: 'account',
    keywords: ['contact', 'email', 'support', 'reach out', 'team', 'human', 'talk to someone'],
    synonyms: ['get help', 'customer support', 'admin'],
    question: 'How do I contact CREWUPFILMS?',
    answer: 'Email us at crewupfilms@gmail.com, use the Contact page, or the Support hub. We typically respond within 24–48 hours.',
    link: { label: 'Contact Us →', href: '/contact' },
    related: ['report', 'delete-account', 'safety-overview'] },
];

/* ════════════════════════════════════════════════════════════════════════════
   MATCHING ENGINE
════════════════════════════════════════════════════════════════════════════ */
function scoreItem(item, tokens, q) {
  let score = 0;
  if (item.question.toLowerCase().includes(q)) score += 10;
  for (const kw of item.keywords) {
    if (q.includes(kw)) score += 3;
    for (const t of tokens) {
      if (kw === t) score += 3;
      else if (kw.includes(t) && t.length > 2) score += 1;
    }
  }
  for (const syn of item.synonyms || []) {
    if (q.includes(syn)) score += 2;
    for (const t of tokens) { if (syn.includes(t) && t.length > 2) score += 1; }
  }
  return score;
}

function findMatches(query, limit = 3) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  return FAQ.map((item) => ({ item, score: scoreItem(item, tokens, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function findAnswer(query) {
  const m = findMatches(query, 1);
  return m.length ? m[0].item : null;
}

function getRelated(ids) {
  return (ids || []).map((id) => FAQ.find((f) => f.id === id)).filter(Boolean).slice(0, 3);
}

function detectFlow(query) {
  const q = query.toLowerCase();
  for (const [key, flow] of Object.entries(FLOWS)) {
    if (flow.trigger.some((t) => q.includes(t))) return { key, flow };
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTOCOMPLETE
════════════════════════════════════════════════════════════════════════════ */
function Autocomplete({ query, onSelect }) {
  if (!query || query.length < 2) return null;
  const matches = findMatches(query, 5);
  if (!matches.length) return null;
  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#efefed] rounded-xl shadow-xl overflow-hidden z-10">
      {matches.map(({ item }) => (
        <button key={item.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item.question); }}
          className="w-full text-left px-3 py-2.5 text-sm text-[#111110] hover:bg-[#f7f7f6] flex items-center gap-2 transition-colors border-b border-[#f5f5f3] last:border-0"
        >
          <span className="text-[#6C63FF] text-xs flex-shrink-0">{CATEGORIES.find((c) => c.id === item.category)?.icon || '✦'}</span>
          {item.question}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
════════════════════════════════════════════════════════════════════════════ */
function Bubble({ msg, onAction }) {
  const isBot = msg.from === 'bot';
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 group`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4740CC] flex items-center justify-center text-white text-[11px] font-bold mr-2 flex-shrink-0 mt-0.5 shadow-sm">C</div>
      )}
      <div className="flex flex-col max-w-[82%]">
        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isBot ? 'bg-white border border-[#efefed] text-[#111110] rounded-tl-sm' : 'bg-gradient-to-br from-[#6C63FF] to-[#4740CC] text-white rounded-tr-sm'
        }`}>
          {msg.text}

          {/* Guided flow action button */}
          {msg.action && (
            <Link href={msg.action.href}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF]/20 border border-[#6C63FF]/20 rounded-lg px-3 py-1.5 transition-colors">
              {msg.action.label}
            </Link>
          )}

          {/* Regular link */}
          {msg.link && !msg.action && (
            <Link href={msg.link.href}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#6C63FF] hover:text-[#4740CC] transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              {msg.link.label}
            </Link>
          )}

          {/* Copy button — bot messages only */}
          {isBot && (
            <button onClick={copy} title="Copy"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#f0f0ee] text-[#a3a39e]">
              {copied
                ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>}
            </button>
          )}
        </div>

        {/* Related chips — horizontal scroll */}
        {msg.related?.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {msg.related.map((r) => (
              <button key={r.id} onClick={() => onAction('related', r)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f0eeff] border border-[#6C63FF]/20 text-[#4740CC] hover:bg-[#6C63FF]/15 transition-colors whitespace-nowrap flex-shrink-0">
                {r.question}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + feedback + 👎 follow-up */}
        <div className={`flex items-center gap-2 mt-1 flex-wrap ${isBot ? 'justify-start' : 'justify-end'}`}>
          <span className="text-[10px] text-[#c0c0bb]">{time}</span>
          {isBot && msg.canRate && !msg.rated && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onAction('up', msg)} title="Helpful" className="text-[11px] text-[#a3a39e] hover:text-green-500 transition-colors">👍</button>
              <button onClick={() => onAction('down', msg)} title="Not helpful" className="text-[11px] text-[#a3a39e] hover:text-red-400 transition-colors">👎</button>
            </div>
          )}
          {isBot && msg.rated === 'up'   && <span className="text-[10px] text-green-500">👍 Glad that helped!</span>}
          {isBot && msg.rated === 'down' && <span className="text-[10px] text-amber-500">Thanks for the feedback!</span>}
        </div>

        {/* 👎 follow-up input */}
        {isBot && msg.showFeedbackInput && !msg.feedbackSent && (
          <FeedbackInput onSend={(text) => onAction('feedbackText', { msg, text })} />
        )}
      </div>
    </div>
  );
}

function FeedbackInput({ onSend }) {
  const [val, setVal] = useState('');
  return (
    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
      <p className="text-xs text-amber-700 font-medium">What were you looking for?</p>
      <div className="flex gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSend(val.trim())}
          placeholder="Tell us what you needed…"
          className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 text-[#111110] placeholder:text-[#a3a39e]"
        />
        <button onClick={() => val.trim() && onSend(val.trim())}
          disabled={!val.trim()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BROWSE VIEW
════════════════════════════════════════════════════════════════════════════ */
function BrowseView({ category, onAsk }) {
  const items = category === 'all' ? FAQ : FAQ.filter((f) => f.category === category);
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <button key={item.id} onClick={() => onAsk(item.question)}
          className="w-full text-left px-3.5 py-3 rounded-xl bg-white border border-[#efefed] hover:border-[#6C63FF]/30 hover:bg-[#f7f5ff] transition-all text-sm text-[#111110] flex items-center gap-2.5 group">
          <span className="text-base flex-shrink-0">{CATEGORIES.find((c) => c.id === item.category)?.icon || '✦'}</span>
          <span className="leading-snug flex-1">{item.question}</span>
          <svg className="w-3.5 h-3.5 text-[#c0c0bb] flex-shrink-0 group-hover:text-[#6C63FF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STORAGE HELPERS
════════════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'crewup_chat_history';
const MAX_STORED  = 40;

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch { return null; }
}

function saveMessages(msgs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED))); } catch {}
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function ChatBot() {
  const pathname  = usePathname();
  const userRef   = useRef(null);

  // Get stored user for personalization (safe — runs only on client)
  useEffect(() => { userRef.current = getStoredUser(); }, []);

  const makeWelcome = useCallback(() => {
    const u = userRef.current;
    const name = u?.name?.split(' ')[0] || null;
    return {
      id: 'welcome', from: 'bot', ts: Date.now(), canRate: false,
      text: name
        ? `Hey ${name}! 👋 I'm your CREWUPFILMS assistant. Ask me anything or browse by category.`
        : "Hey! 👋 I'm the CREWUPFILMS assistant. Ask me anything or browse by category below.",
    };
  }, []);

  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [view, setView]           = useState('chat');
  const [browseCategory, setBrowseCategory] = useState('all');
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState(() => loadMessages() || []);
  const [typing, setTyping]       = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAuto, setShowAuto]   = useState(false);
  const [flowState, setFlowState] = useState(null); // { key, step }
  const [failCount, setFailCount] = useState(0);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const msgIdRef    = useRef(100);
  const nextId = () => `m-${++msgIdRef.current}`;

  // Initialise welcome message if no history
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = makeWelcome();
      setMessages([welcome]);
    }
  }, []); // eslint-disable-line

  // Persist to localStorage whenever messages change
  useEffect(() => { if (messages.length > 0) saveMessages(messages); }, [messages]);

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  // Focus input when opening
  useEffect(() => {
    if (open && !minimized) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [open, minimized]);

  // Keyboard shortcut: Ctrl+/ or Cmd+/
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen((v) => !v);
        setMinimized(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pushBot = useCallback((text, extra = {}) => {
    const msg = { id: nextId(), from: 'bot', text, ts: Date.now(), canRate: true, ...extra };
    setMessages((prev) => [...prev, msg]);
    if (!open || minimized) setHasUnread(true);
  }, [open, minimized]);

  const handleSend = useCallback((text) => {
    const trimmed = (typeof text === 'string' ? text : input).trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text: trimmed, ts: Date.now() }]);
    setInput('');
    setShowAuto(false);
    setView('chat');
    setTyping(true);

    const delay = 400 + Math.min(trimmed.length * 7, 900);

    setTimeout(() => {
      setTyping(false);

      // ── Active guided flow ──
      if (flowState) {
        const q = trimmed.toLowerCase();

        // Exit words — user wants to leave the flow
        const exitWords = ['stop', 'exit', 'cancel', 'quit', 'back', 'done', 'end', 'no thanks', 'never mind', 'nevermind'];
        if (exitWords.some((w) => q === w || q.startsWith(w + ' '))) {
          setFlowState(null);
          pushBot("No problem! Feel free to ask me anything. 😊", {
            related: getRelated(['post-project', 'how-apply', 'contact']),
          });
          setFailCount(0);
          return;
        }

        // If user asks a completely different question (strong FAQ match), exit flow and answer it
        const jumpMatch = findAnswer(trimmed);
        const jumpFlow = detectFlow(trimmed);
        const isNewFlow = jumpFlow && jumpFlow.key !== flowState.key;
        if (isNewFlow) {
          // Start the new flow instead
          setFlowState(null);
          const { key, flow } = jumpFlow;
          const first = flow.steps[0];
          setFlowState({ key, step: 0 });
          pushBot(first.text, { action: first.action || null });
          setFailCount(0);
          return;
        }
        if (jumpMatch && jumpMatch.id !== 'contact') {
          setFlowState(null);
          const related = getRelated(jumpMatch.related || []);
          pushBot(jumpMatch.answer, { link: jumpMatch.link || null, related });
          setFailCount(0);
          return;
        }

        // Otherwise advance to next step
        const { key, step } = flowState;
        const flow = FLOWS[key];
        const nextStep = step + 1;
        if (nextStep < flow.steps.length) {
          const s = flow.steps[nextStep];
          setFlowState({ key, step: nextStep });
          pushBot(s.text, { action: s.action || null });
        } else {
          setFlowState(null);
          pushBot("That's the full walkthrough! Let me know if you have any other questions. 😊", {
            related: getRelated(['dashboard', 'how-apply', 'contact']),
          });
        }
        setFailCount(0);
        return;
      }

      // ── "help" / "hi" / "hello" — show a quick menu ──
      const helpTriggers = ['help', 'hi', 'hello', 'hey', 'helo', 'hii', 'start', 'menu', 'options', 'what can you do'];
      if (helpTriggers.includes(trimmed.toLowerCase())) {
        pushBot(
          "Hi! I'm the CREWUP Assistant 👋 Here are some things I can help with:",
          {
            related: [
              FAQ.find((f) => f.id === 'post-project'),
              FAQ.find((f) => f.id === 'how-apply'),
              FAQ.find((f) => f.id === 'verification'),
              FAQ.find((f) => f.id === 'contact'),
            ].filter(Boolean),
          }
        );
        setFailCount(0);
        return;
      }

      // ── Page-aware override ──
      const pageCtx = PAGE_CONTEXT[pathname];
      if (pageCtx) {
        const contextTokens = (pageCtx.extraKeywords || []);
        const q = trimmed.toLowerCase();
        const isPageQuery = contextTokens.some((t) => q.includes(t));
        if (isPageQuery) {
          pushBot(pageCtx.hint, { related: getRelated(['dashboard', 'how-apply', 'contact']) });
          setFailCount(0);
          return;
        }
      }

      // ── Guided flow trigger ──
      const flowMatch = detectFlow(trimmed);
      if (flowMatch) {
        const { key, flow } = flowMatch;
        const first = flow.steps[0];
        setFlowState({ key, step: 0 });
        pushBot(first.text, { action: first.action || null });
        setFailCount(0);
        return;
      }

      // ── Normal FAQ match ──
      const match = findAnswer(trimmed);
      if (match) {
        const alts = findMatches(trimmed, 4).filter((m) => m.item.id !== match.id).slice(0, 3).map((m) => m.item);
        const related = getRelated(match.related || []);
        pushBot(match.answer, {
          link: match.link || null,
          related: alts.length ? alts : related,
        });
        setFailCount(0);
      } else {
        const newFail = failCount + 1;
        setFailCount(newFail);
        const guesses = findMatches(trimmed, 3).map((m) => m.item);

        if (newFail >= 2) {
          // Escalation after 2 failures
          pushBot(
            "I've had trouble understanding your last couple of questions. Would you like to reach the support team directly? They'll be happy to help! 🙋",
            { link: { label: 'Contact Support →', href: '/contact' }, related: guesses, canRate: false }
          );
          setFailCount(0);
        } else {
          const msgId = nextId();
          pushBot(
            guesses.length
              ? "I'm not sure I got that — did you mean one of these?"
              : "I didn't find an answer to that. Try rephrasing, or contact support!",
            {
              id: msgId,
              link: guesses.length === 0 ? { label: 'Contact Support →', href: '/contact' } : null,
              related: guesses,
              showFeedbackInput: true,
              userQuery: trimmed,
            }
          );
        }
      }
    }, delay);
  }, [input, typing, flowState, failCount, pathname, pushBot]);

  const handleAction = useCallback(async (type, payload) => {
    if (type === 'related') { handleSend(payload.question); return; }
    if (type === 'up') {
      setMessages((prev) => prev.map((m) => m.id === payload.id ? { ...m, rated: 'up' } : m));
    }
    if (type === 'down') {
      setMessages((prev) => prev.map((m) => m.id === payload.id ? { ...m, rated: 'down', showFeedbackInput: true } : m));
    }
    if (type === 'feedbackText') {
      const { msg, text } = payload;
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, feedbackSent: true, showFeedbackInput: false } : m));
      pushBot(`Thanks for the feedback! We'll use it to improve the assistant 🙏`, {
        canRate: false,
      });

      // Send feedback to admin via /api/contact
      try {
        const u = getStoredUser();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        await fetch(`${API_URL}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:    u?.name  || 'Anonymous (chatbot user)',
            email:   u?.email || 'no-reply@crewupfilms.com',
            subject: 'Chatbot Feedback — unanswered question',
            type:    'chatbot-feedback',
            message: `The bot couldn't answer this query.\n\nUser asked: "${msg.userQuery || 'unknown'}"\nBot replied: "${msg.text?.slice(0, 200)}"\n\nUser feedback: "${text}"`,
          }),
        });
      } catch {
        // Silently fail — don't break UX if the email fails
      }
    }
  }, [handleSend, pushBot]);

  const clearChat = () => {
    const welcome = makeWelcome();
    setMessages([welcome]);
    setFlowState(null);
    setFailCount(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setShowAuto(false);
  };

  /* ── Page context hint shown at top of chat when on a known page ── */
  const pageHint = PAGE_CONTEXT[pathname]?.hint;

  return (
    <>
      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            maxHeight: minimized ? 'auto' : 'min(75vh, 640px)',
            border: '1px solid rgba(108,99,255,0.18)',
            background: '#fff',
            animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow-inner">C</div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#4740CC]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">CREWUP Assistant</p>
                <p className="text-white/55 text-[11px]">
                  {flowState ? `Step ${flowState.step + 1} of ${FLOWS[flowState.key].steps.length}` : 'Answers instantly · Ctrl+/ to toggle'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Browse toggle */}
              <button onClick={() => { setView(view === 'browse' ? 'chat' : 'browse'); setMinimized(false); }} title="Browse topics"
                className={`p-1.5 rounded-lg transition-colors ${view === 'browse' ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white hover:bg-white/15'}`}>
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
              {/* Minimize */}
              <button onClick={() => setMinimized((v) => !v)} title={minimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {minimized
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />}
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

          {/* Rest is hidden when minimized */}
          {!minimized && (
            <>
              {/* Category tabs */}
              <div className="flex gap-1 px-3 py-2 bg-[#fafaf9] border-b border-[#efefed] overflow-x-auto scrollbar-hide flex-shrink-0">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id}
                    onClick={() => { setBrowseCategory(cat.id); setView('browse'); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      view === 'browse' && browseCategory === cat.id
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-white border border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/30 hover:text-[#4740CC]'
                    }`}>
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>

              {/* Page context banner */}
              {pageHint && view === 'chat' && (
                <div className="mx-3 mt-2 px-3 py-2 bg-[#f0eeff] border border-[#6C63FF]/15 rounded-xl flex items-start gap-2 flex-shrink-0">
                  <span className="text-sm mt-0.5 flex-shrink-0">📍</span>
                  <p className="text-[11px] text-[#4740CC] leading-relaxed">{pageHint}</p>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto bg-[#f7f7f6]" style={{ minHeight: 0 }}>
                {view === 'browse' ? (
                  <div className="px-3 py-3"><BrowseView category={browseCategory} onAsk={handleSend} /></div>
                ) : (
                  <div className="px-4 py-4">
                    {messages.map((msg) => <Bubble key={msg.id} msg={msg} onAction={handleAction} />)}
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

              {/* Input */}
              <div className="px-3 py-3 bg-white border-t border-[#efefed] flex-shrink-0">
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input ref={inputRef} value={input}
                      onChange={(e) => { setInput(e.target.value); setShowAuto(true); }}
                      onKeyDown={handleKey}
                      onFocus={() => setShowAuto(true)}
                      onBlur={() => setTimeout(() => setShowAuto(false), 150)}
                      placeholder={flowState ? 'Reply to continue the walkthrough…' : 'Ask me anything…'}
                      maxLength={300}
                      className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-4 py-2.5 text-sm text-[#111110] placeholder:text-[#b0b0ab] focus:outline-none focus:border-[#6C63FF] focus:bg-white transition-all"
                    />
                    {showAuto && <Autocomplete query={input} onSelect={(q) => { setInput(q); handleSend(q); }} />}
                  </div>
                  <button onClick={() => handleSend()} disabled={!input.trim() || typing}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#4740CC] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-35 transition-all flex-shrink-0 shadow-sm"
                    aria-label="Send">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-[#c0c0bb] text-center mt-1.5">
                  {input.length > 0 ? `${input.length}/300 · Enter to send` : 'Ctrl+/ to open · Enter to send'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating trigger ── */}
      <button
        onClick={() => { setOpen((v) => !v); setMinimized(false); }}
        aria-label={open ? 'Close chat' : 'Open chat (Ctrl+/)'}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
      >
        {open
          ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          : <>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {hasUnread && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />}
            </>
        }
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </>
  );
}
