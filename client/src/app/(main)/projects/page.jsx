'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/ui/ProjectCard';
import { projectAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  { value: 'All',         label: 'All',          icon: '✦' },
  { value: 'Film',        label: 'Film',         icon: '🎬' },
  { value: 'Music',       label: 'Music',        icon: '🎵' },
  { value: 'Photography', label: 'Photography',  icon: '📷' },
  { value: 'Podcast',     label: 'Podcast',      icon: '🎙' },
  { value: 'Art',         label: 'Art',          icon: '🎨' },
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
  const [projects,    setProjects]    = useState([]);
  const [activeTab,   setActiveTab]   = useState('All');
  const [isPaid,      setIsPaid]      = useState(false);
  const [isRemote,    setIsRemote]    = useState(false);
  const [roleFilter,  setRoleFilter]  = useState('');
  const [search,      setSearch]      = useState('');
  const [isLoading,   setIsLoading]   = useState(true);
  const [showRoles,   setShowRoles]   = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const params = {};
    if (activeTab !== 'All') params.projectType = activeTab.toLowerCase().replace(' ', '-');
    if (isPaid)      params.isPaid   = true;
    if (isRemote)    params.isRemote = true;
    if (roleFilter)  params.role     = roleFilter;
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

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden bg-[#0e0e0d]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      >
        <div className="absolute top-0 right-1/4 w-80 h-64 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-18">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
                <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-widest">Open Projects</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-5xl font-bold text-white mb-2 leading-tight">
                Discover <span className="text-[#6C63FF]">Projects</span>
              </h1>
              <p className="text-sm text-white/50 max-w-md">
                Find film, music, and creative projects looking for talented crew members.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72 flex-shrink-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by title or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 focus:border-[#6C63FF]/60 transition text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs transition"
                >✕</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Horizontal Filter Bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#efefed] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">

            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-shrink-0 pr-3 border-r border-[#efefed]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveTab(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === cat.value
                      ? 'bg-[#0e0e0d] text-white'
                      : 'text-[#444442] hover:bg-[#f7f7f6]'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Paid toggle */}
            <button
              onClick={() => setIsPaid((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                isPaid
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
              }`}
            >
              💰 Paid
              {isPaid && <span className="text-[10px] ml-0.5 text-amber-600">✓</span>}
            </button>

            {/* Remote toggle */}
            <button
              onClick={() => setIsRemote((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                isRemote
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
              }`}
            >
              🌐 Remote
              {isRemote && <span className="text-[10px] ml-0.5 text-blue-600">✓</span>}
            </button>

            {/* Role dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowRoles((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-all ${
                  roleFilter
                    ? 'bg-[#6C63FF]/10 border-[#6C63FF]/30 text-[#4740CC]'
                    : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
                }`}
              >
                🎭 {roleFilter || 'Role'}
                <span className="text-[10px] text-current opacity-60">{showRoles ? '▲' : '▼'}</span>
              </button>

              {showRoles && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-[#efefed] rounded-xl shadow-lg py-1 z-30">
                  {roleFilter && (
                    <button
                      onClick={() => { setRoleFilter(''); setShowRoles(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      ✕ Clear role
                    </button>
                  )}
                  {TOP_ROLES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => { setRoleFilter(r.label); setShowRoles(false); }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                        roleFilter === r.label
                          ? 'bg-[#6C63FF]/10 text-[#4740CC] font-semibold'
                          : 'text-[#444442] hover:bg-[#f7f7f6]'
                      }`}
                    >
                      <span>{r.icon}</span> {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-red-500 hover:bg-red-50 border border-red-200 transition-all flex-shrink-0 ml-1"
              >
                ✕ Clear ({activeFilterCount})
              </button>
            )}

            {/* Spacer + CTAs pushed to the right */}
            <div className="flex-1" />
            <div className="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-[#efefed]">
              <Link
                href="/explore"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#efefed] text-[#444442] text-sm font-medium hover:bg-[#f7f7f6] transition-colors whitespace-nowrap"
              >
                👥 Creators
              </Link>
              <Link
                href={user ? '/create-project' : '/login'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0d] text-white text-sm font-semibold hover:bg-[#2d2d2b] transition-colors whitespace-nowrap"
              >
                + Post Project
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

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
                <strong className="text-[#111110]">{projects.length}</strong>{' '}
                project{projects.length !== 1 ? 's' : ''}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <button
              onClick={clearAll}
              className="rounded-lg bg-[#0e0e0d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d2b] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
