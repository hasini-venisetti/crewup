'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/ui/Logo';
import Navbar from '@/components/layout/Navbar';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { projectAPI } from '@/lib/api';

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

export default function Home() {
  const { user } = useAuth();
  useScrollAnimation();

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

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
    <main className="bg-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center bg-[#0e0e0d] overflow-hidden">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        {/* Amber glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          {/* Label */}
          <div data-scroll className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Independent Creator Platform
          </div>

          {/* Heading */}
          <h1 data-scroll data-delay="1"
            className="font-[Playfair_Display] text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05] tracking-[-0.02em] mb-8">
            Where Creators<br />
            <em className="not-italic" style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b, #fcd34d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Find Their Team.</em>
          </h1>

          {/* Subheadline */}
          <p data-scroll data-delay="2"
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            CREWUPFILMS connects directors, musicians, editors, photographers and storytellers
            to build projects they couldn't make alone.
          </p>

          {/* CTAs */}
          <div data-scroll data-delay="3" className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href={user ? '/create-project' : '/signup'}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]">
              {user ? 'Post a Project' : 'Start a Project'} →
            </Link>
            <Link href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:border-white/50 hover:text-white text-sm font-semibold px-8 py-4 rounded-xl transition-all duration-200">
              Explore Projects
            </Link>
          </div>

          {/* Role pills */}
          <div data-scroll="fade" data-delay="4"
            className="flex justify-center flex-wrap gap-2">
            {['Director', 'Editor', 'Musician', 'Photographer', 'Actor', 'Writer', 'Producer'].map((role) => (
              <span key={role}
                className="text-xs text-white/40 px-4 py-1.5 border border-white/10 rounded-full hover:border-white/25 hover:text-white/60 transition-all cursor-default">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0e0e0d] py-4 overflow-hidden select-none border-t border-white/5">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {TICKER_ROLES.map((role) => (
                <span key={role} className="flex items-center">
                  <span className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase px-8 whitespace-nowrap">
                    {role}
                  </span>
                  <span className="text-amber-500/60 text-sm">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT IS CREWUPFILMS ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-5">What is CREWUPFILMS</p>
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
            <div data-scroll="right" data-delay="1" className="grid grid-cols-2 gap-4">
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
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-4">The Process</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={idx} data-scroll data-delay={String(idx + 1)}
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
              <p data-scroll className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-4">Live on CREWUPFILMS</p>
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
              {projects.map((project, idx) => {
                const initials = (project.createdBy?.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                return (
                  <Link key={project._id} href={`/projects/${project._id}`}
                    data-scroll data-delay={String(idx + 1)}
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
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-4">Every Discipline</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-white">
              Who It's For
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DISCIPLINES.map((item, idx) => (
              <div key={idx} data-scroll data-delay={String((idx % 4) + 1)}
                className="group border border-white/10 rounded-xl p-6 text-center hover:border-amber-500/40 hover:bg-white/5 transition-all duration-300 cursor-default">
                <p className="font-[Playfair_Display] text-4xl text-white/10 leading-none mb-4 group-hover:text-amber-500/30 transition-colors">
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
            <p data-scroll className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-4">Built for Creators</p>
            <h2 data-scroll data-delay="1" className="font-[Playfair_Display] text-4xl md:text-5xl text-[#0e0e0d]">
              Everything You Need
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <div key={idx} data-scroll data-delay={String((idx % 3) + 1)}
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

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 bg-[#0e0e0d] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 data-scroll className="font-[Playfair_Display] text-5xl md:text-6xl text-white mb-6 leading-tight">
            Ready to find<br /><em className="not-italic text-amber-400">your crew?</em>
          </h2>
          <p data-scroll data-delay="1" className="text-lg text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
            Join creators already building something remarkable on CREWUPFILMS.
          </p>
          <div data-scroll data-delay="2" className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? '/dashboard' : '/signup'}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25">
              {user ? 'Go to Dashboard' : 'Get Started — It\'s Free'} →
            </Link>
            <Link href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:border-white/50 hover:text-white text-sm font-semibold px-10 py-4 rounded-xl transition-all duration-200">
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#efefed] pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-2">
                <Logo size="sm" noLink />
              </div>
              <p className="text-sm text-[#6b6b66] leading-relaxed mb-4">
                Where creators find their team.
              </p>
              <p className="text-xs text-[#a3a39e]">hello@crewup.in</p>
            </div>
            {[
              { title: 'Product', links: [
                { href: '/projects',       label: 'Explore Projects' },
                { href: '/explore',        label: 'Find Creators' },
                { href: '/create-project', label: 'Create Project' },
                { href: '/how-it-works',   label: 'How It Works' },
                { href: '/features',       label: 'Features' },
              ]},
              { title: 'Company', links: [
                { href: '/about',   label: 'About Us' },
                { href: '/mission', label: 'Our Mission' },
                { href: '/blog',    label: 'Blog' },
                { href: '/contact', label: 'Contact' },
              ]},
              { title: 'Legal', links: [
                { href: '/legal/terms',      label: 'Terms of Service' },
                { href: '/legal/privacy',    label: 'Privacy Policy' },
                { href: '/legal/guidelines', label: 'Community Guidelines' },
                { href: '/legal/cookies',    label: 'Cookie Policy' },
              ]},
              { title: 'Support', links: [
                { href: '/support',          label: 'Help Center' },
                { href: '/support/report',   label: 'Report Issue' },
                { href: '/support/safety',   label: 'Safety & Trust' },
                { href: '/support/feedback', label: 'Feedback' },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-[0.15em] text-[#6b6b66] font-semibold mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-[#6b6b66] hover:text-[#0e0e0d] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#efefed] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#a3a39e]">
            <p>© 2026 CREWUPFILMS. All rights reserved.</p>
            <div className="flex gap-6">
              {['Twitter', 'Instagram', 'LinkedIn'].map((s) => (
                <a key={s} href="#" className="hover:text-[#0e0e0d] transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
