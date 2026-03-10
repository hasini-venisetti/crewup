'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { profileAPI, reviewAPI, followAPI, projectAPI, filmAPI, notificationAPI } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAIL_CONFIG = {
  'available':      { label: 'Available',      dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  'open-to-offers': { label: 'Open to Offers', dot: 'bg-[#6C63FF]',  badge: 'bg-[#f0eeff] text-[#4740CC] border-[#c9c4ff]' },
  'busy':           { label: 'Currently Busy', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
};

const TYPE_ICON  = { video: '▶', image: '🖼', audio: '🎵', link: '🔗', other: '📁' };
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
  const { user } = useAuth();
  const router   = useRouter();

  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [reviews, setReviews]           = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [avgRating, setAvgRating]       = useState(null);
  const [messaging, setMessaging]       = useState(false);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [films, setFilms]                       = useState([]);
  const [filmsLoading, setFilmsLoading]         = useState(true);
  // Film interactions
  const [filmLikes, setFilmLikes]               = useState({});   // { [filmId]: { count, isLiked } }
  const [filmBookmarks, setFilmBookmarks]       = useState({});   // { [filmId]: bool }
  const [commentFilm, setCommentFilm]           = useState(null); // film object for comment modal
  const [reportFilm, setReportFilm]             = useState(null); // film object for report modal
  const [filmComments, setFilmComments]         = useState({});   // { [filmId]: comments[] }
  const [commentText, setCommentText]           = useState('');
  const [commentPosting, setCommentPosting]     = useState(false);
  const [reportReason, setReportReason]         = useState('');
  const [reportDetails, setReportDetails]       = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone]             = useState(false);
  const [copied, setCopied]                     = useState({});   // { [filmId]: bool }

  // Invite to project
  const [myProjects, setMyProjects]             = useState([]);
  const [showInviteMenu, setShowInviteMenu]     = useState(false);
  const [inviting, setInviting]                 = useState(false);
  const [invitedMap, setInvitedMap]             = useState({});   // { [projectId]: roleName }
  const [expandedProject, setExpandedProject]  = useState(null); // projectId showing role picker

  const handleMessage = async () => {
    if (!user) { router.push('/login'); return; }
    setMessaging(true);
    try {
      const { data } = await api.post('/conversations', { userId: id });
      const convId = data.data?._id;
      router.push(convId ? `/messages?conv=${convId}` : '/messages');
    } catch { router.push('/messages'); }
    finally { setMessaging(false); }
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

  const handleFollowToggle = async () => {
    console.log('Follow toggle clicked:', { isFollowing, userId: id, currentUser: user });
    
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    if (!user._id && !user.id) {
      console.log('User has no ID, cannot follow');
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    const currentUserId = user._id || user.id;
    console.log('Proceeding with follow toggle:', { currentUserId, targetUserId: id });
    
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? -1 : 1) }));
    try {
      if (wasFollowing) {
        console.log('Unfollowing user:', id);
        await followAPI.unfollow(id);
      } else {
        console.log('Following user:', id);
        const response = await followAPI.follow(id);
        console.log('Follow response:', response);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      console.error('Error response:', error.response);
      
      // Revert state on error
      setIsFollowing(wasFollowing);
      setFollowCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? 1 : -1) }));
      
      // Handle specific 409 (already following) error
      if (error.response?.status === 409) {
        // If we tried to follow but already following, keep the following state
        if (!wasFollowing) {
          setIsFollowing(true);
          setFollowCounts((c) => ({ ...c, followers: c.followers + 1 }));
          toast.error('You are already following this user');
        }
      } else {
        toast.error(`Failed to follow user: ${error.response?.data?.message || error.message}`);
      }
    } finally { 
      setFollowLoading(false); 
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

  useEffect(() => {
    profileAPI.getById(id)
      .then(({ data }) => {
        setProfile(data.data);
        reviewAPI.getForUser(id)
          .then(r => { setReviews(r.data.data || []); setAvgRating(r.data.averageRating); })
          .catch(() => {})
          .finally(() => setReviewsLoading(false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    followAPI.getCounts(id).then(({ data }) => setFollowCounts(data.data)).catch(() => {});
    projectAPI.getUserFilms(id)
      .then(({ data }) => {
        const list = data.data || [];
        setFilms(list);
        // Load like + bookmark statuses for all films
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

  useEffect(() => {
    if (!user || !id) return;
    const myId = user._id || user.id;
    if (myId === id) return;
    followAPI.getStatus(id).then(({ data }) => setIsFollowing(data.data.following)).catch(() => {});
  }, [id, user]);

  // Load current user's owned projects for "Invite to Project"
  useEffect(() => {
    if (!user || !id) return;
    const myId = user._id || user.id;
    if (myId === id) return; // viewing own profile
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

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!profile) return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">👤</p>
        <p className="text-2xl font-[Playfair_Display] text-[#111110] mb-2">Profile not found</p>
        <Link href="/explore" className="text-[#6b6b66] hover:text-[#111110] text-sm">← Browse Creators</Link>
      </div>
    </div>
  );

  const { user: creator, bio, skills, location, portfolioLinks, experienceLevel, availability, socialLinks, portfolio } = profile;
  const isOwnProfile = user && (user._id === id || user.id === id);
  const avail = AVAIL_CONFIG[availability] || AVAIL_CONFIG['available'];
  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Hero Section — dark */}
      <div
        className="bg-[#0e0e0d] relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        <div className="absolute top-0 right-1/4 w-80 h-64 bg-[#6C63FF]/6 rounded-full blur-3xl pointer-events-none" />
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
                  {/* Invite to Project — only shown to project owners */}
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
                          <div className="max-h-72 overflow-y-auto">
                            {myProjects.map((proj) => {
                              // check if profile user is already on this project's team
                              const isOnTeam = (proj.teamMembers || []).some(
                                (m) => (m.user?._id || m.user) === id
                              );
                              // open roles = required minus filled
                              const filledRoleNames = (proj.filledRoles || []).map((f) => f.role);
                              const openRoles = (proj.requiredRoles || []).filter(
                                (r) => !filledRoleNames.includes(r)
                              );
                              const sentRole   = invitedMap[proj._id];
                              const isExpanded = expandedProject === proj._id;

                              return (
                                <div key={proj._id} className="border-b border-white/5 last:border-0">
                                  {/* Project row */}
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

                                  {/* Role picker — expands below the project row */}
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

                      {/* Click-outside overlay */}
                      {showInviteMenu && (
                        <div className="fixed inset-0 z-40" onClick={() => { setShowInviteMenu(false); setExpandedProject(null); }} />
                      )}
                    </div>
                  )}

                  <button onClick={handleMessage} disabled={messaging}
                    className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all disabled:opacity-50">
                    {messaging ? 'Opening…' : '💬 Message'}
                  </button>
                  <button onClick={handleFollowToggle} disabled={followLoading}
                    className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all disabled:opacity-50 ${
                      isFollowing
                        ? 'border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400'
                        : 'bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20'
                    }`}>
                    {followLoading ? '…' : isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] flex items-center justify-center text-3xl font-bold text-[#3730A3] flex-shrink-0 overflow-hidden">
              {creator?.profileImage
                ? <img src={creator.profileImage} alt={creator.name} className="w-24 h-24 object-cover" />
                : creator?.name?.[0]?.toUpperCase() || '?'
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-[Playfair_Display] text-white">{creator?.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${avail.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                  {avail.label}
                </span>
              </div>

              <p className="text-white/50 text-sm mb-1">
                @{creator?.username}
                {creator?.role && <><span className="mx-2 text-white/20">·</span><span className="capitalize text-white/70">{creator.role.replace('-', ' ')}</span></>}
              </p>

              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={handleShowFollowers}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white/70">{followCounts.followers}</span> followers
                </button>
                <button 
                  onClick={handleShowFollowing}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white/70">{followCounts.following}</span> following
                </button>
                {avgRating && (
                  <span className="text-xs text-[#7C75FF] font-semibold">⭐ {avgRating} ({reviews.length})</span>
                )}
              </div>

              {(location?.city || location?.country) && (
                <p className="text-sm text-white/40 mb-1">📍 {[location.city, location.country].filter(Boolean).join(', ')}</p>
              )}
              {experienceLevel && (
                <p className="text-sm text-white/40">{EXP_LABEL[experienceLevel] || experienceLevel} level</p>
              )}
              {bio && <p className="text-white/60 text-sm leading-relaxed max-w-xl mt-3">{bio}</p>}
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
                    className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-full transition-all">
                    <span>{cfg?.icon}</span><span>{cfg?.label || key}</span>
                  </a>
                );
              })}
              {portfolioLinks?.map((lnk) => lnk.url && (
                <a key={lnk.url} href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-full transition-all">
                  🔗 {lnk.label || 'Portfolio'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-5">
            {skills?.length > 0 && (
              <div className="bg-white rounded-xl border border-[#efefed] p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="text-xs px-3 py-1.5 bg-[#f7f7f6] border border-[#e0e0dd] text-[#111110] font-medium rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-[#efefed] p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e] mb-3">Member Since</h2>
              <p className="text-sm text-[#111110]">
                {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          {/* Portfolio */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-[#efefed] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#a3a39e]">Portfolio</h2>
                {isOwnProfile && (
                  <Link href="/profile/edit#portfolio" className="text-xs text-[#6b6b66] hover:text-[#111110] transition-colors">+ Add Work</Link>
                )}
              </div>
              {portfolio?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map((item) => (
                    <div key={item._id} className="border border-[#efefed] hover:border-[#b0a9ff] hover:shadow-sm rounded-xl p-4 group transition-all">
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{TYPE_ICON[item.type] || '📁'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[#111110] truncate">{item.title}</p>
                          {item.description && <p className="text-xs text-[#6b6b66] mt-1 line-clamp-2">{item.description}</p>}
                          {item.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((t) => (
                                <span key={t} className="text-[11px] bg-[#f7f7f6] text-[#a3a39e] px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          )}
                          {item.link && (
                            <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#5750D4] hover:text-[#4740CC] mt-2 inline-block font-semibold">
                              View Work →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🎨</p>
                  <p className="text-sm text-[#6b6b66]">
                    {isOwnProfile ? 'Add your work to showcase what you can do' : 'No portfolio items yet'}
                  </p>
                  {isOwnProfile && (
                    <Link href="/profile/edit#portfolio"
                      className="inline-block mt-4 text-xs font-semibold border border-[#e0e0dd] text-[#111110] px-4 py-1.5 rounded-lg hover:border-[#0e0e0d] transition-all">
                      Add Portfolio Item
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FILMS ─────────────────────────────────────────────────── */}
        {(filmsLoading || films.length > 0) && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d]">🎬 Films</h2>
              {!filmsLoading && films.length > 0 && (
                <span className="text-xs text-[#a3a39e] font-medium">{films.length} film{films.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Loading skeletons */}
            {filmsLoading ? (
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

                  const handleShare = async () => {
                    const url = film.youtubeLink || `${window.location.origin}/films`;
                    await navigator.clipboard.writeText(url);
                    setCopied((prev) => ({ ...prev, [film._id]: true }));
                    setTimeout(() => setCopied((prev) => ({ ...prev, [film._id]: false })), 2000);
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

                      {/* Thumbnail — left */}
                      <a href={film.youtubeLink} target="_blank" rel="noopener noreferrer"
                        className="relative flex-shrink-0 w-44 sm:w-52 overflow-hidden bg-[#0e0e0d]">
                        {film.thumbnail ? (
                          <img src={film.thumbnail} alt={film.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🎬</div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                            <span className="text-[#6C63FF] text-base ml-0.5">▶</span>
                          </div>
                        </div>
                      </a>

                      {/* Info — right */}
                      <div className="flex flex-col flex-1 min-w-0 p-4">
                        {/* Title + badge */}
                        <div className="flex items-start gap-2 mb-1">
                          <p className="font-semibold text-sm text-[#111110] truncate flex-1 leading-snug">{film.title}</p>
                          {film.projectType && (
                            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest bg-[#f0eeff] text-[#6C63FF] border border-[#c9c4ff] px-2 py-0.5 rounded-full">
                              {film.projectType.replace('-', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Role */}
                        {film.userRole && (
                          <p className="text-xs text-[#a3a39e] mb-auto">
                            Role: <span className="font-medium text-[#6b6b66]">{film.userRole}</span>
                          </p>
                        )}

                        {/* Stats row */}
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

                        {/* ── Action bar ── */}
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#f0f0ee]">

                          {/* Like */}
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

                          {/* Comment */}
                          <button onClick={openComments}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#a3a39e] hover:text-[#6C63FF] hover:bg-[#f0eeff] transition-all">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>Comment</span>
                          </button>

                          {/* Share */}
                          <button onClick={handleShare}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isCopied
                                ? 'text-green-600 bg-green-50'
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

                          {/* Bookmark */}
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

                          {/* Report */}
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
            )}
          </div>
        )}

        {/* ── COMMENT MODAL ─────────────────────────────────────────── */}
        {commentFilm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed] flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-[#111110] text-sm">Comments</h3>
                  <p className="text-xs text-[#a3a39e] mt-0.5 line-clamp-1">{commentFilm.title}</p>
                </div>
                <button onClick={() => setCommentFilm(null)}
                  className="w-8 h-8 rounded-full bg-[#f7f7f6] hover:bg-[#efefed] flex items-center justify-center text-[#6b6b66] transition-colors text-lg">×</button>
              </div>

              {/* List */}
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

              {/* Add comment */}
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
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-[Playfair_Display] text-[#0e0e0d]">
              Reviews
              {avgRating && (
                <span className="ml-2 text-base font-normal text-[#6b6b66]">· ⭐ {avgRating} ({reviews.length})</span>
              )}
            </h2>
          </div>
          {reviewsLoading ? (
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
                          ? <img src={r.reviewer.profileImage} alt="" className="w-full h-full object-cover" />
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
          )}
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Followers</h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                  {followersList.map((follower) => (
                    <Link
                      key={follower._id}
                      href={`/profile/${follower._id}`}
                      onClick={() => setShowFollowersModal(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
                <div className="text-center py-8">
                  <p className="text-gray-500">No followers yet</p>
                </div>
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
              <button
                onClick={() => setShowFollowingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                  {followingList.map((following) => (
                    <Link
                      key={following._id}
                      href={`/profile/${following._id}`}
                      onClick={() => setShowFollowingModal(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
                <div className="text-center py-8">
                  <p className="text-gray-500">Not following anyone yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
