'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
  { number: '01', role: 'Director',        tagline: 'Lead your vision',       icon: '🎬' },
  { number: '02', role: 'Cinematographer', tagline: 'Capture the moment',     icon: '📷' },
  { number: '03', role: 'Editor',          tagline: 'Shape the narrative',    icon: '✂️' },
  { number: '04', role: 'Musician',        tagline: 'Create the score',       icon: '🎵' },
  { number: '05', role: 'Actor',           tagline: 'Bring characters alive', icon: '🎭' },
  { number: '06', role: 'Photographer',    tagline: 'Frame the story',        icon: '🖼️' },
  { number: '07', role: 'Writer',          tagline: 'Script the moment',      icon: '✍️' },
  { number: '08', role: 'Producer',        tagline: 'Orchestrate creation',   icon: '🎙' },
];

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Build Your Profile',
    description: 'Set up your creative profile, showcase your portfolio and skills, and let the right projects find you.',
    icon: '👤',
  },
  {
    number: '02',
    title: 'Post or Discover Projects',
    description: 'List your project with compensation details, audition format, and shoot location — or browse opportunities by role and category.',
    icon: '🔍',
  },
  {
    number: '03',
    title: 'Collaborate & Create',
    description: 'Apply, connect through built-in messaging, build your crew, and bring ambitious ideas to life.',
    icon: '🚀',
  },
];

const FEATURES = [
  { icon: '🎯', title: 'Role-Based Matching',       description: 'Filter projects by your exact role — Director, Actor, Editor, Musician and more — so you only see what matters.' },
  { icon: '💬', title: 'Real-Time Messaging',       description: 'Collaborate seamlessly with integrated DMs and team chat. Everything stays in one place.' },
  { icon: '💰', title: 'Compensation Transparency', description: 'Every project clearly states paid or unpaid, with compensation type and details — no surprises.' },
  { icon: '📋', title: 'Casting & Audition Info',   description: 'See audition format (in-person, self-tape, or online) and shoot location upfront before you apply.' },
  { icon: '⭐', title: 'Peer Reviews',              description: 'Build your reputation with verified ratings from real collaborators you have worked with.' },
  { icon: '🗺️', title: 'Creator Map',               description: 'Find local collaborators in your city or go fully remote worldwide with location-based search.' },
];


