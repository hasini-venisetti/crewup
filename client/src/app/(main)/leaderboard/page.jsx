'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { leaderboardAPI } from '@/lib/api';

const ROLES = ['director', 'cinematographer', 'editor', 'actor', 'writer', 'composer', 'sound-designer', 'photographer', 'producer', 'vfx-artist', 'other'];
const PERIODS = ['month', 'all-time'];

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-[#f0ede8] text-[#111110] font-semibold flex items-center justify-center flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function PodiumCard({ creator, rank }) {
  const heights = { 1: 'pt-4', 2: 'pt-8', 3: 'pt-12' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const borders = { 1: 'border-[#111110]', 2: 'border-[#6b6b66]', 3: 'border-[#a3a39e]' };

  return (
    <Link
      href={`/profile/${creator._id}`}
      className={`bg-white border-2 ${borders[rank]} hover:shadow-md transition-all group flex flex-col items-center p-6 text-center ${heights[rank]}`}
    >
      <div className="text-2xl mb-3">{medals[rank]}</div>
      <Avatar name={creator.name} image={creator.profileImage} size="lg" />
      <p className="font-semibold text-[#111110] mt-3 truncate max-w-full group-hover:underline">{creator.name}</p>
      <p className="text-xs text-[#a3a39e] mb-2">@{creator.username}</p>
      <p className="text-sm font-bold text-[#111110]">{creator.score || 0} <span className="text-xs font-normal text-[#6b6b66]">pts</span></p>
    </Link>
  );
}

function LeaderboardRow({ creator, rank, maxScore }) {
  const scorePercent = maxScore > 0 ? (creator.score / maxScore) * 100 : 0;
  return (
    <Link
      href={`/profile/${creator._id}`}
      className="flex items-center gap-4 px-5 py-4 bg-white border border-[#efefed] hover:border-[#111110] transition-all group"
    >
      <div className="w-7 h-7 flex items-center justify-center text-sm font-medium text-[#a3a39e] flex-shrink-0">
        {rank}
      </div>
      <Avatar name={creator.name} image={creator.profileImage} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#111110] truncate text-sm group-hover:underline">{creator.name}</p>
        <p className="text-xs text-[#a3a39e]">@{creator.username} · <span className="capitalize">{creator.role?.replace('-', ' ')}</span></p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:block w-24 h-1 bg-[#f0f0ee] overflow-hidden">
          <div className="h-full bg-[#111110] transition-all" style={{ width: `${scorePercent}%` }} />
        </div>
        <div className="text-right min-w-[48px]">
          <p className="text-sm font-semibold text-[#111110]">{creator.score || 0}</p>
          <p className="text-[10px] text-[#a3a39e]">points</p>
        </div>
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [role, setRole] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [period, role]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (role !== 'all') params.role = role;

      const { data } = await leaderboardAPI.get(params);
      setCreators(data.data || []);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const top3 = creators.slice(0, 3);
  const rest = creators.slice(3, 20);
  const maxScore = creators[0]?.score || 1;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <p className="text-xs font-medium text-[#a3a39e] uppercase tracking-widest mb-2">Rankings</p>
          <h1 className="text-3xl font-semibold text-[#111110]">Leaderboard</h1>
          <p className="text-sm text-[#6b6b66] mt-1">Top creators {period === 'month' ? 'this month' : 'all time'}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-start items-start sm:items-center mb-12">
          {/* Period Toggle */}
          <div className="flex items-center gap-1 bg-[#f7f7f6] border border-[#efefed] p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 text-sm font-medium transition-all ${
                  period === p ? 'bg-white text-[#111110] shadow-sm border border-[#e0e0dd]' : 'text-[#6b6b66] hover:text-[#111110]'
                }`}
              >
                {p === 'all-time' ? 'All Time' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace('-', ' ').charAt(0).toUpperCase() + r.replace('-', ' ').slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Podium */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#f0f0ee] h-40 animate-pulse"
              />
            ))}
          </div>
        ) : top3.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {top3.map((creator, idx) => (
              <PodiumCard
                key={creator._id}
                creator={creator}
                rank={idx + 1}
              />
            ))}
          </div>
        ) : null}

        {/* Rest of Leaderboard */}
        {creators.length === 0 && !loading ? (
          <div className="bg-white border border-[#efefed] text-center py-24">
            <p className="text-4xl mb-4">🏆</p>
            <p className="font-semibold text-[#111110] mb-1">No data yet</p>
            <p className="text-sm text-[#6b6b66]">Complete projects to appear on the leaderboard</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#f0f0ee] animate-pulse"
                  />
                ))
              ) : (
                rest.map((creator, idx) => (
                  <LeaderboardRow
                    key={creator._id}
                    creator={creator}
                    rank={idx + 4}
                    maxScore={maxScore}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
