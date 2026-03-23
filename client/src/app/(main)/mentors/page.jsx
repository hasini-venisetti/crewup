'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mentorAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const FIELDS = [
  'Directing', 'Screenwriting', 'Cinematography', 'Editing', 'Color Grading',
  'Sound Design', 'VFX', 'Animation', 'Acting', 'Production Design',
  'Film', 'Photography', 'Music', 'Writing', 'Design',
  'Casting', 'Producing', 'Makeup & Styling', 'Storyboarding', 'Motion Graphics',
];
const SESSION_TYPES = ['1:1 Video Call', 'Portfolio Review', 'Project Guidance', 'Career Mentorship', 'Script Review', 'Reel Feedback'];

const AVAIL_CONFIG = {
  'available':      { color: 'bg-green-500',  label: 'Available' },
  'open-to-offers': { color: 'bg-[#6C63FF]',  label: 'Open to Offers' },
  'busy':           { color: 'bg-red-400',     label: 'Busy' },
};

const LOCATION_LABEL = {
  online:  '🌐 Online',
  offline: '📍 In-Person',
  both:    '✅ Online & In-Person',
};

/* ── Star rating display ── */
function Stars({ rating, count }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(full)].map((_, i)  => <span key={`f${i}`} className="text-amber-400 text-xs">★</span>)}
        {half                          && <span className="text-amber-400 text-xs">★</span>}
        {[...Array(empty)].map((_, i) => <span key={`e${i}`} className="text-gray-300 text-xs">★</span>)}
      </div>
      <span className="text-[11px] text-[#6b6b66]">
        {rating > 0 ? `${rating.toFixed(1)} (${count})` : 'No reviews yet'}
      </span>
    </div>
  );
}

