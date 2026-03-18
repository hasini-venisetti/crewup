'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/ui/ProjectCard';
import { projectAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  { value: 'All',           label: 'All Projects', icon: '✦' },
  { value: 'Film',          label: 'Film',         icon: '🎬' },
  { value: 'Music',         label: 'Music',        icon: '🎵' },
  { value: 'Photography',   label: 'Photography',  icon: '📷' },
  { value: 'Podcast',       label: 'Podcast',      icon: '🎙' },
  { value: 'Art',           label: 'Art',          icon: '🎨' },
];

const TOP_ROLES = [
  { label: 'Director',        icon: '🎬' },
  { label: 'Editor',          icon: '✂️' },
  { label: 'Cinematographer', icon: '📷' },
  { label: 'Actor',           icon: '🎭' },
  { label: 'Musician',        icon: '🎵' },
  { label: 'Writer',          icon: '✍️' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects,   setProjects]   = useState([]);
  const [activeTab,  setActiveTab]  = useState('All');
  const [isPaid,     setIsPaid]     = useState(false);
  const [isRemote,   setIsRemote]   = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [isLoading,  setIsLoading]  = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const params = {};
    if (activeTab !== 'All') params.projectType = activeTab.toLowerCase().replace(' ', '-');
    if (isPaid)     params.isPaid    = true;
    if (isRemote)   params.isRemote  = true;
    if (roleFilter) params.role      = roleFilter;
    if (search.trim()) params.q      = search.trim();

    projectAPI
      .getAll(params)
      .then((res) => {
        const raw = res.data?.data ?? res.data?.projects ?? [];
        setProjects(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, [activeTab, isPaid, isRemote, roleFilter, search]);

  const clearAll = () => {
    setActiveTab('All');
    setIsPaid(false);
    setIsRemote(false);
    setRoleFilter('');
    setSearch('');
  };

  const activeFilterCount = [
    activeTab !== 'All',
    isPaid,
    isRemote,
    !!roleFilter,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0e0e0d]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        <div className="absolute top-0 right-1/4 w-80 h-64 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
            <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-widest">Open Projects</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            Discover <span className="text-[#6C63FF]">Projects</span>
          </h1>
          <p className="text-base text-white/50 mb-8 max-w-xl">
            Find film, music, and creative projects looking for talented crew members.
          </p>

          {/* Search bar in hero */}
          <div className="relative max-w-lg">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by title or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 focus:border-[#6C63FF]/60 transition text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs transition">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-xl border border-[#efefed] bg-white text-sm font-medium text-[#111110] shadow-sm"
          >
            <span className="flex items-center gap-2">
              🎛 Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#6C63FF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <span className="text-xs text-[#6b6b66]">{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">

          {/* ── Sidebar ── */}
          <aside className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden sticky top-20">

              {/* Categories */}
              <div className="p-4 border-b border-[#f5f5f3]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3 px-1">Category</p>
                <div className="flex flex-col gap-0.5">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} onClick={() => setActiveTab(cat.value)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        activeTab === cat.value
                          ? 'bg-[#0e0e0d] text-white'
                          : 'text-[#444442] hover:bg-[#f7f7f6]'
                      }`}>
                      <span className="text-base w-5 text-center flex-shrink-0">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-[#f5f5f3]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3 px-1">Filters</p>
                <div className="flex flex-col gap-2">
                  {/* Paid toggle */}
                  <button onClick={() => setIsPaid((v) => !v)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      isPaid
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
                    }`}>
                    <span className="flex items-center gap-2">
                      <span>💰</span> Paid only
                    </span>
                    <span className={`w-8 h-4 rounded-full relative transition-colors ${isPaid ? 'bg-amber-400' : 'bg-[#e0e0dd]'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isPaid ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>

                  {/* Remote toggle */}
                  <button onClick={() => setIsRemote((v) => !v)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      isRemote
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
                    }`}>
                    <span className="flex items-center gap-2">
                      <span>🌐</span> Remote only
                    </span>
                    <span className={`w-8 h-4 rounded-full relative transition-colors ${isRemote ? 'bg-blue-400' : 'bg-[#e0e0dd]'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isRemote ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={clearAll}
                    className="mt-3 text-xs text-[#a3a39e] hover:text-red-500 transition-colors w-full text-center">
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Top Roles */}
              <div className="p-4 border-b border-[#f5f5f3]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3 px-1">Browse by Role</p>
                <div className="flex flex-col gap-0.5">
                  {TOP_ROLES.map((r) => (
                    <button key={r.label}
                      onClick={() => setRoleFilter(roleFilter === r.label ? '' : r.label)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                        roleFilter === r.label
                          ? 'bg-[#6C63FF]/10 text-[#4740CC] font-semibold'
                          : 'text-[#444442] hover:bg-[#f7f7f6] font-medium'
                      }`}>
                      <span className="w-5 text-center text-base flex-shrink-0">{r.icon}</span>
                      {r.label}
                      {roleFilter === r.label && (
                        <span className="ml-auto text-[10px] text-[#6C63FF] font-bold">✕</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post / Explore CTA */}
              <div className="p-4 flex flex-col gap-2">
                <Link href={user ? '/create-project' : '/login'}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#0e0e0d] text-white text-sm font-semibold hover:bg-[#2d2d2b] transition-colors">
                  <span>+</span> Post a Project
                </Link>
                <Link href="/explore"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#efefed] text-[#444442] text-sm font-medium hover:bg-[#f7f7f6] transition-colors">
                  👥 Find Creators
                </Link>
              </div>

            </div>
          </aside>

          {/* ── Projects Grid ── */}
          <div className="lg:col-span-3">

            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#6b6b66]">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#c9c4ff] border-t-[#5750D4] rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : (
                  <span>
                    <strong className="text-[#111110]">{projects.length}</strong> project{projects.length !== 1 ? 's' : ''}
                    {activeTab !== 'All' && <span> in {activeTab}</span>}
                    {roleFilter && <span> · {roleFilter}</span>}
                  </span>
                )}
              </p>
              {activeFilterCount > 0 && (
                <span className="text-xs bg-[#6C63FF]/10 text-[#5750D4] border border-[#6C63FF]/20 px-2.5 py-1 rounded-full font-medium">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </span>
              )}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-[#efefed] bg-white p-4 h-52">
                    <div className="h-1.5 bg-[#e0e0dd] rounded w-full mb-4" />
                    <div className="h-4 bg-[#f0f0ee] rounded w-1/3 mb-3" />
                    <div className="h-5 bg-[#f0f0ee] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#f5f5f3] rounded w-full mb-1" />
                    <div className="h-3 bg-[#f5f5f3] rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project._id || project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0e0dd] bg-white py-20 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#111110] mb-2">No projects found</h3>
                <p className="text-sm text-[#6b6b66] mb-6 max-w-xs">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
                <button onClick={clearAll}
                  className="rounded-lg bg-[#0e0e0d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d2b] transition-colors">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
