'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { projectAPI, applicationAPI, timelineAPI, waitlistAPI, reviewAPI, fillRoleAPI, profileAPI } from '@/lib/api';
import { useRef } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import CrewSuggestions from '@/components/ui/CrewSuggestions';

const TYPE_LABELS = {
  'short-film': 'Short Film', 'feature-film': 'Feature Film', 'youtube': 'YouTube',
  'music-video': 'Music Video', 'podcast': 'Podcast', 'web-series': 'Web Series',
  'documentary': 'Documentary', 'commercial': 'Commercial', 'music': 'Music', 'other': 'Other',
};

const LEVEL_CONFIG = {
  any:          null,
  beginner:     { label: '★ Beginner Friendly', class: 'bg-green-50 text-green-700 border-green-200' },
  intermediate: { label: '◆ Intermediate',      class: 'bg-blue-50 text-blue-700 border-blue-200' },
  advanced:     { label: '▲ Advanced',           class: 'bg-orange-50 text-orange-700 border-orange-200' },
};
const TAG_LABELS = {
  'learning-project':       '📚 Learning Project',
  'practice-collaboration': '🤝 Practice Collab',
  'portfolio-building':     '🎨 Portfolio Build',
  'mentorship-available':   '🎓 Mentorship',
  'paid-opportunity':       '💰 Paid',
};
const TIMELINE_STAGES = ['planning','pre-production','production','post-production','released'];
const STAGE_LABELS = {
  planning:          { label: 'Planning',        icon: '📋' },
  'pre-production':  { label: 'Pre-Production',  icon: '📝' },
  production:        { label: 'Production',      icon: '🎬' },
  'post-production': { label: 'Post-Production', icon: '✂️' },
  released:          { label: 'Released',        icon: '🚀' },
};

