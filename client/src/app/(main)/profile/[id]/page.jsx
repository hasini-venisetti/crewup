'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { profileAPI, reviewAPI, followAPI, projectAPI, filmAPI, notificationAPI, messageRequestAPI, mentorAPI } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FollowButton from '@/components/ui/FollowButton';
import ReportModal  from '@/components/ui/ReportModal';
import { X, Film, FolderPlus, Upload, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAIL_CONFIG = {
  'available':      { label: 'Available',      dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  'open-to-offers': { label: 'Open to Offers', dot: 'bg-[#6C63FF]',  badge: 'bg-[#f0eeff] text-[#4740CC] border-[#c9c4ff]' },
  'busy':           { label: 'Currently Busy', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
};

const TYPE_ICON  = { video: '▶', image: '🖼', audio: '🎵', link: '🔗', certificate: '🏆', other: '📁' };
const TYPE_COLOR = {
  video:       'bg-[#f0eeff] border-[#c9c4ff] text-[#6C63FF]',
  image:       'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]',
  audio:       'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]',
  link:        'bg-[#fdf2f8] border-[#f5d0fe] text-[#a21caf]',
  certificate: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]',
  other:       'bg-[#f7f7f6] border-[#e0e0dd] text-[#6b6b66]',
};
const SOCIAL_ICON = {
  instagram: { label: 'Instagram', icon: '📸' },
  youtube:   { label: 'YouTube',   icon: '▶' },
  vimeo:     { label: 'Vimeo',     icon: '🎬' },
  linkedin:  { label: 'LinkedIn',  icon: '💼' },
  website:   { label: 'Website',   icon: '🌐' },
};
const EXP_LABEL  = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', professional: 'Professional' };

export default function ProfilePage() {
  const { id }   = useParams();
  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();

  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [reviews, setReviews]           = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [avgRating, setAvgRating]       = useState(null);
  const [messaging, setMessaging]         = useState(false);
  // message-request state: 'none' | 'pending' | 'accepted' | 'connected' | 'received'
  const [msgStatus,    setMsgStatus]      = useState('none');
  const [msgRequestId, setMsgRequestId]   = useState(null);
  const [msgConvId,    setMsgConvId]      = useState(null);
  const [msgModal,     setMsgModal]       = useState(false);
  const [msgText,      setMsgText]        = useState('');
  // Follow counts — updated by <FollowButton> via onCountChange callback
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [films, setFilms]                       = useState([]);
  const [filmsLoading, setFilmsLoading]         = useState(true);
  const [showUploadGuide, setShowUploadGuide]   = useState(false);
  const [filmLikes, setFilmLikes]               = useState({});
  const [filmBookmarks, setFilmBookmarks]       = useState({});
  const [commentFilm, setCommentFilm]           = useState(null);
  const [reportFilm, setReportFilm]             = useState(null);
  const [filmComments, setFilmComments]         = useState({});
  const [commentText, setCommentText]           = useState('');
  const [commentPosting, setCommentPosting]     = useState(false);
  const [reportReason, setReportReason]         = useState('');
  const [reportDetails, setReportDetails]       = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone]             = useState(false);
  const [copied, setCopied]                     = useState({});
  const [showShareMenu, setShowShareMenu]       = useState({});
  const [mentorStatusVal, setMentorStatusVal]   = useState('open'); // mentor's own status toggle
  const [mentorStatusLoading, setMentorStatusLoading] = useState(false);

  const [myProjects, setMyProjects]             = useState([]);
  const [showInviteMenu, setShowInviteMenu]     = useState(false);
  const [inviting, setInviting]                 = useState(false);
  const [invitedMap, setInvitedMap]             = useState({});
  const [expandedProject, setExpandedProject]  = useState(null);
  const [showReportModal, setShowReportModal]   = useState(false);
  const [portfolioFilter, setPortfolioFilter]   = useState('all');

  /* ── Collapsible sections ── */
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Load message-request status when viewing another user's profile
  useEffect(() => {
    if (!user || !id) return;
    if (String(user._id || user.id) === String(id)) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('crewup_token') : null;
    if (!token) return;

    messageRequestAPI.getStatus(id)
      .then(({ data }) => {
        const d = data?.data;
        if (!d) return;
        setMsgStatus(d.status);
        if (d.conversationId) setMsgConvId(d.conversationId);
        if (d.requestId)      setMsgRequestId(d.requestId);
      })
      .catch(() => {});
  }, [id, user]);

  const handleMessageClick = () => {
    if (!user) { router.push('/login'); return; }
    if (msgStatus === 'connected') {
      // Already connected — go straight to chat
      router.push(msgConvId ? `/messages?conv=${msgConvId}` : '/messages');
      return;
    }
    // Otherwise open the request modal
    setMsgText('');
    setMsgModal(true);
  };

  const handleSendMsgRequest = async () => {
    if (messaging) return;
    setMessaging(true);
    try {
      const res = await messageRequestAPI.send(id, msgText.trim());
      if (res.data?.alreadyConnected) {
        setMsgStatus('connected');
        setMsgConvId(res.data.data?._id);
        setMsgModal(false);
        router.push(res.data.data?._id ? `/messages?conv=${res.data.data._id}` : '/messages');
        return;
      }
      setMsgStatus('pending');
      setMsgModal(false);
      toast.success('Message request sent!');
    } catch (err) {
      const errCode = err?.response?.data?.code;
      const msg     = err?.response?.data?.message || 'Failed to send request.';
      if (errCode === 'MINOR_PROTECTION') {
        toast.error(msg, { duration: 8000, icon: '🔒' });
        setMsgModal(false);
      } else {
        toast.error(msg);
      }
    } finally {
      setMessaging(false);
    }
  };

  const handleInvite = async (project, role) => {
    if (inviting) return;
    setInviting(true);
    try {
      await notificationAPI.sendDirect({
        recipientId: id,
        type:        'project_invite',
        title:       `You've been invited to join "${project.title}" as ${role}`,
        message:     `${user.name} wants you for the ${role} role on their project.`,
        link:        `/projects/${project._id}`,
      });
      setInvitedMap((prev) => ({ ...prev, [project._id]: role }));
      setShowInviteMenu(false);
      setExpandedProject(null);
      toast.success(`Invite sent for ${role} role!`);
    } catch {
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const loadFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const { data } = await followAPI.getFollowers(id);
      setFollowersList(data.data || []);
    } catch (error) {
      console.error('Failed to load followers:', error);
      setFollowersList([]);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const loadFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const { data } = await followAPI.getFollowing(id);
      setFollowingList(data.data || []);
    } catch (error) {
      console.error('Failed to load following:', error);
      setFollowingList([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleShowFollowers = () => {
    setShowFollowersModal(true);
    loadFollowers();
  };

  const handleShowFollowing = () => {
    setShowFollowingModal(true);
    loadFollowing();
  };

  // Load profile (counts are handled by the follow-status useEffect below)
  useEffect(() => {
    profileAPI.getById(id)
      .then((profileRes) => {
        setProfile(profileRes.data.data);
        reviewAPI.getForUser(id)
          .then(r => { setReviews(r.data.data || []); setAvgRating(r.data.averageRating); })
          .catch(() => {})
          .finally(() => setReviewsLoading(false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    projectAPI.getUserFilms(id)
      .then(({ data }) => {
        const list = data.data || [];
        setFilms(list);
        list.forEach((film) => {
          filmAPI.getLikeStatus(film._id)
            .then(({ data: d }) => setFilmLikes((prev) => ({ ...prev, [film._id]: { count: d.likeCount, isLiked: d.liked } })))
            .catch(() => {});
          filmAPI.getBookmarkStatus(film._id)
            .then(({ data: d }) => setFilmBookmarks((prev) => ({ ...prev, [film._id]: d.bookmarked })))
            .catch(() => {});
        });
      })
      .catch(() => setFilms([]))
      .finally(() => setFilmsLoading(false));
  }, [id]);

  // Load public follow counts on page mount — FollowButton manages its own isFollowing state
  useEffect(() => {
    if (!id) return;
    followAPI.getCounts(id)
      .then(({ data }) => { if (data?.data) setFollowCounts(data.data); })
      .catch(() => {});
  }, [id]);

  // Load current user's owned projects for "Invite to Project"
  useEffect(() => {
    if (!user || !id) return;
    const myId = user._id || user.id;
    if (myId === id) return;
    projectAPI.getMine()
      .then(({ data }) => {
        const owned = (data.data || []).filter(
          (p) => (p.createdBy?._id || p.createdBy) === myId &&
                  p.timelineStage !== 'released' &&
                  p.status !== 'completed' &&
                  p.status !== 'cancelled'
        );
        setMyProjects(owned);
      })
      .catch(() => {});
  }, [id, user]);

  // Sync mentorStatus from loaded profile into local state
  useEffect(() => {
    if (profile?.mentorStatus) setMentorStatusVal(profile.mentorStatus);
  }, [profile?.mentorStatus]);

  if (loading || authLoading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!profile) return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">👤</p>
        <p className="text-2xl font-[Playfair_Display] text-[#111110] mb-2">Profile not found</p>
        <Link href="/explore" className="text-[#6b6b66] hover:text-[#111110] text-sm">← Browse Creators</Link>
      </div>
    </div>
  );

  const { user: creator, bio, skills, location, portfolioLinks, experienceLevel, availability, socialLinks, portfolio, availabilitySlots, isMentor, mentorStatus, mentorFields, mentorBio, mentorRate, mentorCurrency, isVerified } = profile;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingSlots = (availabilitySlots || [])
    .filter(s => new Date(s.endDate) >= today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 4);

  const fmtSlotDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const isSlotActive = (s) => new Date(s.startDate) <= today && new Date(s.endDate) >= today;
  const isOwnProfile = user && (String(user._id || user.id) === String(id));
  const avail = AVAIL_CONFIG[availability] || AVAIL_CONFIG['available'];

  const handleMentorStatus = async (newStatus) => {
    if (mentorStatusLoading || newStatus === mentorStatusVal) return;
    setMentorStatusLoading(true);
    const prev = mentorStatusVal;
    setMentorStatusVal(newStatus); // optimistic
    try {
      await mentorAPI.updateStatus(newStatus);
      toast.success(`Mentorship status set to "${newStatus}"`);
    } catch {
      setMentorStatusVal(prev);
      toast.error('Failed to update mentor status.');
    } finally {
      setMentorStatusLoading(false);
    }
  };
  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  // Compute which verifications are missing for the profile owner
  const missingForOwner = isOwnProfile ? [
    !user?.isEmailVerified  && { key: 'email', icon: '📧', label: 'Verify your email',        href: '/verify-email' },
    !user?.phone?.isVerified && { key: 'phone', icon: '📱', label: 'Verify your phone number', href: '/verify-phone' },
    !user?.hasDateOfBirth   && { key: 'dob',   icon: '🪪', label: 'Add your date of birth',   href: '/settings?tab=profile' },
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Verification completion banner — own profile only */}
      {missingForOwner.length > 0 && (
        <div className="bg-gradient-to-r from-[#1a1035] to-[#0e0e0d] border-b border-[#6C63FF]/30 px-4 py-4">
          <div className="max-w-[900px] mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">🔐</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Complete your verification to unlock full access</p>
                <p className="text-xs text-white/50 mt-0.5">You can't post or join projects until verification is complete.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {missingForOwner.map((item) => (
                    <a key={item.key} href={item.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#6C63FF] hover:bg-[#7C75FF] text-white rounded-lg transition-colors shadow-sm shadow-[#6C63FF]/30">
                      {item.icon} {item.label} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section — dark */}
      <div
        className="bg-[#0e0e0d] relative"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        {/* Decorative blob — clipped to hero only, does not clip dropdown */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-80 h-64 bg-[#6C63FF]/6 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-3 sm:px-6 pt-8 pb-12">
          {/* Back + actions */}
          <div className="flex items-center justify-between mb-6 sm:mb-10">
            <Link href="/explore" className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5">
              ← Browse Creators
            </Link>
            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <Link href="/profile/edit"
                  className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && (
                <>
                  {myProjects.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => { setShowInviteMenu((v) => !v); setExpandedProject(null); }}
                        disabled={inviting}
                        className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#6C63FF]/50 text-[#a09aff] hover:border-[#6C63FF] hover:bg-[#6C63FF]/10 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        🎬 Invite to Project
                      </button>

                      {showInviteMenu && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/10 bg-gray-800/50">
                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Select a Project</p>
                          </div>
                          <div className="max-h-72 overflow-y-auto rounded-b-xl">
                            {myProjects.map((proj) => {
                              const isOnTeam = (proj.teamMembers || []).some(
                                (m) => (m.user?._id || m.user) === id
                              );
                              const filledRoleNames = [
                                ...(proj.filledRoles || []).map((f) => f.role),
                                ...(proj.teamMembers || []).map((m) => m.role).filter(Boolean),
                              ];
                              const openRoles = (proj.requiredRoles || []).filter(
                                (r) => !filledRoleNames.includes(r)
                              );
                              const sentRole   = invitedMap[proj._id];
                              const isExpanded = expandedProject === proj._id;

                              return (
                                <div key={proj._id} className="border-b border-white/5 last:border-0">
                                  <button
                                    onClick={() => {
                                      if (isOnTeam || sentRole || openRoles.length === 0) return;
                                      setExpandedProject(isExpanded ? null : proj._id);
                                    }}
                                    disabled={inviting || isOnTeam || !!sentRole}
                                    className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 ${
                                      isOnTeam || sentRole || openRoles.length === 0
                                        ? 'opacity-60 cursor-default'
                                        : 'hover:bg-white/5 cursor-pointer'
                                    } ${isExpanded ? 'bg-white/5' : ''}`}
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{proj.title}</p>
                                      <p className="text-[11px] text-white/40 mt-0.5">
                                        {isOnTeam
                                          ? '✓ Already on team'
                                          : sentRole
                                          ? `✓ Invited as ${sentRole}`
                                          : openRoles.length === 0
                                          ? 'No open roles'
                                          : `${openRoles.length} open role${openRoles.length !== 1 ? 's' : ''}`}
                                      </p>
                                    </div>
                                    {!isOnTeam && !sentRole && openRoles.length > 0 && (
                                      <span className={`text-[11px] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} text-[#a09aff]`}>›</span>
                                    )}
                                    {isOnTeam && <span className="text-[11px] text-blue-400 flex-shrink-0">👥 Team</span>}
                                    {sentRole  && <span className="text-[11px] text-green-400 flex-shrink-0">✓ Sent</span>}
                                  </button>

                                  {isExpanded && openRoles.length > 0 && (
                                    <div className="bg-black/30 border-t border-white/5 px-4 py-2">
                                      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Pick a role to invite for</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {openRoles.map((role) => (
                                          <button
                                            key={role}
                                            onClick={() => handleInvite(proj, role)}
                                            disabled={inviting}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#a09aff] hover:bg-[#6C63FF]/35 hover:border-[#6C63FF]/70 transition-all font-medium disabled:opacity-50"
                                          >
                                            {role}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {showInviteMenu && (
                        <div className="fixed inset-0 z-40" onClick={() => { setShowInviteMenu(false); setExpandedProject(null); }} />
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleMessageClick}
                    disabled={messaging || msgStatus === 'pending'}
                    className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all disabled:opacity-50 ${
                      msgStatus === 'connected'
                        ? 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        : msgStatus === 'pending'
                        ? 'border border-white/10 text-white/30 cursor-not-allowed'
                        : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {msgStatus === 'connected'
                      ? '💬 Message'
                      : msgStatus === 'pending'
                      ? '⏳ Request Sent'
                      : '💬 Message'
                    }
                  </button>
                  <FollowButton
                    userId={id}
                    onCountChange={(count) => setFollowCounts((c) => ({ ...c, followers: count }))}
                  />
                  <button
                    onClick={() => setShowReportModal(true)}
                    title="Report this user"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-white/60 hover:text-red-400 hover:border-red-400/40 text-xs font-semibold transition-colors"
                  >
                    ⚑ Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-3xl sm:text-4xl font-bold text-white flex-shrink-0 overflow-hidden ring-4 ring-white/10 shadow-xl shadow-black/40">
                {creator?.profileImage
                  ? <img src={creator.profileImage} alt={creator.name} className="w-full h-full object-cover" />
                  : creator?.name?.[0]?.toUpperCase() || '?'
                }
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 border-2 border-[#0e0e0d] flex items-center justify-center" title="Verified Creator">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-[Playfair_Display] text-white">{creator?.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${avail.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                  {avail.label}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-white/40 text-sm">@{creator?.username}</span>
                {(creator?.roles?.length ? creator.roles : (creator?.role ? [creator.role] : [])).map((r) => (
                  <span key={r} className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60 capitalize">
                    {r.replace(/-/g, ' ')}
                  </span>
                ))}
                {creator?.isEmailVerified && (
                  <span title="Email Verified" className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Email
                  </span>
                )}
                {creator?.phone?.isVerified && (
                  <span title="Phone Verified" className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Phone
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={handleShowFollowers}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white/80">{followCounts.followers}</span> followers
                </button>
                <button
                  onClick={handleShowFollowing}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white/80">{followCounts.following}</span> following
                </button>
                {avgRating && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#6C63FF]/15 border border-[#6C63FF]/25 text-[#a09aff] px-2.5 py-1 rounded-full">
                    ⭐ {avgRating}
                    <span className="text-white/30">({reviews.length})</span>
                  </span>
                )}
              </div>

              {(location?.city || location?.country) && (
                <p className="text-xs text-white/35 mb-2 flex items-center gap-1.5">
                  <span>📍</span>
                  {[location.city, location.country].filter(Boolean).join(', ')}
                </p>
              )}
              {bio && <p className="text-white/55 text-sm leading-relaxed max-w-xl mt-3 border-l-2 border-[#6C63FF]/30 pl-3">{bio}</p>}
            </div>
          </div>

          {/* Social Links */}
          {(hasSocials || portfolioLinks?.some(l => l.url)) && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
              {hasSocials && Object.entries(socialLinks).map(([key, val]) => {
                if (!val) return null;
                const cfg = SOCIAL_ICON[key];
                return (
                  <a key={key} href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 px-3.5 py-2 rounded-full transition-all backdrop-blur-sm">
                    <span>{cfg?.icon}</span><span>{cfg?.label || key}</span>
                  </a>
                );
              })}
              {portfolioLinks?.map((lnk) => lnk.url && (
                <a key={lnk.url} href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 px-3.5 py-2 rounded-full transition-all backdrop-blur-sm">
                  🔗 {lnk.label || 'Portfolio'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Sidebar */}
          <div className="w-full md:w-60 lg:w-64 flex-shrink-0 flex flex-col gap-3">

            {/* Quick-info strip: member since + location */}
            <div className="bg-white rounded-xl border border-[#efefed] divide-y divide-[#f5f5f3]">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-base flex-shrink-0">🗓</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a39e]">Member Since</p>
                  <p className="text-xs font-semibold text-[#111110] truncate">
                    {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
              {(location?.city || location?.country) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base flex-shrink-0">📍</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a39e]">Location</p>
                    <p className="text-xs font-semibold text-[#111110] truncate">
                      {[location.city, location.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {experienceLevel && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base flex-shrink-0">⚡</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a39e]">Level</p>
                    <p className="text-xs font-semibold text-[#111110] capitalize">{EXP_LABEL[experienceLevel] || experienceLevel}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {skills?.length > 0 && (
              <div className="bg-white rounded-xl border border-[#efefed] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a39e] flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-[#6C63FF] inline-block rounded-full" />
                    Skills
                  </p>
                  <span className="text-[10px] font-bold bg-[#f0eeff] text-[#5750D4] border border-[#c9c4ff] px-1.5 py-0.5 rounded-full">{skills.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, idx) => {
                    const colors = [
                      'bg-[#f0eeff] border-[#c9c4ff] text-[#4740CC]',
                      'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]',
                      'bg-[#fef9ee] border-[#fde68a] text-[#92400e]',
                      'bg-[#fdf2f8] border-[#f0abfc] text-[#86198f]',
                      'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]',
                    ];
                    return (
                      <span key={s} className={`text-[11px] px-2.5 py-1 font-semibold rounded-full border ${colors[idx % colors.length]}`}>{s}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Availability */}
            {upcomingSlots.length > 0 && (
              <div className="bg-white rounded-xl border border-[#efefed] p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a39e] flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-green-500 inline-block rounded-full" />
                    Availability
                  </p>
                  {isOwnProfile && (
                    <Link href="/profile/edit" className="text-[10px] text-[#5750D4] hover:text-[#4740CC] font-semibold transition-colors">
                      Edit →
                    </Link>
                  )}
                </div>
                <div className="space-y-1.5">
                  {upcomingSlots.map((slot, i) => {
                    const active = isSlotActive(slot);
                    return (
                      <div key={i} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${active ? 'bg-green-50 border border-green-200' : 'bg-[#f7f7f6] border border-[#efefed]'}`}>
                        <span className={`text-[11px] font-semibold ${active ? 'text-green-700' : 'text-[#111110]'}`}>
                          {fmtSlotDate(slot.startDate)} – {fmtSlotDate(slot.endDate)}
                        </span>
                        {active && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                            Now
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mentoring */}
            {isMentor && mentorFields?.length > 0 && (() => {
              const mStatus = isOwnProfile ? mentorStatusVal : (mentorStatus || 'open');
              const STATUS_CFG = {
                open:   { label: 'Open',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
                paused: { label: 'Paused', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                closed: { label: 'Closed', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
              };
              const sc = STATUS_CFG[mStatus] || STATUS_CFG.open;
              return (
                <div className="bg-[#f0eeff] rounded-xl border border-[#c9c4ff] p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5750D4] flex items-center gap-1.5">
                      🎓 Mentoring
                    </p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} flex-shrink-0`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Fields + rate inline */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {mentorFields.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 bg-[#e4e0ff] text-[#4740CC] rounded-full font-semibold">{f}</span>
                    ))}
                    {mentorRate !== null && mentorRate !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#5750D4] text-white rounded-full font-bold">
                        {mentorRate === 0 ? 'Free' : `₹${mentorRate.toLocaleString('en-IN')}/hr`}
                      </span>
                    )}
                  </div>

                  {mentorBio && <p className="text-[11px] text-[#4b4b47] leading-relaxed mb-2.5 line-clamp-2">{mentorBio}</p>}

                  {/* Own profile: compact toggle */}
                  {isOwnProfile && (
                    <div className="flex gap-1.5 pt-2.5 border-t border-[#ddd8ff]">
                      {[
                        { key: 'open',   label: 'Open',   icon: '🟢' },
                        { key: 'paused', label: 'Paused', icon: '⏸' },
                        { key: 'closed', label: 'Closed', icon: '🔴' },
                      ].map(({ key, label, icon }) => (
                        <button key={key} onClick={() => handleMentorStatus(key)} disabled={mentorStatusLoading}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1 ${
                            mentorStatusVal === key
                              ? 'bg-[#5750D4] text-white shadow-sm'
                              : 'bg-white border border-[#c9c4ff] text-[#5750D4] hover:bg-[#e4e0ff]'
                          }`}>
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">

        {/* ── PORTFOLIO ── */}
        {(portfolio?.length > 0 || isOwnProfile) && (() => {
          const certCount   = portfolio?.filter(i => i.type === 'certificate').length || 0;
          const typesPresent = ['all', ...new Set((portfolio || []).map(i => i.type))];
          const filtered    = portfolioFilter === 'all' ? (portfolio || []) : (portfolio || []).filter(i => i.type === portfolioFilter);
          const certs       = filtered.filter(i => i.type === 'certificate');
          const works       = filtered.filter(i => i.type !== 'certificate');

          return (
            <div>
              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d] flex items-center gap-2">
                      Work & Credentials
                      {portfolio?.length > 0 && (
                        <span className="text-sm font-sans font-bold bg-[#0e0e0d] text-white px-2.5 py-0.5 rounded-full">{portfolio.length}</span>
                      )}
                    </h2>
                    {certCount > 0 && (
                      <p className="text-xs text-[#a3a39e] mt-0.5">{certCount} certificate{certCount !== 1 ? 's' : ''} · {(portfolio?.length || 0) - certCount} work sample{(portfolio?.length || 0) - certCount !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOwnProfile && (
                    <Link href="/profile/edit#portfolio"
                      className="text-xs font-semibold text-white bg-[#0e0e0d] hover:bg-[#2d2d2b] px-4 py-2 rounded-lg transition-all flex items-center gap-1.5">
                      + Add Work
                    </Link>
                  )}
                  <button
                    onClick={() => toggleSection('portfolio')}
                    title={collapsedSections.portfolio ? 'Expand' : 'Collapse'}
                    className="text-xs font-bold text-[#a3a39e] hover:text-[#6C63FF] w-8 h-8 rounded-lg bg-[#f7f7f6] border border-[#efefed] hover:border-[#6C63FF]/30 hover:bg-[#f0eeff] flex items-center justify-center transition-all"
                  >
                    {collapsedSections.portfolio ? '▼' : '▲'}
                  </button>
                  {/* Share profile */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Profile link copied!');
                    }}
                    className="text-xs font-semibold text-[#6b6b66] border border-[#e0e0dd] hover:border-[#6C63FF] hover:text-[#6C63FF] px-4 py-2 rounded-lg transition-all flex items-center gap-1.5">
                    🔗 Share Portfolio
                  </button>
                </div>
              </div>

              {!collapsedSections.portfolio && <>
              {/* Filter tabs */}
              {portfolio?.length > 0 && typesPresent.length > 2 && (
                <div className="flex gap-2 flex-wrap mb-6">
                  {typesPresent.map((type) => {
                    const count = type === 'all' ? portfolio.length : portfolio.filter(i => i.type === type).length;
                    return (
                      <button key={type} onClick={() => setPortfolioFilter(type)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all capitalize ${
                          portfolioFilter === type
                            ? 'bg-[#0e0e0d] border-[#0e0e0d] text-white'
                            : 'bg-white border-[#e0e0dd] text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#111110]'
                        }`}>
                        {type === 'all' ? '✦ All' : `${TYPE_ICON[type] || '📁'} ${type}`}
                        <span className={`text-[10px] ${portfolioFilter === type ? 'text-white/60' : 'text-[#a3a39e]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {portfolio?.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#efefed]">
                  <div className="w-16 h-16 rounded-2xl bg-[#f0eeff] border border-[#c9c4ff] flex items-center justify-center text-3xl mx-auto mb-4">🎨</div>
                  <p className="font-semibold text-sm text-[#111110] mb-1">No work added yet</p>
                  <p className="text-xs text-[#a3a39e] mb-5 max-w-xs mx-auto">Add videos, images, certificates and links to showcase your skills to collaborators and studios.</p>
                  <Link href="/profile/edit#portfolio"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0e0e0d] text-white px-4 py-2 rounded-lg hover:bg-[#2d2d2b] transition-all">
                    + Add Portfolio Item
                  </Link>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-[#a3a39e] text-sm">No items in this category.</div>
              ) : (
                <div className="flex flex-col gap-6">

                  {/* ── Certificates ── */}
                  {certs.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3 flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-[#d97706] inline-block rounded-full" />
                        Certificates & Awards
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {certs.map((item) => {
                          const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                          return (
                            <div key={item._id} className="relative overflow-hidden rounded-xl border-2 border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-white p-5 hover:shadow-md transition-all">
                              {/* Decorative corner */}
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#fde68a]/30 rounded-full -translate-y-6 translate-x-6 pointer-events-none" />
                              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center">
                                <span className="text-sm">🏆</span>
                              </div>
                              <div className="pr-10">
                                <p className="font-bold text-sm text-[#111110] leading-snug mb-1">{item.title}</p>
                                {item.issuer && (
                                  <p className="text-xs font-semibold text-[#92400e] mb-1">
                                    Issued by {item.issuer}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-[#a3a39e] mb-2 flex-wrap">
                                  {item.issueDate && (
                                    <span>
                                      {new Date(item.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                  {item.expiryDate && (
                                    <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                                      · {isExpired ? '⛔ Expired' : '✓ Valid until'} {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                  {!item.expiryDate && item.issueDate && (
                                    <span className="text-green-600">· No expiry</span>
                                  )}
                                </div>
                                {item.credentialId && (
                                  <p className="text-[10px] text-[#a3a39e] font-mono mb-2">ID: {item.credentialId}</p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-[#6b6b66] line-clamp-2 leading-relaxed mb-2">{item.description}</p>
                                )}
                                {item.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {item.tags.map((t) => (
                                      <span key={t} className="text-[10px] bg-[#fef9ee] text-[#92400e] px-2 py-0.5 rounded-full border border-[#fde68a] font-medium">{t}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                  {item.certificateFileUrl && (
                                    <a href={item.certificateFileUrl} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-white bg-[#d97706] hover:bg-[#b45309] font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                      {item.certificateFileUrl.startsWith('data:application/pdf') ? '📄' : '🖼'} View Certificate
                                    </a>
                                  )}
                                  {item.link && (
                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[#d97706] hover:text-[#b45309] font-semibold transition-colors">
                                      Verify Credential →
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Work Samples ── */}
                  {works.length > 0 && (
                    <div>
                      {certs.length > 0 && (
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3 flex items-center gap-2">
                          <span className="w-3 h-0.5 bg-[#6C63FF] inline-block rounded-full" />
                          Work Samples
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {works.map((item) => {
                          const typeColor = TYPE_COLOR[item.type] || TYPE_COLOR.other;
                          const typeIcon  = TYPE_ICON[item.type] || '📁';
                          // Extract YouTube thumbnail if it's a YouTube link
                          const ytMatch = item.link?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                          const ytThumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null;

                          return (
                            <div key={item._id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#efefed] hover:border-[#c9c4ff] hover:shadow-md bg-white transition-all duration-200">
                              {/* Thumbnail or icon header */}
                              {ytThumb ? (
                                <div className="relative w-full aspect-video overflow-hidden bg-[#111110] flex-shrink-0">
                                  <img src={ytThumb} alt={item.title} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                                      <span className="text-white text-sm ml-0.5">▶</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`w-full h-20 flex items-center justify-center flex-shrink-0 ${typeColor} border-b border-[#efefed]`}>
                                  <span className="text-3xl">{typeIcon}</span>
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex flex-col flex-1 p-4 gap-2">
                                {/* Title + badge row */}
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-bold text-sm text-[#111110] leading-snug">{item.title}</p>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 mt-0.5 ${typeColor}`}>
                                    {item.type}
                                  </span>
                                </div>

                                {/* Description */}
                                {item.description && (
                                  <p className="text-xs text-[#6b6b66] line-clamp-3 leading-relaxed">{item.description}</p>
                                )}

                                {/* Tags */}
                                {item.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.map((t) => (
                                      <span key={t} className="text-[10px] bg-[#f7f7f6] text-[#6b6b66] px-2 py-0.5 rounded-full border border-[#efefed] font-medium">{t}</span>
                                    ))}
                                  </div>
                                )}

                                {/* CTA link */}
                                {item.link && (
                                  <div className="mt-auto pt-2">
                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-[#6C63FF] hover:text-[#4740CC] font-semibold transition-colors group/link border border-[#e0e0dd] hover:border-[#c9c4ff] px-3 py-1.5 rounded-lg bg-[#fafaf9] hover:bg-[#f0eeff]">
                                      {item.type === 'video' ? 'Watch' : item.type === 'audio' ? 'Listen' : 'View Work'}
                                      <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
              </>}
            </div>
          );
        })()}

        {/* ── FILMS ─────────────────────────────────────────────────── */}
        {(filmsLoading || films.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d]">Films</h2>
                {!filmsLoading && films.length > 0 && (
                  <span className="text-xs font-bold bg-[#0e0e0d] text-white px-2.5 py-1 rounded-full">
                    {films.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwnProfile && !filmsLoading && (
                  <button
                    onClick={() => setShowUploadGuide(true)}
                    className="text-xs font-semibold text-[#6C63FF] hover:text-[#4740CC] transition-colors"
                  >
                    + Upload Film
                  </button>
                )}
                <button
                  onClick={() => toggleSection('films')}
                  title={collapsedSections.films ? 'Expand' : 'Collapse'}
                  className="text-xs font-bold text-[#a3a39e] hover:text-[#6C63FF] w-8 h-8 rounded-lg bg-[#f7f7f6] border border-[#efefed] hover:border-[#6C63FF]/30 hover:bg-[#f0eeff] flex items-center justify-center transition-all"
                >
                  {collapsedSections.films ? '▼' : '▲'}
                </button>
              </div>
            </div>

            {!collapsedSections.films && (filmsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white border border-[#efefed] rounded-2xl animate-pulse">
                    <div className="w-40 aspect-video rounded-xl bg-[#efefed] flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-[#efefed] rounded w-2/3" />
                      <div className="h-3 bg-[#f5f5f3] rounded w-1/3" />
                      <div className="h-3 bg-[#f5f5f3] rounded w-1/4 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {films.map((film) => {
                  const likeData     = filmLikes[film._id] || { count: 0, isLiked: false };
                  const isBookmarked = !!filmBookmarks[film._id];
                  const isCopied     = copied[film._id];
                  const commentCount = filmComments[film._id]?.length ?? 0;

                  const handleLike = async () => {
                    if (!user) { router.push('/login'); return; }
                    try {
                      const { data: d } = await filmAPI.toggleLike(film._id);
                      setFilmLikes((prev) => ({ ...prev, [film._id]: { count: d.likeCount, isLiked: d.liked } }));
                    } catch {}
                  };

                  const handleBookmark = async () => {
                    if (!user) { router.push('/login'); return; }
                    try {
                      const { data: d } = await filmAPI.toggleBookmark(film._id);
                      setFilmBookmarks((prev) => ({ ...prev, [film._id]: d.bookmarked }));
                    } catch {}
                  };

                  const filmUrl    = film.youtubeLink || `${window.location.origin}/films`;
                  const shareText  = `Watch "${film.title}"${film.director?.name ? ` by ${film.director.name}` : ''} 🎬 Check it out on CREWUPFILMS!`;

                  const handleShareX = () => {
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(filmUrl)}`,
                      '_blank'
                    );
                    setShowShareMenu((prev) => ({ ...prev, [film._id]: false }));
                  };

                  const handleShareNative = async () => {
                    if (navigator.share) {
                      try { await navigator.share({ title: film.title, text: shareText, url: filmUrl }); }
                      catch (_) {}
                    } else {
                      await navigator.clipboard.writeText(filmUrl);
                      setCopied((prev) => ({ ...prev, [film._id]: true }));
                      setTimeout(() => setCopied((prev) => ({ ...prev, [film._id]: false })), 2000);
                    }
                    setShowShareMenu((prev) => ({ ...prev, [film._id]: false }));
                  };

                  const handleCopyLink = async () => {
                    await navigator.clipboard.writeText(filmUrl);
                    setCopied((prev) => ({ ...prev, [film._id]: true }));
                    setTimeout(() => setCopied((prev) => ({ ...prev, [film._id]: false })), 2000);
                    setShowShareMenu((prev) => ({ ...prev, [film._id]: false }));
                  };

                  const openComments = async () => {
                    setCommentFilm(film);
                    if (!filmComments[film._id]) {
                      filmAPI.getComments(film._id)
                        .then(({ data: d }) => setFilmComments((prev) => ({ ...prev, [film._id]: d.data || [] })))
                        .catch(() => {});
                    }
                  };

                  return (
                    <div key={film._id}
                      className="group flex gap-0 bg-white border border-[#efefed] rounded-2xl overflow-hidden hover:border-[#c9c4ff] hover:shadow-[0_4px_24px_rgba(108,99,255,0.08)] transition-all duration-300">

                      <a href={film.youtubeLink} target="_blank" rel="noopener noreferrer"
                        className="relative flex-shrink-0 w-44 sm:w-52 overflow-hidden bg-[#0e0e0d]">
                        {film.thumbnail ? (
                          <img src={film.thumbnail} alt={film.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🎬</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                            <span className="text-[#6C63FF] text-base ml-0.5">▶</span>
                          </div>
                        </div>
                      </a>

                      <div className="flex flex-col flex-1 min-w-0 p-4">
                        <div className="flex items-start gap-2 mb-1">
                          <p className="font-semibold text-sm text-[#111110] truncate flex-1 leading-snug">{film.title}</p>
                          {film.projectType && (
                            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest bg-[#f0eeff] text-[#6C63FF] border border-[#c9c4ff] px-2 py-0.5 rounded-full">
                              {film.projectType.replace('-', ' ')}
                            </span>
                          )}
                        </div>

                        {film.userRole && (
                          <p className="text-xs text-[#a3a39e] mb-auto">
                            Role: <span className="font-medium text-[#6b6b66]">{film.userRole}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          {likeData.count > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-[#a3a39e]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#e05c5c" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              {likeData.count}
                            </span>
                          )}
                          {commentCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-[#a3a39e]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a3a39e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              {commentCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#f0f0ee]">
                          <button onClick={handleLike}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              likeData.isLiked
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-[#a3a39e] hover:text-[#6C63FF] hover:bg-[#f0eeff]'
                            }`}>
                            <svg width="13" height="13" viewBox="0 0 24 24"
                              fill={likeData.isLiked ? 'currentColor' : 'none'}
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>{likeData.isLiked ? 'Liked' : 'Like'}</span>
                          </button>

                          <button onClick={openComments}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a3a39e] hover:text-[#6C63FF] hover:bg-[#f0eeff] transition-all">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>Comment</span>
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setShowShareMenu((prev) => ({ ...prev, [film._id]: !prev[film._id] }))}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isCopied
                                  ? 'text-green-600 bg-green-50'
                                  : showShareMenu[film._id]
                                  ? 'text-[#6C63FF] bg-[#f0eeff]'
                                  : 'text-[#a3a39e] hover:text-[#6C63FF] hover:bg-[#f0eeff]'
                              }`}>
                              {isCopied ? (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                  </svg>
                                  <span>Share</span>
                                </>
                              )}
                            </button>
                            {showShareMenu[film._id] && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu((prev) => ({ ...prev, [film._id]: false }))} />
                                <div className="absolute bottom-full left-0 mb-2 w-44 bg-white border border-[#efefed] rounded-xl shadow-xl z-50 overflow-hidden">
                                  <button onClick={handleShareX}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-[#111110] hover:bg-[#f7f7f6] flex items-center gap-2.5 transition-colors">
                                    <span className="text-[13px] font-bold">𝕏</span> Share on X
                                  </button>
                                  <button onClick={handleShareNative}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-[#111110] hover:bg-[#f7f7f6] flex items-center gap-2.5 transition-colors border-t border-[#f0f0ee]">
                                    <span>📸</span> Share (Instagram…)
                                  </button>
                                  <button onClick={handleCopyLink}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-[#111110] hover:bg-[#f7f7f6] flex items-center gap-2.5 transition-colors border-t border-[#f0f0ee]">
                                    <span>🔗</span> Copy Link
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <button onClick={handleBookmark} title={isBookmarked ? 'Remove bookmark' : 'Save film'}
                            className={`ml-auto flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                              isBookmarked
                                ? 'text-[#6C63FF] bg-[#f0eeff] hover:bg-[#e4e0ff]'
                                : 'text-[#c8c8c4] hover:text-[#6C63FF] hover:bg-[#f0eeff]'
                            }`}>
                            <svg width="13" height="13" viewBox="0 0 24 24"
                              fill={isBookmarked ? 'currentColor' : 'none'}
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>

                          <button onClick={() => { setReportFilm(film); setReportReason(''); setReportDetails(''); setReportDone(false); }}
                            title="Report"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#d0d0cc] hover:text-red-400 hover:bg-red-50 transition-all">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── COMMENT MODAL ─────────────────────────────────────────── */}
        {commentFilm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed] flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-[#111110] text-sm">Comments</h3>
                  <p className="text-xs text-[#a3a39e] mt-0.5 line-clamp-1">{commentFilm.title}</p>
                </div>
                <button onClick={() => setCommentFilm(null)}
                  className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] transition-colors text-lg">×</button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {!filmComments[commentFilm._id] ? (
                  <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-12 bg-[#f7f7f6] rounded-xl animate-pulse" />)}</div>
                ) : filmComments[commentFilm._id].length === 0 ? (
                  <div className="text-center py-8 text-[#a3a39e] text-sm">No comments yet. Be the first!</div>
                ) : (
                  filmComments[commentFilm._id].map((c) => (
                    <div key={c._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
                        {c.author?.profileImage
                          ? <img src={c.author.profileImage} alt="" className="w-full h-full object-cover" />
                          : c.author?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[#111110]">{c.author?.name}</span>
                          <span className="text-xs text-[#a3a39e]">
                            {Math.floor((Date.now() - new Date(c.createdAt)) / 60000) < 60
                              ? `${Math.floor((Date.now() - new Date(c.createdAt)) / 60000)}m ago`
                              : `${Math.floor((Date.now() - new Date(c.createdAt)) / 3600000)}h ago`}
                          </span>
                        </div>
                        <p className="text-sm text-[#3b3b37]">{c.text}</p>
                      </div>
                      {user && c.author?._id === user.id && (
                        <button onClick={async () => {
                          await filmAPI.deleteComment(commentFilm._id, c._id).catch(() => {});
                          setFilmComments((prev) => ({
                            ...prev,
                            [commentFilm._id]: (prev[commentFilm._id] || []).filter((x) => x._id !== c._id),
                          }));
                        }} className="text-[#a3a39e] hover:text-red-500 text-xs flex-shrink-0 mt-1 transition-colors">✕</button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  setCommentPosting(true);
                  try {
                    const { data: d } = await filmAPI.addComment(commentFilm._id, commentText.trim());
                    setFilmComments((prev) => ({
                      ...prev,
                      [commentFilm._id]: [...(prev[commentFilm._id] || []), d.data],
                    }));
                    setCommentText('');
                  } catch {}
                  finally { setCommentPosting(false); }
                }} className="px-6 py-4 border-t border-[#efefed] flex-shrink-0 flex gap-2">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…" maxLength={500}
                    className="flex-1 rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
                  <button type="submit" disabled={commentPosting || !commentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition-all">
                    {commentPosting ? '…' : 'Post'}
                  </button>
                </form>
              ) : (
                <div className="px-6 py-4 border-t border-[#efefed] text-center text-sm text-[#a3a39e]">
                  <Link href="/login" className="text-[#6C63FF] font-semibold hover:underline">Sign in</Link> to comment
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REPORT MODAL ──────────────────────────────────────────── */}
        {reportFilm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[#111110]">Report Film</h3>
                <button onClick={() => setReportFilm(null)}
                  className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg transition-colors">×</button>
              </div>
              <p className="text-xs text-[#a3a39e] mb-4 line-clamp-1">"{reportFilm.title}"</p>

              {reportDone ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="font-semibold text-[#111110] mb-1">Report Submitted</p>
                  <p className="text-xs text-[#6b6b66]">Thank you. Our team will review it shortly.</p>
                  <button onClick={() => setReportFilm(null)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-[#0e0e0d] text-white text-sm font-semibold hover:bg-[#1a1a18] transition-colors">
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-3">Reason</p>
                  <div className="space-y-2 mb-4">
                    {[
                      { value: 'spam',          label: '🚫 Spam or misleading' },
                      { value: 'inappropriate', label: '⚠️ Inappropriate content' },
                      { value: 'copyright',     label: '©️ Copyright violation' },
                      { value: 'misinformation',label: '❌ Misinformation' },
                      { value: 'other',         label: '💬 Other' },
                    ].map(({ value, label }) => (
                      <button key={value} onClick={() => setReportReason(value)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          reportReason === value
                            ? 'border-[#6C63FF] bg-[#f4f3ff] text-[#6C63FF]'
                            : 'border-[#e0e0dd] text-[#3b3b37] hover:border-[#b0a9ff]'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Additional details (optional)…" rows={2} maxLength={500}
                    className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#6C63FF] mb-4" />
                  <button
                    disabled={!reportReason || reportSubmitting}
                    onClick={async () => {
                      setReportSubmitting(true);
                      try {
                        await filmAPI.report(reportFilm._id, reportReason, reportDetails);
                        setReportDone(true);
                      } catch (err) {
                        const msg = err.response?.data?.message || '';
                        if (msg.includes('already')) setReportDone(true);
                      }
                      finally { setReportSubmitting(false); }
                    }}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-40 transition-all">
                    {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d]">
              Reviews
              {avgRating && (
                <span className="ml-2 text-base font-normal text-[#6b6b66]">· ⭐ {avgRating} ({reviews.length})</span>
              )}
            </h2>
            <button
              onClick={() => toggleSection('reviews')}
              title={collapsedSections.reviews ? 'Expand' : 'Collapse'}
              className="text-xs font-bold text-[#a3a39e] hover:text-[#6C63FF] w-8 h-8 rounded-lg bg-[#f7f7f6] border border-[#efefed] hover:border-[#6C63FF]/30 hover:bg-[#f0eeff] flex items-center justify-center transition-all"
            >
              {collapsedSections.reviews ? '▼' : '▲'}
            </button>
          </div>
          {!collapsedSections.reviews && (reviewsLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="bg-[#efefed] rounded-xl h-24 animate-pulse" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-[#6b6b66] bg-white border border-[#efefed] rounded-xl">
              <p className="text-sm">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r._id} className="bg-white border border-[#efefed] rounded-xl p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-sm font-bold text-[#3730A3] shrink-0 overflow-hidden">
                        {r.reviewer?.profileImage
                          ? <img src={r.reviewer.profileImage} alt="" className="w-full h-full object=cover" />
                          : r.reviewer?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111110]">{r.reviewer?.name}</p>
                        <p className="text-xs text-[#6b6b66]">{r.project?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={s <= r.rating ? 'text-[#7C75FF]' : 'text-[#e0e0dd]'}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 text-sm text-[#6b6b66] italic leading-relaxed">"{r.comment}"</p>}
                  {r.categories && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {r.categories.professionalism && (
                        <span className="text-xs text-[#6b6b66] bg-[#f7f7f6] px-2 py-1 rounded-full">Professionalism: <strong className="text-[#111110]">{r.categories.professionalism}/5</strong></span>
                      )}
                      {r.categories.skill && (
                        <span className="text-xs text-[#6b6b66] bg-[#f7f7f6] px-2 py-1 rounded-full">Skill: <strong className="text-[#111110]">{r.categories.skill}/5</strong></span>
                      )}
                      {r.categories.communication && (
                        <span className="text-xs text-[#6b6b66] bg-[#f7f7f6] px-2 py-1 rounded-full">Communication: <strong className="text-[#111110]">{r.categories.communication}/5</strong></span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

          </div>{/* end main content */}
        </div>{/* end flex row */}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Followers</h3>
              <button onClick={() => setShowFollowersModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {loadingFollowers ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-12" />
                  ))}
                </div>
              ) : followersList.length > 0 ? (
                <div className="space-y-2">
                  {followersList.filter(Boolean).map((follower) => (
                    <Link key={follower._id} href={`/profile/${follower._id}`} onClick={() => setShowFollowersModal(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        {follower.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{follower.name}</p>
                        <p className="text-xs text-gray-500 truncate">@{follower.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><p className="text-gray-500">No followers yet</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Following</h3>
              <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {loadingFollowing ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-12" />
                  ))}
                </div>
              ) : followingList.length > 0 ? (
                <div className="space-y-2">
                  {followingList.filter(Boolean).map((following) => (
                    <Link key={following._id} href={`/profile/${following._id}`} onClick={() => setShowFollowingModal(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        {following.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{following.name}</p>
                        <p className="text-xs text-gray-500 truncate">@{following.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><p className="text-gray-500">Not following anyone yet</p></div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Message Request Modal ──────────────────────────────── */}
      {msgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#efefed]">
              <div>
                <h3 className="font-bold text-[#0e0e0d] text-base">Send Message Request</h3>
                <p className="text-xs text-[#6b6b66] mt-0.5">
                  to <span className="font-semibold text-[#0e0e0d]">{creator?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setMsgModal(false)}
                className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] text-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-[#6b6b66] mb-4 leading-relaxed">
                <span className="font-semibold text-[#0e0e0d]">{creator?.name}</span> will get a request notification.
                They can accept or decline before you can chat.
              </p>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-2">
                Intro message <span className="normal-case font-normal text-[#a3a39e]">(optional)</span>
              </label>
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={`Hi ${creator?.name?.split(' ')[0] || 'there'}, I'd love to connect with you…`}
                rows={3}
                maxLength={300}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] transition"
              />
              <p className="text-[11px] text-[#a3a39e] text-right mt-1">{msgText.length}/300</p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                onClick={() => setMsgModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#0e0e0d] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMsgRequest}
                disabled={messaging}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {messaging ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                ) : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-tap Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="user"
          targetId={creator?._id || id}
          targetLabel={creator?.name || 'this user'}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* ── Upload Film Guide Modal ── */}
      {showUploadGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#6C63FF] to-[#4740CC] px-6 pt-6 pb-8">
              <button
                onClick={() => setShowUploadGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Film size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">How to Upload a Film</h2>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                Films on CrewUp are tied to projects. Follow these steps to get your film live on your profile.
              </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-4">
              {[
                {
                  icon: <FolderPlus size={18} className="text-[#6C63FF]" />,
                  step: '1',
                  title: 'Create a Project',
                  desc: 'Go to Projects and create a new project for your film — short film, feature, music video, etc.',
                },
                {
                  icon: <Upload size={18} className="text-[#6C63FF]" />,
                  step: '2',
                  title: 'Upload Your Film',
                  desc: 'Inside your project, paste a YouTube or Vimeo link and fill in details like your role, genre, and description.',
                },
                {
                  icon: <CheckCircle2 size={18} className="text-[#6C63FF]" />,
                  step: '3',
                  title: 'It Appears on Your Profile',
                  desc: 'Once uploaded, your film automatically shows up in the Films section of your profile for everyone to see.',
                },
              ].map(({ icon, step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f0eeff] flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111110]">{title}</p>
                    <p className="text-xs text-[#6b6b66] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowUploadGuide(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors"
              >
                Maybe Later
              </button>
              <Link
                href="/projects/new"
                onClick={() => setShowUploadGuide(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Create Project <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}