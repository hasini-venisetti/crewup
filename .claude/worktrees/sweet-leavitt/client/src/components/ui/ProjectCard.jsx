'use client';

import Link from 'next/link';

const TYPE_CONFIG = {
  'short-film':   { label: 'Short Film',   color: '#7C3AED', bg: '#F5F3FF' },
  'feature-film': { label: 'Feature Film', color: '#4338CA', bg: '#EEF2FF' },
  'youtube':      { label: 'YouTube',      color: '#DC2626', bg: '#FEF2F2' },
  'music-video':  { label: 'Music Video',  color: '#DB2777', bg: '#FDF2F8' },
  'podcast':      { label: 'Podcast',      color: '#6C63FF', bg: '#F0EEFF' },
  'web-series':   { label: 'Web Series',   color: '#2563EB', bg: '#EFF6FF' },
  'documentary':  { label: 'Documentary',  color: '#0D9488', bg: '#F0FDFA' },
  'commercial':   { label: 'Commercial',   color: '#EA580C', bg: '#FFF7ED' },
  'music':        { label: 'Music',        color: '#9333EA', bg: '#FAF5FF' },
  'other':        { label: 'Other',        color: '#6B7280', bg: '#F9FAFB' },
};

const LEVEL_CONFIG = {
  beginner:     { label: 'Beginner',     color: '#16A34A', bg: '#F0FDF4' },
  intermediate: { label: 'Intermediate', color: '#2563EB', bg: '#EFF6FF' },
  advanced:     { label: 'Advanced',     color: '#EA580C', bg: '#FFF7ED' },
};

export default function ProjectCard({ project }) {
  const {
    _id, title, description, createdBy, projectType,
    requiredRoles, location, isPaid, createdAt,
    experienceLevel, timelineStage,
  } = project;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isReleased = timelineStage === 'released';
  const typeCfg    = TYPE_CONFIG[projectType] || TYPE_CONFIG.other;
  const levelCfg   = LEVEL_CONFIG[experienceLevel];
  const initials   = createdBy?.name?.[0]?.toUpperCase() || '?';

  return (
    <Link href={`/projects/${_id}`} className="block group h-full">
      <article className={`relative bg-white rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-200
        ${isReleased
          ? 'border-2 border-green-400 hover:border-green-500'
          : 'border border-[#e8e8e5] hover:border-[#c8c8c4] hover:-translate-y-0.5 hover:shadow-lg'
        }`}
      >

        {/* ── Top colour strip (project type) ── */}
        <div
          className="h-1.5 w-full flex-shrink-0"
          style={{ background: isReleased ? '#22C55E' : typeCfg.color }}
        />

        {/* ── Released badge ── */}
        {isReleased && (
          <div className="bg-green-500 text-white text-[10px] font-black tracking-[0.15em] uppercase text-center py-1.5 px-3">
            🚀 Completed · Released
          </div>
        )}

        <div className="flex flex-col flex-1 p-4 gap-3">

          {/* ── Row 1: type pill + paid/collab ── */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ color: typeCfg.color, background: typeCfg.bg }}
            >
              {typeCfg.label}
            </span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              isPaid
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-[#f7f7f6] text-[#6b6b66] border border-[#e0e0dd]'
            }`}>
              {isPaid ? '💰 Paid' : '🤝 Collab'}
            </span>
          </div>

          {/* ── Row 2: Title + description ── */}
          <div>
            <h3 className="font-bold text-[#0e0e0d] text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-[#6C63FF] transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] sm:text-xs text-[#6b6b66] leading-relaxed line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* ── Row 3: Roles ── */}
          {requiredRoles?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {requiredRoles.slice(0, 3).map((role) => (
                <span key={role}
                  className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 bg-[#f4f4f2] text-[#3a3a38] border border-[#e8e8e4] rounded-md truncate max-w-[90px] sm:max-w-none">
                  {role}
                </span>
              ))}
              {requiredRoles.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 bg-[#f4f4f2] text-[#a3a39e] rounded-md">
                  +{requiredRoles.length - 3}
                </span>
              )}
            </div>
          )}

          {/* ── Row 4: Level ── */}
          {levelCfg && (
            <div>
              <span
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ color: levelCfg.color, background: levelCfg.bg }}
              >
                {levelCfg.label}
              </span>
            </div>
          )}

          {/* ── Row 5: Creator + meta (pinned to bottom) ── */}
          <div className="mt-auto pt-3 border-t border-[#f0f0ee] flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#a09aff] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#0e0e0d] truncate">{createdBy?.name || 'Anonymous'}</p>
              <p className="text-[10px] text-[#a3a39e] truncate">
                {location?.isRemote ? '🌐 Remote' : location?.city ? `📍 ${location.city}` : ''}
                {(location?.isRemote || location?.city) ? ' · ' : ''}
                {timeAgo(createdAt)}
              </p>
            </div>
          </div>

        </div>
      </article>
    </Link>
  );
}
