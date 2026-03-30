'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { projectAPI, applicationAPI, timelineAPI, waitlistAPI, reviewAPI, fillRoleAPI, profileAPI, mentorAPI } from '@/lib/api';
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

function ApplyModal({ project, onClose, onSuccess, appliedRoles = [], rejectedRoles = [], preselectedRole = '' }) {
  // Active (pending/accepted) roles are blocked from the dropdown; rejected roles can be reapplied
  const availableRoles = (project.requiredRoles || []).filter((r) => !appliedRoles.includes(r));
  const [form, setForm]     = useState({ roleApplyingFor: preselectedRole || availableRoles[0] || '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applicationAPI.apply({ projectId: project._id, ...form });
      onSuccess(form.roleApplyingFor); onClose();
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
        <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d] mb-1">Apply to "{project.title}"</h2>
        {(appliedRoles.length > 0 || rejectedRoles.length > 0) && (
          <p className="text-xs text-[#a3a39e] mb-5">
            {appliedRoles.length > 0 && (
              <>Already applied for: {appliedRoles.map((r) => (
                <span key={r} className="inline-block bg-[#f0eeff] text-[#5750D4] px-2 py-0.5 rounded-full mr-1 font-semibold">{r}</span>
              ))}</>
            )}
            {rejectedRoles.length > 0 && (
              <span className="ml-1">Not selected: {rejectedRoles.map((r) => (
                <span key={r} className="inline-block bg-[#fef2f2] text-[#b91c1c] px-2 py-0.5 rounded-full mr-1 font-semibold">{r}</span>
              ))}</span>
            )}
          </p>
        )}
        {!appliedRoles.length && !rejectedRoles.length && <div className="mb-6" />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
        )}
        {availableRoles.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-sm text-[#111110]">You've applied to all available roles!</p>
            <p className="text-xs text-[#6b6b66] mt-1">Check your dashboard for application statuses.</p>
            <button onClick={onClose} className="mt-4 px-5 py-2 rounded-lg bg-[#f5f5f3] text-sm font-semibold text-[#111110] hover:bg-[#efefed] transition-colors">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2">Role You're Applying For</label>
              <div className="flex flex-wrap gap-2 mb-1">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, roleApplyingFor: r })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      form.roleApplyingFor === r
                        ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-sm'
                        : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#6C63FF] hover:text-[#6C63FF]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {!form.roleApplyingFor && (
                <p className="text-xs text-red-500 mt-1">Please select a role above</p>
              )}
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
            <button type="submit" disabled={loading || !form.roleApplyingFor}
              className="w-full py-3 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white font-semibold text-sm shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Submitting…' : `Apply as ${form.roleApplyingFor || '…'}`}
            </button>
          </form>
        )}
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

