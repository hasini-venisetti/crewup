'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { profileAPI, mentorAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/* ── Constants ── */
const MENTOR_FIELDS = [
  'Directing','Screenwriting','Cinematography','Editing','Color Grading',
  'Sound Design','VFX','Animation','Acting','Production Design',
  'Film','Photography','Music','Writing','Design',
  'Casting','Producing','Makeup & Styling','Storyboarding','Motion Graphics',
];
const SESSION_TYPES  = ['1:1 Video Call','Portfolio Review','Project Guidance','Career Mentorship','Script Review','Reel Feedback'];
const LANGUAGES      = ['Telugu','Hindi','English','Tamil','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi'];
const TIMEZONES      = [
  { value: 'Asia/Kolkata',     label: 'IST — India (UTC+5:30)' },
  { value: 'Asia/Dubai',       label: 'GST — Dubai (UTC+4)' },
  { value: 'Asia/Singapore',   label: 'SGT — Singapore (UTC+8)' },
  { value: 'Asia/Tokyo',       label: 'JST — Tokyo (UTC+9)' },
  { value: 'Europe/London',    label: 'GMT/BST — London' },
  { value: 'Europe/Paris',     label: 'CET — Paris (UTC+1/2)' },
  { value: 'America/New_York', label: 'ET — New York (UTC-5/4)' },
  { value: 'America/Los_Angeles', label: 'PT — Los Angeles (UTC-8/7)' },
  { value: 'America/Chicago',  label: 'CT — Chicago (UTC-6/5)' },
  { value: 'Australia/Sydney', label: 'AEST — Sydney (UTC+10/11)' },
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const inputCls = 'w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition';
const labelCls = 'block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2';

/* ── Avatar helper ── */
function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-sm';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#c9c4ff] text-[#3730A3] font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white uppercase`}>
      {name?.[0] || '?'}
    </div>
  );
}

