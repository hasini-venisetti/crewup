'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mentorAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const FIELDS = ['Film', 'Photography', 'Animation', 'VFX', 'Sound Design', 'Directing'];

const AVAIL_CONFIG = {
  'available':      { color: 'bg-green-500',  label: 'Available' },
  'open-to-offers': { color: 'bg-[#6C63FF]',  label: 'Open to Offers' },
  'busy':           { color: 'bg-red-400',     label: 'Busy' },
};

export default function MentorsPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [mentors,      setMentors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [field,        setField]        = useState('');
  const [availability, setAvailability] = useState('');

  // Apply modal state
  const [applyTarget,  setApplyTarget]  = useState(null); // the mentor profile object
  const [applyMsg,     setApplyMsg]     = useState('');
  const [applying,     setApplying]     = useState(false);
  const [appliedIds,   setAppliedIds]   = useState(new Set()); // track applied mentors

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const res = await mentorAPI.getAll({ field, availability });
        const data = res.data?.data || res.data?.mentors || [];
        setMentors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, [field, availability]);

  const openApplyModal = (mentor) => {
    if (!user) { router.push('/login'); return; }
    setApplyTarget(mentor);
    setApplyMsg('');
  };

  const handleApply = async () => {
    if (!applyTarget || applying) return;
    const mentorUserId = applyTarget.user?._id || applyTarget.user?.id;
    if (!mentorUserId) return;

    setApplying(true);
    try {
      // Use the dedicated mentor apply endpoint — handles enum fallback internally
      await mentorAPI.apply(mentorUserId, applyMsg.trim());

      setAppliedIds((prev) => new Set([...prev, applyTarget._id]));
      setApplyTarget(null);
      toast.success('Application sent! The mentor has been notified.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send application. Please try again.';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <div className="relative bg-[#0e0e0d] h-64 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-block bg-[#6C63FF] text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Mentorship
          </div>
          <h1 className="font-[Playfair_Display] text-5xl font-bold text-white mb-3">
            Find a Mentor
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mb-6">
            Connect with industry experts to elevate your craft
          </p>
          {!user && (
            <Link href="/profile/edit" className="bg-[#6C63FF] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#5750D4] transition">
              Become a Mentor
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#efefed] p-5 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">Field</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                <option value="">All Fields</option>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                <option value="">All Statuses</option>
                {Object.entries(AVAIL_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-[#6b6b66]">Loading mentors...</div>
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => {
              const creator      = mentor.user;
              const name         = creator?.name || 'Mentor';
              const userId       = creator?._id || creator?.id;
              const avatarLetter = name.charAt(0).toUpperCase();
              const availKey      = mentor.availability || 'available';
              const availCfg      = AVAIL_CONFIG[availKey] || AVAIL_CONFIG['available'];
              const mentorStatus  = mentor.mentorStatus || 'open';
              const isUnavailable = mentorStatus === 'paused' || mentorStatus === 'closed';
              const fields        = mentor.mentorFields || [];
              const rate          = mentor.mentorRate;
              const currency      = mentor.mentorCurrency || 'INR';
              const bio           = mentor.mentorBio || '';
              const isOwnProfile  = user && (String(user._id || user.id) === String(userId));
              const hasApplied    = appliedIds.has(mentor._id);

              return (
                <div
                  key={mentor._id}
                  className="rounded-2xl border border-[#efefed] p-6 hover:shadow-lg hover:-translate-y-1 transition duration-300 bg-white flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-lg overflow-hidden flex-shrink-0">
                        {creator?.profileImage
                          ? <img src={creator.profileImage} alt={name} className="w-14 h-14 object-cover" />
                          : avatarLetter
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0e0e0d]">{name}</h3>
                        <p className="text-xs text-[#6b6b66]">{creator?.role || ''}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${availCfg.color} animate-pulse flex-shrink-0 mt-1`} />
                  </div>

                  {/* Availability Badge */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-[#6b6b66]">{availCfg.label}</span>
                  </div>

                  {/* Bio */}
                  {bio && (
                    <p className="text-sm text-[#6b6b66] mb-4 line-clamp-2">{bio}</p>
                  )}

                  {/* Field Chips */}
                  {fields.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {fields.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff] rounded-full text-xs px-2.5 py-1 font-medium"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rate */}
                  <div className="mb-4">
                    {rate !== null && rate !== undefined ? (
                      Number(rate) === 0 ? (
                        <span className="text-sm font-semibold text-green-600">Free</span>
                      ) : (
                        <span className="text-sm font-semibold text-[#0e0e0d]">
                          {currency} {Number(rate).toLocaleString()}/hr
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-[#6b6b66]">Rate not set</span>
                    )}
                  </div>

                  {/* CTA — View Profile + Apply */}
                  <div className="flex items-center gap-2 border-t border-[#efefed] pt-4 mt-auto">
                    <Link
                      href={`/profile/${userId}`}
                      className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition"
                    >
                      View Profile
                    </Link>

                    {!isOwnProfile && (
                      <button
                        onClick={() => !hasApplied && !isUnavailable && openApplyModal(mentor)}
                        disabled={hasApplied || isUnavailable}
                        className={`flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg transition ${
                          hasApplied
                            ? 'bg-green-50 border border-green-200 text-green-600 cursor-default'
                            : isUnavailable
                            ? 'bg-[#f7f7f6] border border-[#e0e0dd] text-[#a3a39e] cursor-not-allowed'
                            : 'bg-[#6C63FF] text-white hover:bg-[#5750D4] shadow-sm shadow-[#6C63FF]/20'
                        }`}
                      >
                        {hasApplied
                          ? '✓ Applied'
                          : mentorStatus === 'paused'
                          ? '⏸ Paused'
                          : mentorStatus === 'closed'
                          ? '🔴 Closed'
                          : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#e0e0dd] p-12 text-center">
            <p className="text-[#6b6b66] mb-4">No mentors found matching your criteria.</p>
            <button
              onClick={() => { setField(''); setAvailability(''); }}
              className="bg-[#6C63FF] text-white rounded-xl px-6 py-2.5 font-semibold hover:bg-[#5750D4] transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Apply Modal ────────────────────────────────────────────── */}
      {applyTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#efefed]">
              <div>
                <h3 className="font-bold text-[#0e0e0d] text-base">Apply for Mentorship</h3>
                <p className="text-xs text-[#6b6b66] mt-0.5">
                  with <span className="font-semibold text-[#0e0e0d]">{applyTarget.user?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setApplyTarget(null)}
                className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg transition-colors"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Mentor summary */}
              <div className="flex items-center gap-3 bg-[#f7f7f6] rounded-xl p-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-sm overflow-hidden flex-shrink-0">
                  {applyTarget.user?.profileImage
                    ? <img src={applyTarget.user.profileImage} alt="" className="w-10 h-10 object-cover" />
                    : applyTarget.user?.name?.charAt(0).toUpperCase()
                  }
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
              <textarea
                value={applyMsg}
                onChange={(e) => setApplyMsg(e.target.value)}
                placeholder={`Hi ${applyTarget.user?.name?.split(' ')[0] || 'there'}, I'd love to learn from you! I'm looking to improve my skills in…`}
                rows={4}
                maxLength={500}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] transition"
              />
              <p className="text-[11px] text-[#a3a39e] text-right mt-1">{applyMsg.length}/500</p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                onClick={() => setApplyTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#0e0e0d] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
