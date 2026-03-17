'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { projectAPI, filmAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const GENRES = [
  { value: '',              label: 'All Films' },
  { value: 'short-film',   label: 'Short Films' },
  { value: 'feature-film', label: 'Feature Films' },
  { value: 'documentary',  label: 'Documentary' },
  { value: 'music-video',  label: 'Music Videos' },
  { value: 'web-series',   label: 'Web Series' },
  { value: 'youtube',      label: 'YouTube' },
  { value: 'commercial',   label: 'Commercial' },
  { value: 'other',        label: 'Other' },
];

const TYPE_LABEL = {
  'short-film':   'Short Film',  'feature-film': 'Feature Film',
  'documentary':  'Documentary', 'music-video':  'Music Video',
  'web-series':   'Web Series',  'youtube':      'YouTube',
  'commercial':   'Commercial',  'music':        'Music',
  'podcast':      'Podcast',     'other':        'Other',
};

/* ── Comment Modal ──────────────────────────────────────────────────── */
function CommentModal({ film, user, router, onClose }) {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    filmAPI.getComments(film._id)
      .then(({ data }) => setComments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [film._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) { router.push('/login'); return; }
    setSubmitting(true);
    try {
      const { data } = await filmAPI.addComment(film._id, text.trim());
      setComments((prev) => [data.data, ...prev]);
      setText('');
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await filmAPI.deleteComment(film._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {}
  };

  const myId = user?._id || user?.id;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0e0e0d] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="font-semibold text-sm text-white truncate max-w-[260px]">{film.title}</p>
            <p className="text-xs text-white/40 mt-0.5">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 bg-white/10 rounded w-24" />
                    <div className="h-2.5 bg-white/5 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm text-white/40">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
                  {c.author?.profileImage
                    ? <img src={c.author.profileImage} alt="" className="w-full h-full object-cover" />
                    : c.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${c.author?._id}`} onClick={onClose}
                      className="text-xs font-semibold text-white hover:text-[#a09aff] transition-colors">
                      {c.author?.name}
                    </Link>
                    <span className="text-[10px] text-white/30">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mt-0.5 break-words">{c.text}</p>
                </div>
                {myId && c.author?._id === myId && (
                  <button onClick={() => handleDelete(c._id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs self-start mt-1 flex-shrink-0">
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-white/10 flex gap-3 items-center flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
            {user?.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? 'Add a comment…' : 'Log in to comment'}
            disabled={!user || submitting}
            maxLength={500}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C63FF]/50 transition-colors disabled:opacity-50"
          />
          <button type="submit" disabled={!text.trim() || submitting}
            className="w-9 h-9 rounded-xl bg-[#6C63FF] hover:bg-[#7C75FF] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Report Modal ───────────────────────────────────────────────────── */
function ReportModal({ film, user, router, onClose }) {
  const [reason, setReason]       = useState('');
  const [details, setDetails]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const REASONS = [
    { value: 'spam',           label: '🚫 Spam or misleading' },
    { value: 'inappropriate',  label: '⚠️ Inappropriate content' },
    { value: 'copyright',      label: '©️ Copyright violation' },
    { value: 'misinformation', label: '❌ Misinformation' },
    { value: 'other',          label: '💬 Other' },
  ];

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    if (!reason) return;
    setSubmitting(true);
    try {
      await filmAPI.report(film._id, reason, details);
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already')) setDone(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111110] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm">Report Film</h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/35 mb-5 line-clamp-1">"{film.title}"</p>

        {done ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-semibold text-white mb-1 text-sm">Report Submitted</p>
            <p className="text-xs text-white/40">Our team will review it shortly. Thank you.</p>
            <button onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-2.5">Reason</p>
            <div className="space-y-1.5 mb-4">
              {REASONS.map(({ value, label }) => (
                <button key={value} onClick={() => setReason(value)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                    reason === value
                      ? 'border-[#6C63FF] bg-[#6C63FF]/15 text-white'
                      : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white/80'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)…"
              rows={2} maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#6C63FF]/50 resize-none transition-colors mb-4"
            />
            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : '⚑ Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Analytics Modal (film owner only) ─────────────────────────────── */
function AnalyticsModal({ film, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('likes');

  useEffect(() => {
    filmAPI.getAnalytics(film._id)
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [film._id]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111110] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="font-bold text-white text-sm">Film Analytics</p>
            <p className="text-xs text-white/35 truncate max-w-[260px] mt-0.5">{film.title}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button onClick={() => setTab('likes')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              tab === 'likes' ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]' : 'text-white/40 hover:text-white/70'
            }`}>
            ❤️ Likes {data ? `(${data.likes.length})` : ''}
          </button>
          <button onClick={() => setTab('comments')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              tab === 'comments' ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]' : 'text-white/40 hover:text-white/70'
            }`}>
            💬 Comments {data ? `(${data.comments.length})` : ''}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-72 px-5 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0"/>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 bg-white/10 rounded w-32"/>
                    <div className="h-2 bg-white/5 rounded w-20"/>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'likes' ? (
            data?.likes.length === 0 ? (
              <p className="text-center text-sm text-white/30 py-8">No likes yet</p>
            ) : data?.likes.map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden">
                  {u.profileImage ? <img src={u.profileImage} alt="" className="w-full h-full object-cover"/> : u.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-white/35">@{u.username}</p>
                </div>
              </div>
            ))
          ) : (
            data?.comments.length === 0 ? (
              <p className="text-center text-sm text-white/30 py-8">No comments yet</p>
            ) : data?.comments.map((c) => (
              <div key={c._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden">
                  {c.author?.profileImage ? <img src={c.author.profileImage} alt="" className="w-full h-full object-cover"/> : c.author?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-white">{c.author?.name}</span>
                    <span className="text-[10px] text-white/25">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5 break-words">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Film Card ──────────────────────────────────────────────────────── */
function FilmCard({ film, user, router, onBookmarkChange }) {
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(film.likeCount || 0);
  const [liking, setLiking]         = useState(false);
  const [bookmarked, setBookmarked] = useState(film.bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hovered, setHovered]       = useState(false);

  const myId     = user?._id || user?.id;
  const isOwner  = myId && film.director?._id?.toString() === myId.toString();

  // Fetch initial like + bookmark status
  useEffect(() => {
    filmAPI.getLikeStatus(film._id)
      .then(({ data }) => { setLiked(data.liked); setLikeCount(data.likeCount); })
      .catch(() => {});
    filmAPI.getComments(film._id)
      .then(({ data }) => setCommentCount((data.data || []).length))
      .catch(() => {});
    if (user) {
      filmAPI.getBookmarkStatus(film._id)
        .then(({ data }) => setBookmarked(data.bookmarked))
        .catch(() => {});
    }
  }, [film._id, user]);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (liking) return;
    setLiking(true);
    // Optimistic
    setLiked((l) => !l);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    try {
      const { data } = await filmAPI.toggleLike(film._id);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      // Revert
      setLiked((l) => !l);
      setLikeCount((c) => liked ? c + 1 : c - 1);
    }
    finally { setLiking(false); }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (bookmarking) return;
    setBookmarking(true);
    const prev = bookmarked;
    setBookmarked((b) => !b);
    try {
      const { data } = await filmAPI.toggleBookmark(film._id);
      setBookmarked(data.bookmarked);
      if (onBookmarkChange) onBookmarkChange(film._id, data.bookmarked);
    } catch {
      setBookmarked(prev);
    } finally {
      setBookmarking(false);
    }
  };

  const filmUrl  = film.youtubeLink || `${typeof window !== 'undefined' ? window.location.origin : 'https://crewupfilms.com'}/films`;
  const shareText = `Watch "${film.title}"${film.director?.name ? ` by ${film.director.name}` : ''} 🎬 Check it out on CREWUPFILMS!`;

  const handleShareX = (e) => {
    e.preventDefault();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(filmUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareNative = async (e) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({ title: film.title, text: shareText, url: filmUrl });
      } catch {}
    } else {
      // fallback: copy link
      await navigator.clipboard.writeText(filmUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  const handleCopyLink = async (e) => {
    e.preventDefault();
    await navigator.clipboard.writeText(filmUrl).catch(() => {});
    setCopied(true);
    setShowShareMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (e) => {
    e.preventDefault();
    setShowShareMenu((v) => !v);
  };

  const handleComment = (e) => {
    e.preventDefault();
    setShowComments(true);
  };

  return (
    <>
      <div className="bg-[#0e0e0d] rounded-2xl overflow-hidden border border-white/8 hover:border-[#6C63FF]/40 hover:shadow-[0_8px_32px_rgba(108,99,255,0.12)] transition-all duration-300"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>

        {/* Thumbnail — click to open YouTube */}
        <a href={film.youtubeLink} target="_blank" rel="noopener noreferrer" className="block relative aspect-video overflow-hidden bg-[#1a1a18]">
          {film.thumbnail ? (
            <img src={film.thumbnail} alt={film.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${hovered ? 'scale-105' : 'scale-100'}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🎬</div>
          )}
          {/* Play overlay */}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
              <span className="text-[#6C63FF] text-xl ml-1">▶</span>
            </div>
          </div>
          {/* Genre badge */}
          {film.projectType && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white/80 px-2 py-1 rounded-md">
                {TYPE_LABEL[film.projectType] || film.projectType}
              </span>
            </div>
          )}
        </a>

        {/* Info */}
        <div className="px-4 pt-3 pb-1">
          <h3 className="font-semibold text-sm text-white truncate mb-1.5">{film.title}</h3>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 overflow-hidden">
              {film.director?.profileImage
                ? <img src={film.director.profileImage} alt="" className="w-full h-full object-cover" />
                : film.director?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <Link href={`/profile/${film.director?._id}`}
              className="text-xs text-white/45 hover:text-white/80 transition-colors truncate">
              {film.director?.name || 'Unknown'}
            </Link>
            {film.teamSize > 1 && (
              <span className="ml-auto text-[10px] text-white/25 flex-shrink-0">{film.teamSize} crew</span>
            )}
          </div>
          {/* Web-series: show all episode links */}
          {film.projectType === 'web-series' && film.episodeLinks?.length > 0 && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-white/8 pt-2">
              {film.episodeLinks.map((ep, i) => (
                <a key={i} href={ep.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-[#7C75FF] transition-colors py-0.5 group">
                  <span className="text-[8px] text-white/20 group-hover:text-[#7C75FF]">▶</span>
                  <span className="truncate">{ep.title || `Episode ${i + 1}`}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Like / Share / Comment bar ── */}
        <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-2.5 border-t border-white/5 mt-2">

          {/* Like */}
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              liked
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15'
                : 'text-white/40 hover:text-white/70 hover:bg-white/8'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{commentCount}</span>
          </button>

          {/* Share */}
          <div className="relative">
            <button
              onClick={handleShare}
              title={copied ? 'Copied!' : 'Share'}
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                copied
                  ? 'text-green-400 bg-green-500/10'
                  : showShareMenu
                  ? 'text-white/70 bg-white/8'
                  : 'text-white/30 hover:text-white/70 hover:bg-white/8'
              }`}
            >
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              )}
            </button>

            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-[#1a1a18] border border-white/10 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                  {/* X / Twitter */}
                  <button onClick={handleShareX}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share on X
                  </button>
                  {/* Instagram / Native share */}
                  <button onClick={handleShareNative}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors border-t border-white/5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    {typeof navigator !== 'undefined' && navigator.share ? 'Share (Instagram…)' : 'Share on Instagram'}
                  </button>
                  {/* Copy link */}
                  <button onClick={handleCopyLink}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors border-t border-white/5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Copy Link
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={bookmarking}
            title={bookmarked ? 'Remove from saved' : 'Save film'}
            className={`ml-auto flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
              bookmarked
                ? 'text-[#6C63FF] bg-[#6C63FF]/15 hover:bg-[#6C63FF]/25'
                : 'text-white/30 hover:text-[#6C63FF] hover:bg-[#6C63FF]/10'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={bookmarked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Analytics (owner only) */}
          {isOwner && (
            <button
              onClick={(e) => { e.preventDefault(); setShowAnalytics(true); }}
              title="View film analytics"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/25 hover:text-[#a09aff] hover:bg-[#6C63FF]/10 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </button>
          )}

          {/* Report */}
          <button
            onClick={(e) => { e.preventDefault(); setShowReport(true); }}
            title="Report this film"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Comment modal */}
      {showComments && (
        <CommentModal
          film={film}
          user={user}
          router={router}
          onClose={() => {
            setShowComments(false);
            filmAPI.getComments(film._id)
              .then(({ data }) => setCommentCount((data.data || []).length))
              .catch(() => {});
          }}
        />
      )}

      {/* Analytics modal */}
      {showAnalytics && (
        <AnalyticsModal
          film={film}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Report modal */}
      {showReport && (
        <ReportModal
          film={film}
          user={user}
          router={router}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#0e0e0d] rounded-2xl overflow-hidden border border-white/8 animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
      <div className="mx-4 mb-3 mt-1 h-8 bg-white/5 rounded-lg" />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function FilmsPage() {
  const { user }                        = useAuth();
  const router                          = useRouter();
  const [activeTab, setActiveTab]       = useState('all');   // 'all' | 'saved'

  // — All films state —
  const [films, setFilms]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [genre, setGenre]               = useState('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // — Saved films state —
  const [saved, setSaved]               = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const fetchFilms = useCallback(async (g, p) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 24 };
      if (g) params.genre = g;
      const { data } = await projectAPI.getAllFilms(params);
      setFilms(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch {
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    setSavedLoading(true);
    try {
      const { data } = await filmAPI.getBookmarks();
      setSaved(data.data || []);
    } catch {
      setSaved([]);
    } finally {
      setSavedLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchFilms(genre, page); }, [genre, page, fetchFilms]);
  useEffect(() => { if (activeTab === 'saved') fetchSaved(); }, [activeTab, fetchSaved]);

  const handleGenreChange = (g) => { setGenre(g); setPage(1); };

  // When a bookmark is toggled in the saved tab, remove it from the saved list
  const handleBookmarkChange = (filmId, isBookmarked) => {
    if (!isBookmarked) {
      setSaved((prev) => prev.filter((f) => f._id.toString() !== filmId.toString()));
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Dark hero */}
      <div className="bg-[#0e0e0d] relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute top-0 right-1/4 w-96 h-72 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-3 sm:px-6 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎬</span>
            <h1 className="text-3xl sm:text-4xl font-[Playfair_Display] text-white">Films</h1>
          </div>
          <p className="text-white/50 text-sm max-w-lg">
            Watch, like, and discuss short films, documentaries, and music videos made by CREWUPFILMS creators.
          </p>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-8 mb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#0e0e0d]'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              All Films
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'saved'
                    ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24"
                  fill={activeTab === 'saved' ? 'white' : 'none'}
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Saved
              </button>
            )}
          </div>

          {/* Genre filters (only on All tab) */}
          {activeTab === 'all' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {GENRES.map((g) => (
                <button key={g.value} onClick={() => handleGenreChange(g.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    genre === g.value
                      ? 'bg-[#6C63FF] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25'
                      : 'border-white/15 text-white/55 hover:border-white/30 hover:text-white'
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Saved Films Tab ── */}
      {activeTab === 'saved' && (
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-10">
          {savedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : saved.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-4">🔖</p>
              <p className="text-xl font-[Playfair_Display] text-[#111110] mb-2">No saved films yet</p>
              <p className="text-sm text-[#6b6b66] mb-6">
                Tap the bookmark icon on any film to save it here for later.
              </p>
              <button onClick={() => setActiveTab('all')}
                className="inline-flex items-center gap-2 text-sm font-semibold bg-[#0e0e0d] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a1a18] transition-colors">
                Browse Films →
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#6b6b66] mb-6">
                {saved.length} saved film{saved.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {saved.map((film) => (
                  <FilmCard
                    key={film._id}
                    film={{ ...film, bookmarked: true }}
                    user={user}
                    router={router}
                    onBookmarkChange={handleBookmarkChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── All Films Tab ── */}
      {activeTab === 'all' && (
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-10">
          {!loading && (
            <p className="text-sm text-[#6b6b66] mb-6">
              {total === 0 ? 'No films yet' : `${total} film${total !== 1 ? 's' : ''}`}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : films.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-4">🎞</p>
              <p className="text-xl font-[Playfair_Display] text-[#111110] mb-2">No films here yet</p>
              <p className="text-sm text-[#6b6b66] mb-6">
                When a project is marked as Released and a YouTube link is added, it appears here.
              </p>
              <Link href="/projects"
                className="inline-flex items-center gap-2 text-sm font-semibold bg-[#0e0e0d] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a1a18] transition-colors">
                Browse Projects →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {films.map((film) => (
                  <FilmCard key={film._id} film={film} user={user} router={router} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm font-medium text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#111110] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    ← Prev
                  </button>
                  <span className="text-sm text-[#6b6b66] px-3">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm font-medium text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#111110] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
