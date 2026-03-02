'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { profileAPI, reviewAPI, followAPI } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AVAIL_CONFIG = {
  'available':      { label: 'Available',      dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  'open-to-offers': { label: 'Open to Offers', dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
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

  const handleFollowToggle = async () => {
    if (!user) { router.push('/login'); return; }
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? -1 : 1) }));
    try {
      if (wasFollowing) await followAPI.unfollow(id);
      else await followAPI.follow(id);
    } catch {
      setIsFollowing(wasFollowing);
      setFollowCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? 1 : -1) }));
    } finally { setFollowLoading(false); }
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
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const myId = user._id || user.id;
    if (myId === id) return;
    followAPI.getStatus(id).then(({ data }) => setIsFollowing(data.data.following)).catch(() => {});
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
        <div className="absolute top-0 right-1/4 w-80 h-64 bg-amber-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[900px] mx-auto px-6 pt-8 pb-12">
          {/* Back + actions */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/explore" className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5">
              ← Browse Creators
            </Link>
            <div className="flex items-center gap-3">
              {isOwnProfile && (
                <Link href="/profile/edit"
                  className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && (
                <>
                  <button onClick={handleMessage} disabled={messaging}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all disabled:opacity-50">
                    {messaging ? 'Opening…' : '💬 Message'}
                  </button>
                  <button onClick={handleFollowToggle} disabled={followLoading}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 ${
                      isFollowing
                        ? 'border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400'
                        : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
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
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center text-3xl font-bold text-amber-800 flex-shrink-0 overflow-hidden">
              {creator?.profileImage
                ? <img src={creator.profileImage} alt={creator.name} className="w-24 h-24 object-cover" />
                : creator?.name?.[0]?.toUpperCase() || '?'
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-3xl font-[Playfair_Display] text-white">{creator?.name}</h1>
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
                <span className="text-xs text-white/40">
                  <span className="font-semibold text-white/70">{followCounts.followers}</span> followers
                </span>
                <span className="text-xs text-white/40">
                  <span className="font-semibold text-white/70">{followCounts.following}</span> following
                </span>
                {avgRating && (
                  <span className="text-xs text-amber-400 font-semibold">⭐ {avgRating} ({reviews.length})</span>
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
      <div className="max-w-[900px] mx-auto px-6 py-10">
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
                    <div key={item._id} className="border border-[#efefed] hover:border-amber-300 hover:shadow-sm rounded-xl p-4 group transition-all">
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
                              className="text-xs text-amber-600 hover:text-amber-700 mt-2 inline-block font-semibold">
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
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-sm font-bold text-amber-800 shrink-0 overflow-hidden">
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
                        <span key={s} className={s <= r.rating ? 'text-amber-400' : 'text-[#e0e0dd]'}>★</span>
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
    </div>
  );
}
