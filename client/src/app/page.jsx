'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/ui/Logo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { projectAPI, adminAPI } from '@/lib/api';

const TICKER_ROLES = [
  'Director', 'Cinematographer', 'Editor', 'Musician',
  'Actor', 'Photographer', 'Writer', 'Producer',
  'Sound Designer', 'Colorist', 'VFX Artist', 'Costume Designer',
];

const DISCIPLINES = [
  { number: '01', role: 'Director',        tagline: 'Lead your vision' },
  { number: '02', role: 'Cinematographer', tagline: 'Capture the moment' },
  { number: '03', role: 'Editor',          tagline: 'Shape the narrative' },
  { number: '04', role: 'Musician',        tagline: 'Create the score' },
  { number: '05', role: 'Actor',           tagline: 'Bring characters alive' },
  { number: '06', role: 'Photographer',    tagline: 'Frame the story' },
  { number: '07', role: 'Writer',          tagline: 'Script the moment' },
  { number: '08', role: 'Producer',        tagline: 'Orchestrate creation' },
];

const HOW_IT_WORKS = [
  { number: '01', title: 'Create Your Profile', description: 'Set up your profile, showcase your skills, portfolio, and let creators discover you.' },
  { number: '02', title: 'Post or Discover Projects', description: 'Share your project ideas or browse exciting opportunities in your discipline.' },
  { number: '03', title: 'Apply and Collaborate', description: 'Connect with creators, build your team, and bring ambitious ideas to life.' },
];