function ApplyModal({ project, onClose, onSuccess }) {
  const [form, setForm]     = useState({ roleApplyingFor: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applicationAPI.apply({ projectId: project._id, ...form });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#6b6b66] hover:text-[#111110] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d] mb-6">Apply to "{project.title}"</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2">Role You're Applying For</label>
            <select
              className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              value={form.roleApplyingFor}
              onChange={(e) => setForm({ ...form, roleApplyingFor: e.target.value })}
              required
            >
              <option value="">Select a role</option>
              {project.requiredRoles?.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2">
              Your Message <span className="text-[#a3a39e] normal-case font-normal">(max 1000 chars)</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition min-h-[120px] resize-none"
              placeholder="Tell the project owner why you're a great fit, what you bring, and any relevant experience…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={1000}
              required
            />
            <p className="text-xs text-[#a3a39e] mt-1">{form.message.length}/1000</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white font-semibold text-sm shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((star) => (
        <button key={star} type="button" disabled={disabled} onClick={() => onChange(star)}
          className={`text-xl transition-colors ${star <= value ? 'text-[#7C75FF]' : 'text-[#e0e0dd]'} ${disabled ? 'cursor-default' : 'hover:text-[#b0a9ff] cursor-pointer'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function RateTeamSection({ project, myId }) {
  const everyone = [];
  if (project.createdBy?._id !== myId && project.createdBy?._id?.toString() !== myId) {
    everyone.push({ userId: project.createdBy?._id, name: project.createdBy?.name, username: project.createdBy?.username, role: 'Project Owner' });
  }
  project.teamMembers?.forEach((m) => {
    const uid = m.user?._id || m.user;
    if (uid !== myId && uid?.toString() !== myId) {
      everyone.push({ userId: uid, name: m.user?.name, username: m.user?.username, role: m.role });
    }
  });

  const [alreadyRated, setAlreadyRated] = useState([]);
  const [ratings, setRatings]           = useState({});
  const [submitting, setSubmitting]     = useState({});
  const [submitted, setSubmitted]       = useState({});
  const [initLoading, setInitLoading]   = useState(true);

  useEffect(() => {
    reviewAPI.getMyProjectReviews(project._id)
      .then(({ data }) => setAlreadyRated(data.data || []))
      .catch(() => {})
      .finally(() => setInitLoading(false));
  }, [project._id]);

  const setRating = (userId, field, val) =>
    setRatings((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: val } }));

  const handleSubmit = async (userId) => {
    const r = ratings[userId] || {};
    if (!r.rating) return;
    setSubmitting((prev) => ({ ...prev, [userId]: true }));
    try {
      await reviewAPI.create({ revieweeId: userId, projectId: project._id, rating: r.rating, comment: r.comment || '' });
      setAlreadyRated((prev) => [...prev, userId.toString()]);
      setSubmitted((prev) => ({ ...prev, [userId]: true }));
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit rating'); }
    finally { setSubmitting((prev) => ({ ...prev, [userId]: false })); }
  };

  if (everyone.length === 0) return null;

  return (
    <div className="bg-[#0e0e0d] rounded-2xl p-6 mb-6"
      style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-xl flex-shrink-0">⭐</div>
        <div>
          <h2 className="font-bold text-white">Rate Your Team</h2>
          <p className="text-xs text-white/50 mt-0.5">Project is released — share feedback on your collaborators.</p>
        </div>
      </div>
      {initLoading ? (
        <div className="text-sm text-white/40">Loading…</div>
      ) : (
        <div className="flex flex-col gap-4">
          {everyone.map(({ userId, name, username, role }) => {
            const uid = userId?.toString();
            const done = alreadyRated.includes(uid) || submitted[uid];
            const r = ratings[uid] || {};
            return (
              <div key={uid} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] text-[#3730A3] text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{name}</div>
                    <div className="text-xs text-white/50">{role}{username ? ` · @${username}` : ''}</div>
                  </div>
                  {done && (
                    <span className="ml-auto text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                      ✓ Rated
                    </span>
                  )}
                </div>
                {!done && (
                  <div className="flex flex-col gap-3">
                    <StarRating value={r.rating || 0} onChange={(val) => setRating(uid, 'rating', val)} />
                    <textarea
                      placeholder="Optional comment (max 1000 chars)…" maxLength={1000}
                      value={r.comment || ''} onChange={(e) => setRating(uid, 'comment', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF]/50 transition resize-none min-h-[70px]"
                    />
                    <button disabled={!r.rating || submitting[uid]} onClick={() => handleSubmit(uid)}
                      className="text-sm font-semibold bg-[#6C63FF] hover:bg-[#7C75FF] text-white px-5 py-2 rounded-lg w-fit transition-all disabled:opacity-50">
                      {submitting[uid] ? 'Submitting…' : 'Submit Rating'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── YouTube Link Modal ─────────────────────────────────────────────────── */
function YouTubeLinkModal({ projectTitle, projectType, onClose, onSave }) {
  const isWebSeries = projectType === 'web-series';

  const [link, setLink]         = useState('');
  const [episodes, setEpisodes] = useState([{ title: 'Episode 1', url: '' }]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const isYouTube = (url) =>
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/.test(url);

  const addEpisode = () =>
    setEpisodes((prev) => [...prev, { title: `Episode ${prev.length + 1}`, url: '' }]);

  const removeEpisode = (i) =>
    setEpisodes((prev) => prev.filter((_, idx) => idx !== i));

  const updateEpisode = (i, field, value) =>
    setEpisodes((prev) => prev.map((ep, idx) => idx === i ? { ...ep, [field]: value } : ep));

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (isWebSeries) {
        const valid = episodes.filter((ep) => ep.url.trim());
        if (valid.length === 0) { setError('Add at least one episode YouTube link.'); setSaving(false); return; }
        for (const ep of valid) {
          if (!isYouTube(ep.url)) { setError(`Invalid YouTube URL: ${ep.url}`); setSaving(false); return; }
        }
        await onSave(null, valid.map((ep) => ({ title: ep.title.trim() || 'Episode', url: ep.url.trim() })));
      } else {
        if (!link.trim()) { setError('Please paste a YouTube URL.'); setSaving(false); return; }
        if (!isYouTube(link)) { setError("That doesn't look like a valid YouTube link."); setSaving(false); return; }
        await onSave(link.trim(), null);
      }
      onClose();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#6b6b66] hover:text-[#111110] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {isWebSeries ? '📺' : '🎬'}
          </div>
          <div>
            <h2 className="text-lg font-[Playfair_Display] text-[#0e0e0d] leading-tight">
              {isWebSeries ? 'Add Episode Links' : 'Add Film to Portfolios'}
            </h2>
            <p className="text-xs text-[#6b6b66] mt-0.5">"{projectTitle}" is now Released!</p>
          </div>
        </div>

        <p className="text-sm text-[#6b6b66] mb-5 leading-relaxed">
          {isWebSeries
            ? "Add YouTube links for each episode. They'll appear on every team member's portfolio."
            : 'Paste the YouTube link of your finished film. It will automatically appear in the portfolio of every team member who worked on this project.'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <div className="flex flex-col gap-3">
          {isWebSeries ? (
            <>
              {episodes.map((ep, i) => (
                <div key={i} className="flex flex-col gap-1.5 bg-[#f7f7f6] rounded-xl p-3 border border-[#e0e0dd]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6b6b66] w-16 flex-shrink-0">Title</span>
                    <input
                      type="text"
                      value={ep.title}
                      onChange={(e) => updateEpisode(i, 'title', e.target.value)}
                      placeholder="Episode 1"
                      className="flex-1 rounded-lg border border-[#e0e0dd] bg-white px-3 py-1.5 text-xs text-[#111110] focus:outline-none focus:border-[#6C63FF] transition"
                    />
                    {episodes.length > 1 && (
                      <button onClick={() => removeEpisode(i)} className="text-red-400 hover:text-red-600 transition-colors text-sm flex-shrink-0 ml-1">✕</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6b6b66] w-16 flex-shrink-0">Link</span>
                    <input
                      type="url"
                      value={ep.url}
                      onChange={(e) => updateEpisode(i, 'url', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 rounded-lg border border-[#e0e0dd] bg-white px-3 py-1.5 text-xs text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:border-[#6C63FF] transition"
                    />
                  </div>
                </div>
              ))}
              <button onClick={addEpisode}
                className="text-sm font-semibold text-[#6C63FF] hover:text-[#5750D4] transition-colors py-1">
                + Add Episode
              </button>
            </>
          ) : (
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#f7f7f6] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
            />
          )}
          <div className="flex gap-3 mt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">
              Skip for now
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold shadow-lg shadow-[#6C63FF]/20 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : isWebSeries ? '📺 Save Episodes' : '🎬 Add Film'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TYPE_ACCENT = {
  'short-film': 'bg-violet-500', 'feature-film': 'bg-indigo-500', 'music-video': 'bg-pink-500',
  'youtube': 'bg-red-500', 'podcast': 'bg-blue-500', 'documentary': 'bg-teal-500',
  'commercial': 'bg-orange-500', 'music': 'bg-purple-500', 'web-series': 'bg-cyan-500', 'other': 'bg-slate-500',
};

function ProjectDetailContent() {
  const { id }   = useParams();
  const { user } = useAuth();
  const router   = useRouter();
  const [project, setProject]                       = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [showModal, setShowModal]                   = useState(false);
  const [applied, setApplied]                       = useState(false);
  const [deleting, setDeleting]                     = useState(false);
  const [updatingTimeline, setUpdatingTimeline]     = useState(false);
  const [waitlistRole, setWaitlistRole]             = useState('');
  const [waitlistLoading, setWaitlistLoading]       = useState(false);
  const [waitlistMsg, setWaitlistMsg]               = useState('');
  const [showYoutubeModal, setShowYoutubeModal]     = useState(false);
  const [creatorIsVerified, setCreatorIsVerified]   = useState(false);

  useEffect(() => {
    projectAPI.getById(id)
      .then(({ data }) => setProject(data.data))
      .catch(() => router.push('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch creator's verified status from their Profile
  useEffect(() => {
    if (!project?.createdBy?._id) return;
    profileAPI.getById(project.createdBy._id)
      .then(({ data }) => setCreatorIsVerified(!!data?.data?.isVerified))
      .catch(() => {/* silent — badge just won't show */});
  }, [project?.createdBy?._id]);

  const handleDelete = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(true);
    try { await projectAPI.delete(id); router.push('/dashboard'); }
    catch { setDeleting(false); }
  };

  const handleUpdateTimeline = async (stage) => {
    setUpdatingTimeline(true);
    try {
      const { data } = await timelineAPI.update(id, stage);
      setProject(data.data);
      // When marking as released, prompt for YouTube link if not already set
      if (stage === 'released' && !data.data?.youtubeLink) {
        setShowYoutubeModal(true);
      }
    }
    catch { /* silent */ }
    finally { setUpdatingTimeline(false); }
  };

  const handleYoutubeSave = async (link, episodeLinks) => {
    if (episodeLinks) {
      await projectAPI.setEpisodeLinks(id, episodeLinks);
      setProject((prev) => ({ ...prev, episodeLinks, youtubeLink: episodeLinks[0]?.url || prev.youtubeLink }));
    } else {
      await projectAPI.setYoutubeLink(id, link);
      setProject((prev) => ({ ...prev, youtubeLink: link }));
    }
  };

  const handleWaitlist = async (role) => {
    setWaitlistLoading(true); setWaitlistMsg('');
    try { await waitlistAPI.join(id, role); setWaitlistMsg(`You're on the waitlist for ${role}!`); }
    catch (err) { setWaitlistMsg(err.response?.data?.message || 'Could not join waitlist'); }
    finally { setWaitlistLoading(false); }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!confirm(`Remove ${memberName} from the project? Their role will become open again.`)) return;
    try {
      await fillRoleAPI.removeMember(id, userId);
      setProject((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((m) => m.user?._id !== userId),
        filledRoles: prev.filledRoles?.filter((f) => {
          const member = prev.teamMembers.find((m) => m.user?._id === userId);
          return f.role !== member?.role;
        }) || [],
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove member');
    }
  };

  const handleLeaveProject = async () => {
    if (!confirm('Leave this project? Your role will become open again.')) return;
    try {
      await fillRoleAPI.leaveProject(id);
      router.push('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not leave project');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!project) return null;

  const myId        = user?._id || user?.id;
  const isOwner     = !!(user && myId && (project.createdBy?._id === myId || project.createdBy?._id?.toString() === myId));
  const isTeamMember = !!(user && project.teamMembers?.some((m) => m.user?._id === myId || m.user?._id?.toString() === myId));
  const isFull      = !!(project.requiredRoles?.length > 0 && project.teamMembers?.length >= project.requiredRoles?.length);
  const deadline    = project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const accentColor = TYPE_ACCENT[project.projectType] || TYPE_ACCENT['other'];
  const currentStageIdx = TIMELINE_STAGES.indexOf(project.timelineStage || 'planning');

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {showModal && <ApplyModal project={project} onClose={() => setShowModal(false)} onSuccess={() => setApplied(true)} />}
      {showYoutubeModal && (
        <YouTubeLinkModal
          projectTitle={project.title}
          projectType={project.projectType}
          onClose={() => setShowYoutubeModal(false)}
          onSave={handleYoutubeSave}
        />
      )}

      {/* Owner-only moderation status banner */}
      {isOwner && project.moderationStatus === 'pending' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-lg">⏳</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Your project is under review</p>
              <p className="text-xs text-amber-700 mt-0.5">It's not visible to others yet. Our team usually reviews within 24 hours.</p>
            </div>
          </div>
        </div>
      )}
      {isOwner && project.autoSuspended && (
        <div className="bg-red-100 border-b border-red-300 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-start gap-3">
            <span className="text-lg">⛔</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Your project has been temporarily suspended</p>
              <p className="text-xs text-red-700 mt-0.5">A user reported this project and it has been hidden while our admin team reviews it. You'll be notified of the outcome.</p>
            </div>
          </div>
        </div>
      )}
      {isOwner && project.moderationStatus === 'rejected' && !project.autoSuspended && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-start gap-3">
            <span className="text-lg">❌</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Your project was not approved</p>
              {project.moderationNote && (
                <p className="text-xs text-red-700 mt-0.5">Reason: {project.moderationNote}</p>
              )}
              <p className="text-xs text-red-600 mt-1">Edit your project to address the issue. Our team will be notified to re-review it.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dark Hero */}
      <div className="bg-[#0e0e0d] relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute top-0 left-0 right-0 h-1">
          <div className={`h-full ${accentColor}`} />
        </div>
        <div className="absolute top-0 right-1/3 w-80 h-64 bg-[#6C63FF]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[900px] mx-auto px-6 pt-8 pb-12">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors mb-8">
            ← Back to Projects
          </Link>
          <div className="flex flex-col gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-bold tracking-widest uppercase text-white/60 bg-white/10 px-2.5 py-1 rounded-md">
                  {TYPE_LABELS[project.projectType] || project.projectType}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${project.isPaid ? 'bg-[#6C63FF]/20 text-[#7C75FF] border border-[#6C63FF]/30' : 'bg-white/10 text-white/60'}`}>
                  {project.isPaid ? '💰 Paid' : '🤝 Collab'}
                </span>
                <span className="text-xs capitalize bg-white/10 text-white/60 px-2.5 py-1 rounded-md">{project.status}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-[Playfair_Display] text-white mb-2 leading-tight">{project.title}</h1>
              <div className="flex items-center gap-2 text-sm text-white/50 flex-wrap">
                <span>by</span>
                <Link href={`/profile/${project.createdBy?._id}`} className="text-white/80 hover:text-white font-medium transition-colors">
                  @{project.createdBy?.username}
                </Link>
                {creatorIsVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 tracking-wide">
                    ✔ Verified Creator
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(isOwner || isTeamMember) && (
                <>
                  <Link href={`/projects/${id}/team?tab=chat`}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white transition-all">
                    💬 Team Chat
                  </Link>
                  <Link href={`/projects/${id}/team`}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                    👥 Team Dashboard
                  </Link>
                </>
              )}
              {isOwner ? (
                <>
                  <Link href="/dashboard?tab=incoming"
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                    📋 Applications
                  </Link>
                  <Link href={`/projects/${id}/edit`}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                    ✏️ Edit
                  </Link>
                  <button onClick={handleDelete} disabled={deleting}
                    className="text-sm font-semibold py-2 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              ) : isTeamMember ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-lg">
                    ✓ You're on the Team
                  </span>
                  <button onClick={handleLeaveProject}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    Leave
                  </button>
                </div>
              ) : isFull ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-white/50 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
                    🔒 Team is Full
                  </span>
                  {user && <p className="text-xs text-white/40">Join the waitlist for an open role below ↓</p>}
                </div>
              ) : user ? (
                <button onClick={() => setShowModal(true)} disabled={applied}
                  className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-60">
                  {applied ? '✓ Applied' : 'Apply Now'}
                </button>
              ) : (
                <Link href="/login"
                  className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white transition-all">
                  Login to Apply
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Description Card */}
        <div className="bg-white rounded-2xl border border-[#efefed] p-8 mb-6">
          <p className="text-[#6b6b66] leading-relaxed text-[15px] whitespace-pre-wrap">{project.description}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Roles */}
          <div className="bg-white rounded-2xl border border-[#efefed] p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">Roles Needed</h2>
            <div className="flex flex-col gap-3">
              {project.requiredRoles?.map((role) => {
                const isFilled = project.teamMembers?.some(m => m.role === role);
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-3 py-1.5 bg-[#f0eeff] border border-[#c9c4ff] text-[#3730A3] text-sm font-medium rounded-lg">{role}</span>
                      {isFilled
                        ? <span className="text-xs text-[#a3a39e]">Filled</span>
                        : <span className="text-xs font-semibold text-green-600">Open</span>}
                    </div>
                    {isFilled && user && !isOwner && (
                      <button onClick={() => handleWaitlist(role)} disabled={waitlistLoading}
                        className="mt-1 text-xs text-[#6b6b66] border border-[#efefed] rounded-lg px-3 py-1 hover:border-[#0e0e0d] transition-colors disabled:opacity-50">
                        {waitlistLoading ? 'Joining…' : '+ Join Waitlist'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {waitlistMsg && <p className="text-sm text-[#6b6b66] mt-4 pt-4 border-t border-[#efefed]">{waitlistMsg}</p>}
          </div>

          {/* Project info */}
          <div className="bg-white rounded-2xl border border-[#efefed] p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">Project Details</h2>
            <div className="flex flex-col gap-3 text-sm">
              {project.location?.isRemote && (
                <div className="flex justify-between"><span className="text-[#6b6b66]">Location</span><span>🌐 Remote</span></div>
              )}
              {project.location?.city && !project.location?.isRemote && (
                <div className="flex justify-between">
                  <span className="text-[#6b6b66]">Location</span>
                  <span>📍 {project.location.city}{project.location.country ? `, ${project.location.country}` : ''}</span>
                </div>
              )}
              {deadline && <div className="flex justify-between"><span className="text-[#6b6b66]">Deadline</span><span>{deadline}</span></div>}
              {project.budget && <div className="flex justify-between"><span className="text-[#6b6b66]">Budget</span><span className="text-green-600 font-semibold">{project.budget}</span></div>}
              <div className="flex justify-between"><span className="text-[#6b6b66]">Posted</span><span>{new Date(project.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>

        {/* Crew Match Suggestions — visible to project owner only */}
        {isOwner && (
          <CrewSuggestions
            projectId={id}
            projectTitle={project.title}
          />
        )}

        {/* Team */}
        {project.teamMembers?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">Team ({project.teamMembers.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.teamMembers.map((member) => (
                <div key={member.user?._id} className="flex items-center gap-3 p-4 bg-[#fafaf9] border border-[#efefed] rounded-xl hover:border-[#d0d0ce] hover:shadow-sm transition-all">
                  <Link href={`/profile/${member.user?._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] text-[#3730A3] text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {member.user?.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#111110] truncate">{member.user?.name}</div>
                      <div className="text-xs text-[#6b6b66]">{member.role}</div>
                    </div>
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.user?._id, member.user?.name)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                      title="Remove from project">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Team */}
        {project.timelineStage === 'released' && (isOwner || isTeamMember) && myId && (
          <RateTeamSection project={project} myId={myId} />
        )}

        {/* Tags */}
        {((project.experienceLevel && project.experienceLevel !== 'any') || project.projectTags?.length > 0) && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-5">Project Tags</h2>
            <div className="flex flex-wrap gap-2">
              {project.experienceLevel && LEVEL_CONFIG[project.experienceLevel] && (
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${LEVEL_CONFIG[project.experienceLevel].class}`}>
                  {LEVEL_CONFIG[project.experienceLevel].label}
                </span>
              )}
              {project.projectTags?.map((tag) => TAG_LABELS[tag] && (
                <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#f7f7f6] border border-[#e0e0dd] text-[#111110]">
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-[#efefed] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e]">Production Timeline</h2>
            {(isOwner || isTeamMember) && <p className="text-xs text-[#a3a39e]">Click to update stage</p>}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {TIMELINE_STAGES.map((stage, idx) => {
              const cfg      = STAGE_LABELS[stage];
              const isCurrent = project.timelineStage === stage;
              const isPast    = currentStageIdx > idx;
              const canUpdate = isOwner || isTeamMember;
              return (
                <button key={stage} disabled={!canUpdate || updatingTimeline}
                  onClick={() => canUpdate && handleUpdateTimeline(stage)}
                  className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                    isCurrent ? 'border-[#6C63FF] bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/20' :
                    isPast    ? 'border-[#e0e0dd] bg-[#f7f7f6] text-[#a3a39e]' :
                    'border-[#efefed] bg-white text-[#6b6b66] hover:border-[#0e0e0d]'
                  } ${!canUpdate ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-70`}>
                  <p className="text-xl mb-1">{cfg.icon}</p>
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : isPast ? 'text-[#a3a39e]' : 'text-[#111110]'}`}>{cfg.label}</p>
                  {isCurrent && <p className="text-[10px] text-white/70 mt-0.5">Current</p>}
                  {isPast    && <p className="text-[10px] text-[#a3a39e] mt-0.5">Done ✓</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <AuthProvider><ProjectDetailContent /></AuthProvider>;
}
