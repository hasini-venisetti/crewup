'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

/* ── FAQ knowledge base ─────────────────────────────────────────────────────
   Each entry has: keywords[], question (shown as suggestion chip), answer (JSX or string)
   The matcher scores by counting keyword hits — highest score wins.
──────────────────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    id: 'what-is',
    keywords: ['what', 'crewup', 'about', 'platform', 'is this', 'explain'],
    question: 'What is CREWUPFILMS?',
    answer: 'CREWUPFILMS is a platform where independent film creators find their crew. Directors, editors, cinematographers, actors, musicians and more can connect, collaborate on projects, and build their portfolio together — whether paid or unpaid.',
  },
  {
    id: 'how-apply',
    keywords: ['apply', 'application', 'join', 'project', 'how to apply', 'submit'],
    question: 'How do I apply to a project?',
    answer: 'Browse projects on the Projects page, open one that interests you, and click Apply. Choose the role you want, write a short message about why you\'re a great fit, and submit. The project owner will review and accept or decline.',
  },
  {
    id: 'post-project',
    keywords: ['post', 'create', 'publish', 'listing', 'how to post', 'new project'],
    question: 'How do I post a project?',
    answer: 'Click "+ Post Project" in the navigation bar. Fill in your project title, type, required roles, location, compensation details, and safety fields. You can publish immediately or save as a draft to finish later.',
  },
  {
    id: 'draft',
    keywords: ['draft', 'save', 'unpublished', 'not live'],
    question: 'What are draft projects?',
    answer: 'You can save a project as a draft while you\'re still filling in the details. Drafts are only visible to you. When you\'re ready, go to your Dashboard and click "Publish" on the draft to make it live.',
  },
  {
    id: 'paid',
    keywords: ['paid', 'payment', 'compensation', 'money', 'free', 'collab', 'unpaid'],
    question: 'Are projects paid or unpaid?',
    answer: 'Both! Projects can be paid (fixed rate, revenue share, or deferred), unpaid collaboration, or "not specified yet". Paid projects must include clear compensation details — you\'ll see an amber dot on paid project cards.',
  },
  {
    id: 'roles',
    keywords: ['role', 'roles', 'director', 'editor', 'actor', 'cinematographer', 'musician', 'writer'],
    question: 'What roles can I apply for?',
    answer: 'Common roles include Director, Cinematographer, Editor, Actor, Musician, Writer, Producer, Sound Designer, Colorist, VFX Artist, Animator, Scriptwriter, Production Designer, Costume Designer, and Makeup Artist — plus custom roles set by creators.',
  },
  {
    id: 'verification',
    keywords: ['verify', 'verification', 'email', 'phone', 'verified', 'confirm'],
    question: 'Why do I need to verify my account?',
    answer: 'Email, phone, and age verification are required before posting a project. This keeps the community safe and reduces fake listings. Go to Settings to complete your verifications.',
  },
  {
    id: 'safety',
    keywords: ['safe', 'safety', 'scam', 'fraud', 'trust', 'report', 'fake', 'suspicious'],
    question: 'How does CREWUPFILMS keep me safe?',
    answer: 'We have several protections: risk scoring on new projects, audition format transparency (online/studio only — no private residences), spam cooldown on comments, a report system, and admin moderation. Read our full Safety Guide for tips on safe collaboration.',
    link: { label: 'View Safety Guide →', href: '/safety' },
  },
  {
    id: 'report',
    keywords: ['report', 'abuse', 'harassment', 'inappropriate', 'problem', 'issue', 'flag'],
    question: 'How do I report a problem?',
    answer: 'On any project or profile page you\'ll find a "Report" link at the bottom. You can also go to Support → Report an Issue. Our admin team reviews all reports and takes action within 48 hours.',
    link: { label: 'Report an Issue →', href: '/support/report' },
  },
  {
    id: 'profile',
    keywords: ['profile', 'portfolio', 'bio', 'edit', 'skills', 'experience'],
    question: 'How do I set up my profile?',
    answer: 'Go to Profile → Edit Profile. Add your bio, skills (up to 20), experience level, location, social links, and portfolio items (videos, images, links, certificates). A complete profile gets more applications accepted.',
    link: { label: 'Edit Profile →', href: '/profile/edit' },
  },
  {
    id: 'status-update',
    keywords: ['update', 'status', 'notify', 'announcement', 'casting closed', 'filming'],
    question: 'How do I post a project update?',
    answer: 'Open your project page and scroll to the "📢 Project Updates" section. Type your message (e.g. "Casting is now closed, filming starts next week") and click Post Update. All pending applicants and team members get notified automatically.',
  },
  {
    id: 'similar',
    keywords: ['similar', 'more projects', 'related', 'discover', 'explore'],
    question: 'How do I find similar projects?',
    answer: 'At the bottom of every project detail page you\'ll see a "Similar Projects" section with 3 related projects of the same type. You can also use the Explore page or filter by role/category on the Projects page.',
    link: { label: 'Browse Projects →', href: '/projects' },
  },
  {
    id: 'application-status',
    keywords: ['accepted', 'rejected', 'declined', 'pending', 'status', 'heard back', 'response'],
    question: 'How do I check my application status?',
    answer: 'Go to Dashboard → My Applications. Each application shows its status: Pending ⏳, Accepted ✅, or Declined ❌. If a creator declines with a note, you\'ll see it in your notification and the application card.',
  },
  {
    id: 'team',
    keywords: ['team', 'members', 'chat', 'group', 'collaborate', 'accepted'],
    question: 'What happens after my application is accepted?',
    answer: 'Once accepted, you\'re added to the project team. You\'ll get access to the team chat, team page, and shared files. The project will also appear in your portfolio once the creator releases the finished film.',
  },
  {
    id: 'cost',
    keywords: ['cost', 'price', 'free', 'subscription', 'plan', 'pricing', 'pay to use'],
    question: 'Is CREWUPFILMS free to use?',
    answer: 'Yes! CREWUPFILMS is currently free for all creators during our early access period. All features — posting projects, applying, messaging, and portfolio building — are included at no cost.',
    link: { label: 'View Pricing →', href: '/pricing' },
  },
  {
    id: 'films',
    keywords: ['film', 'films', 'watch', 'released', 'youtube', 'finished', 'showcase'],
    question: 'Where can I watch completed films?',
    answer: 'Visit the Films page to browse all released projects. Once a creator links a YouTube video to their project, it appears in the Films section and on every team member\'s profile automatically.',
    link: { label: 'Browse Films →', href: '/films' },
  },
  {
    id: 'contest',
    keywords: ['contest', 'competition', 'win', 'prize', 'submit', 'vote'],
    question: 'How do contests work?',
    answer: 'Contests are themed film competitions with prizes. Submit an eligible released project during the submission window. The community can like and vote on entries. Winners are announced when the contest ends.',
    link: { label: 'View Contests →', href: '/contests' },
  },
  {
    id: 'mentor',
    keywords: ['mentor', 'mentorship', 'guide', 'learn', 'coach'],
    question: 'How does mentorship work?',
    answer: 'Experienced creators can enable mentor mode on their profile. Browse mentors on the Mentors page and send a mentorship request. If accepted, you can connect with your mentor directly through the platform.',
    link: { label: 'Find Mentors →', href: '/mentors' },
  },
  {
    id: 'delete-account',
    keywords: ['delete', 'remove', 'account', 'deactivate', 'close account'],
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Account. You\'ll find the option to deactivate or delete your account there. If you need help, contact us at crewupfilms@gmail.com.',
    link: { label: 'Contact Support →', href: '/contact' },
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'support', 'help', 'reach', 'team'],
    question: 'How do I contact the CREWUPFILMS team?',
    answer: 'You can reach us at crewupfilms@gmail.com or use the Contact page. For platform issues, use the Support hub. We typically respond within 24–48 hours.',
    link: { label: 'Contact Us →', href: '/contact' },
  },
];

/* ── Suggested quick-start questions shown initially ── */
const SUGGESTIONS = [
  'What is CREWUPFILMS?',
  'How do I apply to a project?',
  'How do I post a project?',
  'Is CREWUPFILMS free to use?',
  'How does CREWUPFILMS keep me safe?',
];

