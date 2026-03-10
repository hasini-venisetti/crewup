'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { exploreAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const ROLES = ['director', 'cinematographer', 'editor', 'actor', 'writer', 'composer', 'sound-designer', 'photographer', 'producer', 'vfx-artist', 'other'];
const AVAILABILITIES = ['all', 'available', 'busy', 'open-to-offers'];

const AVAIL_CONFIG = {
  'available':      { label: 'Available',      dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border border-green-200' },
  'open-to-offers': { label: 'Open to Offers', dot: 'bg-[#6C63FF]', badge: 'bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff]' },
  'busy':           { label: 'Busy',           dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border border-red-200' },
};

const ROLE_ICONS = {
  director: '🎬', cinematographer: '📷', editor: '✂️', actor: '🎭',
  writer: '✍️', composer: '🎵', 'sound-designer': '🎚️', photographer: '📸',
  producer: '🎙️', 'vfx-artist': '✨', other: '🎨',
};

const ROLE_COLORS = {
  director:        'bg-[#6C63FF]',
  cinematographer: 'bg-violet-500',
  editor:          'bg-blue-500',
  actor:           'bg-pink-500',
  writer:          'bg-emerald-500',
  composer:        'bg-purple-500',
  'sound-designer':'bg-indigo-500',
  photographer:    'bg-cyan-500',
  producer:        'bg-orange-500',
  'vfx-artist':    'bg-rose-500',
  other:           'bg-slate-500',
};

function Avatar({ name, image }) {
  if (image) return <img src={image} alt={name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-base sm:text-lg font-semibold text-[#3730A3] flex-shrink-0">
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function CreatorCard({ creator }) {
  const roleIcon  = ROLE_ICONS[creator.role]  || '🎨';
  const roleLabel = creator.role?.replace(/-/g, ' ') || 'Creator';
  const roleColor = ROLE_COLORS[creator.role] || ROLE_COLORS['other'];
  const avail = AVAIL_CONFIG[creator.availability] || AVAIL_CONFIG['available'];

  return (
    <Link
      href={`/profile/${creator._id}`}
      className="rounded-2xl bg-white border border-[#efefed] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-[#d0d0ce] transition-all duration-300 flex flex-col group overflow-hidden relative"
    >
      {/* Colored accent bar per role */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${roleColor}`} />

      <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-4 flex-1 pt-4 sm:pt-6">
        {/* Avatar + name stacked on mobile */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
          <Avatar name={creator.name} image={creator.profileImage} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#111110] text-xs sm:text-sm truncate group-hover:underline leading-tight">{creator.name}</h3>
            <p className="text-[10px] sm:text-xs text-[#a3a39e] mb-1 sm:mb-3 truncate">@{creator.username}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${avail.badge}`}>
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${avail.dot} ${creator.availability === 'available' ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{avail.label}</span>
              <span className="sm:hidden">{avail.label.split(' ')[0]}</span>
            </span>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[#6b6b66] bg-[#f7f7f6] border border-[#e0e0dd] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            <span>{roleIcon}</span>
            <span className="capitalize truncate max-w-[70px] sm:max-w-none">{roleLabel}</span>
          </span>
        </div>

        {creator.bio && (
          <p className="hidden sm:block text-xs text-[#6b6b66] line-clamp-2 leading-relaxed">{creator.bio}</p>
        )}

        {creator.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creator.skills.slice(0, 2).map((skill) => (
              <span key={skill} className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 bg-[#f7f7f6] text-[#6b6b66] border border-[#e0e0dd] rounded-full truncate max-w-[70px]">
                {skill}
              </span>
            ))}
            {creator.skills.length > 2 && (
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 text-[#a3a39e]">+{creator.skills.length - 2}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 sm:pt-3 border-t border-[#f0f0ee]">
          <span className="text-[10px] sm:text-xs text-[#a3a39e] flex items-center gap-1 truncate">
            📍{' '}
            <span className="truncate">
              {creator.location?.city
                ? `${creator.location.city}${creator.location.country ? `, ${creator.location.country}` : ''}`
                : 'Location not set'}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-[#efefed] flex flex-col animate-pulse overflow-hidden">
      <div className="h-1 bg-[#e0e0dd] w-full" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-full bg-[#f0f0ee] flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-[#f0f0ee] rounded w-3/4" />
            <div className="h-3 bg-[#f0f0ee] rounded w-1/3" />
            <div className="h-5 bg-[#f0f0ee] rounded-full w-20" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-[#f0f0ee] rounded-full w-16" />
          <div className="h-5 bg-[#f0f0ee] rounded-full w-12" />
        </div>
        <div className="pt-3 border-t border-[#f0f0ee] flex justify-between">
          <div className="h-3 bg-[#f0f0ee] rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [creators, setCreators]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filters, setFilters]     = useState({ q: '', role: 'all', skill: '', location: '', availability: 'all', page: 1 });
  const [hasMore, setHasMore]     = useState(true);

  const debouncedFetch = useCallback(
    debounce(async (newFilters, myId) => {
      setLoading(true);
      try {
        const params = {
          ...(newFilters.q            && { q:            newFilters.q }),
          ...(newFilters.role !== 'all' && { role:        newFilters.role }),
          ...(newFilters.skill        && { skill:        newFilters.skill }),
          ...(newFilters.location     && { location:     newFilters.location }),
          ...(newFilters.availability !== 'all' && { availability: newFilters.availability }),
          page: newFilters.page,
        };
        const { data } = await exploreAPI.getCreators(params);
        const filtered = myId
          ? (data.data || []).filter((c) => c._id !== myId && c._id?.toString() !== myId)
          : (data.data || []);
        if (newFilters.page === 1) setCreators(filtered);
        else setCreators((prev) => [...prev, ...filtered]);
        setHasMore((data.data?.length ?? 0) === 10);
      } catch {
        toast.error('Failed to load creators');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const myId = user?._id || user?.id || null;
    debouncedFetch(filters, myId);
  }, [filters, debouncedFetch, user]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleLoadMore = () =>
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Dark Hero */}
      <div
        className="bg-[#0e0e0d] relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-16">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-widest">Creator Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-[Playfair_Display] text-white mb-3 leading-tight">
            Find Your Crew
          </h1>
          <p className="text-white/50 text-sm sm:text-lg mb-8">Browse creators by role, skill and location</p>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF]/50 transition text-sm"
            />
            {filters.q && (
              <button
                onClick={() => handleFilterChange('q', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs transition"
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-10">

        {/* Filter panel */}
        <div className="bg-white rounded-xl border border-[#efefed] p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6b6b66] mb-2 block">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                <option value="all">All Roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/-/g, ' ').charAt(0).toUpperCase() + role.replace(/-/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b6b66] mb-2 block">Skill</label>
              <input
                type="text"
                placeholder="e.g. Premiere Pro"
                value={filters.skill}
                onChange={(e) => handleFilterChange('skill', e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b6b66] mb-2 block">Location</label>
              <input
                type="text"
                placeholder="e.g. Los Angeles"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b6b66] mb-2 block">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                {AVAILABILITIES.map((avail) => (
                  <option key={avail} value={avail}>
                    {avail === 'all' ? 'Any' : avail.replace(/-/g, ' ').charAt(0).toUpperCase() + avail.replace(/-/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading && creators.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mb-10">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#efefed] text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-[#111110] mb-1">No creators found</p>
            <p className="text-sm text-[#6b6b66]">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mb-10">
            {creators.map((creator) => <CreatorCard key={creator._id} creator={creator} />)}
          </div>
        )}

        {/* Load More */}
        {creators.length > 0 && hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-white border border-[#e0e0dd] text-[#0e0e0d] font-semibold text-sm px-8 py-3 rounded-lg hover:border-[#0e0e0d] transition-all disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