/* ── Review modal ── */
function ReviewModal({ mentor, myReview, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(myReview?.rating  || 0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState(myReview?.comment || '');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a star rating.'); return; }
    setSaving(true);
    try {
      const mentorUserId = mentor.user?._id || mentor.user?.id;
      await mentorAPI.submitReview(mentorUserId, { rating, comment });
      toast.success('Review submitted!');
      onSubmit();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#efefed]">
          <div>
            <h3 className="font-bold text-[#0e0e0d] text-base">Rate this Mentor</h3>
            <p className="text-xs text-[#6b6b66] mt-0.5">with <span className="font-semibold">{mentor.user?.name}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button key={star} type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className={`text-4xl transition-transform hover:scale-110 ${(hover || rating) >= star ? 'text-amber-400' : 'text-gray-200'}`}>
                ★
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-[#6b6b66] h-5">
            {(hover || rating) === 1 && 'Poor'}{(hover || rating) === 2 && 'Fair'}
            {(hover || rating) === 3 && 'Good'}{(hover || rating) === 4 && 'Very Good'}{(hover || rating) === 5 && 'Excellent'}
          </p>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            rows={3} maxLength={500}
            placeholder="Share your experience with this mentor… (optional)"
            className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] transition" />
          <p className="text-[11px] text-[#a3a39e] text-right -mt-2">{comment.length}/500</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:border-[#0e0e0d] transition">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !rating}
            className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : '⭐ Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MentorsPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [mentors,      setMentors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [field,        setField]        = useState('');
  const [sessionType,  setSessionType]  = useState('');
  const [locationType, setLocationType] = useState('');
  const [availability, setAvailability] = useState('');

  const [applyTarget,  setApplyTarget]  = useState(null);
  const [applyMsg,     setApplyMsg]     = useState('');
  const [applying,     setApplying]     = useState(false);
  const [appliedIds,   setAppliedIds]   = useState(new Set());

  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await mentorAPI.getAll({ field, availability, sessionType, locationType, search });
      const data = res.data?.data || res.data?.mentors || [];
      setMentors(Array.isArray(data) ? data : []);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [field, availability, sessionType, locationType, search]);

  useEffect(() => {
    const t = setTimeout(fetchMentors, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchMentors, search]);

  const openApplyModal = (mentor) => {
    if (!user) { router.push('/login'); return; }
    setApplyTarget(mentor); setApplyMsg('');
  };

  const handleApply = async () => {
    if (!applyTarget || applying) return;
    const mentorUserId = applyTarget.user?._id || applyTarget.user?.id;
    if (!mentorUserId) return;
    setApplying(true);
    try {
      await mentorAPI.apply(mentorUserId, applyMsg.trim());
      setAppliedIds((prev) => new Set([...prev, applyTarget._id]));
      setApplyTarget(null);
      toast.success('Application sent! The mentor has been notified.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send application. Please try again.');
    } finally { setApplying(false); }
  };

  const clearFilters = () => { setField(''); setAvailability(''); setSessionType(''); setLocationType(''); setSearch(''); };
  const hasFilters = field || availability || sessionType || locationType || search;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-[#0e0e0d] h-64 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-block bg-[#6C63FF] text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">Mentorship</div>
          <h1 className="font-[Playfair_Display] text-5xl font-bold text-white mb-3">Find a Mentor</h1>
          <p className="text-white/50 text-lg max-w-2xl mb-6">Connect with industry experts to elevate your craft</p>
          {user ? (
            <Link href="/profile/edit?tab=mentor" className="bg-white/10 border border-white/20 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition">
              🎓 Manage Mentor Profile
            </Link>
          ) : (
            <Link href="/signup" className="bg-[#6C63FF] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#5750D4] transition">
              Join &amp; Become a Mentor
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#efefed] p-5 shadow-sm mb-8">
          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3a39e] text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e0e0dd] text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition outline-none" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Field', value: field, onChange: setField, options: FIELDS.map(f => ({ val: f, label: f })), placeholder: 'All Fields' },
              { label: 'Session Type', value: sessionType, onChange: setSessionType, options: SESSION_TYPES.map(s => ({ val: s, label: s })), placeholder: 'All Types' },
              { label: 'Mode', value: locationType, onChange: setLocationType, options: [{ val: 'online', label: '🌐 Online' }, { val: 'offline', label: '📍 In-Person' }, { val: 'both', label: '✅ Both' }], placeholder: 'Any Mode' },
              { label: 'Availability', value: availability, onChange: setAvailability, options: Object.entries(AVAIL_CONFIG).map(([k, v]) => ({ val: k, label: v.label })), placeholder: 'All Statuses' },
            ].map(({ label, value, onChange, options, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-[#6b6b66] mb-1.5">{label}</label>
                <select value={value} onChange={e => onChange(e.target.value)}
                  className="w-full rounded-lg border border-[#e0e0dd] bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition outline-none">
                  <option value="">{placeholder}</option>
                  {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs text-[#6C63FF] hover:underline font-medium">✕ Clear all filters</button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#efefed] p-6 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f0f0ee]" />
                  <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-[#f0f0ee] rounded w-3/4" /><div className="h-2.5 bg-[#f0f0ee] rounded w-1/2" /></div>
                </div>
                <div className="space-y-2"><div className="h-2.5 bg-[#f0f0ee] rounded" /><div className="h-2.5 bg-[#f0f0ee] rounded w-5/6" /></div>
              </div>
            ))}
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => {
              const creator      = mentor.user;
              const name         = creator?.name || 'Mentor';
              const userId       = creator?._id || creator?.id;
              const availKey     = mentor.availability || 'available';
              const availCfg     = AVAIL_CONFIG[availKey] || AVAIL_CONFIG['available'];
              const mentorStatus = mentor.mentorStatus || 'open';
              const isUnavailable = mentorStatus === 'paused' || mentorStatus === 'closed';
              const fields       = mentor.mentorFields || [];
              const sessionTypes = mentor.mentorSessionTypes || [];
              const locType      = mentor.mentorLocationType || 'online';
              const languages    = mentor.mentorLanguages || [];
              const rate         = mentor.mentorRate;
              const currency     = mentor.mentorCurrency || 'INR';
              const bio          = mentor.mentorBio || '';
              const experience   = mentor.mentorExperience;
              const ratingAvg    = mentor.mentorRatingAvg || 0;
              const ratingCount  = mentor.mentorRatingCount || 0;
              const isOwnProfile = user && (String(user._id || user.id) === String(userId));
              const hasApplied   = appliedIds.has(mentor._id);
              const city         = mentor.location?.district || mentor.location?.city || '';
              const state        = mentor.location?.state || '';
              const location     = [city, state].filter(Boolean).join(', ');

              return (
                <div key={mentor._id} className="rounded-2xl border border-[#efefed] p-6 hover:shadow-lg hover:-translate-y-0.5 transition duration-300 bg-white flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-lg overflow-hidden flex-shrink-0">
                        {creator?.profileImage
                          ? <img src={creator.profileImage} alt={name} className="w-14 h-14 object-cover" />
                          : name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0e0e0d]">{name}</h3>
                        <p className="text-xs text-[#6b6b66]">{creator?.role || ''}</p>
                        {location && <p className="text-[11px] text-[#a3a39e] mt-0.5">📍 {location}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${availCfg.color} animate-pulse`} />
                      <span className="text-[10px] text-[#6b6b66]">{availCfg.label}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  <Stars rating={ratingAvg} count={ratingCount} />

                  {/* Meta: experience + mode + languages */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 mb-3">
                    {experience != null && (
                      <span className="text-[11px] bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2 py-0.5 rounded-full">{experience}yr exp</span>
                    )}
                    <span className="text-[11px] bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2 py-0.5 rounded-full">
                      {LOCATION_LABEL[locType] || '🌐 Online'}
                    </span>
                    {languages.slice(0, 2).map(lang => (
                      <span key={lang} className="text-[11px] bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2 py-0.5 rounded-full">{lang}</span>
                    ))}
                  </div>

                  {/* Bio */}
                  {bio && <p className="text-xs text-[#6b6b66] mb-3 line-clamp-2 leading-relaxed">{bio}</p>}

                  {/* Fields */}
                  {fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {fields.slice(0, 4).map(f => (
                        <span key={f} className="bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff] rounded-full text-[11px] px-2 py-0.5 font-medium">{f}</span>
                      ))}
                      {fields.length > 4 && <span className="text-[11px] text-[#a3a39e] px-1 self-center">+{fields.length - 4}</span>}
                    </div>
                  )}

                  {/* Session types */}
                  {sessionTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {sessionTypes.slice(0, 3).map(s => (
                        <span key={s} className="bg-[#f0f7ff] text-[#1e6bcc] border border-[#c4dcff] rounded-full text-[11px] px-2 py-0.5 font-medium">{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Rate */}
                  <div className="mb-4">
                    {rate !== null && rate !== undefined ? (
                      Number(rate) === 0
                        ? <span className="text-sm font-bold text-green-600">Free</span>
                        : <span className="text-sm font-bold text-[#0e0e0d]">{currency} {Number(rate).toLocaleString()}<span className="text-xs font-normal text-[#6b6b66]">/hr</span></span>
                    ) : (
                      <span className="text-sm text-[#a3a39e]">Rate not set</span>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2 border-t border-[#efefed] pt-4 mt-auto">
                    <Link href={`/profile/${userId}`}
                      className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition">
                      View Profile
                    </Link>
                    {user && !isOwnProfile && (
                      <button onClick={() => setReviewTarget(mentor)}
                        className="px-2.5 py-2 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:border-amber-400 hover:text-amber-500 transition text-xs font-semibold"
                        title="Leave a review">⭐</button>
                    )}
                    {!isOwnProfile && (
                      <button
                        onClick={() => !hasApplied && !isUnavailable && openApplyModal(mentor)}
                        disabled={hasApplied || isUnavailable}
                        className={`flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg transition ${
                          hasApplied ? 'bg-green-50 border border-green-200 text-green-600 cursor-default'
                          : isUnavailable ? 'bg-[#f7f7f6] border border-[#e0e0dd] text-[#a3a39e] cursor-not-allowed'
                          : 'bg-[#6C63FF] text-white hover:bg-[#5750D4] shadow-sm shadow-[#6C63FF]/20'}`}>
                        {hasApplied ? '✓ Applied' : mentorStatus === 'paused' ? '⏸ Paused' : mentorStatus === 'closed' ? '🔴 Closed' : 'Apply'}
                      </button>
                    )}
                    {isOwnProfile && (
                      <Link href="/profile/edit?tab=mentor"
                        className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg bg-[#f0eeff] border border-[#c9c4ff] text-[#4740CC] hover:bg-[#e4e1ff] transition">
                        ✏️ Edit Profile
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#e0e0dd] p-14 text-center">
            <p className="text-3xl mb-3">🎓</p>
            <p className="font-semibold text-[#111110] mb-1">No mentors found</p>
            <p className="text-sm text-[#6b6b66] mb-5">{hasFilters ? 'Try adjusting your filters.' : 'Be the first to become a mentor!'}</p>
            {hasFilters ? (
              <button onClick={clearFilters} className="bg-[#6C63FF] text-white rounded-xl px-6 py-2.5 font-semibold hover:bg-[#5750D4] transition text-sm">Clear Filters</button>
            ) : user && (
              <Link href="/profile/edit?tab=mentor" className="bg-[#6C63FF] text-white rounded-xl px-6 py-2.5 font-semibold hover:bg-[#5750D4] transition text-sm">Become a Mentor</Link>
            )}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#efefed]">
              <div>
                <h3 className="font-bold text-[#0e0e0d] text-base">Apply for Mentorship</h3>
                <p className="text-xs text-[#6b6b66] mt-0.5">with <span className="font-semibold text-[#0e0e0d]">{applyTarget.user?.name}</span></p>
              </div>
              <button onClick={() => setApplyTarget(null)} className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg">×</button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 bg-[#f7f7f6] rounded-xl p-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-sm overflow-hidden flex-shrink-0">
                  {applyTarget.user?.profileImage
                    ? <img src={applyTarget.user.profileImage} alt="" className="w-10 h-10 object-cover" />
                    : applyTarget.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0e0e0d]">{applyTarget.user?.name}</p>
                  <p className="text-xs text-[#6b6b66]">
                    {(applyTarget.mentorFields || []).slice(0, 2).join(' · ')}
                    {applyTarget.mentorRate !== null && applyTarget.mentorRate !== undefined && (
                      <span className="ml-2 font-medium text-[#4740CC]">
                        {Number(applyTarget.mentorRate) === 0 ? '· Free' : `· ${applyTarget.mentorCurrency || 'INR'} ${Number(applyTarget.mentorRate).toLocaleString()}/hr`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-2">
                Message <span className="normal-case font-normal text-[#a3a39e]">(optional)</span>
              </label>
              <textarea value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)}
                placeholder={`Hi ${applyTarget.user?.name?.split(' ')[0] || 'there'}, I'd love to learn from you! I'm looking to improve my skills in…`}
                rows={4} maxLength={500}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] transition" />
              <p className="text-[11px] text-[#a3a39e] text-right mt-1">{applyMsg.length}/500</p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button onClick={() => setApplyTarget(null)} className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#0e0e0d] transition">Cancel</button>
              <button onClick={handleApply} disabled={applying}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                {applying ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</> : '🎓 Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          mentor={reviewTarget}
          myReview={null}
          onClose={() => setReviewTarget(null)}
          onSubmit={fetchMentors}
        />
      )}
    </div>
  );
}