function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(diff / 864e5);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function WordReveal({ text, baseDelay = 0, wordStyle = {} }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="word-clip-wrap">
          <span className="word-reveal" style={{ animationDelay: `${baseDelay + i * 0.1}s`, ...wordStyle }}>
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

  const [projects,       setProjects]       = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [trendingFilms,  setTrendingFilms]  = useState([]);
  const [cursor,         setCursor]         = useState({ x: 50, y: 50 });
  const heroRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursor({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
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

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[94vh] flex flex-col justify-center bg-[#06060a] overflow-hidden"
      >
        {/* Layer 0 — Background photo (very subtle, low opacity) */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat hero-bg-photo"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")', opacity: 0 }}
        />
        {/* Dark overlay on photo */}
        <div className="absolute inset-0 z-1 bg-[#06060a]/75" />
        {/* Vignette */}
        <div className="absolute inset-0 z-1 hero-vignette" />

        {/* Layer 2 — Floating gradient orbs */}
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />
        <div className="hero-orb-3" />

        {/* Layer 3 — Cursor spotlight */}
        <div
          className="absolute inset-0 pointer-events-none z-3"
          style={{
            background: `radial-gradient(circle 500px at ${cursor.x}% ${cursor.y}%, rgba(96,85,222,0.09) 0%, transparent 65%)`,
            transition: 'background 0.08s ease',
          }}
        />

        {/* Layer 4 — Film grain */}
        <div className="film-grain-anim" />

        {/* Layer 10 — All hero content (always on top) */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center w-full">

          {/* Accent line */}
          <div className="flex justify-center mb-10">
            <span className="hero-accent-line w-24" />
          </div>

          {/* Badge */}
          <div
            className="hero-fade inline-flex items-center gap-2 border border-[#6055de]/25 bg-[#6055de]/10 text-[#a09bff] text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-10"
            style={{ animationDelay: '0.5s' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b82ff] animate-pulse" />
            Independent Creator Platform
          </div>

          {/* Heading */}
          <h1 className="font-[Playfair_Display] text-5xl md:text-7xl lg:text-[86px] text-white leading-[1.08] tracking-[-0.03em] mb-6">
            <span className="block mb-2">
              <WordReveal text="Where Creators" baseDelay={0.65} />
            </span>
            <span className="block">
              <WordReveal
                text="Find Their Team."
                baseDelay={0.9}
                wordStyle={{
                  background: 'linear-gradient(135deg, #7b6fff 0%, #a89dff 50%, #c8bfff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              />
            </span>
          </h1>

          {/* Subline */}
          <p
            className="hero-fade text-base md:text-lg text-white/40 max-w-xl mx-auto mb-12 font-light leading-relaxed"
            style={{ animationDelay: '1.4s' }}
          >
            Post projects with real compensation details, browse by role, and collaborate with
            directors, musicians, editors, and storytellers — all in one place.
          </p>

          {/* CTAs */}
          <div
            className="hero-fade flex flex-col items-center gap-3 justify-center mb-14"
            style={{ animationDelay: '1.6s' }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={user ? '/create-project' : '/signup'}
                className="inline-flex items-center justify-center gap-2 bg-[#6055de] hover:bg-[#5048cc] text-white text-sm font-bold px-8 py-3.5 rounded-xl transition-all duration-250 shadow-lg shadow-[#6055de]/30 hover:shadow-[#6055de]/50 hover:-translate-y-px active:translate-y-0"
              >
                {user ? 'Post a Project' : 'Start a Project'} →
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 border border-white/12 text-white/60 hover:border-[#6055de]/50 hover:text-white hover:bg-[#6055de]/08 text-sm font-semibold px-8 py-3.5 rounded-xl transition-all duration-250"
              >
                Browse Projects
              </Link>
            </div>
            <Link
              href="/contests"
              className="inline-flex items-center justify-center gap-2 text-[#a78bfa] hover:text-white text-xs font-semibold px-5 py-2 rounded-full border border-[#6055de]/30 hover:border-[#6055de]/70 hover:bg-[#6055de]/10 transition-all duration-250"
            >
              🏆 Join the Short Film Contest
            </Link>
          </div>

          {/* Role pills */}
          <div
            className="hero-fade flex justify-center flex-wrap gap-2"
            style={{ animationDelay: '1.85s' }}
          >
            {['Director', 'Editor', 'Musician', 'Photographer', 'Actor', 'Writer', 'Producer', 'Colorist'].map((role) => (
              <Link key={role} href={`/projects?role=${role}`}
                className="text-[11px] text-white/30 px-3.5 py-1.5 border border-white/[0.07] rounded-full hover:border-[#6055de]/40 hover:text-white/55 hover:bg-[#6055de]/08 transition-all duration-200">
                {role}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#06060a] to-transparent pointer-events-none z-10" />
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-[#06060a] py-4 overflow-hidden select-none border-t border-white/[0.06]">
        <div className="marquee-track flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {TICKER_ROLES.map((role) => (
                <span key={role} className="flex items-center">
                  <span className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase px-8 whitespace-nowrap">{role}</span>
                  <span className="text-[#6055de]/60 text-sm">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT IS CREWUPFILMS ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-5">What is CREWUPFILMS</p>
              <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d] leading-[1.1] mb-6">
                A platform built for independent creators.
              </h2>
              <p data-scroll data-delay="2" className="text-[#6b6b66] text-lg leading-relaxed mb-8">
                From short films to music videos, photo series to podcasts — CREWUPFILMS is where ambitious creators find the collaborators they need to bring ideas to life, with full transparency on compensation and project details.
              </p>
              <div data-scroll data-delay="3" className="flex gap-4">
                <Link href="/projects" className="btn-primary">Browse Projects</Link>
                <Link href="/explore" className="btn-outline">Find Creators</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎬', label: 'Post your project',      desc: 'Share your vision, compensation, audition format, and roles needed.' },
                { icon: '🔍', label: 'Filter by role',          desc: 'Browse projects matching your exact discipline — no noise.' },
                { icon: '🚀', label: 'Collaborate together',    desc: 'Message your team, track stages, and ship your creative work.' },
                { icon: '⭐', label: 'Build reputation',        desc: 'Earn verified reviews from real collaborators you have worked with.' },
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

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6 bg-[#fafaf9] border-y border-[#efefed]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">The Process</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={idx} data-scroll
                className="relative bg-white border border-[#efefed] rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] border border-[#e0dbff] flex items-center justify-center text-2xl mb-6">
                  {item.icon}
                </div>
                <p className="font-[Playfair_Display] text-5xl text-[#f0f0ee] leading-none mb-4 select-none absolute top-6 right-7">{item.number}</p>
                <h3 className="text-lg font-bold text-[#0e0e0d] mb-3">{item.title}</h3>
                <p className="text-sm text-[#6b6b66] leading-relaxed">{item.description}</p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-[#d0d0cc] text-xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE PROJECTS ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Live on CREWUPFILMS</p>
              <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
                Latest from the community
              </h2>
            </div>
            <Link href="/projects" data-scroll data-delay="2" className="btn-outline flex-shrink-0 self-end">View all →</Link>
          </div>

          {projectsLoading && (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white border border-[#efefed] rounded-2xl p-6 animate-pulse">
                  <div className="h-1.5 bg-[#e0e0dd] rounded w-full mb-5" />
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#f0f0ee]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#f0f0ee] rounded w-24" />
                      <div className="h-2 bg-[#f5f5f3] rounded w-16" />
                    </div>
                  </div>
                  <div className="h-5 bg-[#f0f0ee] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[#f5f5f3] rounded w-full mb-2" />
                  <div className="h-3 bg-[#f5f5f3] rounded w-2/3 mb-6" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-[#f0f0ee] rounded-full" />
                    <div className="h-6 w-16 bg-[#f0f0ee] rounded-full" />
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
                const compLabel = project.isPaid ? '💰 Paid' : '🤝 Collab';
                return (
                  <Link key={project._id} href={`/projects/${project._id}`}
                    className="group bg-white border border-[#efefed] rounded-2xl overflow-hidden hover:border-[#d0d0cc] hover:-translate-y-1 transition-all duration-300 block"
                    style={{ boxShadow: 'var(--shadow-xs)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-xs)'}
                  >
                    {/* Top color bar */}
                    <div className={`h-1 w-full ${project.isPaid ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gradient-to-r from-[#6055de] to-[#8b82ff]'}`} />
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d0d0cc] to-[#e8e8e5] flex items-center justify-center text-xs font-bold text-[#0e0e0d]">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0e0e0d] truncate">{project.createdBy?.name || 'Anonymous'}</p>
                          <p className="text-xs text-[#a3a39e]">{timeAgo(project.createdAt)}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${project.isPaid ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#f7f7f6] text-[#6b6b66] border border-[#e8e8e5]'}`}>
                          {compLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#0e0e0d] text-base mb-2 group-hover:text-[#6055de] transition-colors line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-[#6b6b66] mb-5 line-clamp-2 leading-relaxed">{project.description}</p>
                      {project.requiredRoles?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {project.requiredRoles.slice(0, 3).map((role, i) => (
                            <span key={i} className="chip">{role}</span>
                          ))}
                          {project.requiredRoles.length > 3 && (
                            <span className="chip text-[#a3a39e]">+{project.requiredRoles.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-28 px-6 bg-[#0e0e0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Every Discipline</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-white">
              Who It&apos;s For
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DISCIPLINES.map((item, idx) => (
              <div key={idx} data-scroll
                className="group border border-white/10 rounded-xl p-6 text-center hover:border-[#6055de]/50 hover:bg-white/5 transition-all duration-300 cursor-default">
                <p className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</p>
                <h3 className="text-sm font-bold text-white/80 mb-1 group-hover:text-white transition-colors">{item.role}</h3>
                <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">{item.tagline}</p>
              </div>
            ))}
          </div>
          <div data-scroll className="text-center mt-12">
            <Link href="/explore"
              className="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:border-[#6055de]/60 hover:text-white text-sm font-semibold px-7 py-3 rounded-xl transition-all">
              👥 Browse All Creators →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 px-6 bg-[#fafaf9] border-y border-[#efefed]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-4">Built for Creators</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">Everything You Need</h2>
            <p data-scroll data-delay="2" className="text-[#6b6b66] mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Every feature is designed around how independent creators actually work.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <div key={idx} data-scroll
                className="bg-white border border-[#efefed] rounded-2xl p-7 hover:border-[#d0d0cc] hover:-translate-y-1 transition-all duration-300 group"
                style={{ boxShadow: 'var(--shadow-xs)' }}>
                <div className="w-11 h-11 rounded-xl bg-[#f5f3ff] border border-[#e0dbff] flex items-center justify-center text-xl mb-5 group-hover:bg-[#6055de]/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-[#0e0e0d] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6b6b66] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFETY ── */}
      <section className="py-28 px-6 bg-[#0e0e0d] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-[#6055de]/5 blur-[120px] pointer-events-none -translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-[#8b82ff] font-bold mb-4">Trust &amp; Safety</p>
              <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-white leading-tight">
                A Safe Space for<br />
                <span className="text-[#8b82ff]">Creative Collaboration.</span>
              </h2>
            </div>
            <Link href="/safety" data-scroll data-delay="2"
              className="flex-shrink-0 inline-flex items-center gap-2 border border-white/20 text-white/70 hover:border-[#8b82ff]/60 hover:text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all self-start md:self-end">
              Read Full Safety Guide →
            </Link>
          </div>

          {/* Warning */}
          <div data-scroll className="inline-flex items-center gap-3 bg-red-500/15 border border-red-400/30 rounded-full px-5 py-2.5 mb-12">
            <span className="text-red-400 text-sm">⚠️</span>
            <p className="text-sm font-semibold text-red-300">
              Legitimate productions <strong className="text-red-200">never</strong> ask you to pay. Any fee request is a scam.
            </p>
          </div>

          {/* Safety cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {[
              { icon: '🚨', title: 'Fraud Risk Detection',     desc: 'Every project is automatically scanned for fraud signals. High-risk listings are flagged and reviewed by our team.' },
              { icon: '⚠️', title: 'Scam Keyword Detection',   desc: 'Messages containing payment requests or suspicious keywords are flagged in real time and reviewed by our moderation team.' },
              { icon: '🔒', title: 'Minor Account Protection', desc: 'Accounts under 18 are automatically protected — unverified adults cannot initiate contact with minors.' },
              { icon: '✅', title: 'Verified Creator Badge',   desc: 'Top creators earn a Verified badge through identity checks, giving you confidence when joining paid projects.' },
              { icon: '⏱️', title: 'Comment Spam Cooldown',    desc: 'A cooldown between comments prevents spam and keeps project discussions healthy and constructive.' },
              { icon: '⚑',  title: 'One-Tap Reporting',       desc: 'Report any profile, project, or message in one tap. Your identity is kept confidential and all reports are reviewed.' },
            ].map((item, idx) => (
              <div key={idx} data-scroll
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#8b82ff]/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl mb-4">{item.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Quick reference */}
          <div data-scroll className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-10">
            <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2">⚡ Quick Reference</h3>
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
                    'Ignore missing compensation or audition details',
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

          <div data-scroll className="text-center">
            <Link href="/safety"
              className="inline-flex items-center gap-2 bg-[#6055de] hover:bg-[#4d44c8] text-white text-sm font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#6055de]/25 hover:shadow-[#6055de]/40">
              🛡 Read the Full Safety Guide →
            </Link>
            <p className="text-white/30 text-xs mt-4">Includes scam prevention tips, red flags, and minor protection guidelines.</p>
          </div>
        </div>
      </section>

      {/* ── TRENDING FILMS ── */}
      {trendingFilms.length > 0 && (
        <section className="py-24 px-6 bg-white border-y border-[#efefed]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6055de] font-bold mb-3">Films Made on CrewUpFilms</p>
                <h2 className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">Trending This Week</h2>
              </div>
              <Link href="/films"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b6b66] hover:text-[#111110] transition-colors border border-[#e0e0dd] hover:border-[#0e0e0d] px-4 py-2 rounded-xl">
                View all films →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {trendingFilms.map((film, idx) => (
                <a key={film._id} href={film.youtubeLink} target="_blank" rel="noopener noreferrer"
                  className="group block bg-white rounded-2xl overflow-hidden border border-[#efefed] hover:border-[#b0a9ff] hover:shadow-[0_8px_32px_rgba(108,99,255,0.12)] transition-all duration-300">
                  <div className="relative aspect-video bg-[#f7f7f6] overflow-hidden">
                    {film.thumbnail ? (
                      <img src={film.thumbnail} alt={film.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-[#d0d0cc]">🎬</div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm ${idx === 0 ? 'bg-[#6055de]' : idx === 1 ? 'bg-[#8b84ff]' : 'bg-[#0e0e0d]/70'}`}>
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                        <span className="text-[#6055de] text-base ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#111110] truncate mb-1 group-hover:text-[#6055de] transition-colors">{film.title}</p>
                    <p className="text-xs text-[#6b6b66] truncate mb-3">by {film.director?.name || 'Unknown'}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#6055de] px-2.5 py-1 rounded-lg">▶ Watch</span>
                      <div className="flex items-center gap-2 text-[#a3a39e] text-[11px]">
                        {film.likeCount > 0 && <span>♥ {film.likeCount}</span>}
                        {film.commentCount > 0 && <span>💬 {film.commentCount}</span>}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="flex justify-center mt-8 sm:hidden">
              <Link href="/films" className="text-sm font-semibold text-[#6b6b66] hover:text-[#111110] transition-colors border border-[#e0e0dd] hover:border-[#0e0e0d] px-5 py-2.5 rounded-xl">
                View all films →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ── */}
      <section className="relative py-32 px-6 bg-[#0e0e0d] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
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
              {user ? 'Go to Dashboard' : "Get Started — It's Free"} →
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
