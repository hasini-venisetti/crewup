'use client';

/**
 * CrewSuggestions
 *
 * Displayed only to the project owner on the project detail page.
 * Fetches scored creator suggestions per open role from the backend
 * and renders suggestion cards with profile photo, name, role,
 * reputation score, and an Invite button.
 *
 * The Invite button sends a project_invite notification to the creator
 * and optionally opens a direct message conversation.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { crewMatchAPI, conversationAPI, notificationAPI } from '@/lib/api';

const ROLE_DISPLAY = {
  actor:           'Actor',
  filmmaker:       'Filmmaker / DP',
  editor:          'Editor',
  writer:          'Writer',
  musician:        'Musician',
  designer:        'Designer',
  photographer:    'Photographer',
  'content-creator': 'Content Creator',
  other:           'Creator',
};

const EXP_BADGE = {
  beginner:      { label: 'Beginner',      cls: 'bg-green-50 text-green-700 border-green-200' },
  intermediate:  { label: 'Intermediate',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  advanced:      { label: 'Advanced',      cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  professional:  { label: 'Pro',           cls: 'bg-[#f0eeff] text-[#3730A3] border-[#c9c4ff]' },
};

const AVAIL_DOT = {
  available:       'bg-green-400',
  'open-to-offers': 'bg-yellow-400',
  busy:            'bg-red-400',
};

function StarRow({ rating, count }) {
  if (rating === null) {
    return <span className="text-[11px] text-[#a3a39e]">No reviews yet</span>;
  }
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`text-[13px] ${s <= full ? 'text-[#6C63FF]' : s === full + 1 && half ? 'text-[#6C63FF]/50' : 'text-[#e0e0dd]'}`}>★</span>
        ))}
      </span>
      <span className="text-[11px] text-[#6b6b66] font-medium">{rating.toFixed(1)}</span>
      <span className="text-[10px] text-[#a3a39e]">({count})</span>
    </span>
  );
}

function SuggestionCard({ creator, projectId, projectTitle, onInvited }) {
  const [inviting, setInviting]   = useState(false);
  const [invited, setInvited]     = useState(false);
  const [err, setErr]             = useState('');

  const initial = creator.name?.[0]?.toUpperCase() || '?';
  const expCfg  = EXP_BADGE[creator.experienceLevel] || EXP_BADGE.beginner;
  const availDot = AVAIL_DOT[creator.availability] || 'bg-gray-300';

  const handleInvite = async () => {
    if (invited || inviting) return;
    setInviting(true);
    setErr('');
    try {
      // 1. Send a targeted project_invite notification to this creator only
      await notificationAPI.sendDirect({
        recipientId: creator._id,
        title:       `🎬 Project Invitation: ${projectTitle}`,
        message:     `You've been invited to join "${projectTitle}". Click to check it out!`,
        type:        'project_invite',
        link:        `/projects/${projectId}`,
      });

      // 2. Try to open/find a DM so the owner can follow up — non-fatal.
      // This fails if no accepted message request exists yet, which is fine;
      // the notification above is the actual invite.
      try {
        await conversationAPI.start({ recipientId: creator._id });
      } catch (_) {
        // Silently ignore — conversation will be available once they connect
      }

      setInvited(true);
      onInvited?.(creator._id);
    } catch (e) {
      setErr('Could not send invite. Try again.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-white border border-[#efefed] rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm hover:border-[#d0d0ce] transition-all">
      {/* Top row: avatar + name + role */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {creator.profileImage ? (
            <img
              src={creator.profileImage}
              alt={creator.name}
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] text-[#3730A3] text-base font-bold flex items-center justify-center flex-shrink-0">
              {initial}
            </div>
          )}
          {/* availability dot */}
          <span className={`absolute bottom-0 right-0 w-3 h-3 ${availDot} rounded-full border-2 border-white`} />
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${creator._id}`}
            className="text-sm font-semibold text-[#111110] hover:text-[#6C63FF] transition-colors truncate block"
          >
            {creator.name}
          </Link>
          <p className="text-xs text-[#6b6b66] truncate">
            {ROLE_DISPLAY[creator.role] || creator.role}
            {creator.location?.city ? ` · ${creator.location.city}` : ''}
          </p>
        </div>

        {/* Match score badge */}
        <div className="flex-shrink-0 text-right">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6C63FF] bg-[#f0eeff] px-2 py-0.5 rounded-full border border-[#c9c4ff]">
            {creator.matchScore}% match
          </span>
        </div>
      </div>

      {/* Stars */}
      <StarRow rating={creator.avgRating} count={creator.reviewCount} />

      {/* Skills */}
      {creator.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {creator.skills.map((skill) => (
            <span key={skill} className="text-[10px] bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Experience + invite */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${expCfg.cls}`}>
          {expCfg.label}
        </span>

        <button
          onClick={handleInvite}
          disabled={invited || inviting}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            invited
              ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
              : 'bg-[#6C63FF] hover:bg-[#5750D4] text-white disabled:opacity-60'
          }`}
        >
          {inviting ? 'Inviting…' : invited ? '✓ Invited' : 'Invite'}
        </button>
      </div>

      {err && <p className="text-[10px] text-red-500">{err}</p>}
    </div>
  );
}

export default function CrewSuggestions({ projectId, projectTitle }) {
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [invitedIds, setInvitedIds] = useState(new Set());

  useEffect(() => {
    if (!projectId) return;
    crewMatchAPI.getSuggestions(projectId)
      .then(({ data }) => {
        const raw = data?.data || [];
        // Filter out groups with no suggestions
        setGroups(raw.filter((g) => g.suggestions?.length > 0));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white border border-[#efefed] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#f0eeff] animate-pulse flex-shrink-0" />
          <div>
            <div className="h-4 w-40 bg-[#f0f0ee] rounded animate-pulse mb-1" />
            <div className="h-3 w-28 bg-[#f0f0ee] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-32 rounded-xl bg-[#f7f7f6]" />
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  const toggleRole = (role) =>
    setCollapsed((prev) => ({ ...prev, [role]: !prev[role] }));

  const handleInvited = (userId) =>
    setInvitedIds((prev) => new Set([...prev, userId]));

  return (
    <div className="bg-white border border-[#efefed] rounded-2xl p-6 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#f0eeff] border border-[#c9c4ff] flex items-center justify-center text-xl flex-shrink-0">
          🎬
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#111110]">Crew Match Suggestions</h2>
          <p className="text-xs text-[#a3a39e] mt-0.5">
            Top-matched creators for your open roles — ranked by role fit, skills, location &amp; reputation.
          </p>
        </div>
      </div>

      {/* Role groups */}
      <div className="flex flex-col gap-6">
        {groups.map(({ role, suggestions }) => (
          <div key={role}>
            {/* Role sub-header */}
            <button
              onClick={() => toggleRole(role)}
              className="flex items-center gap-2 w-full text-left mb-3 group"
            >
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#6C63FF]">{role}</span>
              <span className="text-[10px] text-[#a3a39e] bg-[#f0eeff] px-1.5 py-0.5 rounded-full">
                {suggestions.length}
              </span>
              <span className="ml-auto text-[#a3a39e] text-xs group-hover:text-[#6b6b66] transition-colors">
                {collapsed[role] ? '▼ Show' : '▲ Hide'}
              </span>
            </button>

            {!collapsed[role] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((creator) => (
                  <SuggestionCard
                    key={creator._id}
                    creator={{
                      ...creator,
                      // Convert raw matchScore (0-100) to readable percentage
                      matchScore: Math.min(100, creator.matchScore),
                    }}
                    projectId={projectId}
                    projectTitle={projectTitle}
                    onInvited={handleInvited}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
