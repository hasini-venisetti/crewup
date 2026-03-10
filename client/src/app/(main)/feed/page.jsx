'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { activityAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ── Activity type config ─────────────────────────────────────────────────────
const TYPE_CONFIG = {
  project_created: { icon: '🎬', color: 'bg-[#f0eeff] text-[#6C63FF]',   label: 'New Project'  },
  film_uploaded:   { icon: '🎥', color: 'bg-[#fff0f0] text-red-500',      label: 'Film Upload'  },
  project_joined:  { icon: '🤝', color: 'bg-green-50 text-green-600',     label: 'Joined'       },
  role_filled:     { icon: '✅', color: 'bg-green-50 text-green-600',     label: 'Role Filled'  },
  user_followed:   { icon: '👥', color: 'bg-blue-50 text-blue-600',       label: 'Follow'       },
  contest_entered: { icon: '🏆', color: 'bg-yellow-50 text-yellow-600',   label: 'Contest'      },
  review_received: { icon: '⭐', color: 'bg-orange-50 text-orange-500',   label: 'Review'       },
};

// ── Relative time helper ─────────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── Single activity card ─────────────────────────────────────────────────────
function ActivityCard({ activity }) {
  const cfg    = TYPE_CONFIG[activity.type] || { icon: '📌', color: 'bg-gray-100 text-gray-600', label: '' };
  const actor  = activity.actor;
  const initials = actor?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex gap-3.5 py-4 border-b border-[#f0f0ee] last:border-0 group">
      {/* Actor avatar */}
      <Link href={actor ? `/profile/${actor._id}` : '#'} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-sm font-bold text-white overflow-hidden">
          {actor?.profileImage
            ? <img src={actor.profileImage} alt={actor.name} className="w-10 h-10 object-cover" />
            : initials}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-[#111110] leading-snug">
            <Link href={actor ? `/profile/${actor._id}` : '#'} className="font-semibold hover:underline">
              {actor?.name || 'Someone'}
            </Link>{' '}
            <span className="text-[#6b6b66]">{activity.title}</span>
          </p>
          <span className="text-[11px] text-[#a3a39e] flex-shrink-0 mt-0.5">{relativeTime(activity.createdAt)}</span>
        </div>

        {activity.body && (
          <p className="text-xs text-[#8b8b86] mt-1 line-clamp-2 leading-relaxed">{activity.body}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          {activity.link && (
            <Link href={activity.link}
              className="text-[11px] text-[#5750D4] hover:text-[#4740CC] font-semibold transition-colors">
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyFeed() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🎬</p>
      <p className="text-xl font-[Playfair_Display] text-[#111110] mb-2">Your feed is empty</p>
      <p className="text-sm text-[#6b6b66] mb-6 max-w-xs mx-auto">
        Follow other filmmakers and crew members to see what they're working on.
      </p>
      <Link href="/explore"
        className="inline-block px-5 py-2.5 bg-[#0e0e0d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1a18] transition-colors">
        Discover People
      </Link>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [error, setError]           = useState(null);

  const loadFeed = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const { data } = await activityAPI.getFeed(pageNum, 20);
      const items = data.data || [];
      setActivities((prev) => append ? [...prev, ...items] : items);
      setHasMore(pageNum < (data.pagination?.pages || 1));
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadFeed(1);
  }, [user, loadFeed, router]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadFeed(page + 1, true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div
        className="bg-[#0e0e0d]"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6C63FF] mb-3">Activity Feed</p>
          <h1 className="text-3xl font-[Playfair_Display] text-white mb-2">What's Happening</h1>
          <p className="text-white/50 text-sm">Latest updates from filmmakers you follow</p>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-0">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex gap-3.5 py-4 border-b border-[#f0f0ee] animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-[#efefed] flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-[#efefed] rounded w-3/4" />
                  <div className="h-3 bg-[#f5f5f3] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#6b6b66] mb-4">{error}</p>
            <button onClick={() => loadFeed(1)}
              className="px-4 py-2 bg-[#0e0e0d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1a18] transition-colors">
              Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <EmptyFeed />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#efefed] px-5 py-1 mb-6">
              {activities.map((activity) => (
                <ActivityCard key={activity._id} activity={activity} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 border border-[#e0e0dd] text-[#111110] text-sm font-semibold rounded-xl hover:border-[#0e0e0d] transition-all disabled:opacity-50">
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Suggestion if feed is short */}
        {!loading && activities.length > 0 && activities.length < 5 && (
          <div className="mt-6 p-5 bg-[#f0eeff] border border-[#c9c4ff] rounded-2xl text-center">
            <p className="text-sm font-semibold text-[#4740CC] mb-1">Follow more filmmakers</p>
            <p className="text-xs text-[#6b6b66] mb-3">Your feed grows as you connect with more people</p>
            <Link href="/explore"
              className="inline-block text-xs font-semibold px-4 py-2 bg-[#6C63FF] text-white rounded-lg hover:bg-[#5750D4] transition-colors">
              Discover Filmmakers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
