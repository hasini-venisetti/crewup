'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { contestAPI } from '@/lib/api';

function ContestCard({ contest }) {
  const isOpen     = contest.status === 'open';
  const deadline   = new Date(contest.submissionDeadline);
  const daysLeft   = Math.ceil((deadline - Date.now()) / 86400000);
  const isExpired  = daysLeft < 0;

  return (
    <Link href={`/contests/${contest._id}`}
      className="group block bg-white border border-[#efefed] rounded-2xl p-3 sm:p-6 hover:border-[#6C63FF]/40 hover:shadow-lg hover:shadow-[#6C63FF]/5 transition-all duration-300">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${
          isOpen && !isExpired
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-[#f7f7f6] text-[#6b6b66] border-[#e0e0dd]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen && !isExpired ? 'bg-green-500 animate-pulse' : 'bg-[#a3a39e]'}`} />
          {isOpen && !isExpired ? 'Open' : 'Ended'}
        </span>
        {isOpen && !isExpired && daysLeft <= 7 && (
          <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            ⚡ {daysLeft}d
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-sm sm:text-lg font-bold text-[#111110] mb-1 sm:mb-2 group-hover:text-[#6C63FF] transition-colors line-clamp-2">
        {contest.title}
      </h2>
      <p className="hidden sm:block text-sm text-[#6b6b66] line-clamp-3 mb-5">{contest.description}</p>
      <p className="sm:hidden text-[11px] text-[#6b6b66] line-clamp-2 mb-3">{contest.description}</p>

      {/* Details */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
        {contest.theme && (
          <span className="text-[10px] sm:text-xs bg-[#f4f3ff] text-[#6C63FF] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-[90px] sm:max-w-none">
            🎨 {contest.theme}
          </span>
        )}
        {contest.maxDuration && (
          <span className="text-[10px] sm:text-xs bg-[#f7f7f6] text-[#6b6b66] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            ⏱ {contest.maxDuration}
          </span>
        )}
      </div>

      {/* Prize + deadline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 border-t border-[#f0f0ee] gap-1">
        {(contest.prizeAmount > 0 || contest.prizeDescription) && (
          <p className="text-xs sm:text-sm font-bold text-[#111110] truncate">
            🏆 {contest.prizeDescription || `₹${contest.prizeAmount}`}
          </p>
        )}
        <p className="text-[10px] sm:text-xs text-[#a3a39e]">
          {isExpired
            ? `Ended ${deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
            : `Due ${deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
        </p>
      </div>

      {/* Winners strip */}
      {contest.winners?.length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#f0f0ee] flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-[10px] sm:text-xs text-[#a3a39e]">🏅</span>
          {contest.winners.slice(0, 2).map((w, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold text-amber-600">#{w.placement}</span>
              <span className="text-[10px] sm:text-xs text-[#6b6b66] truncate max-w-[50px]">{w.user?.name || 'User'}</span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    contestAPI.getAll()
      .then(({ data }) => setContests(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open   = contests.filter((c) => c.status === 'open');
  const ended  = contests.filter((c) => c.status !== 'open');

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-[#0e0e0d] border-b border-white/10 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6C63FF]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[1100px] mx-auto px-3 sm:px-6 py-12 sm:py-16 text-center">
          <p className="text-[#6C63FF] text-sm font-bold uppercase tracking-[0.2em] mb-3">🏆 CREWUPFILMS</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-[Playfair_Display] text-white mb-4">
            Short Film Contests
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
            Compete, get featured, and win prizes for your short films.
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-8 sm:py-12 space-y-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {Array(3).fill(0).map((_,i) => <div key={i} className="h-64 bg-white border border-[#efefed] rounded-2xl animate-pulse" />)}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎬</p>
            <h2 className="text-xl font-bold text-[#111110] mb-2">No contests yet</h2>
            <p className="text-[#6b6b66] text-sm">Check back soon — contests will appear here when announced.</p>
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">
                  Open Contests ({open.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {open.map((c) => <ContestCard key={c._id} contest={c} />)}
                </div>
              </section>
            )}
            {ended.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">
                  Past Contests ({ended.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {ended.map((c) => <ContestCard key={c._id} contest={c} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