const COMP_CONFIG = {
  'paid':          { icon: '💰', label: 'Paid',          cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  'revenue-share': { icon: '📊', label: 'Revenue Share', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'deferred':      { icon: '⏳', label: 'Deferred Pay',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  'unpaid':        { icon: '🤝', label: 'Unpaid Collab', cls: 'bg-white/10 text-white/60 border-white/20' },
  'not-specified': { icon: '❓', label: 'TBD',            cls: 'bg-white/10 text-white/60 border-white/20' },
};

const PROD_TYPE_LABELS = {
  'student': '🎓 Student', 'indie': '🎬 Indie', 'commercial': '💼 Commercial',
  'broadcast': '📺 Broadcast', 'other': '📦 Other',
};
const AUDITION_LABELS = {
  'not-applicable': 'N/A', 'online': '💻 Online', 'studio': '🏢 Studio',
  'production-office': '🏛 Production Office', 'flexible': '🔄 Flexible',
};
const SHOOT_LOC_LABELS = {
  'not-specified': 'TBD', 'studio': '🏢 Studio', 'public-location': '🌆 Public Location',
  'remote': '🌐 Remote', 'flexible': '🔄 Mix / Flexible',
};

/* ── Mini Booking Modal (used on Project page) ── */
function MiniBookModal({ mentor, onClose }) {
  const schedule     = mentor.mentorWeeklySchedule || [];
  const duration     = mentor.mentorSessionDuration || 60;
  const timezone     = mentor.mentorTimezone || 'Asia/Kolkata';
  const sessionTypes = mentor.mentorSessionTypes || [];
  const mentorUserId = mentor.user?._id || mentor.user?.id;

  const [step,         setStep]         = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedSlots,  setBookedSlots]  = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionType,  setSessionType]  = useState(sessionTypes[0] || '');
  const [notes,        setNotes]        = useState('');
  const [booking,      setBooking]      = useState(false);

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    const m = `${year}-${String(month + 1).padStart(2, '0')}`;
    mentorAPI.getSlots(mentorUserId, m).then(r => setBookedSlots(r.data?.data || [])).catch(() => {});
  }, [mentorUserId, year, month]);

  const availableDays = new Set(schedule.map(s => s.day));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const generateSlots = (dateStr) => {
    const sch = schedule.find(s => s.day === new Date(dateStr + 'T12:00:00').getDay());
    if (!sch) return [];
    const slots = [];
    const [sh, sm] = sch.startTime.split(':').map(Number);
    const [eh, em] = sch.endTime.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + duration <= end) {
      const s = `${String(Math.floor(cur / 60)).padStart(2,'0')}:${String(cur % 60).padStart(2,'0')}`;
      const e = `${String(Math.floor((cur + duration) / 60)).padStart(2,'0')}:${String((cur + duration) % 60).padStart(2,'0')}`;
      slots.push({ startTime: s, endTime: e, isBooked: bookedSlots.some(b => b.date === dateStr && b.startTime === s) });
      cur += duration;
    }
    return slots;
  };

  const fmt12 = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const handleBook = async () => {
    setBooking(true);
    try {
      await mentorAPI.requestBooking(mentorUserId, { date: selectedDate, startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, sessionType, notes, timezone, duration });
      setStep(3);
    } catch (err) { toast.error(err?.response?.data?.message || 'Booking failed.'); }
    finally { setBooking(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed] flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#0e0e0d] text-sm">Book a Session</h3>
            <p className="text-xs text-[#6b6b66]">with {mentor.user?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-full bg-[#f7f7f6] flex items-center justify-center text-base">‹</button>
                <p className="text-sm font-semibold">{MONTHS[month]} {year}</p>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-full bg-[#f7f7f6] flex items-center justify-center text-base">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-center text-[10px] font-semibold text-[#a3a39e] py-1">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const date = new Date(year, month, d);
                  const isAvail = availableDays.has(date.getDay()) && date >= today;
                  return (
                    <button key={i} onClick={() => { if (!isAvail) return; const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; setSelectedDate(ds); setStep(1); }} disabled={!isAvail}
                      className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${isAvail ? 'bg-[#f0eeff] border border-[#c9c4ff] text-[#4740CC] hover:bg-[#6C63FF] hover:text-white cursor-pointer' : 'text-[#d0d0cc]'}`}>{d}</button>
                  );
                })}
              </div>
              <p className="text-xs text-[#a3a39e] mt-3 text-center">🌐 {timezone}</p>
            </div>
          )}
          {step === 1 && selectedDate && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(0)} className="text-xs text-[#6C63FF] hover:underline">← Back</button>
                <p className="text-sm font-semibold">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {generateSlots(selectedDate).map(slot => (
                  <button key={slot.startTime} disabled={slot.isBooked} onClick={() => { setSelectedSlot(slot); setStep(2); }}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${slot.isBooked ? 'border-[#efefed] text-[#d0d0cc] line-through cursor-not-allowed' : 'border-[#e0e0dd] text-[#111110] hover:border-[#6C63FF] hover:bg-[#f0eeff] hover:text-[#4740CC]'}`}>
                    {fmt12(slot.startTime)}
                  </button>
                ))}
                {generateSlots(selectedDate).length === 0 && <p className="col-span-3 text-sm text-center text-[#6b6b66] py-4">No slots for this day.</p>}
              </div>
              <p className="text-xs text-[#a3a39e] mt-3">{duration}-min sessions · {timezone}</p>
            </div>
          )}
          {step === 2 && selectedSlot && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2"><button onClick={() => setStep(1)} className="text-xs text-[#6C63FF] hover:underline">← Back</button></div>
              <div className="bg-[#f0eeff] border border-[#c9c4ff] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#4740CC] mb-1">Booking Summary</p>
                <p className="text-sm font-medium text-[#0e0e0d]">{mentor.user?.name}</p>
                <p className="text-xs text-[#6b6b66] mt-0.5">{new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · {fmt12(selectedSlot.startTime)}–{fmt12(selectedSlot.endTime)}</p>
              </div>
              {sessionTypes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-2">Session Type</label>
                  <div className="flex flex-wrap gap-2">
                    {sessionTypes.map(t => <button key={t} type="button" onClick={() => setSessionType(t)} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${sessionType === t ? 'bg-[#6C63FF] text-white border-[#6C63FF]' : 'border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>{t}</button>)}
                  </div>
                </div>
              )}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="What would you like to focus on?" className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] transition" />
            </div>
          )}
          {step === 3 && (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">✅</div>
              <h3 className="font-bold text-[#0e0e0d] mb-2">Booking Requested!</h3>
              <p className="text-sm text-[#6b6b66]">Your request was sent to <strong>{mentor.user?.name}</strong>. They'll confirm and share a meeting link.</p>
            </div>
          )}
        </div>
        {step === 2 && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#efefed] flex-shrink-0">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66]">Back</button>
            <button onClick={handleBook} disabled={booking} className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {booking ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Booking…</> : '📅 Confirm Booking'}
            </button>
          </div>
        )}
        {step === 3 && <div className="px-6 py-4 border-t border-[#efefed] flex-shrink-0"><button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#0e0e0d] text-white text-sm font-semibold">Done</button></div>}
      </div>
    </div>
  );
}

