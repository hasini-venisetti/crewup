'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { leaderboardAPI } from '@/lib/api';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, Filter, Info } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'filmmaker',       label: 'Filmmaker / Director' },
  { value: 'actor',           label: 'Actor' },
  { value: 'editor',          label: 'Editor' },
  { value: 'writer',          label: 'Writer' },
  { value: 'musician',        label: 'Musician' },
  { value: 'designer',        label: 'Designer' },
  { value: 'photographer',    label: 'Photographer' },
  { value: 'content-creator', label: 'Content Creator' },
  { value: 'other',           label: 'Other' },
];

const QUICK_FILTERS = [
  { label: 'All',         value: 'all',       icon: '🏆' },
  { label: 'Directors',   value: 'filmmaker', icon: '🎬' },
  { label: 'Actors',      value: 'actor',     icon: '🎭' },
  { label: 'Editors',     value: 'editor',    icon: '✂️' },
];

const PERIODS = ['month', 'all-time'];

// How the score is calculated — shown to users
const SCORE_BREAKDOWN_INFO = [
  { label: 'Review Quality',     max: 50, color: 'bg-[#6C63FF]',  desc: 'Average star rating from teammates' },
  { label: 'Review Volume',      max: 20, color: 'bg-purple-400', desc: 'Number of reviews received (max at 10)' },
  { label: 'Projects Completed', max: 20, color: 'bg-green-500',  desc: 'Released films you were part of (max at 5)' },
  { label: 'Collaborations',     max: 10, color: 'bg-orange-400', desc: 'Unique people you\'ve worked with (max at 10)' },
];

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#6C63FF] to-[#5750D4] text-white font-semibold flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function ReputationBadge({ score }) {
  const cls =
    score >= 80 ? 'bg-[#6C63FF] text-white' :
    score >= 50 ? 'bg-[#f0eeff] text-[#3730A3] border border-[#c9c4ff]' :
                  'bg-[#f7f7f6] text-[#6b6b66] border border-[#e0e0dd]';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${cls}`}>
      ⭐ {score}
    </span>
  );
}

/* ── Score breakdown mini bar (shown in each row on hover) ── */
function ScoreBreakdownBar({ breakdown, total }) {
  if (!breakdown) return null;
  const segments = [
    { pts: breakdown.reviewQuality, color: 'bg-[#6C63FF]',  label: 'Review Quality' },
    { pts: breakdown.reviewVolume,  color: 'bg-purple-400', label: 'Review Volume' },
    { pts: breakdown.projects,      color: 'bg-green-500',  label: 'Projects' },
    { pts: breakdown.collabs,       color: 'bg-orange-400', label: 'Collabs' },
  ];
  return (
    <div className="mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 gap-px">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.pts / 100) * 100}%` }}
            title={`${s.label}: ${s.pts} pts`}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {segments.filter(s => s.pts > 0).map((s) => (
          <span key={s.label} className="flex items-center gap-1 text-[10px] text-[#6b6b66]">
            <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
            {s.label}: <strong>{s.pts}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ creator, rank }) {
  const heights  = { 1: 'pt-4', 2: 'pt-8', 3: 'pt-12' };
  const bgColors = { 1: 'from-gray-800 to-gray-900', 2: 'from-gray-700 to-gray-800', 3: 'from-gray-600 to-gray-700' };
  const roleLabel = ROLE_OPTIONS.find((r) => r.value === creator.role)?.label || creator.role;

  return (
    <Link
      href={`/profile/${creator._id}`}
      className={`group relative bg-gradient-to-br ${bgColors[rank]} hover:shadow-xl transition-all duration-300 flex flex-col items-center p-6 text-white rounded-2xl transform hover:scale-105 ${heights[rank]}`}
    >
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
        <span className="text-base font-bold text-gray-800">{rank}</span>
      </div>
      <div className="text-4xl mb-4">
        {rank === 1 && <Trophy className="w-10 h-10 text-white" />}
        {rank === 2 && <Medal  className="w-10 h-10 text-white" />}
        {rank === 3 && <Award  className="w-10 h-10 text-white" />}
      </div>
      <Avatar name={creator.name} image={creator.profileImage} size="lg" />
      <p className="font-bold text-white mt-3 truncate max-w-full group-hover:underline text-sm">{creator.name}</p>
      <p className="text-[11px] text-white/60 mb-0.5">@{creator.username}</p>
      <p className="text-[11px] text-white/60 mb-3 capitalize">{roleLabel}</p>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center w-full">
        <p className="text-base font-bold text-white leading-none">{creator.reputationScore ?? 0}</p>
        <p className="text-[10px] text-white/60 mt-0.5">Rep Score</p>
      </div>
      {/* Mini stats */}
      <div className="flex gap-3 mt-2 text-[10px] text-white/50">
        <span>★ {creator.averageRating?.toFixed(1)}</span>
        <span>·</span>
        <span>🎬 {creator.projectsCompleted} films</span>
        <span>·</span>
        <span>🤝 {creator.collaborations}</span>
      </div>
    </Link>
  );
}

function LeaderboardRow({ creator, rank, maxScore }) {
  const [expanded, setExpanded] = useState(false);
  const scorePercent = maxScore > 0 ? (creator.reputationScore / maxScore) * 100 : 0;
  const roleLabel    = ROLE_OPTIONS.find((r) => r.value === creator.role)?.label || creator.role;
  const rankColors   = {
    1: 'bg-[#111110] text-white border-gray-700',
    2: 'bg-[#1a1a18] text-white border-gray-600',
    3: 'bg-gray-700 text-white border-gray-500',
  };

  return (
    <div className="rounded-xl border border-gray-200 hover:border-[#6C63FF]/40 hover:shadow-md transition-all duration-200 bg-white overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Rank */}
        <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg border flex-shrink-0 ${
          rankColors[rank] || 'bg-[#f7f7f6] text-[#6b6b66] border-gray-200'
        }`}>
          {rank}
        </div>

        {/* Avatar */}
        <Link href={`/profile/${creator._id}`}>
          <Avatar name={creator.name} image={creator.profileImage} />
        </Link>

        {/* Name + role + stats */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${creator._id}`}>
            <p className="font-semibold text-[#111110] truncate text-sm hover:text-[#6C63FF] transition-colors">{creator.name}</p>
          </Link>
          <p className="text-xs text-[#6b6b66]">
            @{creator.username}
            <span className="mx-1.5 text-[#d0d0ce]">·</span>
            <span className="capitalize">{roleLabel}</span>
            {creator.location?.city && (
              <><span className="mx-1.5 text-[#d0d0ce]">·</span>📍 {creator.location.city}</>
            )}
          </p>
          {/* Quick stats */}
          <div className="flex gap-3 mt-1 text-[11px] text-[#a3a39e]">
            <span>★ {creator.averageRating?.toFixed(1)} ({creator.reviewCount} reviews)</span>
            <span>·</span>
            <span>🎬 {creator.projectsCompleted} films</span>
            <span>·</span>
            <span>🤝 {creator.collaborations} collabs</span>
          </div>
        </div>

        {/* Score + expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:block w-24 h-2 bg-[#f7f7f6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8b84ff] transition-all duration-500 rounded-full"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <div className="text-right min-w-[72px]">
            <ReputationBadge score={creator.reputationScore ?? 0} />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#a3a39e] hover:text-[#6C63FF] transition-colors"
            title="See score breakdown"
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 bg-[#fafaf9]">
          <p className="text-[11px] font-semibold text-[#a3a39e] uppercase tracking-wider mt-3 mb-2">Score Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Review Quality', pts: creator.breakdown?.reviewQuality || 0, max: 50, color: 'text-[#6C63FF]',  icon: '⭐' },
              { label: 'Review Volume',  pts: creator.breakdown?.reviewVolume  || 0, max: 20, color: 'text-purple-500', icon: '📝' },
              { label: 'Films Done',     pts: creator.breakdown?.projects      || 0, max: 20, color: 'text-green-600',  icon: '🎬' },
              { label: 'Collabs',        pts: creator.breakdown?.collabs       || 0, max: 10, color: 'text-orange-500', icon: '🤝' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                <p className="text-lg mb-0.5">{item.icon}</p>
                <p className={`text-base font-bold ${item.color}`}>{item.pts}<span className="text-xs text-[#a3a39e] font-normal">/{item.max}</span></p>
                <p className="text-[10px] text-[#6b6b66] mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <ScoreBreakdownBar breakdown={creator.breakdown} total={creator.reputationScore} />
        </div>
      )}
    </div>
  );
}

/* ── How scoring works panel ── */
function HowItWorksPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-8 max-w-2xl mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#6b6b66] hover:border-[#6C63FF]/40 hover:text-[#111110] transition-all"
      >
        <span className="flex items-center gap-2"><Info size={15} /> How is the score calculated?</span>
        <span className="text-[10px] text-[#a3a39e]">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="mt-2 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-[#6b6b66] mb-4">Reputation score is out of <strong>100 points</strong>, earned across 4 signals:</p>
          <div className="space-y-3">
            {SCORE_BREAKDOWN_INFO.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#111110]">{item.label}</span>
                    <span className="text-[#a3a39e]">up to {item.max} pts</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.max}%` }} />
                  </div>
                  <p className="text-[10px] text-[#a3a39e] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#a3a39e] mt-4 pt-3 border-t border-gray-100">
            💡 To climb the leaderboard: complete projects, collaborate with more people, and earn great reviews from your team.
          </p>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('month');
  const [role, setRole]         = useState('all');

  useEffect(() => { fetchLeaderboard(); }, [period, role]);

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

  const top3     = creators.slice(0, 3);
  const rest     = creators.slice(3, 20);
  const maxScore = creators[0]?.reputationScore || 1;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Dark Hero */}
      <div
        className="relative bg-[#0e0e0d] py-16 overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold">Community</p>
          </div>
          <h1 className="text-5xl font-[Playfair_Display] text-white mb-3">Leaderboard</h1>
          <p className="text-white/50 text-lg">Top creators ranked by reputation score.</p>
          {/* Score pills in hero */}
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            {[
              { icon: '⭐', label: 'Review Quality', pts: '50 pts' },
              { icon: '📝', label: 'Review Volume',  pts: '20 pts' },
              { icon: '🎬', label: 'Films Completed', pts: '20 pts' },
              { icon: '🤝', label: 'Collaborations',  pts: '10 pts' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-white/60">{s.label}</span>
                <span className="text-xs font-bold text-white/90">{s.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 mb-8 text-sm text-[#6b6b66]">
          <div className="flex items-center gap-2"><Users size={16} /><span>{creators.length} Creators</span></div>
          <div className="flex items-center gap-2"><TrendingUp size={16} /><span>Ranked by Reputation Score</span></div>
        </div>

        {/* How it works */}
        <HowItWorksPanel />

        {/* Quick Role Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRole(f.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                role === f.value
                  ? 'bg-[#111110] text-white border-[#111110] shadow-sm'
                  : 'bg-white text-[#6b6b66] border-gray-200 hover:border-gray-400 hover:text-[#111110]'
              }`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        {/* Period + full role select */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${
                  period === p ? 'bg-[#111110] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#fafaf9]'
                }`}
              >
                {p === 'all-time' ? <><Trophy size={14} /> All Time</> : <><Calendar size={14} /> This Month</>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
            <Filter size={15} className="text-[#6b6b66]" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-[#6b6b66]"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Podium */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#f7f7f6] h-64 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : top3.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {top3.map((creator, idx) => (
              <PodiumCard key={creator._id} creator={creator} rank={idx + 1} />
            ))}
          </div>
        ) : null}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {creators.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16">
              <div className="w-20 h-20 bg-[#f7f7f6] rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-[#6b6b66]" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-[#111110] mb-2">No rankings yet</h3>
              <p className="text-[#6b6b66] mb-6">Complete projects and get reviews to appear on the leaderboard</p>
              <Link href="/projects"
                className="inline-flex items-center gap-2 bg-[#111110] hover:bg-[#1a1a18] text-white px-6 py-3 rounded-lg transition-colors">
                <TrendingUp size={16} /> Start Contributing
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-sm font-semibold text-[#111110]">
                  {role === 'all'
                    ? 'Top Rated Creators'
                    : `Top ${ROLE_OPTIONS.find((r) => r.value === role)?.label || role}s`}
                </h3>
                <span className="text-xs text-[#a3a39e]">Click ⓘ to see score breakdown</span>
              </div>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 h-16 bg-white border border-gray-200 animate-pulse rounded-xl" />
                  ))
                : rest.map((creator, idx) => (
                    <LeaderboardRow
                      key={creator._id}
                      creator={creator}
                      rank={idx + 4}
                      maxScore={maxScore}
                    />
                  ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
