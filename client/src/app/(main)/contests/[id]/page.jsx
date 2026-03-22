'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { contestAPI, contestSubmissionAPI } from '@/lib/api';
import toast from 'react-hot-toast';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function thumbnail(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

/* ─── CommentPanel ──────────────────────────────────────────────────────────── */
function CommentPanel({ contestId, sub, onClose, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [posting, setPosting]   = useState(false);

  useEffect(() => {
    contestSubmissionAPI.getComments(contestId, sub._id)
      .then(({ data }) => setComments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contestId, sub._id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const { data } = await contestSubmissionAPI.addComment(contestId, sub._id, text.trim());
      setComments((prev) => [...prev, data.data]);
      setText('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post comment.');
    } finally { setPosting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await contestSubmissionAPI.deleteComment(contestId, sub._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed] flex-shrink-0">
          <div>
            <h3 className="font-semibold text-[#111110] text-sm">Comments</h3>
            <p className="text-xs text-[#a3a39e] mt-0.5 line-clamp-1">{sub.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] transition-colors text-lg">×</button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-12 bg-[#f7f7f6] rounded-xl animate-pulse" />)}</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-[#a3a39e] text-sm">No comments yet. Be the first!</div>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
                  {c.author?.profileImage
                    ? <img src={c.author.profileImage} alt="" className="w-full h-full object-cover" />
                    : c.author?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#111110]">{c.author?.name}</span>
                    <span className="text-xs text-[#a3a39e]">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#3b3b37]">{c.text}</p>
                </div>
                {user && c.author?._id === user.id && (
                  <button onClick={() => handleDelete(c._id)}
                    className="text-[#a3a39e] hover:text-red-500 transition-colors text-xs flex-shrink-0 mt-1">✕</button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        {user ? (
          <form onSubmit={handleAdd} className="px-6 py-4 border-t border-[#efefed] flex-shrink-0 flex gap-2">
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…" maxLength={500}
              className="flex-1 rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            <button type="submit" disabled={posting || !text.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition-all">
              {posting ? '…' : 'Post'}
            </button>
          </form>
        ) : (
          <div className="px-6 py-4 border-t border-[#efefed] text-center text-sm text-[#a3a39e]">
            <Link href="/login" className="text-[#6C63FF] font-semibold hover:underline">Sign in</Link> to comment
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SubmissionCard ────────────────────────────────────────────────────────── */
function SubmissionCard({ sub, contestId, user, rank, onLikeToggle, onVoteToggle, onCommentOpen, onDelete }) {
  const thumb       = thumbnail(sub.videoId);
  const likeCount   = sub.likes?.length ?? 0;
  const voteCount   = sub.votes?.length ?? 0;
  const isLiked     = user && sub.likes?.some((l) => l === user.id || l?._id === user.id);
  const isVoted     = user && sub.votes?.some((v) => v === user.id || v?._id === user.id);
  const isOwner     = user && (sub.submittedBy?._id === user.id || sub.submittedBy === user.id);
  const [liking, setLiking] = useState(false);
  const [voting, setVoting] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    if (!user) { window.location.href = '/login'; return; }
    setLiking(true);
    try { await onLikeToggle(sub._id); }
    finally { setLiking(false); }
  };

  const handleVote = async () => {
    if (voting) return;
    if (!user) { window.location.href = '/login'; return; }
    if (isOwner) return;
    setVoting(true);
    try { await onVoteToggle(sub._id); }
    finally { setVoting(false); }
  };

  return (
    <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden hover:border-[#6C63FF]/30 hover:shadow-lg hover:shadow-[#6C63FF]/5 transition-all group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#111110] overflow-hidden">
        {rank && (
          <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
            rank === 1 ? 'bg-amber-400 text-amber-900' :
            rank === 2 ? 'bg-gray-300 text-gray-700' :
            rank === 3 ? 'bg-orange-400 text-orange-900' :
                         'bg-white/80 text-[#6b6b66]'
          }`}>#{rank}</div>
        )}
        {thumb ? (
          <img src={thumb} alt={sub.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-40">🎬</span>
          </div>
        )}
        {/* Watch overlay */}
        <a href={sub.youtubeLink} target="_blank" rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group/play">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover/play:opacity-100 transition-all scale-90 group-hover/play:scale-100">
            <svg className="w-6 h-6 text-[#0e0e0d] ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </a>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#111110] mb-1 line-clamp-1">{sub.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[8px] font-bold text-white overflow-hidden flex-shrink-0">
            {sub.submittedBy?.profileImage
              ? <img src={sub.submittedBy.profileImage} alt="" className="w-full h-full object-cover" />
              : sub.submittedBy?.name?.[0]?.toUpperCase()}
          </div>
          <Link href={`/profile/${sub.submittedBy?._id}`} className="text-xs text-[#6b6b66] hover:text-[#6C63FF] transition-colors">
            {sub.submittedBy?.name}
          </Link>
          <span className="text-xs text-[#d0d0cc]">·</span>
          <span className="text-xs text-[#a3a39e]">{timeAgo(sub.createdAt)}</span>
        </div>

        {/* Filmmaker caption/message */}
        {sub.caption && (
          <p className="text-xs text-[#4b4b47] bg-[#fafaf9] border border-[#efefed] rounded-lg px-3 py-2 mb-3 leading-relaxed italic">
            "{sub.caption}"
          </p>
        )}

        {/* Vote CTA — prominent bar */}
        {!isOwner && (
          <button
            onClick={handleVote}
            disabled={voting}
            title={
              !user     ? 'Sign in to vote'
              : isVoted ? 'Remove your vote'
              :           'Vote for this film!'
            }
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all mb-3 ${
              isVoted
                ? 'bg-[#6055de] text-white shadow-md shadow-[#6055de]/25'
                : !user
                  ? 'bg-[#f4f3ff] text-[#6055de] border border-[#c9c4ff] hover:bg-[#ece9ff]'
                  : 'bg-[#f4f3ff] text-[#6055de] border border-[#c9c4ff] hover:bg-[#ece9ff] hover:border-[#6055de]/50'
            } disabled:opacity-50`}>
            <span className="text-base leading-none">🗳</span>
            {isVoted
              ? 'Voted! ✓'
              : !user
              ? 'Vote for this film — Sign in'
              : 'Vote for this film!'}
          </button>
        )}
        {isOwner && (
          <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-[#6055de] bg-[#f4f3ff] mb-3">
            📣 Share your film and ask your community to vote!
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleLike} disabled={liking}
            title={!user ? 'Sign in to like' : isLiked ? 'Unlike' : 'Like'}
            className={`flex items-center gap-1 text-xs font-semibold transition-all ${
              isLiked
                ? 'text-[#6055de]'
                : !user
                  ? 'text-[#c0c0bc] hover:text-[#6055de] cursor-pointer'
                  : 'text-[#a3a39e] hover:text-[#6055de]'
            }`}>
            <span className="text-base leading-none">{isLiked ? '♥' : '♡'}</span>
            {likeCount}
          </button>
          <button onClick={() => onCommentOpen(sub)}
            className="flex items-center gap-1 text-xs font-semibold text-[#a3a39e] hover:text-[#6055de] transition-colors">
            <span className="text-base leading-none">💬</span>
            {sub.commentCount ?? 0}
          </button>
          <a href={sub.youtubeLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-[#a3a39e] hover:text-[#6055de] transition-colors ml-auto">
            ▶ Watch
          </a>
          {isOwner && (
            <button onClick={() => onDelete(sub._id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── SubmitModal ───────────────────────────────────────────────────────────── */
function SubmitModal({ contestId, onClose, onSuccess, existingSubmission }) {
  const isResubmit = !!existingSubmission;
  const [form, setForm]           = useState({
    title:       existingSubmission?.title       || '',
    youtubeLink: existingSubmission?.youtubeLink || '',
    projectId:   '',
    caption:     existingSubmission?.caption     || '',
  });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [eligibility, setElig]    = useState(null);
  const [eligLoading, setEligLoad]= useState(true);

  useEffect(() => {
    contestSubmissionAPI.checkEligibility(contestId)
      .then(({ data }) => setElig(data))
      .catch(() => setElig({ eligible: false, reason: 'Could not check eligibility. Please try again.' }))
      .finally(() => setEligLoad(false));
  }, [contestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.youtubeLink.trim()) { setError('Both fields are required.'); return; }
    const videoId = extractVideoId(form.youtubeLink);
    if (!videoId) { setError('Please enter a valid YouTube URL.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await contestSubmissionAPI.submitFilm(contestId, form);
      onSuccess(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#111110]">{isResubmit ? '↩ Resubmit Your Film' : 'Submit Your Film'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f7f7f6] flex items-center justify-center text-[#6b6b66] hover:bg-[#efefed] transition-colors text-lg">×</button>
        </div>

        {/* YouTube description requirements */}
        <div className="bg-[#f0eeff] border border-[#c7c2f5] rounded-xl p-3.5 mb-5">
          <p className="text-xs font-bold text-[#4d44c8] mb-1.5">📋 Required: YouTube description must include</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#5750D4]">
              <span className="w-4 h-4 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">1</span>
              The word <strong>crewupfilms</strong> (or "crewup films")
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5750D4]">
              <span className="w-4 h-4 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">2</span>
              Your CrewUp <strong>@username</strong>
            </div>
          </div>
          <p className="text-[10px] text-[#7c74e8] mt-2">Submissions missing either mention will be auto-rejected. You can resubmit after fixing your description.</p>
        </div>

        {/* Eligibility check */}
        {eligLoading ? (
          <div className="h-16 bg-[#f7f7f6] rounded-xl animate-pulse mb-5" />
        ) : eligibility?.teamAlreadySubmitted ? (
          /* ── Team already submitted ── */
          <div className="bg-[#f0eeff] border border-[#c7c2f5] rounded-xl p-5 mb-5 text-center">
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-sm font-bold text-[#4d44c8] mb-1">Your team has already submitted!</p>
            <p className="text-xs text-[#6b6b66]">Each team can only enter one film per contest. Share your submission and get people to vote!</p>
          </div>
        ) : !eligibility?.eligible ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Eligibility Required</p>
            <p className="text-xs text-amber-700">{eligibility?.reason}</p>
            <a href="/create-project" className="inline-block mt-3 text-xs font-bold text-[#6055de] hover:underline">
              → Post a project &amp; build your team
            </a>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <p className="text-xs text-green-700 font-medium">You're eligible! You have {eligibility.projects?.length} qualifying project{eligibility.projects?.length !== 1 ? 's' : ''} with a full team.</p>
          </div>
        )}

        {eligibility?.eligible && (
          <>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project selector */}
              {eligibility.projects?.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Select Your Team Project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de]">
                    <option value="">Auto-select (first eligible)</option>
                    {eligibility.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.memberCount} members)</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Film Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="The title of your film"
                  className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">YouTube Link</label>
                <input required type="url" value={form.youtubeLink} onChange={(e) => setForm({ ...form, youtubeLink: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
                  Your Message <span className="normal-case font-normal text-[#a3a39e]">(optional — shown on your film card)</span>
                </label>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="Tell the community about your film — what inspired it, who made it, or ask for their vote! 🎬"
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de] resize-none"
                />
                <p className="text-[11px] text-[#a3a39e] text-right mt-0.5">{form.caption.length}/300</p>
              </div>
              <p className="text-xs text-[#a3a39e]">Make sure your video is set to <strong>Public</strong> or <strong>Unlisted</strong> on YouTube.</p>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#6055de] text-white font-semibold text-sm hover:bg-[#4d44c8] disabled:opacity-50 transition-all shadow-md shadow-[#6055de]/20">
                  {loading ? 'Submitting…' : '🎬 Submit Film'}
                </button>
                <button type="button" onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-[#e0e0dd] text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {!eligibility?.eligible && !eligLoading && (
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-[#e0e0dd] text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">
            Close
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function ContestDetailPage() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const router        = useRouter();

  const [contest, setContest]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submissions, setSubmissions]   = useState([]);
  const [subLoading, setSubLoading]     = useState(true);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [total, setTotal]               = useState(0);
  const [showSubmit, setShowSubmit]     = useState(false);
  const [commentSub, setCommentSub]     = useState(null);
  const [activeSection, setActiveSection] = useState('submissions'); // 'submissions' | 'leaderboard'
  const [mySubmission, setMySubmission] = useState(null); // current user's own submission

  /* Load contest */
  useEffect(() => {
    contestAPI.getById(id)
      .then(({ data }) => setContest(data.data))
      .catch(() => router.push('/contests'))
      .finally(() => setLoading(false));
  }, [id]);

  /* Load submissions */
  const loadSubmissions = useCallback(async (p) => {
    setSubLoading(true);
    try {
      const { data } = await contestSubmissionAPI.getSubmissions(id, { page: p, limit: 12 });
      setSubmissions(data.data || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {}
    finally { setSubLoading(false); }
  }, [id]);

  /* Load leaderboard */
  const loadLeaderboard = useCallback(async () => {
    try {
      const { data } = await contestSubmissionAPI.getLeaderboard(id);
      setLeaderboard(data.data || []);
    } catch {}
  }, [id]);

  useEffect(() => { loadSubmissions(1); loadLeaderboard(); }, [id]);

  /* Load the current user's own submission status */
  useEffect(() => {
    if (!user) return;
    contestSubmissionAPI.getMySubmission(id)
      .then(({ data }) => setMySubmission(data.data || null))
      .catch(() => {});
  }, [id, user]);

  const handleLikeToggle = async (subId) => {
    if (!user) return;
    try {
      await contestSubmissionAPI.toggleLike(id, subId);
      setSubmissions((prev) => prev.map((s) => {
        if (s._id !== subId) return s;
        const liked = s.likes?.some((l) => l === user.id || l?._id === user.id);
        return {
          ...s,
          likes: liked
            ? s.likes.filter((l) => (l?._id || l) !== user.id)
            : [...(s.likes || []), user.id],
        };
      }));
      loadLeaderboard();
    } catch {}
  };

  const handleVoteToggle = async (subId) => {
    if (!user) return;
    try {
      await contestSubmissionAPI.toggleVote(id, subId);
      setSubmissions((prev) => prev.map((s) => {
        if (s._id !== subId) return s;
        const voted = s.votes?.some((v) => v === user.id || v?._id === user.id);
        return {
          ...s,
          votes: voted
            ? s.votes.filter((v) => (v?._id || v) !== user.id)
            : [...(s.votes || []), user.id],
        };
      }));
      loadLeaderboard();
    } catch {}
  };

  const handleDelete = async (subId) => {
    if (!confirm('Remove your submission?')) return;
    try {
      await contestSubmissionAPI.deleteSubmission(id, subId);
      setSubmissions((prev) => prev.filter((s) => s._id !== subId));
      setTotal((t) => t - 1);
      loadLeaderboard();
    } catch {}
  };

  const handleSubmitSuccess = (newSub) => {
    setShowSubmit(false);
    setMySubmission(newSub);
    // Only add to public list if already approved (won't happen on first submit,
    // but covers admin-approved submissions showing up instantly)
    if (newSub.reviewStatus === 'approved') {
      setSubmissions((prev) => [newSub, ...prev]);
      setTotal((t) => t + 1);
      loadLeaderboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!contest) return null;

  const isOpen       = contest.status === 'open';
  const deadline     = new Date(contest.submissionDeadline);
  const daysLeft     = Math.ceil((deadline - Date.now()) / 86400000);
  const isExpired    = daysLeft < 0;
  const canSubmit    = isOpen && !isExpired && !!user;

  /* ── Render ── */
  return (
    <>
      {showSubmit && (
        <SubmitModal contestId={id} onClose={() => setShowSubmit(false)} onSuccess={handleSubmitSuccess} existingSubmission={mySubmission} />
      )}
      {commentSub && (
        <CommentPanel contestId={id} sub={commentSub} user={user} onClose={() => setCommentSub(null)} />
      )}

      <div className="min-h-screen bg-[#fafaf9]">

        {/* ── HERO HEADER ─────────────────────────────────────────── */}
        <div className="bg-[#0e0e0d] relative overflow-hidden border-b border-white/10"
          style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-[#6C63FF]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-[1100px] mx-auto px-6 py-12">
            <Link href="/contests" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
              ← Back to Contests
            </Link>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                {/* Status */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                    isOpen && !isExpired
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-white/10 text-white/50 border-white/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen && !isExpired ? 'bg-green-400 animate-pulse' : 'bg-white/40'}`} />
                    {isOpen && !isExpired ? 'Open for Submissions' : 'Contest Ended'}
                  </span>
                  {isOpen && !isExpired && daysLeft <= 7 && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                      ⚡ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-[Playfair_Display] text-white mb-3 leading-tight">
                  {contest.title}
                </h1>
                <p className="text-white/60 text-base leading-relaxed max-w-2xl">{contest.description}</p>
              </div>

              {/* Prize card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-shrink-0 w-full lg:w-72">
                {(contest.prizeAmount > 0 || contest.prizeDescription) && (
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-[0.1em] mb-1">Prize</p>
                    <p className="text-2xl font-bold text-white">{contest.prizeDescription || `₹${contest.prizeAmount}`}</p>
                    {contest.prizeAmount > 0 && contest.prizeDescription && (
                      <p className="text-sm text-white/50 mt-0.5">₹{contest.prizeAmount} value</p>
                    )}
                  </div>
                )}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Deadline</span>
                    <span className="text-white/80 font-medium">{deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Entries</span>
                    <span className="text-white/80 font-medium">{total}</span>
                  </div>
                  {contest.theme && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Theme</span>
                      <span className="text-white/80 font-medium">{contest.theme}</span>
                    </div>
                  )}
                  {contest.maxDuration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Max Duration</span>
                      <span className="text-white/80 font-medium">{contest.maxDuration}</span>
                    </div>
                  )}
                  {contest.allowedLanguages && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Languages</span>
                      <span className="text-white/80 font-medium">{contest.allowedLanguages}</span>
                    </div>
                  )}
                </div>
                {canSubmit ? (
                  <button onClick={() => setShowSubmit(true)}
                    className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white font-bold text-sm transition-all shadow-lg shadow-[#6C63FF]/30">
                    🎬 Submit Your Film
                  </button>
                ) : !user ? (
                  <Link href="/login"
                    className="block text-center w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/20">
                    Sign in to Submit
                  </Link>
                ) : (
                  <div className="text-center text-sm text-white/30 py-2">
                    {isExpired ? 'Submission deadline has passed' : 'Contest has ended'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────── */}
        <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-12">

          {/* ── INFO GRID: Details · Rules · How to Participate ── */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Contest Details */}
            <div className="bg-white border border-[#efefed] rounded-2xl p-6">
              <h2 className="font-bold text-[#111110] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center text-sm">📋</span>
                Contest Details
              </h2>
              <div className="space-y-3 text-sm">
                {contest.theme && (
                  <div>
                    <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Theme</p>
                    <p className="text-[#3b3b37] font-medium">{contest.theme}</p>
                  </div>
                )}
                {contest.maxDuration && (
                  <div>
                    <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Max Duration</p>
                    <p className="text-[#3b3b37] font-medium">{contest.maxDuration}</p>
                  </div>
                )}
                {contest.allowedLanguages && (
                  <div>
                    <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Languages</p>
                    <p className="text-[#3b3b37] font-medium">{contest.allowedLanguages}</p>
                  </div>
                )}
                {contest.teamFormedAfter && (
                  <div>
                    <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Team Formed After</p>
                    <p className="text-[#6055de] font-semibold text-sm">
                      {new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Deadline</p>
                  <p className="text-[#3b3b37] font-medium">{deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-[0.1em] mb-0.5">Status</p>
                  <p className={`font-semibold ${isOpen && !isExpired ? 'text-green-600' : 'text-[#6b6b66]'}`}>
                    {isOpen && !isExpired ? `Open — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Closed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white border border-[#efefed] rounded-2xl p-6">
              <h2 className="font-bold text-[#111110] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-sm">📜</span>
                Rules
              </h2>
              <ul className="space-y-2.5 text-sm text-[#3b3b37]">
                {(contest.rules?.length > 0
                  ? contest.rules
                  : [
                      'Film must be original and created by you or your crew.',
                      'Submit via a public or unlisted YouTube link.',
                      `${contest.maxDuration || 'Up to 20 minutes'} maximum runtime.`,
                      'One submission per participant.',
                      'No plagiarism or previously submitted works.',
                      'All genres and styles are welcome.',
                    ]
                ).map((rule, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Participate */}
            <div className="bg-white border border-[#efefed] rounded-2xl p-6">
              <h2 className="font-bold text-[#111110] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-sm">🚀</span>
                How to Participate
              </h2>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'Create an Account', desc: 'Sign up on CREWUPFILMS to join the contest.' },
                  { step: '02', title: 'Post a Project & Build a Team',
                    desc: `Create a project and recruit at least 1 crew member — 2 members minimum total.${contest.teamFormedAfter ? ` Your project must be created on or after ${new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}` },
                  { step: '03', title: 'Upload to YouTube', desc: 'Upload your film as Public or Unlisted on YouTube. Your video description must mention "crewupfilms" and your @username — submissions are auto-checked.' },
                  { step: '04', title: 'Submit Your Film', desc: 'Click "Submit Your Film", select your team project, and paste the YouTube link.' },
                  { step: '05', title: 'Get Community Votes', desc: 'Earn votes and comments from the community to rise up the leaderboard.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <span className="text-xs font-bold text-[#6055de] w-6 flex-shrink-0 pt-0.5">{step}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#111110]">{title}</p>
                      <p className="text-xs text-[#6b6b66] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team formation date callout */}
              {contest.teamFormedAfter && (
                <div className="mt-5 bg-[#f0eeff] border border-[#6055de]/25 rounded-xl px-4 py-3 flex gap-2.5 items-start">
                  <span className="text-base leading-none mt-0.5">🗓</span>
                  <div>
                    <p className="text-xs font-bold text-[#6055de]">Team Formation Requirement</p>
                    <p className="text-xs text-[#4d44c8] mt-0.5">
                      Your CREWUP team project must have been created on or after{' '}
                      <strong>{new Date(contest.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                      Teams formed before this date are not eligible.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── WINNERS (if ended and has winners) ── */}
          {contest.winners?.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">🏆 Winners</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {contest.winners.map((w) => {
                  const allMembers = [w.user, ...(w.teamMembers || [])].filter(Boolean);
                  return (
                    <div key={w._id || w.placement}
                      className={`bg-white border rounded-2xl p-5 ${
                        w.placement === 1 ? 'border-amber-300 bg-amber-50/30' :
                        w.placement === 2 ? 'border-gray-300 bg-gray-50/40' :
                        w.placement === 3 ? 'border-orange-300 bg-orange-50/20' :
                                            'border-[#efefed]'
                      }`}>
                      {/* Placement badge + main winner */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                          w.placement === 1 ? 'bg-amber-400 text-amber-900' :
                          w.placement === 2 ? 'bg-gray-300 text-gray-700' :
                          w.placement === 3 ? 'bg-orange-300 text-orange-800' :
                                              'bg-[#f0f0ee] text-[#6b6b66]'
                        }`}>#{w.placement}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#111110] truncate">{w.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-[#6b6b66]">@{w.user?.username}</p>
                        </div>
                      </div>
                      {/* Team members */}
                      {allMembers.length > 0 && (
                        <div className="border-t border-[#f0f0ee] pt-3">
                          <p className="text-[10px] uppercase tracking-widest text-[#a3a39e] font-semibold mb-2">Team</p>
                          <div className="flex flex-wrap gap-2">
                            {allMembers.map((m) => (
                              <a key={m._id} href={`/profile/${m._id}`}
                                className="flex items-center gap-1.5 bg-[#f7f7f6] hover:bg-[#efefed] rounded-full px-2.5 py-1 transition-colors">
                                {m.profileImage
                                  ? <img src={m.profileImage} alt={m.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                  : <div className="w-5 h-5 rounded-full bg-[#6C63FF] flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">{m.name?.[0]?.toUpperCase()}</div>
                                }
                                <span className="text-xs font-medium text-[#111110]">@{m.username}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {w.note && <p className="text-xs text-[#a3a39e] mt-3 italic">"{w.note}"</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── MY SUBMISSION STATUS ── */}
          {user && mySubmission && (() => {
            const s = mySubmission;
            const statusMap = {
              pending_check:  { icon: '⏳', color: 'bg-yellow-50 border-yellow-200', title: 'Checking your submission…', body: 'We\'re verifying your YouTube description. This only takes a moment.' },
              auto_rejected:  { icon: '❌', color: 'bg-red-50 border-red-200', title: 'Auto-check failed', body: `Your YouTube description is missing required mentions. Please update it and resubmit.` },
              pending_review: { icon: '🔍', color: 'bg-blue-50 border-blue-200', title: 'Under admin review', body: 'Your film passed the auto-check and is now being reviewed by our team.' },
              approved:       { icon: '🎉', color: 'bg-green-50 border-green-200', title: 'Submission approved!', body: 'Your film is live in the contest. Share it to get more votes!' },
              rejected:       { icon: '❌', color: 'bg-red-50 border-red-200', title: 'Submission rejected', body: s.adminNote ? `Reason: ${s.adminNote}` : 'Your submission was rejected. Please review the requirements and resubmit.' },
            };
            const cfg = statusMap[s.reviewStatus] || statusMap.pending_check;
            const canResubmit = ['auto_rejected', 'rejected'].includes(s.reviewStatus) && canSubmit;
            const autoCheck = s.autoCheck || {};

            return (
              <div className={`border rounded-2xl p-5 mb-2 ${cfg.color}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{cfg.icon}</span>
                    <div>
                      <p className="font-bold text-[#111110] text-sm">Your Submission — {s.title}</p>
                      <p className="text-xs text-[#6b6b66] mt-0.5">{cfg.body}</p>
                      {/* Auto-check detail for rejected */}
                      {s.reviewStatus === 'auto_rejected' && autoCheck.ran && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${autoCheck.hasCrewupMention ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-600 border-red-300'}`}>
                            {autoCheck.hasCrewupMention ? '✓' : '✗'} "crewupfilms" in description
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${autoCheck.hasUsernameMention ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-600 border-red-300'}`}>
                            {autoCheck.hasUsernameMention ? '✓' : '✗'} Your @username in description
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={s.youtubeLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#6C63FF] hover:underline">▶ Watch</a>
                    {canResubmit && (
                      <button onClick={() => setShowSubmit(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#6C63FF] hover:bg-[#5750D4] text-white transition-all">
                        ↩ Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── TABS: Submissions / Leaderboard ── */}
          <section>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1">
                <button onClick={() => setActiveSection('submissions')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeSection === 'submissions'
                      ? 'bg-[#0e0e0d] text-white shadow-sm'
                      : 'text-[#6b6b66] hover:text-[#111110]'
                  }`}>
                  Submissions ({total})
                </button>
                {user?.isAdmin && (
                  <button onClick={() => setActiveSection('leaderboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      activeSection === 'leaderboard'
                        ? 'bg-[#0e0e0d] text-white shadow-sm'
                        : 'text-[#6b6b66] hover:text-[#111110]'
                    }`}>
                    🏆 Top 10
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6055de]/15 text-[#6055de]">Admin</span>
                  </button>
                )}
              </div>
              {canSubmit && (
                <button onClick={() => setShowSubmit(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-bold transition-all shadow-md shadow-[#6C63FF]/20">
                  + Submit Your Film
                </button>
              )}
            </div>

            {/* Submissions grid */}
            {activeSection === 'submissions' && (
              <>
                {subLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array(8).fill(0).map((_,i) => (
                      <div key={i} className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
                        <div className="aspect-video bg-[#efefed] animate-pulse" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-[#efefed] rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-[#efefed] rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-[#efefed] rounded-2xl">
                    <p className="text-4xl mb-3">🎬</p>
                    <h3 className="font-bold text-[#111110] mb-2">No submissions yet</h3>
                    <p className="text-sm text-[#6b6b66]">
                      {canSubmit ? 'Be the first to submit your film!' : 'Check back later.'}
                    </p>
                    {canSubmit && (
                      <button onClick={() => setShowSubmit(true)}
                        className="mt-5 px-6 py-3 rounded-xl bg-[#6C63FF] text-white font-semibold text-sm hover:bg-[#5750D4] transition-all">
                        Submit Your Film
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {submissions.map((sub) => (
                        <SubmissionCard
                          key={sub._id}
                          sub={sub}
                          contestId={id}
                          user={user}
                          onLikeToggle={handleLikeToggle}
                          onVoteToggle={handleVoteToggle}
                          onCommentOpen={setCommentSub}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                    {/* Pagination */}
                    {pages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-8">
                        <button onClick={() => { setPage((p) => p - 1); loadSubmissions(page - 1); }} disabled={page === 1}
                          className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
                          ← Prev
                        </button>
                        <span className="text-sm text-[#6b6b66]">Page {page} of {pages}</span>
                        <button onClick={() => { setPage((p) => p + 1); loadSubmissions(page + 1); }} disabled={page === pages}
                          className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Leaderboard */}
            {activeSection === 'leaderboard' && (
              <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-16 text-[#a3a39e] text-sm">No submissions yet to rank.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#efefed] bg-[#fafaf9]">
                        <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] w-12">#</th>
                        <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Film</th>
                        <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden sm:table-cell">Creator</th>
                        <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">🗳 Votes</th>
                        <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">♥ Likes</th>
                        <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">💬</th>
                        <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] pr-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#efefed]">
                      {leaderboard.map((sub, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr key={sub._id} className="hover:bg-[#fafaf9] transition-colors">
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold ${
                                rank === 1 ? 'bg-amber-400 text-amber-900' :
                                rank === 2 ? 'bg-gray-200 text-gray-600' :
                                rank === 3 ? 'bg-orange-300 text-orange-800' :
                                             'bg-[#f7f7f6] text-[#6b6b66]'
                              }`}>{rank}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-8 rounded-lg overflow-hidden bg-[#111] flex-shrink-0">
                                  {sub.videoId && (
                                    <img src={thumbnail(sub.videoId)} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <span className="font-medium text-[#111110] line-clamp-1">{sub.title}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[#6b6b66] hidden sm:table-cell">
                              {sub.submittedBy?.name}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-[#6055de]">
                              {sub.voteCount ?? sub.votes?.length ?? 0}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold text-[#111110] hidden md:table-cell">
                              {sub.likeCount ?? sub.likes?.length ?? 0}
                            </td>
                            <td className="px-5 py-3.5 text-right text-[#6b6b66] hidden md:table-cell">
                              {sub.commentCount ?? 0}
                            </td>
                            <td className="px-5 py-3.5 text-right pr-5">
                              <a href={sub.youtubeLink} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[#6C63FF] hover:text-[#5750D4] font-semibold transition-colors">
                                Watch ↗
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