function ProjectDetailContent() {
  const { id }   = useParams();
  const { user } = useAuth();
  const router   = useRouter();
  const [project, setProject]                       = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [showModal, setShowModal]                   = useState(false);
  const [myApplications, setMyApplications]         = useState([]); // all applications for this project by the user
  const [deleting, setDeleting]                     = useState(false);
  const [updatingTimeline, setUpdatingTimeline]     = useState(false);
  const [waitlistRole, setWaitlistRole]             = useState('');
  const [waitlistLoading, setWaitlistLoading]       = useState(false);
  const [waitlistMsg, setWaitlistMsg]               = useState('');
  const [showYoutubeModal, setShowYoutubeModal]     = useState(false);
  const [creatorIsVerified, setCreatorIsVerified]   = useState(false);
  // Status updates
  const [updateText, setUpdateText]                 = useState('');
  const [postingUpdate, setPostingUpdate]           = useState(false);
  // Similar projects
  const [similarProjects, setSimilarProjects]       = useState([]);
  // Mentor suggestions
  const [suggestedMentors, setSuggestedMentors]     = useState([]);
  const [bookTargetProj,   setBookTargetProj]       = useState(null);

  useEffect(() => {
    projectAPI.getById(id)
      .then(({ data }) => {
        setProject(data.data);
        // Fetch similar projects based on type
        const type = data.data?.projectType;
        if (type) {
          projectAPI.getAll({ projectType: type, limit: 4 })
            .then(({ data: simRes }) => {
              const others = (simRes.data || []).filter((p) => p._id !== id);
              setSimilarProjects(others.slice(0, 3));
            })
            .catch(() => {});
        }
      })
      .catch(() => {/* project not found — handled by !project check below */})
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch all of the logged-in user's applications for this project
  useEffect(() => {
    if (!user || !id) return;
    applicationAPI.getMine()
      .then(({ data }) => {
        const apps = data.data || [];
        const mine = apps.filter(
          (app) => app.project?._id === id || app.project === id
        );
        setMyApplications(mine);
      })
      .catch(() => {});
  }, [user, id]);

  // Fetch creator's verified status from their Profile
  useEffect(() => {
    if (!project?.createdBy?._id) return;
    profileAPI.getById(project.createdBy._id)
      .then(({ data }) => setCreatorIsVerified(!!data?.data?.isVerified))
      .catch(() => {/* silent — badge just won't show */});
  }, [project?.createdBy?._id]);

  // Fetch mentor suggestions based on required roles
  const ROLE_TO_MENTOR_FIELD = {
    'director': 'Directing', 'cinematographer': 'Cinematography', 'editor': 'Editing',
    'musician': 'Music', 'actor': 'Acting', 'photographer': 'Photography',
    'writer': 'Screenwriting', 'producer': 'Producing', 'sound-designer': 'Sound Design',
    'colorist': 'Color Grading', 'vfx-artist': 'VFX', 'animator': 'Animation',
    'scriptwriter': 'Screenwriting', 'production-designer': 'Production Design',
    'costume-designer': 'Makeup & Styling', 'makeup-artist': 'Makeup & Styling',
  };
  useEffect(() => {
    if (!project?.requiredRoles?.length) return;
    const fields = [...new Set(
      project.requiredRoles.map(r => ROLE_TO_MENTOR_FIELD[r.toLowerCase().replace(/\s+/g, '-')] || null).filter(Boolean)
    )];
    if (!fields.length) return;
    mentorAPI.getAll({ field: fields[0], availability: 'available' })
      .then(res => {
        const data = res.data?.data || [];
        // Never suggest the logged-in user's own mentor card
        const myId = user?._id || user?.id;
        const filtered = myId
          ? data.filter(m => String(m.user?._id || m.user?.id) !== String(myId))
          : data;
        setSuggestedMentors(filtered.slice(0, 3));
      })
      .catch(() => {});
  }, [project?._id]);

  const handleDelete = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(true);
    try { await projectAPI.delete(id); router.push('/dashboard'); }
    catch { setDeleting(false); }
  };

  const handlePostUpdate = async () => {
    if (!updateText.trim()) return;
    setPostingUpdate(true);
    try {
      const { data } = await projectAPI.postStatusUpdate(id, updateText.trim());
      setProject((prev) => ({
        ...prev,
        statusUpdates: [data.data, ...(prev.statusUpdates || [])],
      }));
      setUpdateText('');
      toast.success('Update posted — applicants and team have been notified.');
    } catch {
      toast.error('Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
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

  // Returns true if user can post/join projects; shows toast otherwise
  const checkVerification = () => {
    if (!user?.isEmailVerified && !user?.phone?.isVerified) {
      toast.error('Verify your email and phone number to post or join projects.', {
        duration: 5000, icon: '🔒',
      });
      return false;
    }
    if (!user?.isEmailVerified) {
      toast.error('Please verify your email before joining projects.', {
        duration: 5000, icon: '📧',
      });
      return false;
    }
    if (!user?.phone?.isVerified) {
      toast.error('Please verify your phone number before joining projects.', {
        duration: 5000, icon: '📱',
      });
      return false;
    }
    return true;
  };

  const handleWaitlist = async (role) => {
    if (!checkVerification()) return;
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
  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white">
      <p className="text-5xl mb-5">🎬</p>
      <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#111110] mb-2">Project Not Found</h2>
      <p className="text-sm text-[#6b6b66] mb-6 max-w-xs">This project may have been removed or the link is invalid.</p>
      <Link href="/projects" className="rounded-xl bg-[#0e0e0d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d2d2b] transition-colors">
        Browse Projects
      </Link>
    </div>
  );

  const myId        = user?._id || user?.id;
  const isOwner     = !!(user && myId && (project.createdBy?._id === myId || project.createdBy?._id?.toString() === myId));
  const isTeamMember = !!(user && project.teamMembers?.some((m) => m.user?._id === myId || m.user?._id?.toString() === myId));
  const isFull      = !!(project.requiredRoles?.length > 0 && project.teamMembers?.length >= project.requiredRoles?.length);
  const deadline    = project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const accentColor = TYPE_ACCENT[project.projectType] || TYPE_ACCENT['other'];
  const currentStageIdx = TIMELINE_STAGES.indexOf(project.timelineStage || 'planning');

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {showModal && (
        <ApplyModal
          project={project}
          onClose={() => setShowModal(false)}
          appliedRoles={myApplications.filter((a) => ['pending','accepted'].includes(a.status)).map((a) => a.roleApplyingFor)}
          rejectedRoles={myApplications.filter((a) => ['rejected','left','removed'].includes(a.status)).map((a) => a.roleApplyingFor)}
          onSuccess={(role) => {
            // Optimistically add the new application so UI updates immediately
            setMyApplications((prev) => [
              ...prev,
              { _id: Date.now(), roleApplyingFor: role, status: 'pending' },
            ]);
          }}
        />
      )}
      {showYoutubeModal && (
        <YouTubeLinkModal
          projectTitle={project.title}
          projectType={project.projectType}
          onClose={() => setShowYoutubeModal(false)}
          onSave={handleYoutubeSave}
        />
      )}

      {/* Owner-only suspension banner */}
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
                {project.compensationType && COMP_CONFIG[project.compensationType] && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${COMP_CONFIG[project.compensationType].cls}`}>
                    {COMP_CONFIG[project.compensationType].icon} {COMP_CONFIG[project.compensationType].label}
                  </span>
                )}
                {project.productionType && (
                  <span className="text-xs bg-white/10 text-white/60 px-2.5 py-1 rounded-md">
                    {PROD_TYPE_LABELS[project.productionType] || project.productionType}
                  </span>
                )}
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
              ) : user ? (() => {
                // Filter out applications where the user has left or been removed
                const activeApplications = myApplications.filter((a) => a.status !== 'left' && a.status !== 'removed');
                const appliedRoles = activeApplications.map((a) => a.roleApplyingFor);
                const availableRoles = (project.requiredRoles || []).filter((r) => !appliedRoles.includes(r));
                const hasAccepted = activeApplications.some((a) => a.status === 'accepted') && isTeamMember;
                const STATUS_CFG = {
                  accepted: { bg: 'bg-green-500/15 border-green-500/30 text-green-300', icon: '✅' },
                  rejected: { bg: 'bg-red-500/15 border-red-500/30 text-red-300',   icon: '❌' },
                  pending:  { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300', icon: '⏳' },
                };
                return (
                  <div className="flex flex-col items-end gap-2">
                    {/* Show each existing application as a pill (hide left/removed) */}
                    {activeApplications.map((app) => {
                      const cfg = STATUS_CFG[app.status] || STATUS_CFG.pending;
                      return (
                        <div key={app._id} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg}`}>
                          {cfg.icon} {app.roleApplyingFor} — {app.status === 'rejected' ? 'Declined' : app.status === 'accepted' ? 'Accepted' : 'Pending'}
                        </div>
                      );
                    })}
                    {/* Team Dashboard link only if still an active team member */}
                    {hasAccepted && (
                      <Link href={`/projects/${id}/team`}
                        className="text-xs font-semibold bg-[#6C63FF] text-white px-3 py-1.5 rounded-lg hover:bg-[#5750D4] transition-colors">
                        👥 Go to Team Dashboard
                      </Link>
                    )}
                    {/* Apply for another role if available */}
                    {availableRoles.length > 0 && (
                      <button
                        onClick={() => { if (checkVerification()) setShowModal(true); }}
                        className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-[0.98] ${
                          myApplications.length > 0
                            ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
                            : 'bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20'
                        }`}>
                        {myApplications.length > 0 ? '+ Apply for Another Role' : 'Apply Now'}
                      </button>
                    )}
                    {myApplications.length > 0 && availableRoles.length === 0 && (
                      <p className="text-[11px] text-white/40">Applied to all available roles</p>
                    )}
                  </div>
                );
              })() : (
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
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-4">Roles Needed</h2>
            <div className="flex flex-col gap-3">
              {project.requiredRoles?.map((role) => {
                const isFilled    = project.teamMembers?.some(m => m.role === role);
                const description = project.roleDescriptions?.[role] || project.roleDescriptions?.get?.(role) || '';
                const positions   = project.rolePositions?.[role]   || project.rolePositions?.get?.(role)   || 1;
                return (
                  <div key={role} className={`rounded-xl border overflow-hidden ${isFilled ? 'border-[#efefed] opacity-60' : 'border-[#c9c4ff]'}`}>
                    {/* Role header */}
                    <div className={`flex items-center justify-between gap-2 px-3 py-2 ${isFilled ? 'bg-[#f7f7f6]' : 'bg-[#f0eeff]'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isFilled ? 'text-[#a3a39e]' : 'text-[#3730A3]'}`}>{role}</span>
                        {positions > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
                            {positions} spots
                          </span>
                        )}
                      </div>
                      {isFilled
                        ? <span className="text-[10px] font-bold text-[#a3a39e] uppercase tracking-wide">Filled</span>
                        : <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">● Open</span>}
                    </div>
                    {/* Description */}
                    {description && (
                      <p className="px-3 py-2 text-xs text-[#6b6b66] leading-relaxed border-t border-[#efefed] bg-white">
                        {description}
                      </p>
                    )}
                    {/* Waitlist button */}
                    {isFilled && user && !isOwner && (
                      <div className="px-3 py-2 bg-white border-t border-[#efefed]">
                        <button onClick={() => handleWaitlist(role)} disabled={waitlistLoading}
                          className="text-xs text-[#6b6b66] border border-[#efefed] rounded-lg px-3 py-1 hover:border-[#0e0e0d] transition-colors disabled:opacity-50 w-full">
                          {waitlistLoading ? 'Joining…' : '+ Join Waitlist'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {waitlistMsg && <p className="text-sm text-[#6b6b66] mt-4 pt-4 border-t border-[#efefed]">{waitlistMsg}</p>}
          </div>

          {/* Project info */}
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-4">Project Details</h2>
              <div className="flex flex-col gap-3 text-sm">
                {(project.location?.isRemote || project.location?.city) && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[#6b6b66] flex-shrink-0">Location</span>
                    <span className="text-right">
                      {project.location.isRemote ? '🌐 Remote' : `📍 ${project.location.city}${project.location.country ? `, ${project.location.country}` : ''}`}
                    </span>
                  </div>
                )}
                {deadline && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[#6b6b66] flex-shrink-0">Deadline</span>
                    <span className="text-right">{deadline}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[#6b6b66] flex-shrink-0">Rate / Budget</span>
                    <span className="text-green-600 font-semibold text-right">{project.budget}</span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[#6b6b66] flex-shrink-0">Posted</span>
                  <span className="text-right">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Compensation details */}
            {project.compensationDetails && (
              <div className="border-t border-[#f5f5f3] pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-2">Compensation Details</p>
                <p className="text-sm text-[#6b6b66] leading-relaxed">{project.compensationDetails}</p>
              </div>
            )}

            {/* Safety & Casting */}
            {(project.auditionFormat || project.shootingLocationType) && (
              <div className="border-t border-[#f5f5f3] pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3">Casting & Safety</p>
                <div className="flex flex-col gap-2 text-sm">
                  {project.auditionFormat && project.auditionFormat !== 'not-applicable' && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[#6b6b66] flex-shrink-0">Audition</span>
                      <span className="text-right">{AUDITION_LABELS[project.auditionFormat] || project.auditionFormat}</span>
                    </div>
                  )}
                  {project.shootingLocationType && project.shootingLocationType !== 'not-specified' && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[#6b6b66] flex-shrink-0">Shoot Location</span>
                      <span className="text-right">{SHOOT_LOC_LABELS[project.shootingLocationType] || project.shootingLocationType}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-500 text-xs flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Legitimate productions <strong>never</strong> ask applicants to pay fees. <Link href="/support/safety" className="underline">Learn more</Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crew Match Suggestions — visible to project owner only */}
        {isOwner && (
          <CrewSuggestions
            projectId={id}
            projectTitle={project.title}
          />
        )}

        {/* ── Mentor for Your Project ── */}
        {suggestedMentors.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-1">🎓 Mentor for Your Project</h2>
                <p className="text-sm text-[#6b6b66]">
                  Need guidance on{' '}
                  <span className="font-semibold text-[#0e0e0d]">{(project.requiredRoles || []).slice(0, 2).join(', ')}</span>?
                  Book a session with an expert mentor.
                </p>
              </div>
              <Link href="/mentors" className="text-xs font-semibold text-[#6C63FF] hover:underline flex-shrink-0">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestedMentors.map(mentor => {
                const creator   = mentor.user;
                const userId    = creator?._id || creator?.id;
                const rate      = mentor.mentorRate;
                const currency  = mentor.mentorCurrency || 'INR';
                const ratingAvg = mentor.mentorRatingAvg || 0;
                const hasSchedule = (mentor.mentorWeeklySchedule || []).length > 0;
                return (
                  <div key={mentor._id} className="rounded-xl border border-[#efefed] p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#c9c4ff] transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-sm overflow-hidden flex-shrink-0">
                        {creator?.profileImage ? <img src={creator.profileImage} alt={creator?.name} className="w-10 h-10 object-cover" /> : creator?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0e0e0d] truncate">{creator?.name}</p>
                        <p className="text-[11px] text-[#6b6b66] truncate">{(mentor.mentorFields || []).slice(0, 2).join(' · ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ratingAvg > 0 && (
                        <>
                          <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(ratingAvg))}</span>
                          <span className="text-[10px] text-[#6b6b66]">{ratingAvg.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[#0e0e0d]">
                      {rate != null ? (Number(rate) === 0 ? <span className="text-green-600">Free</span> : <span>{currency} {Number(rate).toLocaleString()}/hr</span>) : null}
                    </div>
                    <div className="flex gap-2 mt-auto pt-1 border-t border-[#efefed]">
                      <Link href={`/profile/${userId}`} className="flex-1 text-center text-xs font-semibold px-2 py-2 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition">
                        Profile
                      </Link>
                      {hasSchedule && user && String(user._id || user.id) !== String(userId) && (
                        <button onClick={() => setBookTargetProj(mentor)}
                          className="flex-1 text-center text-xs font-semibold px-2 py-2 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5750D4] transition">
                          📅 Book
                        </button>
                      )}
                      {!hasSchedule && user && String(user._id || user.id) !== String(userId) && (
                        <Link href="/mentors" className="flex-1 text-center text-xs font-semibold px-2 py-2 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5750D4] transition">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Booking modal from project page */}
        {bookTargetProj && (
          <MiniBookModal mentor={bookTargetProj} onClose={() => setBookTargetProj(null)} />
        )}

        {/* Team */}
        {project.teamMembers?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e]">Team</h2>
              <span className="text-xs font-semibold bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2.5 py-1 rounded-full">
                {project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.teamMembers.map((member) => (
                <div key={member.user?._id} className="flex items-center gap-3 p-3 bg-[#fafaf9] border border-[#efefed] rounded-xl hover:border-[#d0d0ce] hover:shadow-sm transition-all group">
                  <Link href={`/profile/${member.user?._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {member.user?.profileImage ? (
                      <img src={member.user.profileImage} alt={member.user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#efefed] group-hover:ring-[#c9c4ff] transition-all" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] text-[#3730A3] text-sm font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-[#efefed] group-hover:ring-[#c9c4ff] transition-all">
                        {member.user?.name?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#111110] truncate group-hover:text-[#6C63FF] transition-colors">{member.user?.name}</div>
                      <div className="text-xs text-[#a3a39e]">@{member.user?.username || '—'}</div>
                      <div className="text-[11px] text-[#6b6b66] font-medium mt-0.5">{member.role}</div>
                    </div>
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.user?._id, member.user?.name)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
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
        <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e]">Production Timeline</h2>
            {isOwner && <p className="text-xs text-[#a3a39e]">Click to update stage</p>}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {TIMELINE_STAGES.map((stage, idx) => {
              const cfg       = STAGE_LABELS[stage];
              const isCurrent = project.timelineStage === stage;
              const isPast    = currentStageIdx > idx;
              const canUpdate = isOwner;
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

        {/* ── Status Updates ── */}
        {(isOwner || (project.statusUpdates?.length > 0)) && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-6 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-4">📢 Project Updates</h2>

            {isOwner && (
              <div className="mb-5">
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder='e.g. "Casting is now closed. Shooting starts next week!"'
                  maxLength={500}
                  rows={2}
                  className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:border-[#6C63FF] resize-none transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#a3a39e]">{updateText.length}/500</span>
                  <button
                    onClick={handlePostUpdate}
                    disabled={!updateText.trim() || postingUpdate}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-[#6C63FF] text-white hover:bg-[#5750D4] disabled:opacity-40 transition-colors"
                  >
                    {postingUpdate ? 'Posting…' : 'Post Update'}
                  </button>
                </div>
              </div>
            )}

            {project.statusUpdates?.length > 0 ? (
              <div className="space-y-3">
                {project.statusUpdates.map((u, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-[#111110] leading-relaxed">{u.text}</p>
                      <p className="text-xs text-[#a3a39e] mt-1">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#a3a39e] italic">No updates yet. Post one to notify your applicants and team.</p>
            )}
          </div>
        )}

        {/* ── Similar Projects ── */}
        {similarProjects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-4">Similar Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {similarProjects.map((sp) => (
                <Link key={sp._id} href={`/projects/${sp._id}`}
                  className="bg-white rounded-2xl border border-[#efefed] p-4 hover:border-[#6C63FF]/40 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sp.isPaid ? 'bg-amber-400' : 'bg-purple-400'}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#a3a39e]">
                      {sp.isPaid ? 'Paid' : 'Collab'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#111110] leading-snug group-hover:text-[#6C63FF] transition-colors line-clamp-2">{sp.title}</p>
                  <p className="text-xs text-[#6b6b66] mt-1.5">{sp.requiredRoles?.slice(0, 3).join(' · ')}</p>
                  <p className="text-xs text-[#a3a39e] mt-2">
                    {sp.location?.isRemote ? '🌐 Remote' : `📍 ${sp.location?.city || sp.location?.country || 'Location TBD'}`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between py-2 px-1">
          <p className="text-xs text-[#c0c0bb]">Project ID: {id?.slice(-8)}</p>
          {!isOwner && user && (
            <Link
              href={`/support/report?projectId=${id}&projectTitle=${encodeURIComponent(project.title)}`}
              className="text-xs text-[#c0c0bb] hover:text-red-500 transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Report this project
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <AuthProvider><ProjectDetailContent /></AuthProvider>;
}