/* ── Star display ── */
function Stars({ rating }) {
  const full = Math.floor(rating), empty = 5 - Math.ceil(rating);
  return (
    <span className="flex gap-0.5">
      {[...Array(full)].map((_,i) => <span key={`f${i}`} className="text-amber-400 text-sm">★</span>)}
      {[...Array(empty)].map((_,i) => <span key={`e${i}`} className="text-gray-200 text-sm">★</span>)}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MENTOR DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function MentorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  // Read ?tab= from URL (e.g. from notification click) — default 'overview'
  const [tab,      setTab]      = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      return ['overview','settings','applications','sessions'].includes(p) ? p : 'overview';
    }
    return 'overview';
  });

  /* settings form */
  const [form, setForm] = useState({
    isMentor: false, mentorBio: '', mentorFields: [],
    mentorRate: '', mentorCurrency: 'INR',
    mentorStatus: 'open', mentorExperience: '',
    mentorSessionTypes: [], mentorLocationType: 'online',
    mentorLanguages: [], mentorTimezone: 'Asia/Kolkata',
    mentorSessionDuration: 60, mentorWeeklySchedule: [],
  });

  /* applications */
  const [mentorApps,    setMentorApps]    = useState([]);
  const [sentRequests,  setSentRequests]  = useState([]);

  /* bookings */
  const [incomingBookings,  setIncomingBookings]  = useState([]);
  const [myBookings,        setMyBookings]        = useState([]);
  const [bookingAction,     setBookingAction]     = useState({});
  const [meetingLinks,      setMeetingLinks]      = useState({});
  const [chatInputs,        setChatInputs]        = useState({});   // bookingId → text
  const [sendingChat,       setSendingChat]       = useState({});   // bookingId → bool
  const [expandedChats,     setExpandedChats]     = useState({});   // bookingId → bool

  /* reviews */
  const [reviews, setReviews] = useState([]);

  /* ── Load all data ── */
  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;

    profileAPI.getMe()
      .then(({ data }) => {
        const p = data.data;
        setProfile(p);
        setForm({
          isMentor:             p.isMentor            || false,
          mentorBio:            p.mentorBio            || '',
          mentorFields:         p.mentorFields         || [],
          mentorRate:           p.mentorRate != null ? String(p.mentorRate) : '',
          mentorCurrency:       p.mentorCurrency       || 'INR',
          mentorStatus:         p.mentorStatus         || 'open',
          mentorExperience:     p.mentorExperience != null ? String(p.mentorExperience) : '',
          mentorSessionTypes:   p.mentorSessionTypes   || [],
          mentorLocationType:   p.mentorLocationType   || 'online',
          mentorLanguages:      p.mentorLanguages      || [],
          mentorTimezone:       p.mentorTimezone       || 'Asia/Kolkata',
          mentorSessionDuration: p.mentorSessionDuration ?? 60,
          mentorWeeklySchedule: p.mentorWeeklySchedule || [],
        });
        // Load reviews for this mentor
        const uid = p.user?._id || p.user?.id;
        if (uid) mentorAPI.getReviews(uid).then(r => setReviews(r.data?.data || [])).catch(() => {});
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));

    mentorAPI.getApplications().then(({ data: d })     => setMentorApps(d.data || [])).catch(() => {});
    mentorAPI.getSentRequests().then(({ data: d })     => setSentRequests(d.data || [])).catch(() => {});
    mentorAPI.getIncomingBookings().then(({ data: d }) => setIncomingBookings(d.data || [])).catch(() => {});
    mentorAPI.getMyBookings().then(({ data: d })       => setMyBookings(d.data || [])).catch(() => {});
  }, [user, authLoading]);

  /* ── Save settings ── */
  const handleSave = async () => {
    if (form.isMentor && (form.mentorRate === '' || form.mentorRate === null || Number(form.mentorRate) < 0)) {
      toast.error('Please set your hourly rate (enter 0 for free mentorship).');
      return;
    }
    setSaving(true);
    try {
      await mentorAPI.updateSettings({
        isMentor:             form.isMentor,
        mentorBio:            form.mentorBio,
        mentorFields:         form.mentorFields,
        mentorRate:           form.mentorRate !== '' ? Number(form.mentorRate) : null,
        mentorCurrency:       form.mentorCurrency,
        mentorStatus:         form.mentorStatus,
        mentorExperience:     form.mentorExperience !== '' ? Number(form.mentorExperience) : null,
        mentorSessionTypes:   form.mentorSessionTypes,
        mentorLocationType:   form.mentorLocationType,
        mentorLanguages:      form.mentorLanguages,
        mentorTimezone:       form.mentorTimezone,
        mentorSessionDuration: form.mentorSessionDuration,
        mentorWeeklySchedule: form.mentorWeeklySchedule,
      });
      toast.success('Mentor settings saved!');
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  /* ── Application handlers ── */
  const handleAppDecision = (id) => setMentorApps(prev => prev.filter(r => r._id !== id));

  /* ── Booking handlers ── */
  const confirmBooking = async (id) => {
    setBookingAction(p => ({ ...p, [id]: 'confirming' }));
    try {
      await mentorAPI.confirmBooking(id, { meetingLink: meetingLinks[id] || '' });
      setIncomingBookings(p => p.map(b => b._id === id ? { ...b, status: 'confirmed', meetingLink: meetingLinks[id] || '' } : b));
      toast.success('Confirmed! Meeting link sent to mentee.');
    } catch { toast.error('Could not confirm.'); }
    finally { setBookingAction(p => ({ ...p, [id]: null })); }
  };
  const cancelBooking = async (id, side) => {
    if (!confirm('Cancel this booking?')) return;
    setBookingAction(p => ({ ...p, [id]: 'cancelling' }));
    try {
      await mentorAPI.cancelBooking(id, 'Cancelled by ' + side);
      if (side === 'mentor') setIncomingBookings(p => p.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      else setMyBookings(p => p.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled.');
    } catch { toast.error('Could not cancel.'); }
    finally { setBookingAction(p => ({ ...p, [id]: null })); }
  };
  const completeBooking = async (id) => {
    setBookingAction(p => ({ ...p, [id]: 'completing' }));
    try {
      await mentorAPI.completeBooking(id);
      setIncomingBookings(p => p.map(b => b._id === id ? { ...b, status: 'completed' } : b));
      toast.success('Session marked as completed!');
    } catch { toast.error('Could not mark as completed.'); }
    finally { setBookingAction(p => ({ ...p, [id]: null })); }
  };

  /* ── Booking Chat ── */
  const sendBookingChat = async (bookingId, isMentorSide) => {
    const text = (chatInputs[bookingId] || '').trim();
    if (!text) return;
    setSendingChat(p => ({ ...p, [bookingId]: true }));
    try {
      const res = await mentorAPI.sendBookingChat(bookingId, text);
      const updatedChat = res.data?.data || [];
      if (isMentorSide) {
        setIncomingBookings(p => p.map(b => b._id === bookingId ? { ...b, chat: updatedChat } : b));
      } else {
        setMyBookings(p => p.map(b => b._id === bookingId ? { ...b, chat: updatedChat } : b));
      }
      setChatInputs(p => ({ ...p, [bookingId]: '' }));
    } catch { toast.error('Could not send message.'); }
    finally { setSendingChat(p => ({ ...p, [bookingId]: false })); }
  };

  /* ── Derived ── */
  const pendingApps     = mentorApps.filter(r => r.status === 'pending');
  const pendingBookings = incomingBookings.filter(b => b.status === 'pending');
  const upcomingMySess  = myBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const pastMySess      = myBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const totalBadge      = pendingApps.length + pendingBookings.length;

  const TABS = [
    { key: 'overview',     label: '📊 Overview' },
    { key: 'settings',     label: '⚙️ Settings' },
    { key: 'applications', label: '🎓 Applications', badge: pendingApps.length },
    { key: 'sessions',     label: '📅 Sessions',     badge: pendingBookings.length },
  ];

  /* ── Guards ── */
  if (authLoading || loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!user) return null;

  const ratingAvg   = profile?.mentorRatingAvg  || 0;
  const ratingCount = profile?.mentorRatingCount || 0;

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* ── Header ── */}
      <div className="bg-[#0e0e0d] pt-8 pb-10 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="relative max-w-[860px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/80 transition-colors">← Dashboard</Link>
            {tab === 'settings' && (
              <button onClick={handleSave} disabled={saving}
                className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            )}
          </div>

          {/* Mentor identity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] flex items-center justify-center text-2xl font-bold text-[#3730A3] overflow-hidden flex-shrink-0">
              {profile?.user?.profileImage
                ? <img src={profile.user.profileImage} alt="" className="w-14 h-14 object-cover" />
                : profile?.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold mb-0.5">Mentor Dashboard</p>
              <h1 className="text-2xl font-[Playfair_Display] text-white">{profile?.user?.name}</h1>
              {ratingAvg > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Stars rating={ratingAvg} />
                  <span className="text-white/50 text-xs">{ratingAvg.toFixed(1)} · {ratingCount} review{ratingCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            {/* Quick status pills */}
            <div className="ml-auto hidden sm:flex flex-col items-end gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${form.isMentor ? 'bg-[#6C63FF] text-white' : 'bg-white/10 text-white/50'}`}>
                {form.isMentor ? '🎓 Active Mentor' : '⭕ Not Listed'}
              </span>
              {form.isMentor && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  form.mentorStatus === 'open' ? 'bg-green-500/20 text-green-400' :
                  form.mentorStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {form.mentorStatus === 'open' ? '🟢 Open' : form.mentorStatus === 'paused' ? '⏸ Paused' : '🔴 Closed'}
                </span>
              )}
            </div>
          </div>

          {/* Pending notification */}
          {totalBadge > 0 && (
            <div className="flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/40 rounded-xl px-4 py-2.5">
              <span className="text-sm">🔔</span>
              <p className="text-sm text-white/80">
                You have <strong className="text-white">{totalBadge}</strong> pending {totalBadge === 1 ? 'item' : 'items'} waiting for your response.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-6 py-8">

        {/* ── Tab Nav ── */}
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 mb-8 w-fit overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.key ? 'bg-[#0e0e0d] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#f7f7f6]'
              }`}>
              {t.label}
              {t.badge > 0 && (
                <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${tab === t.key ? 'bg-white text-[#0e0e0d]' : 'bg-[#6C63FF] text-white'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-6">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Rating',    value: ratingAvg > 0 ? ratingAvg.toFixed(1) : '—', sub: `${ratingCount} review${ratingCount !== 1 ? 's' : ''}`, icon: '⭐' },
                { label: 'Total Sessions', value: incomingBookings.filter(b => b.status === 'completed').length, sub: 'completed', icon: '✅' },
                { label: 'Pending',   value: pendingApps.length + pendingBookings.length, sub: 'need action', icon: '🔔' },
                { label: 'Listing',   value: form.isMentor ? (form.mentorStatus === 'open' ? 'Open' : form.mentorStatus === 'paused' ? 'Paused' : 'Closed') : 'Off', sub: form.isMentor ? 'on directory' : 'not listed', icon: form.isMentor ? '🟢' : '⭕' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#efefed] p-5">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-2xl font-bold text-[#0e0e0d]">{s.value}</p>
                  <p className="text-xs font-semibold text-[#6b6b66] mt-0.5">{s.label}</p>
                  <p className="text-[11px] text-[#a3a39e]">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Profile preview card */}
            {form.isMentor && (
              <div className="bg-white rounded-2xl border border-[#efefed] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0e0e0d]">Your Mentor Profile</h3>
                  <button onClick={() => setTab('settings')} className="text-xs text-[#6C63FF] hover:underline font-semibold">Edit Settings →</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(form.mentorFields || []).map(f => (
                    <span key={f} className="bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff] rounded-full text-xs px-2.5 py-0.5 font-medium">{f}</span>
                  ))}
                  {form.mentorFields.length === 0 && <p className="text-xs text-[#a3a39e]">No fields set — add them in Settings</p>}
                </div>
                {form.mentorBio ? (
                  <p className="text-sm text-[#6b6b66] leading-relaxed line-clamp-2">{form.mentorBio}</p>
                ) : (
                  <p className="text-xs text-[#a3a39e]">No mentor bio yet — add one in Settings</p>
                )}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#efefed] text-xs text-[#6b6b66]">
                  {form.mentorRate !== '' && form.mentorRate != null && (
                    <span>💰 {Number(form.mentorRate) === 0 ? 'Free' : `${form.mentorCurrency} ${Number(form.mentorRate).toLocaleString()}/hr`}</span>
                  )}
                  {form.mentorExperience && <span>🏅 {form.mentorExperience}yr exp</span>}
                  {form.mentorLocationType && <span>{form.mentorLocationType === 'online' ? '🌐 Online' : form.mentorLocationType === 'offline' ? '📍 In-Person' : '✅ Online & In-Person'}</span>}
                  {form.mentorTimezone && <span>🕐 {form.mentorTimezone}</span>}
                  {form.mentorSessionDuration && <span>⏱ {form.mentorSessionDuration} min sessions</span>}
                  {(form.mentorWeeklySchedule || []).length > 0 && (
                    <span>📅 {form.mentorWeeklySchedule.map(s => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.day]).join(', ')}</span>
                  )}
                </div>
                <Link href={`/profile/${profile?.user?._id || profile?.user?.id}`}
                  className="mt-4 block text-center text-xs font-semibold px-4 py-2 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition">
                  View Public Mentor Profile →
                </Link>
              </div>
            )}

            {!form.isMentor && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#e0e0dd] p-10 text-center">
                <p className="text-4xl mb-3">🎓</p>
                <h3 className="font-bold text-[#0e0e0d] mb-2">You're not listed as a mentor yet</h3>
                <p className="text-sm text-[#6b6b66] mb-5">Enable mentoring in Settings to appear in the Mentor Directory and start accepting bookings.</p>
                <button onClick={() => setTab('settings')}
                  className="bg-[#6C63FF] text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-[#5750D4] transition">
                  Go to Settings
                </button>
              </div>
            )}

            {/* Recent reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#efefed] p-6">
                <h3 className="text-sm font-bold text-[#0e0e0d] mb-4">Recent Reviews</h3>
                <div className="flex flex-col gap-4">
                  {reviews.slice(0, 5).map(rv => (
                    <div key={rv._id} className="flex gap-3">
                      <Avatar name={rv.reviewer?.name} image={rv.reviewer?.profileImage} size="sm" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#0e0e0d]">{rv.reviewer?.name}</span>
                          <Stars rating={rv.rating} />
                        </div>
                        {rv.comment && <p className="text-xs text-[#6b6b66] leading-relaxed">{rv.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: SETTINGS
        ══════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-8 flex flex-col gap-6">

            {/* Earnings banner */}
            <div className="bg-[#0e0e0d] rounded-xl p-5 flex gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">How earnings work</p>
                <p className="text-xs leading-relaxed text-white/60">You set your own rate — free or paid. Every rupee goes directly to you. CREWUPFILMS takes no commission.</p>
              </div>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 border border-[#efefed] rounded-xl">
              <div>
                <p className="font-medium text-[#111110]">Open to Mentoring</p>
                <p className="text-sm text-[#6b6b66]">Show up in the Mentor Directory</p>
              </div>
              <button onClick={() => {
                if (!form.isMentor && !user?.isEmailVerified) {
                  toast.error('Please verify your email before becoming a mentor.');
                  router.push('/verify-email');
                  return;
                }
                setForm(f => ({ ...f, isMentor: !f.isMentor }));
              }}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.isMentor ? 'bg-[#6C63FF]' : 'bg-[#efefed]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMentor ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              {!user?.isEmailVerified && !form.isMentor && (
                <p className="text-xs text-amber-600 mt-1 w-full">⚠️ <a href="/verify-email" className="underline">Verify your email</a> to enable mentoring.</p>
              )}
            </div>

            {form.isMentor && (<>

              {/* Listing Status */}
              <div>
                <label className={labelCls}>Listing Status</label>
                <p className="text-xs text-[#6b6b66] mb-3">Control whether new mentees can apply to you right now.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'open',   label: '🟢 Open',   desc: 'Accepting requests' },
                    { key: 'paused', label: '⏸ Paused',  desc: 'Temporarily closed' },
                    { key: 'closed', label: '🔴 Closed',  desc: 'Not accepting' },
                  ].map(({ key, label, desc }) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, mentorStatus: key }))}
                      className={`p-3 rounded-xl border text-left transition-colors ${form.mentorStatus === key ? 'border-[#6C63FF] bg-[#f0eeff]' : 'border-[#efefed] hover:border-[#6C63FF]/40'}`}>
                      <p className={`text-xs font-semibold ${form.mentorStatus === key ? 'text-[#4740CC]' : 'text-[#111110]'}`}>{label}</p>
                      <p className="text-[10px] text-[#6b6b66] mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentor Bio */}
              <div>
                <label className={labelCls}>Mentor Bio</label>
                <textarea value={form.mentorBio} onChange={e => setForm(f => ({ ...f, mentorBio: e.target.value }))}
                  rows={3} maxLength={500} placeholder="Briefly describe your experience and what you can help mentees with…"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-[#a3a39e] text-right mt-1">{(form.mentorBio || '').length}/500</p>
              </div>

              {/* Experience */}
              <div>
                <label className={labelCls}>Years of Experience</label>
                <input type="number" min="0" max="50" step="1" placeholder="e.g. 5"
                  value={form.mentorExperience}
                  onChange={e => setForm(f => ({ ...f, mentorExperience: e.target.value }))}
                  className={`${inputCls} w-40`} />
              </div>

              {/* Mentorship Fields */}
              <div>
                <label className={labelCls}>Mentorship Fields</label>
                <div className="flex flex-wrap gap-2">
                  {MENTOR_FIELDS.map(mf => {
                    const active = (form.mentorFields || []).includes(mf);
                    return (
                      <button key={mf} type="button"
                        onClick={() => setForm(prev => ({ ...prev, mentorFields: active ? prev.mentorFields.filter(x => x !== mf) : [...prev.mentorFields, mf] }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#0e0e0d]'}`}>
                        {mf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Types */}
              <div>
                <label className={labelCls}>Session Types</label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map(s => {
                    const active = (form.mentorSessionTypes || []).includes(s);
                    return (
                      <button key={s} type="button"
                        onClick={() => setForm(prev => ({ ...prev, mentorSessionTypes: active ? prev.mentorSessionTypes.filter(x => x !== s) : [...prev.mentorSessionTypes, s] }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#6C63FF] text-white border-[#6C63FF]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Mode */}
              <div>
                <label className={labelCls}>Session Mode</label>
                <div className="flex gap-2">
                  {[
                    { key: 'online',  label: '🌐 Online Only' },
                    { key: 'offline', label: '📍 In-Person Only' },
                    { key: 'both',    label: '✅ Both' },
                  ].map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, mentorLocationType: key }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.mentorLocationType === key ? 'border-[#6C63FF] bg-[#f0eeff] text-[#4740CC]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className={labelCls}>Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => {
                    const active = (form.mentorLanguages || []).includes(lang);
                    return (
                      <button key={lang} type="button"
                        onClick={() => setForm(prev => ({ ...prev, mentorLanguages: active ? prev.mentorLanguages.filter(x => x !== lang) : [...prev.mentorLanguages, lang] }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#0e0e0d]'}`}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className={`${labelCls} mb-0`}>Hourly Rate</label>
                  <span className="text-xs bg-[#f0f0ee] text-[#6b6b66] border border-[#e0e0dd] px-2 py-0.5 rounded-full font-medium">Enter 0 for free</span>
                </div>
                <div className="flex gap-2">
                  <select value={form.mentorCurrency} onChange={e => setForm(f => ({ ...f, mentorCurrency: e.target.value }))}
                    className="rounded-lg border border-[#e0e0dd] text-sm text-[#111110] px-3 py-2.5 focus:outline-none focus:border-[#6C63FF] bg-white w-24">
                    {['INR','USD','EUR','GBP','AED','SGD','AUD','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" min="0" step="1" placeholder="e.g. 500 or 0 for free" value={form.mentorRate}
                    onChange={e => setForm(f => ({ ...f, mentorRate: e.target.value }))}
                    className={`${inputCls} flex-1`} />
                </div>
                {form.mentorRate !== '' && form.mentorRate != null && (
                  Number(form.mentorRate) === 0
                    ? <p className="text-xs text-[#6b6b66] mt-2">Mentees will see: <strong className="text-green-700">Free</strong></p>
                    : Number(form.mentorRate) > 0
                      ? <p className="text-xs text-[#6b6b66] mt-2">Mentees will see: <strong>{form.mentorCurrency} {Number(form.mentorRate).toLocaleString()} / hr</strong></p>
                      : null
                )}
              </div>

              {/* ── Booking & Availability ── */}
              <div className="border-t border-[#efefed] pt-6">
                <h3 className="text-sm font-bold text-[#111110] mb-1">📅 Booking & Availability</h3>
                <p className="text-xs text-[#6b6b66] mb-5">Set your timezone, session length, and weekly hours so mentees can book exact time slots.</p>

                {/* Timezone */}
                <div className="mb-5">
                  <label className={labelCls}>Your Timezone</label>
                  <select value={form.mentorTimezone} onChange={e => setForm(f => ({ ...f, mentorTimezone: e.target.value }))} className={inputCls}>
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>

                {/* Session Duration — max duration mentees can pick */}
                <div className="mb-5">
                  <label className={labelCls}>Max Session Duration</label>
                  <p className="text-xs text-[#a3a39e] mb-2">Mentees can book up to this length — they choose their preferred duration.</p>
                  <div className="flex gap-2">
                    {[
                      { mins: 30,  label: '30 min' },
                      { mins: 60,  label: '1 hr'   },
                      { mins: 90,  label: '1.5 hr' },
                      { mins: 120, label: '2 hr'   },
                    ].map(({ mins, label }) => (
                      <button key={mins} type="button" onClick={() => setForm(f => ({ ...f, mentorSessionDuration: mins }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${form.mentorSessionDuration === mins ? 'border-[#6C63FF] bg-[#f0eeff] text-[#4740CC]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div>
                  <label className={labelCls}>Weekly Availability</label>
                  <p className="text-xs text-[#6b6b66] mb-3">Check each day you're available and set your hours.</p>
                  <div className="flex flex-col gap-2">
                    {DAYS.map((day, idx) => {
                      const slot    = (form.mentorWeeklySchedule || []).find(s => s.day === idx);
                      const enabled = !!slot;
                      return (
                        <div key={day} className={`rounded-xl border transition-colors ${enabled ? 'border-[#6C63FF]/40 bg-[#f8f7ff]' : 'border-[#efefed] bg-white'}`}>
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button type="button" onClick={() => {
                              const sched = form.mentorWeeklySchedule || [];
                              if (enabled) setForm(f => ({ ...f, mentorWeeklySchedule: sched.filter(s => s.day !== idx) }));
                              else setForm(f => ({ ...f, mentorWeeklySchedule: [...sched, { day: idx, startTime: '09:00', endTime: '17:00' }] }));
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${enabled ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-[#d0d0cc] hover:border-[#6C63FF]'}`}>
                              {enabled && <span className="text-white text-xs font-bold">✓</span>}
                            </button>
                            <span className={`text-sm font-semibold w-8 ${enabled ? 'text-[#4740CC]' : 'text-[#6b6b66]'}`}>{day}</span>
                            {enabled && (
                              <div className="flex items-center gap-2 ml-auto">
                                <input type="time" value={slot.startTime}
                                  onChange={e => setForm(f => ({ ...f, mentorWeeklySchedule: f.mentorWeeklySchedule.map(s => s.day === idx ? { ...s, startTime: e.target.value } : s) }))}
                                  className="rounded-lg border border-[#e0e0dd] text-sm px-2 py-1.5 focus:outline-none focus:border-[#6C63FF] bg-white" />
                                <span className="text-xs text-[#6b6b66]">to</span>
                                <input type="time" value={slot.endTime}
                                  onChange={e => setForm(f => ({ ...f, mentorWeeklySchedule: f.mentorWeeklySchedule.map(s => s.day === idx ? { ...s, endTime: e.target.value } : s) }))}
                                  className="rounded-lg border border-[#e0e0dd] text-sm px-2 py-1.5 focus:outline-none focus:border-[#6C63FF] bg-white" />
                              </div>
                            )}
                            {!enabled && <span className="text-xs text-[#a3a39e] ml-auto">Not available</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#a3a39e] mt-3">Times are in your selected timezone ({form.mentorTimezone}).</p>
                </div>
              </div>

            </>)}

            {/* Save button (bottom) */}
            <div className="pt-2">
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#6C63FF] hover:bg-[#7C75FF] text-white font-semibold text-sm shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: APPLICATIONS
        ══════════════════════════════════════════════ */}
        {tab === 'applications' && (
          <div className="flex flex-col gap-6">

            {/* Incoming mentorship applications */}
            <div>
              <h3 className="text-sm font-bold text-[#0e0e0d] mb-4 flex items-center gap-2">
                Incoming Requests
                {pendingApps.length > 0 && <span className="text-xs font-bold bg-[#f0eeff] text-[#5750D4] px-2 py-0.5 rounded-full">{pendingApps.length} pending</span>}
              </h3>
              {mentorApps.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#e0e0dd] p-10 text-center">
                  <p className="text-3xl mb-3">🎓</p>
                  <p className="font-semibold text-[#111110] mb-1">No applications yet</p>
                  <p className="text-sm text-[#6b6b66]">When someone applies for your mentorship, it will appear here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#efefed] overflow-hidden">
                  {mentorApps.map((req, i) => (
                    <MentorAppCard key={req._id} req={req} onDecision={handleAppDecision}
                      className={i < mentorApps.length - 1 ? 'border-b border-[#f5f5f3]' : ''} />
                  ))}
                </div>
              )}
            </div>

            {/* Sent requests (as mentee) */}
            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#0e0e0d] mb-4">Requests You Sent</h3>
                <div className="bg-white rounded-2xl border border-[#efefed] overflow-hidden">
                  {sentRequests.map((req, i) => {
                    const mentor = req.recipient;
                    return (
                      <div key={req._id} className={`flex items-center gap-3 px-5 py-4 ${i < sentRequests.length - 1 ? 'border-b border-[#f5f5f3]' : ''}`}>
                        <Avatar name={mentor?.name} image={mentor?.profileImage} size="sm" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${mentor?._id}`} className="text-sm font-semibold text-[#111110] hover:text-[#6C63FF] transition-colors truncate block">{mentor?.name}</Link>
                          <p className="text-xs text-[#6b6b66]">Mentorship request</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          req.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>{req.status === 'pending' ? '⏳' : req.status === 'accepted' ? '✅' : '❌'} {req.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: SESSIONS
        ══════════════════════════════════════════════ */}
        {tab === 'sessions' && (
          <div className="flex flex-col gap-8">

            {/* ── Incoming Bookings (mentor side) ── */}
            <div>
              <h3 className="text-sm font-bold text-[#0e0e0d] mb-4 flex items-center gap-2">
                Incoming Bookings
                {pendingBookings.length > 0 && <span className="text-xs font-bold bg-[#f0eeff] text-[#5750D4] px-2 py-0.5 rounded-full">{pendingBookings.length} pending</span>}
              </h3>
              {incomingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#e0e0dd] p-10 text-center">
                  <p className="text-3xl mb-3">📅</p>
                  <p className="font-semibold text-[#111110] mb-1">No session bookings yet</p>
                  <p className="text-sm text-[#6b6b66] mb-4">Set your weekly availability in Settings so mentees can book sessions with you.</p>
                  <button onClick={() => setTab('settings')} className="bg-[#6C63FF] text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-[#5750D4] transition">Set Up Schedule</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {incomingBookings.map(b => {
                    const act = bookingAction[b._id];
                    const statusColors = { pending: 'bg-amber-50 border-amber-200 text-amber-700', confirmed: 'bg-green-50 border-green-200 text-green-700', cancelled: 'bg-red-50 border-red-200 text-red-500', completed: 'bg-[#f7f7f6] border-[#e0e0dd] text-[#6b6b66]' };
                    return (
                      <div key={b._id} className="bg-white border border-[#efefed] rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={b.mentee?.name} image={b.mentee?.profileImage} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-[#0e0e0d]">{b.mentee?.name || 'Mentee'}</p>
                              <p className="text-xs text-[#6b6b66]">{b.sessionType || '1:1 Session'}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border flex-shrink-0 ${statusColors[b.status] || statusColors.pending}`}>{b.status}</span>
                        </div>
                        <p className="text-xs text-[#6b6b66] mb-3">
                          📅 {b.date} &nbsp;·&nbsp; {b.startTime}–{b.endTime} &nbsp;·&nbsp; {b.duration || 60} min &nbsp;·&nbsp; {b.timezone}
                        </p>
                        {b.meetingAddress && b.status === 'pending' && (
                          <p className="text-xs text-[#a3a39e] bg-[#f7f7f6] border border-[#efefed] rounded-lg px-3 py-2 mb-2">
                            📍 In-person session — mentee&apos;s location revealed after you confirm.
                          </p>
                        )}
                        {b.meetingAddress && b.status !== 'pending' && (
                          <p className="text-xs text-[#4740CC] bg-[#f0eeff] border border-[#c9c4ff] rounded-lg px-3 py-2 mb-2 font-medium">
                            📍 Mentee&apos;s Location: {b.meetingAddress}
                          </p>
                        )}
                        {b.notes && <p className="text-xs text-[#6b6b66] bg-[#f7f7f6] rounded-lg px-3 py-2 mb-3">💬 {b.notes}</p>}

                        {/* ── Booking Negotiation Chat ── */}
                        <div className="mb-3 border border-[#efefed] rounded-xl overflow-hidden">
                          <button type="button"
                            onClick={() => setExpandedChats(p => ({ ...p, [b._id]: !p[b._id] }))}
                            className="w-full flex items-center justify-between px-3 py-2 bg-[#f7f7f6] text-xs font-semibold text-[#6b6b66] hover:bg-[#efefed] transition">
                            <span>💬 Negotiation Chat {(b.chat?.length || 0) > 0 ? `(${b.chat.length})` : ''}</span>
                            <span>{expandedChats[b._id] ? '▲' : '▼'}</span>
                          </button>
                          {expandedChats[b._id] && (
                            <div className="px-3 pb-3 pt-2 flex flex-col gap-2">
                              {(b.chat || []).length === 0 && (
                                <p className="text-xs text-[#a3a39e] text-center py-2">No messages yet. Discuss timing, rate, or details here.</p>
                              )}
                              {(b.chat || []).map((msg, idx) => {
                                const isMe = String(msg.sender) === String(user?._id || user?.id);
                                return (
                                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${isMe ? 'bg-[#6C63FF] text-white rounded-br-sm' : 'bg-[#f0f0ee] text-[#111110] rounded-bl-sm'}`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Type a message…"
                                  value={chatInputs[b._id] || ''}
                                  onChange={e => setChatInputs(p => ({ ...p, [b._id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && sendBookingChat(b._id, true)}
                                  className="flex-1 rounded-lg border border-[#e0e0dd] px-3 py-1.5 text-xs focus:outline-none focus:border-[#6C63FF] transition"
                                />
                                <button onClick={() => sendBookingChat(b._id, true)} disabled={sendingChat[b._id]}
                                  className="px-3 py-1.5 rounded-lg bg-[#6C63FF] text-white text-xs font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition">
                                  {sendingChat[b._id] ? '…' : '→'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {b.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Paste meeting link (Google Meet, Zoom…)"
                              value={meetingLinks[b._id] || ''}
                              onChange={e => setMeetingLinks(p => ({ ...p, [b._id]: e.target.value }))}
                              className="w-full rounded-lg border border-[#e0e0dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF] transition" />
                            <div className="flex gap-2">
                              <button onClick={() => confirmBooking(b._id)} disabled={!!act}
                                className="flex-1 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition">
                                {act === 'confirming' ? 'Confirming…' : '✅ Confirm Booking'}
                              </button>
                              <button onClick={() => cancelBooking(b._id, 'mentor')} disabled={!!act}
                                className="flex-1 py-2 rounded-xl border border-[#e0e0dd] text-xs font-semibold text-[#6b6b66] hover:border-red-300 hover:text-red-500 disabled:opacity-50 transition">
                                {act === 'cancelling' ? 'Cancelling…' : '✕ Decline'}
                              </button>
                            </div>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <div className="flex gap-2">
                            {b.meetingLink && (
                              <a href={b.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="flex-1 text-center py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition">
                                🔗 Open Meeting Link
                              </a>
                            )}
                            <button onClick={() => completeBooking(b._id)} disabled={!!act}
                              className="flex-1 py-2 rounded-xl border border-[#e0e0dd] text-xs font-semibold text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] disabled:opacity-50 transition">
                              {act === 'completing' ? 'Marking…' : '✓ Mark Done'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── My Sessions (as mentee) ── */}
            <div>
              <h3 className="text-sm font-bold text-[#0e0e0d] mb-4">My Booked Sessions</h3>
              {myBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#e0e0dd] p-10 text-center">
                  <p className="text-3xl mb-3">🗓</p>
                  <p className="font-semibold text-[#111110] mb-1">No sessions booked yet</p>
                  <p className="text-sm text-[#6b6b66] mb-4">Browse mentors and book a session to learn from industry experts.</p>
                  <Link href="/mentors" className="bg-[#6C63FF] text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-[#5750D4] transition">Find a Mentor</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingMySess.length > 0 && (
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b6b66]">Upcoming</p>
                  )}
                  {upcomingMySess.map(b => {
                    const act = bookingAction[b._id];
                    return (
                      <div key={b._id} className="bg-white border border-[#efefed] rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-sm overflow-hidden flex-shrink-0">
                              {b.mentor?.profileImage ? <img src={b.mentor.profileImage} alt="" className="w-10 h-10 object-cover" /> : b.mentor?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <Link href={`/profile/${b.mentor?._id}`} className="text-sm font-semibold text-[#0e0e0d] hover:text-[#6C63FF] transition-colors">{b.mentor?.name || 'Mentor'}</Link>
                              <p className="text-xs text-[#6b6b66]">{b.sessionType || '1:1 Session'}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{b.status}</span>
                        </div>
                        <p className="text-xs text-[#6b6b66] mb-3">📅 {b.date} · {b.startTime}–{b.endTime} ({b.duration || 60} min)</p>
                        {b.meetingAddress && (
                          <p className="text-xs text-[#4740CC] bg-[#f0eeff] border border-[#c9c4ff] rounded-lg px-3 py-2 mb-2 font-medium">
                            📍 Your Location: {b.meetingAddress}
                          </p>
                        )}
                        {b.status === 'confirmed' && b.meetingLink && (
                          <a href={b.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="block text-center py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition mb-2">
                            🔗 Join Meeting
                          </a>
                        )}
                        {b.status === 'pending' && (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                            ⏳ Waiting for mentor to confirm{b.meetingAddress ? '.' : ' and share a meeting link.'}
                          </p>
                        )}

                        {/* ── Booking Negotiation Chat ── */}
                        <div className="my-2 border border-[#efefed] rounded-xl overflow-hidden">
                          <button type="button"
                            onClick={() => setExpandedChats(p => ({ ...p, [b._id]: !p[b._id] }))}
                            className="w-full flex items-center justify-between px-3 py-2 bg-[#f7f7f6] text-xs font-semibold text-[#6b6b66] hover:bg-[#efefed] transition">
                            <span>💬 Chat with Mentor {(b.chat?.length || 0) > 0 ? `(${b.chat.length})` : ''}</span>
                            <span>{expandedChats[b._id] ? '▲' : '▼'}</span>
                          </button>
                          {expandedChats[b._id] && (
                            <div className="px-3 pb-3 pt-2 flex flex-col gap-2">
                              {(b.chat || []).length === 0 && (
                                <p className="text-xs text-[#a3a39e] text-center py-2">No messages yet. Ask about pricing, timing, or session details here.</p>
                              )}
                              {(b.chat || []).map((msg, idx) => {
                                const isMe = String(msg.sender) === String(user?._id || user?.id);
                                return (
                                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${isMe ? 'bg-[#6C63FF] text-white rounded-br-sm' : 'bg-[#f0f0ee] text-[#111110] rounded-bl-sm'}`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Type a message…"
                                  value={chatInputs[b._id] || ''}
                                  onChange={e => setChatInputs(p => ({ ...p, [b._id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && sendBookingChat(b._id, false)}
                                  className="flex-1 rounded-lg border border-[#e0e0dd] px-3 py-1.5 text-xs focus:outline-none focus:border-[#6C63FF] transition"
                                />
                                <button onClick={() => sendBookingChat(b._id, false)} disabled={sendingChat[b._id]}
                                  className="px-3 py-1.5 rounded-lg bg-[#6C63FF] text-white text-xs font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition">
                                  {sendingChat[b._id] ? '…' : '→'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button onClick={() => cancelBooking(b._id, 'mentee')} disabled={!!act}
                          className="text-xs text-[#a3a39e] hover:text-red-500 font-medium transition disabled:opacity-50">
                          {act === 'cancelling' ? 'Cancelling…' : '✕ Cancel booking'}
                        </button>
                      </div>
                    );
                  })}

                  {pastMySess.length > 0 && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b6b66] mt-2">Past Sessions</p>
                      {pastMySess.map(b => (
                        <div key={b._id} className="bg-white border border-[#efefed] rounded-2xl p-4 opacity-60">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-[#0e0e0d]">{b.mentor?.name || 'Mentor'}</p>
                              <p className="text-xs text-[#a3a39e]">{b.date} · {b.startTime}–{b.endTime}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border bg-[#f7f7f6] border-[#e0e0dd] text-[#a3a39e]">{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

/* ── Mentor Application Card (local) ── */
function MentorAppCard({ req, onDecision, className = '' }) {
  const router  = useRouter();
  const [loading, setLoading] = useState('');
  const decide = async (action) => {
    setLoading(action);
    try {
      if (action === 'accept') {
        const res = await mentorAPI.acceptRequest(req._id);
        const convId = res.data?.data?._id;
        toast.success('Accepted! Opening chat…');
        onDecision(req._id, 'accepted');
        router.push(convId ? `/messages?conv=${convId}` : '/messages');
      } else {
        await mentorAPI.declineRequest(req._id);
        toast.success('Declined.');
        onDecision(req._id, 'declined');
      }
    } catch (err) { toast.error(err?.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(''); }
  };
  return (
    <div className={`flex flex-col gap-2 px-5 py-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${req.sender?._id}`}>
          <Avatar name={req.sender?.name} image={req.sender?.profileImage} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${req.sender?._id}`} className="text-sm font-semibold text-[#111110] hover:text-[#6C63FF] hover:underline truncate block transition-colors">{req.sender?.name}</Link>
          <p className="text-xs text-[#6b6b66] capitalize">{req.sender?.role?.replace('-', ' ') || 'Filmmaker'} · Mentorship request</p>
        </div>
        {req.status === 'pending' ? (
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => decide('accept')} disabled={!!loading}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5750D4] transition disabled:opacity-40">
              {loading === 'accept' ? '…' : 'Accept'}
            </button>
            <button onClick={() => decide('decline')} disabled={!!loading}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition disabled:opacity-40">
              {loading === 'decline' ? '…' : 'Decline'}
            </button>
          </div>
        ) : (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${req.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {req.status === 'accepted' ? '✅' : '❌'} {req.status}
          </span>
        )}
      </div>
      {req.message && (
        <p className="text-xs text-[#6b6b66] italic bg-[#fafaf9] rounded-lg px-3 py-2 border border-[#f0f0ee] line-clamp-2">"{req.message}"</p>
      )}
    </div>
  );
}
