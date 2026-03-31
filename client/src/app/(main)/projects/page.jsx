'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/ui/ProjectCard';
import { projectAPI, applicationAPI, filmAPI } from '@/lib/api';
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
  const [projects,      setProjects]      = useState([]);
  const [activeTab,     setActiveTab]     = useState('All');
  const [isPaid,        setIsPaid]        = useState(false);
  const [isRemote,      setIsRemote]      = useState(false);
  const [roleFilter,    setRoleFilter]    = useState('');
  const [search,        setSearch]        = useState('');
  const [isLoading,     setIsLoading]     = useState(true);
  const [loadError,     setLoadError]     = useState(false);
  const [showRoles,     setShowRoles]     = useState(false);
  const [appliedIds,    setAppliedIds]    = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [roleAnchor,    setRoleAnchor]    = useState(null); // { top, left } for fixed dropdown

  // Fetch user's applied + bookmarked project IDs once on mount (logged-in only)
  useEffect(() => {
    if (!user) return;
    applicationAPI.getMine().then((res) => {
      const apps = res.data?.applications ?? res.data ?? [];
      setAppliedIds(new Set(apps.map((a) => a.project?._id ?? a.project)));
    }).catch(() => {});
    projectAPI.getBookmarks().then((res) => {
      const bms = res.data?.data ?? [];
      setBookmarkedIds(new Set(bms.map((b) => b._id ?? b)));
    }).catch(() => {});
  }, [user]);

  // Reset to page 1 whenever any filter changes (but NOT when page itself changes)
  useEffect(() => { setPage(1); }, [activeTab, isPaid, isRemote, roleFilter, search]);

  useEffect(() => {
    setIsLoading(true);
    const params = { page };
    if (activeTab !== 'All') params.projectType = activeTab.toLowerCase().replace(' ', '-');
    if (isPaid)      params.isPaid   = true;
    if (isRemote)    params.isRemote = true;
    if (roleFilter)  params.role     = roleFilter;
    if (search.trim()) params.q      = search.trim();

    setLoadError(false);
    projectAPI
      .getAll(params)
      .then((res) => {
        const raw = res.data?.data ?? res.data?.projects ?? [];
        setProjects(Array.isArray(raw) ? raw : []);
        if (res.data?.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalCount(res.data.pagination.total || 0);
        }
      })
      .catch(() => { setLoadError(true); setProjects([]); })
      .finally(() => setIsLoading(false));
  }, [activeTab, isPaid, isRemote, roleFilter, search, page]);

  const clearAll = () => {
    setActiveTab('All');
    setIsPaid(false);
    setIsRemote(false);
    setRoleFilter('');
    setSearch('');
    setPage(1);
  };

  const handleToggleBookmark = async (projectId) => {
    if (!user) return;
    try {
      await filmAPI.toggleBookmark(projectId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) next.delete(projectId);
        else next.add(projectId);
        return next;
      });
    } catch {}
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

          {/* Row 1 — category tabs (always scrollable, larger touch targets on mobile) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pt-2.5 pb-2 border-b border-[#f5f5f3]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 min-h-[36px] ${
                  activeTab === cat.value
                    ? 'bg-[#0e0e0d] text-white'
                    : 'text-[#444442] hover:bg-[#f7f7f6]'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Row 2 — filter chips + CTA (scrollable on mobile; role dropdown uses fixed so no clip) */}
          <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">

            {/* Paid toggle */}
            <button
              onClick={() => setIsPaid((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 min-h-[38px] ${
                isPaid
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
              }`}
            >
              💰 Paid {isPaid && <span className="ml-0.5 text-amber-500">✓</span>}
            </button>

            {/* Remote toggle */}
            <button
              onClick={() => setIsRemote((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 min-h-[38px] ${
                isRemote
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
              }`}
            >
              🌐 Remote {isRemote && <span className="ml-0.5 text-blue-500">✓</span>}
            </button>

            {/* Role dropdown — fixed position so overflow-x-auto never clips it */}
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  if (showRoles) { setShowRoles(false); setRoleAnchor(null); return; }
                  const rect = e.currentTarget.getBoundingClientRect();
                  setRoleAnchor({ top: rect.bottom + 6, left: rect.left });
                  setShowRoles(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all min-h-[38px] ${
                  roleFilter
                    ? 'bg-[#6C63FF]/10 border-[#6C63FF]/30 text-[#4740CC]'
                    : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
                }`}
              >
                🎭 {roleFilter || 'Role'} <span className="opacity-40 text-[10px] ml-0.5">{showRoles ? '▲' : '▼'}</span>
              </button>

              {showRoles && roleAnchor && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setShowRoles(false); setRoleAnchor(null); }} />
                  <div
                    className="fixed w-48 bg-white border border-[#efefed] rounded-2xl shadow-xl py-1.5 z-50"
                    style={{ top: roleAnchor.top, left: roleAnchor.left }}
                  >
                    {roleFilter && (
                      <button
                        onClick={() => { setRoleFilter(''); setShowRoles(false); setRoleAnchor(null); setPage(1); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        ✕ Clear role
                      </button>
                    )}
                    {TOP_ROLES.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => { setRoleFilter(r.label); setShowRoles(false); setRoleAnchor(null); setPage(1); }}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${
                          roleFilter === r.label
                            ? 'bg-[#6C63FF]/10 text-[#4740CC] font-semibold'
                            : 'text-[#444442] hover:bg-[#f7f7f6]'
                        }`}
                      >
                        <span>{r.icon}</span> {r.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Clear filters chip */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap text-red-500 hover:bg-red-50 border border-red-200 transition-all flex-shrink-0 min-h-[38px]"
              >
                ✕ Clear ({activeFilterCount})
              </button>
            )}

            {/* Spacer pushes CTAs to the right on desktop, ignored on mobile scroll */}
            <div className="flex-1 min-w-[8px]" />

            {/* Creators link — hidden on small screens */}
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#efefed] text-[#444442] text-sm font-medium hover:bg-[#f7f7f6] transition-colors whitespace-nowrap flex-shrink-0 min-h-[38px]"
            >
              👥 Creators
            </Link>

            {/* Post project — icon-only on mobile, full label on sm+ */}
            <Link
              href={user ? '/create-project' : '/auth/login'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e0e0d] text-white text-sm font-semibold hover:bg-[#2d2d2b] transition-colors whitespace-nowrap flex-shrink-0 min-h-[38px]"
            >
              <span>+</span>
              <span className="hidden sm:inline">Post Project</span>
            </Link>

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
                <strong className="text-[#111110]">{totalCount}</strong>{' '}
                project{totalCount !== 1 ? 's' : ''}
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
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-20 text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#111110] mb-2">Couldn't load projects</h3>
            <p className="text-sm text-[#6b6b66] mb-6 max-w-xs">Something went wrong while fetching projects. Please check your connection and try again.</p>
            <button onClick={() => { setLoadError(false); setIsLoading(true); }}
              className="rounded-lg bg-[#0e0e0d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d2b] transition-colors">
              Try Again
            </button>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id || project.id}
                  project={project}
                  isApplied={appliedIds.has(project._id)}
                  isBookmarked={bookmarkedIds.has(project._id)}
                  onToggleBookmark={user ? handleToggleBookmark : undefined}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 pb-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="flex items-center gap-1.5 bg-white border border-[#e0e0dd] text-[#0e0e0d] font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-[#0e0e0d] hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Previous
                </button>
                <span className="text-sm text-[#6b6b66] font-medium">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="flex items-center gap-1.5 bg-white border border-[#e0e0dd] text-[#0e0e0d] font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-[#0e0e0d] hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            )}
          </>
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
