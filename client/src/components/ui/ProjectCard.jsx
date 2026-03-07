'use client';

import Link from 'next/link';

const LEVEL_CONFIG = {
  beginner:     { label: '★ Beginner',     class: 'bg-green-50 text-green-700 border border-green-200' },
  intermediate: { label: '◆ Intermediate', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
  advanced:     { label: '▲ Advanced',     class: 'bg-orange-50 text-orange-700 border border-orange-200' },
  any:          { label: null, class: '' },
};

const TAG_CONFIG = {
  'learning-project':       { label: '📚 Learning',     class: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'practice-collaboration': { label: '🤝 Practice',     class: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  'portfolio-building':     { label: '🎨 Portfolio',    class: 'bg-pink-50 text-pink-700 border border-pink-200' },
  'mentorship-available':   { label: '🎓 Mentorship',   class: 'bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff]' },
  'paid-opportunity':       { label: '💰 Paid',         class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

const TYPE_ACCENT = {
  'short-film':   'bg-violet-500',
  'feature-film': 'bg-indigo-500',
  'youtube':      'bg-red-500',
  'music-video':  'bg-pink-500',
  'podcast':      'bg-[#6C63FF]',
  'web-series':   'bg-blue-500',
  'documentary':  'bg-teal-500',
  'commercial':   'bg-orange-500',
  'music':        'bg-purple-500',
  'other':        'bg-gray-400',
};

export default function ProjectCard({ project }) {
  const {
    _id, title, description, createdBy, projectType,
    requiredRoles, location, isPaid, createdAt,
    experienceLevel, projectTags, timelineStage,
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
  
  const levelCfg   = LEVEL_CONFIG[experienceLevel] || LEVEL_CONFIG.any;
  const isReleased = timelineStage === 'released';
  const accent     = TYPE_ACCENT[projectType] || TYPE_ACCENT.other;

  

  return (
    <Link href={`/projects/${_id}`} className="block group h-full">
      <article className={`relative bg-white rounded-2xl border overflow-hidden flex flex-col h-full transition-all duration-300
        ${isReleased
          ? 'border-green-200 hover:border-green-300'
          : 'border-[#efefed] hover:border-[#d0d0cc] hover:-translate-y-0.5'}
      `}
        style={{ boxShadow: 'var(--shadow-xs)' }}
        onMouseEnter={e => { if (!isReleased) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-xs)'}
      >
        {/* Colored left accent bar (project type) */}
        <div className={`absolute top-0 left-0 bottom-0 w-1 ${isReleased ? 'bg-green-400' : accent} opacity-70`} />

        {/* Released banner */}
        {isReleased && (
          <div className="bg-green-500 text-white text-[10px] font-bold tracking-widest uppercase text-center py-1.5 pl-1">
            🚀 Completed · Released
          </div>
        )}

        <div className="flex flex-col gap-4 p-5 pl-6 flex-1">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d0d0cc] to-[#e8e8e5] flex items-center justify-center text-sm font-bold text-[#0e0e0d] flex-shrink-0 uppercase">
              {createdBy?.name?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0e0e0d] leading-tight truncate">{createdBy?.name || 'Anonymous'}</p>
              <p className="text-xs text-[#a3a39e] capitalize mt-0.5">{createdBy?.role?.replace('-', ' ')} · {timeAgo(createdAt)}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${isPaid ? 'bg-[#0e0e0d] text-white' : 'bg-[#f7f7f6] text-[#6b6b66] border border-[#e0e0dd]'}`}>
              {isPaid ? '💰 Paid' : '🤝 Collab'}
            </span>
          </div>

          {/* Title + Description */}
          <div>
            <h3 className="font-bold text-[#0e0e0d] text-base leading-snug mb-1.5 group-hover:underline line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-[#6b6b66] leading-relaxed line-clamp-2">{description}</p>
          </div>

          {/* Level + Tags */}
          {(levelCfg.label || projectTags?.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {levelCfg.label && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${levelCfg.class}`}>
                  {levelCfg.label}
                </span>
              )}
              {projectTags?.slice(0, 2).map((tag) => TAG_CONFIG[tag] && (
                <span key={tag} className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TAG_CONFIG[tag].class}`}>
                  {TAG_CONFIG[tag].label}
                </span>
              ))}
            </div>
          )}

          {/* Roles */}
          <div className="flex flex-wrap gap-1.5">
            {requiredRoles?.slice(0, 4).map((role) => (
              <span key={role} className="text-xs px-2.5 py-1 bg-[#f7f7f6] text-[#0e0e0d] border border-[#e8e8e5] rounded-lg font-medium">
                {role}
              </span>
            ))}
            {requiredRoles?.length > 4 && (
              <span className="text-xs px-2.5 py-1 bg-[#f7f7f6] text-[#a3a39e] rounded-lg">
                +{requiredRoles.length - 4}
              </span>
            )}
          </div>

          {/* Meta footer */}
          <div className="flex items-center gap-3 text-xs text-[#a3a39e] mt-auto pt-3 border-t border-[#f0f0ee]">
            <span className="capitalize font-medium">{projectType?.replace('-', ' ')}</span>
            {location?.isRemote && <><span>·</span><span>🌐 Remote</span></>}
            {location?.city && !location?.isRemote && <><span>·</span><span>📍 {location.city}</span></>}
          </div>
        </div>
      </article>
    </Link>
  );
}