/* ── Keyword matcher ── */
function findAnswer(query) {
  if (!query.trim()) return null;
  const q = query.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const item of FAQ) {
    const score = item.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore > 0 ? best : null;
}

/* ── Message bubble ── */
function Bubble({ msg }) {
  const isBot = msg.from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
          C
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? 'bg-white border border-[#efefed] text-[#111110] rounded-tl-sm'
            : 'bg-[#6C63FF] text-white rounded-tr-sm'
        }`}
      >
        {msg.text}
        {msg.link && (
          <Link
            href={msg.link.href}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#6C63FF] hover:underline"
          >
            {msg.link.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hey! 👋 I\'m the CREWUPFILMS assistant. Ask me anything about the platform, or pick a topic below.',
    },
  ]);
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const match = findAnswer(trimmed);
      if (match) {
        setMessages((prev) => [
          ...prev,
          { from: 'bot', text: match.answer, link: match.link || null },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            text: "I'm not sure about that one. Try rephrasing, or reach out to us directly — we're happy to help!",
            link: { label: 'Contact Support →', href: '/contact' },
          },
        ]);
      }
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Chat window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '70vh', border: '1px solid rgba(108,99,255,0.2)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">C</div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">CREWUP Assistant</p>
                <p className="text-white/60 text-[11px]">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f7f7f6]" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">C</div>
                <div className="bg-white border border-[#efefed] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips — show only when conversation is fresh */}
          {messages.length <= 1 && !typing && (
            <div className="px-4 py-2 bg-[#f7f7f6] border-t border-[#efefed] flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-[#6C63FF]/20 text-[#4740CC] hover:bg-[#6C63FF]/10 transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-[#efefed] flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              className="flex-1 bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-3 py-2 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:border-[#6C63FF] transition-colors"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl bg-[#6C63FF] text-white flex items-center justify-center hover:bg-[#5750D4] disabled:opacity-40 transition-colors flex-shrink-0"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4740CC 100%)' }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
