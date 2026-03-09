'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const LAUNCH_DATE = new Date('2026-03-27T00:00:00');

const PROBLEMS = [
  {
    icon: '😔',
    title: 'No place to find your crew',
    desc: 'Talented filmmakers, editors, actors, and writers exist everywhere — but there\'s no dedicated space in India to bring them together for a project.',
  },
  {
    icon: '📱',
    title: 'Scattered across DMs & WhatsApp groups',
    desc: 'Casting calls happen in random Instagram stories. Crew requests get buried in Facebook groups. There\'s no organized, professional home for indie filmmakers.',
  },
  {
    icon: '🚫',
    title: 'Your finished film goes nowhere',
    desc: 'You spent months making something — and then it just sits on a hard drive. There\'s no community platform built specifically for indie films to get discovered.',
  },
];

const SOLUTIONS = [
  {
    icon: '🎬',
    title: 'One platform for your entire film journey',
    desc: 'Post your project, list the roles you need, and instantly connect with verified creators — from director to sound designer.',
  },
  {
    icon: '🏆',
    title: 'Contests that get you noticed',
    desc: 'Enter curated film contests, earn community votes, and get your work featured on the platform\'s front page.',
  },
  {
    icon: '🎞',
    title: 'A real audience for your films',
    desc: 'Release your finished work to the CREWUPFILMS community. Get genuine likes, comments, and feedback from people who care about independent cinema.',
  },
  {
    icon: '🧑‍🏫',
    title: 'Mentorship from real creators',
    desc: 'Learn directly from experienced filmmakers who\'ve been there. One-on-one guidance — free or paid, on your terms.',
  },
  {
    icon: '💬',
    title: 'Built-in tools to collaborate',
    desc: 'Project chat, task boards, file sharing, and team messaging — everything your crew needs, without switching between ten apps.',
  },
  {
    icon: '🌐',
    title: 'Discover & grow your network',
    desc: 'Follow filmmakers, build your profile portfolio, and become part of a growing community of independent creators across India.',
  },
];

