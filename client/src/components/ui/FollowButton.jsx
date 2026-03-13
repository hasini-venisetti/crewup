'use client';

/**
 * FollowButton — completely self-contained follow/unfollow button.
 *
 * Props:
 *   userId       — the user to follow/unfollow
 *   onCountChange(followers) — optional callback when count changes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { followAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function FollowButton({ userId, onCountChange }) {
  const { user } = useAuth();
  const router   = useRouter();

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading]         = useState(true);   // true while loading initial state
  const [busy, setBusy]               = useState(false);  // true while toggling

  // Load initial follow state once
  useEffect(() => {
    if (!userId) return;
    if (!user)   { setLoading(false); return; }

    // Don't show button at all for own profile — handled by parent
    const token = typeof window !== 'undefined' ? localStorage.getItem('crewup_token') : null;
    if (!token)  { setLoading(false); return; }

    followAPI.getStatus(userId)
      .then(({ data }) => {
        const d = data?.data;
        if (d !== undefined) {
          setIsFollowing(Boolean(d.isFollowing));
          if (onCountChange && d.followers !== undefined) onCountChange(d.followers);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?._id || user?.id]);

  const handleClick = async () => {
    if (!user) { router.push('/login'); return; }
    if (busy)  return;

    setBusy(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing); // optimistic

    try {
      const res = wasFollowing
        ? await followAPI.unfollow(userId)
        : await followAPI.follow(userId);

      const d = res?.data?.data;
      if (d !== undefined) {
        setIsFollowing(Boolean(d.isFollowing));
        if (onCountChange && d.followers !== undefined) onCountChange(d.followers);
      }
    } catch (err) {
      setIsFollowing(wasFollowing); // revert on error
      const msg = err?.response?.data?.message || 'Failed to update follow. Please try again.';
      toast.error(msg);
      console.error('[FollowButton]', msg);
    } finally {
      setBusy(false);
    }
  };

  // While loading initial state — show a neutral skeleton button
  if (loading) {
    return (
      <button disabled
        className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/10 text-white/20 min-w-[88px] cursor-default">
        &nbsp;
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all min-w-[88px] ${
        busy
          ? 'opacity-60 cursor-not-allowed border border-white/20 text-white/40'
          : isFollowing
          ? 'border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400'
          : 'bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20'
      }`}
    >
      {busy
        ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
        : isFollowing ? '✓ Following' : '+ Follow'
      }
    </button>
  );
}