const FEATURES = [
  { icon: '🎯', title: 'Role-Based Matching',     description: 'Smart algorithms connect you with creators in your discipline and skill set.' },
  { icon: '💬', title: 'Real-Time Messaging',     description: 'Collaborate seamlessly with integrated DMs, team chat, and file sharing.' },
  { icon: '✦',  title: 'Smart Recommendations',  description: 'Discover projects and team members tailored precisely to your skills.' },
  { icon: '📋', title: 'Production Timeline',     description: 'Track your project from planning through to release with built-in stages.' },
  { icon: '⭐', title: 'Peer Reviews',            description: 'Build your reputation with verified ratings from real collaborators.' },
  { icon: '🗺️', title: 'Creator Map',             description: 'Find local collaborators in your city or go fully remote worldwide.' },
];

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(diff / 864e5);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// Helper — split a string into word-reveal spans
function WordReveal({ text, baseDelay = 0, wordStyle = {} }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="word-clip-wrap">
          <span
            className="word-reveal"
            style={{ animationDelay: `${baseDelay + i * 0.1}s`, ...wordStyle }}
          >
            {word}
          </span>
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  useScrollAnimation();

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [trendingFilms, setTrendingFilms] = useState([]);

  // Cursor spotlight state
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const heroRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x, y });
  }, []);

  useEffect(() => {
    adminAPI.getTrending().then(({ data }) => setTrendingFilms(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    projectAPI.getAll({ limit: 3, sort: '-createdAt' })
      .then((res) => {
        const raw = res.data?.data ?? res.data?.projects ?? [];
        setProjects(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  return (
    <>
    <main className="bg-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[92vh] flex flex-col justify-center bg-[#0e0e0d] overflow-hidden"
      >
        {/* Letterbox bars — slide away on load */}
        <div className="letterbox-bar-top" />
        <div className="letterbox-bar-bottom" />

        {/* Background Image with Ken Burns */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-bg-kenburns"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80")'
            }}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Vignette — darkens edges like a film lens */}
          <div className="absolute inset-0 hero-vignette" />
        </div>

        {/* Animated film grain */}
        <div className="film-grain-anim" />

        {/* Horizontal scan line */}
        <div className="hero-scanline" />

        {/* Cursor spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle 480px at ${cursor.x}% ${cursor.y}%, rgba(108,99,255,0.07) 0%, transparent 70%)`,
            transition: 'background 0.1s ease',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center" style={{ zIndex: 10 }}>
          {/* Badge */}
          <div
            className="cinematic-fade inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10"
            style={{ animationDelay: '0.8s' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b82ff] animate-pulse" />
            Independent Creator Platform
          </div>

          {/* Heading — word-by-word reveal */}
          <h1 className="font-[Playfair_Display] text-5xl md:text-7xl lg:text-8xl text-white leading-[1.15] tracking-[-0.02em] mb-8">
            <span className="block">
              <WordReveal text="Where Creators" baseDelay={0.9} />
            </span>
            <span className="block">
              <WordReveal
                text="Find Their Team."
                baseDelay={1.2}
                wordStyle={{
                  background: 'linear-gradient(135deg, #6055de, #8b82ff, #a5b4fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="cinematic-fade text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
            style={{ animationDelay: '1.55s' }}
          >
            CREWUPFILMS connects directors, musicians, editors, photographers and storytellers
            to build projects they couldn't make alone.
          </p>

          {/* CTAs */}
          <div
            className="cinematic-fade flex flex-col sm:flex-row gap-4 justify-center mb-20"
            style={{ animationDelay: '1.75s' }}
          >
            <Link href={user ? '/create-project' : '/signup'}
              className="inline-flex items-center justify-center gap-2 bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#6055de]/25 hover:shadow-[#6055de]/40 active:scale-[0.98]">
              {user ? 'Post a Project' : 'Start a Project'} →
            </Link>
            <Link href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:border-white/50 hover:text-white text-sm font-semibold px-8 py-4 rounded-xl transition-all duration-200">
              Explore Projects
            </Link>
          </div>

          {/* Role pills */}
          <div
            className="cinematic-fade flex justify-center flex-wrap gap-2"
            style={{ animationDelay: '2s' }}
          >
            {['Director', 'Editor', 'Musician', 'Photographer', 'Actor', 'Writer', 'Producer'].map((role) => (
              <span key={role}
                className="text-xs text-white/40 px-4 py-1.5 border border-white/10 rounded-full hover:border-white/25 hover:text-white/60 transition-all cursor-default">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0e0e0d] py-4 overflow-hidden select-none border-t border-white/5">
        <div className="marquee-track flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {TICKER_ROLES.map((role) => (
                <span key={role} className="flex items-center">
                  <span className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase px-8 whitespace-nowrap">
                    {role}
                  </span>
                  <span className="text-[#6055de]/60 text-sm">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ── WHAT IS CREWUPFILMS ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-5">What is CREWUPFILMS</p>
              <h2 data-scroll data-delay="1"
                className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d] leading-[1.1] mb-6">
                A platform built for independent creators.
              </h2>
              <p data-scroll data-delay="2"
                className="text-[#6b6b66] text-lg leading-relaxed mb-8">
                From short films to music videos, photo series to podcasts — CREWUPFILMS is where ambitious creators find the collaborators they need to bring ideas to life.
              </p>
              <div data-scroll data-delay="3" className="flex gap-4">
                <Link href="/projects" className="btn-primary">Browse Projects</Link>
                <Link href="/explore" className="btn-outline">Find Creators</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎬', label: 'Post your project',  desc: 'Describe your vision and roles needed.' },
                { icon: '🤝', label: 'Find your people',   desc: 'Browse creators by discipline and skill.' },
                { icon: '🚀', label: 'Create together',    desc: 'Collaborate with messaging, schedules, and more.' },
                { icon: '⭐', label: 'Build reputation',   desc: 'Earn verified reviews from real collaborators.' },
              ].map((item, idx) => (
                <div key={idx} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <p className="text-2xl mb-3">{item.icon}</p>
                  <p className="text-sm font-bold text-[#0e0e0d] mb-1">{item.label}</p>
                  <p className="text-xs text-[#6b6b66] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#fafaf9] border-y border-[#efefed]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">The Process</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={idx}
                className="relative bg-white border border-[#efefed] rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <p className="font-[Playfair_Display] text-6xl text-[#efefed] leading-none mb-6 select-none">{item.number}</p>
                <h3 className="text-lg font-bold text-[#0e0e0d] mb-3">{item.title}</h3>
                <p className="text-sm text-[#6b6b66] leading-relaxed">{item.description}</p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-[#e0e0dd] text-xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE PROJECTS ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Live on CREWUPFILMS</p>
              <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
                Latest from the community
              </h2>
            </div>
            <Link href="/projects" data-scroll data-delay="2"
              className="btn-outline flex-shrink-0 self-end">
              View all →
            </Link>
          </div>

          {projectsLoading && (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white border border-[#efefed] rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 skeleton rounded-full w-24" />
                      <div className="h-2 skeleton rounded-full w-16" />
                    </div>
                  </div>
                  <div className="h-5 skeleton rounded-full w-3/4 mb-3" />
                  <div className="h-3 skeleton rounded-full w-full mb-2" />
                  <div className="h-3 skeleton rounded-full w-2/3 mb-6" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 skeleton rounded-full" />
                    <div className="h-6 w-16 skeleton rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!projectsLoading && projects.length === 0 && (
            <div className="border-2 border-dashed border-[#e0e0dd] rounded-2xl px-8 py-24 text-center">
              <p className="text-5xl mb-6">🎬</p>
              <h3 className="font-[Playfair_Display] text-2xl text-[#0e0e0d] mb-3">Be the first to post.</h3>
              <p className="text-sm text-[#6b6b66] max-w-md mx-auto leading-relaxed mb-10">
                Every iconic collaboration started with someone brave enough to share a single idea.
              </p>
              <Link href={user ? '/create-project' : '/signup'} className="btn-primary">
                {user ? 'Post a Project' : 'Join Free & Post a Project'}
              </Link>
            </div>
          )}

          {!projectsLoading && projects.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {projects.map((project) => {
                const initials = (project.createdBy?.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                return (
                  <Link key={project._id} href={`/projects/${project._id}`}
                    className="group bg-white border border-[#efefed] rounded-2xl p-6 hover:border-[#d0d0cc] hover:-translate-y-1 transition-all duration-300 block"
                    style={{ boxShadow: 'var(--shadow-xs)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-xs)'}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d0d0cc] to-[#e8e8e5] flex items-center justify-center text-xs font-bold text-[#0e0e0d]">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0e0e0d] truncate">{project.createdBy?.name || 'Anonymous'}</p>
                        <p className="text-xs text-[#a3a39e]">{project.createdBy?.role} · {timeAgo(project.createdAt)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${project.isPaid ? 'bg-[#0e0e0d] text-white' : 'bg-[#f7f7f6] text-[#6b6b66]'}`}>
                        {project.isPaid ? '💰 Paid' : '🤝 Collab'}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0e0e0d] text-base mb-2 group-hover:underline line-clamp-1">{project.title}</h3>
                    <p className="text-sm text-[#6b6b66] mb-5 line-clamp-2 leading-relaxed">{project.description}</p>
                    {project.requiredRoles?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {project.requiredRoles.slice(0, 3).map((role, i) => (
                          <span key={i} className="chip">{role}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#0e0e0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Every Discipline</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-white">
              Who It&apos;s For
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DISCIPLINES.map((item, idx) => (
              <div key={idx}
                className="group border border-white/10 rounded-xl p-6 text-center hover:border-[#6055de]/40 hover:bg-white/5 transition-all duration-300 cursor-default">
                <p className="font-[Playfair_Display] text-4xl text-white/10 leading-none mb-4 group-hover:text-[#6055de]/30 transition-colors">
                  {item.number}
                </p>
                <h3 className="text-sm font-bold text-white/80 mb-1.5 group-hover:text-white transition-colors">{item.role}</h3>
                <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">{item.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#fafaf9] border-y border-[#efefed]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Built for Creators</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
              Everything You Need
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <div key={idx}
                className="bg-white border border-[#efefed] rounded-2xl p-7 hover:border-[#d0d0cc] hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: 'var(--shadow-xs)' }}>
                <div className="w-10 h-10 rounded-xl bg-[#f7f7f6] border border-[#e0e0dd] flex items-center justify-center text-xl mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-[#0e0e0d] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6b6b66] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFETY SECTION ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#0e0e0d] relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-[#6055de]/5 blur-[120px] pointer-events-none -translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#8b82ff] font-bold mb-4">Trust &amp; Safety</p>
              <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-white leading-tight">
                A Safe Space for<br />
                <span className="text-[#8b82ff]">Creative Collaboration.</span>
              </h2>
            </div>
            <Link
              href="/safety"
              data-scroll data-delay="2"
              className="flex-shrink-0 inline-flex items-center gap-2 border border-white/20 text-white/70 hover:border-[#8b82ff]/60 hover:text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all self-start md:self-end"
            >
              Read Full Safety Guide →
            </Link>
          </div>

          {/* Warning pill */}
          <div data-scroll className="inline-flex items-center gap-3 bg-red-500/15 border border-red-400/30 rounded-full px-5 py-2.5 mb-12">
            <span className="text-red-400 text-sm">⚠️</span>
            <p className="text-sm font-semibold text-red-300">
              Legitimate productions <strong className="text-red-200">never</strong> ask you to pay. Any fee request is a scam.
            </p>
          </div>

          {/* Safety feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {[
              {
                icon: '🚨',
                title: 'Fraud Risk Detection',
                desc: 'Every project is automatically scanned for fraud signals. High-risk listings are flagged and reviewed by our team.',
              },
              {
                icon: '🚫',
                title: 'Contact Info Filtering',
                desc: 'Phone numbers and emails are automatically removed from messages. All communication stays safely on-platform.',
              },
              {
                icon: '⚠️',
                title: 'Scam Detection',
                desc: 'Messages containing payment requests or suspicious keywords are flagged in real time and reviewed by our moderation team.',
              },
              {
                icon: '🔒',
                title: 'Minor Account Protection',
                desc: 'Accounts under 18 are automatically protected — unverified adults cannot initiate contact with minors.',
              },
              {
                icon: '✅',
                title: 'Verified Creator Badge',
                desc: 'Top creators earn a Verified badge through identity checks, giving you confidence when joining paid projects.',
              },
              {
                icon: '⚑',
                title: 'One-Tap Reporting',
                desc: 'Report any profile, project, or message in one tap. Your identity is kept confidential and all reports are reviewed.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                data-scroll
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#8b82ff]/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Do / Don't quick reference */}
          <div data-scroll className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-10">
            <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2">
              ⚡ Quick Reference
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-4">✅ Always Do</p>
                <ul className="flex flex-col gap-3">
                  {[
                    'Verify your email to unlock full platform access',
                    'Meet in public for first in-person meetings',
                    'Use built-in messages for all communication',
                    'Check for a Verified badge on paid projects',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-sm text-white/60 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-4">❌ Never Do</p>
                <ul className="flex flex-col gap-3">
                  {[
                    'Pay any fee to audition, apply, or join a project',
                    'Move conversations to WhatsApp or email early on',
                    'Share personal contact info before building trust',
                    'Send money via crypto, wire transfer, or UPI to strangers',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-sm text-white/60 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div data-scroll className="text-center">
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#6055de]/25 hover:shadow-[#6055de]/40"
            >
              🛡 Read the Full Safety Guide →
            </Link>
            <p className="text-white/30 text-xs mt-4">
              Includes emergency contacts, scam prevention tips, and minor protection guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* ── TRENDING FILMS THIS WEEK ──────────────────────────────────────── */}
      {trendingFilms.length > 0 && (
        <section className="py-24 px-6 bg-white border-y border-[#efefed]">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-3">Films Made on CrewUpFilms</p>
                <h2 className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
                  Trending This Week
                </h2>
              </div>
              <Link href="/films"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b6b66] hover:text-[#111110] transition-colors border border-[#e0e0dd] hover:border-[#0e0e0d] px-4 py-2 rounded-xl">
                View all films →
              </Link>
            </div>

            {/* Film cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {trendingFilms.map((film, idx) => (
                <a
                  key={film._id}
                  href={film.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white rounded-2xl overflow-hidden border border-[#efefed] hover:border-[#b0a9ff] hover:shadow-[0_8px_32px_rgba(108,99,255,0.12)] transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-[#f7f7f6] overflow-hidden">
                    {film.thumbnail ? (
                      <img
                        src={film.thumbnail}
                        alt={film.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-[#d0d0cc]">🎬</div>
                    )}

                    {/* Rank badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm ${
                        idx === 0 ? 'bg-[#6055de]' : idx === 1 ? 'bg-[#8b84ff]' : 'bg-[#0e0e0d]/70'
                      }`}>
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                        <span className="text-[#6055de] text-base ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#111110] truncate mb-1 group-hover:text-[#6055de] transition-colors">
                      {film.title}
                    </p>
                    <p className="text-xs text-[#6b6b66] truncate mb-3">by {film.director?.name || 'Unknown'}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#6055de] px-2.5 py-1 rounded-lg">
                        ▶ Watch
                      </span>
                      <div className="flex items-center gap-2 text-[#a3a39e] text-[11px]">
                        {film.likeCount > 0 && <span>♥ {film.likeCount}</span>}
                        {film.commentCount > 0 && <span>💬 {film.commentCount}</span>}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Mobile view all */}
            <div className="flex justify-center mt-8 sm:hidden">
              <Link href="/films"
                className="text-sm font-semibold text-[#6b6b66] hover:text-[#111110] transition-colors border border-[#e0e0dd] hover:border-[#0e0e0d] px-5 py-2.5 rounded-xl">
                View all films →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 bg-[#0e0e0d] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#6055de]/5 blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 data-scroll className="font-[Playfair_Display] text-5xl md:text-6xl text-white mb-6 leading-tight">
            Ready to find<br /><em className="not-italic text-[#8b82ff]">your crew?</em>
          </h2>
          <p data-scroll data-delay="1" className="text-lg text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
            Join creators already building something remarkable on CREWUPFILMS.
          </p>
          <div data-scroll data-delay="2" className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? '/dashboard' : '/signup'}
              className="inline-flex items-center justify-center gap-2 bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#6055de]/25">
              {user ? 'Go to Dashboard' : 'Get Started — It\'s Free'} →
            </Link>
            <Link href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:border-white/50 hover:text-white text-sm font-semibold px-10 py-4 rounded-xl transition-all duration-200">
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

    </main>
    <Footer />
    </>
  );
}