function useCountdown(targetDate) {
  const calc = () => {
    const diff = targetDate - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done:    false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function WaitlistPage() {
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [status, setStatus]     = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount]       = useState(null);
  const countdown               = useCountdown(LAUNCH_DATE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);
      let res;
      try {
        res = await fetch(`${API_URL}/launch-waitlist`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email.trim(), name: name.trim() }),
          signal:  controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { setStatus('success'); return; }
        throw new Error(data.message || 'Something went wrong');
      }
      setCount(data.position || null);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('Request timed out. Please check your connection and try again.');
      } else if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
        setErrorMsg('Network error. Please check your connection and try again.');
      } else {
        setErrorMsg(err.message || 'Could not join waitlist. Please try again.');
      }
      setStatus('error');
    }
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#0a0a09] text-white overflow-x-hidden">

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Colour blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#6C63FF]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-[#a09aff]/6 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 pt-7 pb-4">
        <span className="text-xl font-black tracking-tight text-white">
          CREWUP<span style={{ color: '#6C63FF' }}>FILMS</span>
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#6C63FF] border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
          Launching 27 March 2026
        </span>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">

        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#a09aff] border border-[#6C63FF]/25 bg-[#6C63FF]/8 px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
          Private Beta — Join the Waitlist
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl text-white leading-[1.05] tracking-tight mb-6">
          Where Filmmakers<br />
          <span style={{
            background: 'linear-gradient(135deg, #a09aff 0%, #6C63FF 50%, #c9c4ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Find Their Crew
          </span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
          India's first dedicated platform for independent filmmakers to build teams,
          showcase work, and collaborate — from idea to release.
        </p>

        {/* ── Countdown ── */}
        {!countdown.done && (
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-10">
            {[
              { label: 'Days',    val: countdown.days },
              { label: 'Hours',   val: pad(countdown.hours) },
              { label: 'Minutes', val: pad(countdown.minutes) },
              { label: 'Seconds', val: pad(countdown.seconds) },
            ].map(({ label, val }, i) => (
              <div key={label} className="flex items-center gap-3 sm:gap-5">
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-black text-white tabular-nums"
                    style={{ fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mt-1">{label}</span>
                </div>
                {i < 3 && <span className="text-2xl font-black text-white/20 -mt-4">:</span>}
              </div>
            ))}
          </div>
        )}
        {countdown.done && (
          <div className="inline-flex items-center gap-2 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full mb-10">
            🚀 We're live! Welcome to CREWUPFILMS.
          </div>
        )}

        {/* ── Email form ── */}
        {status === 'success' ? (
          <div className="max-w-md mx-auto bg-[#111110] border border-[#6C63FF]/30 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              We'll email you on <strong className="text-[#a09aff]">March 27th</strong> when CREWUPFILMS goes live.
              {count && (
                <span className="block mt-2 text-[#a09aff] font-semibold">You're #{count} in line 🙌</span>
              )}
            </p>
            <p className="text-xs text-white/25 mt-5">Know a filmmaker? Share this page with them.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Your name (optional)" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#6C63FF]/60 transition-colors" />
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#6C63FF]/60 transition-colors" />
                <button type="submit" disabled={status === 'loading' || !email.trim()}
                  className="flex-shrink-0 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7C75FF, #6C63FF)' }}>
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Joining…
                    </span>
                  ) : 'Notify Me →'}
                </button>
              </div>
            </div>
            {status === 'error' && <p className="text-xs text-red-400 mt-2 text-left">{errorMsg}</p>}
            <p className="text-xs text-white/20 mt-3">No spam. One email on launch day. 🤝</p>
          </form>
        )}
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-red-400/70 mb-3 block">The Problem</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Making films in India is harder<br className="hidden sm:block" />
            <span className="text-white/40"> than it should be</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROBLEMS.map((p) => (
            <div key={p.title}
              className="bg-white/[0.02] border border-red-500/10 rounded-2xl p-6 hover:border-red-500/20 transition-all duration-300">
              <span className="text-3xl mb-4 block">{p.icon}</span>
              <h3 className="font-bold text-sm text-white mb-2">{p.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE SOLUTION ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-8 pb-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#a09aff]/70 mb-3 block">The Solution</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Everything a filmmaker needs,<br className="hidden sm:block" />
            <span style={{
              background: 'linear-gradient(135deg, #a09aff 0%, #6C63FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}> in one place</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SOLUTIONS.map((s) => (
            <div key={s.title}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-[#6C63FF]/30 hover:bg-[#6C63FF]/5 transition-all duration-300">
              <span className="text-2xl mb-3 block">{s.icon}</span>
              <h3 className="font-bold text-sm text-white mb-1.5">{s.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Short Film Contest Banner ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
        <div className="rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1510 0%, #120f08 100%)', border: '1px solid rgba(251,191,36,0.2)' }}>
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Trophy */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
              🏆
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
                  style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  Also Launching March 27
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5">
                Inaugural Short Film Contest
              </h2>
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                To celebrate our launch, we're kicking off our very first Short Film Contest.
                Submit your short film, earn community votes, and win cash prizes (INR). Open to all independent creators.
              </p>
              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                {['🎬 Short Films', '💰 Cash Prizes (INR)', '🗳 Community Voting', '🇮🇳 Open to All'].map((pill) => (
                  <span key={pill} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                Details on Launch Day →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Launch CTA banner ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1836 0%, #111028 100%)', border: '1px solid rgba(108,99,255,0.25)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.15) 0%, transparent 70%)' }} />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-[#a09aff]/60 mb-4">Mark your calendar</p>
          <p className="relative text-4xl sm:text-5xl font-black text-white mb-2">March 27, 2026</p>
          <p className="relative text-white/40 text-sm mb-8">CREWUPFILMS launches publicly for all independent creators in India.</p>
          {status !== 'success' ? (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#6C63FF]/60 transition-colors" />
              <button type="submit" disabled={status === 'loading' || !email.trim()}
                className="flex-shrink-0 px-5 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7C75FF, #6C63FF)' }}>
                {status === 'loading' ? '…' : 'Get Notified'}
              </button>
            </form>
          ) : (
            <p className="text-[#a09aff] font-semibold text-sm">✅ You're on the list — see you on March 27th!</p>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 text-center">
        <p className="font-black text-white/8 select-none mb-3"
          style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)', letterSpacing: '-0.03em' }}>
          CREWUPFILMS
        </p>
        <p className="text-xs text-white/20">Made with ♥ for independent creators · Launching March 27, 2026</p>
      </footer>

    </div>
  );
}
