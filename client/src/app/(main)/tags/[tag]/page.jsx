'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ProjectCard from '@/components/ui/ProjectCard';
import { tagsAPI } from '@/lib/api';

const TAG_DISPLAY_NAMES = {
  'short-film': 'Short Films',
  'feature-film': 'Feature Films',
  'youtube': 'YouTube',
  'music-video': 'Music Videos',
  'podcast': 'Podcasts',
  'web-series': 'Web Series',
  'documentary': 'Documentaries',
  'commercial': 'Commercials',
  'photography': 'Photography',
  'music': 'Music',
  'other': 'Other',
};

const TAG_EMOJIS = {
  'short-film': '🎬',
  'feature-film': '🎥',
  'youtube': '📹',
  'music-video': '🎵',
  'podcast': '🎙️',
  'web-series': '📺',
  'documentary': '📽️',
  'commercial': '📢',
  'photography': '📸',
  'music': '🎶',
  'other': '✦',
};

const ALL_TAGS = Object.keys(TAG_DISPLAY_NAMES);

export default function TagPage() {
  const { tag } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    paid: 'all',
    location: '',
    sort: 'newest',
    page: 1,
  });
  const [hasMore, setHasMore] = useState(true);

  const displayName = TAG_DISPLAY_NAMES[tag] || tag;
  const emoji = TAG_EMOJIS[tag] || '✦';

  useEffect(() => {
    fetchProjects();
  }, [tag, filters]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.paid !== 'all' && { isPaid: filters.paid === 'paid' }),
        ...(filters.location && { location: filters.location }),
        ...(filters.sort !== 'newest' && { sort: filters.sort }),
        page: filters.page,
      };

      const { data } = await tagsAPI.getByType(tag, params);
      if (filters.page === 1) {
        setProjects(data.data);
      } else {
        setProjects((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.data?.length === 10);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Dark Hero */}
      <div
        className="relative bg-[#0e0e0d] pt-24 pb-14 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-4 text-center">
          <div className="text-5xl mb-4">{emoji}</div>
          <h1 className="text-4xl md:text-5xl font-[Playfair_Display] text-white mb-3">{displayName}</h1>
          <p className="text-white/50">
            {projects.length} open project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="pb-20 px-4 max-w-[1200px] mx-auto">
        {/* Filters */}
        <div className="bg-white border border-[#efefed] rounded-2xl p-6 my-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#6b6b66] mb-2 block tracking-wider">Type</label>
              <select
                value={filters.paid}
                onChange={(e) => handleFilterChange('paid', e.target.value)}
                className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-3 py-2 text-[#111110] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#6b6b66] mb-2 block tracking-wider">Location</label>
              <input
                type="text"
                placeholder="e.g. Los Angeles"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-3 py-2 text-[#111110] text-sm placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#6b6b66] mb-2 block tracking-wider">Sort</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-3 py-2 text-[#111110] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#efefed] animate-pulse h-48" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-[#efefed] rounded-2xl text-center py-20 px-8 mb-10">
            <div className="text-4xl mb-4">🎬</div>
            <p className="font-[Playfair_Display] text-xl text-[#111110] mb-2">No open {displayName} projects</p>
            <p className="text-[#6b6b66] text-sm max-w-sm mx-auto mb-6">
              Be the first to post a {displayName.toLowerCase().slice(0, -1)}!
            </p>
            <Link
              href="/create-project"
              className="inline-block bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Post a Project
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mb-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white border border-[#e0e0dd] rounded-xl px-8 py-3 font-semibold text-sm hover:border-[#6C63FF] hover:text-[#5750D4] transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Browse other categories */}
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase text-[#a3a39e] mb-4 text-center tracking-widest">
            Browse other categories
          </h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {ALL_TAGS.filter((t) => t !== tag).map((t) => (
              <Link
                key={t}
                href={"/tags/" + t}
                className="text-xs px-3 py-2 rounded-lg bg-white border border-[#e0e0dd] text-[#6b6b66] hover:text-[#6C63FF] hover:border-[#6C63FF]/40 transition-colors"
              >
                {TAG_EMOJIS[t]} {TAG_DISPLAY_NAMES[t]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
