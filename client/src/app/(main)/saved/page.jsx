'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/components/ui/ProjectCard';
import { projectAPI, filmAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SavedProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [saved,      setSaved]      = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [filter,     setFilter]     = useState('All');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch bookmarks — use the projects endpoint which returns full project data
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    projectAPI.getBookmarks()
      .then((res) => {
        const bms = res.data?.data ?? res.data ?? [];
        setSaved(Array.isArray(bms) ? bms : []);
      })
      .catch(() => setSaved([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleRemove = async (projectId) => {
    try {
      await filmAPI.toggleBookmark(projectId);
      setSaved((prev) => prev.filter((p) => p._id !== projectId));
    } catch {}
  };

  // Get unique project types for filter tabs
  const types = ['All', ...Array.from(new Set(saved.map((p) => p.projectType).filter(Boolean)))];

  const filtered = filter === 'All'
    ? saved
    : saved.filter((p) => p.projectType === filter);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden bg-[#0e0e0d]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      >
        <div className="absolute top-0 left-1/3 w-80 h-64 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-4">
                <span className="text-[#6C63FF]">🔖</span>
                <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-widest">Saved Projects</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-5xl font-bold text-white mb-2 leading-tight">
                Your <span className="text-[#6C63FF]">Bookmarks</span>
              </h1>
              <p className="text-sm text-white/50 max-w-md">
                Projects you've saved to revisit later. Click the bookmark icon on any card to remove it.
              </p>
            </div>
            <Link
              href="/projects"
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors"
            >
              🔍 Browse More Projects
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filter tabs (only shown when there are saved projects) ── */}
      {!isLoading && saved.length > 0 && (
        <div className="sticky top-0 z-20 bg-white border-b border-[#efefed] shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                    filter === t
                      ? 'bg-[#0e0e0d] text-white border-transparent'
                      : 'border-[#efefed] text-[#444442] hover:bg-[#f7f7f6]'
                  }`}
                >
                  {t === 'All' ? `✦ All (${saved.length})` : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {isLoading ? (
          /* Skeleton */
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
        ) : saved.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0e0dd] bg-white py-24 text-center">
            <p className="text-5xl mb-4">🔖</p>
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#111110] mb-2">No saved projects yet</h3>
            <p className="text-sm text-[#6b6b66] mb-6 max-w-xs leading-relaxed">
              Browse projects and click the bookmark icon on any card to save it here for later.
            </p>
            <Link
              href="/projects"
              className="rounded-xl bg-[#0e0e0d] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d2b] transition-colors"
            >
              Browse Projects →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          /* No results for this filter */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0e0dd] bg-white py-16 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-semibold text-[#111110] mb-1">No saved projects in this category</p>
            <button onClick={() => setFilter('All')} className="text-sm text-[#6C63FF] hover:underline mt-1">
              Show all saved projects
            </button>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#6b6b66]">
                <strong className="text-[#111110]">{filtered.length}</strong> saved project{filtered.length !== 1 ? 's' : ''}
                {filter !== 'All' && <span> in {filter}</span>}
              </p>
              {saved.length > 0 && (
                <span className="text-xs text-[#a3a39e]">
                  Hover a card and click 🔖 to remove
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  isBookmarked={true}
                  onToggleBookmark={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
