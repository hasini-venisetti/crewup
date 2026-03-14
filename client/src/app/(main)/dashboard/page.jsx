'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProjectCard from '@/components/ui/ProjectCard';
import { SkeletonGrid, SkeletonPage } from '@/components/ui/SkeletonCard';
import { projectAPI, applicationAPI, followAPI, reviewAPI, mentorAPI, profileAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { computeCompletenessScore, getCompletenessColor } from '@/lib/profileCompleteness';

const STATUS_CLASS = {
  pending:  'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff]',
  accepted: 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200',
  rejected: 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200',
};
const STATUS_ICON = { pending: '⏳', accepted: '✅', rejected: '❌' };

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-12 h-12 text-base';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] text-[#3730A3] font-bold flex items-center justify-center flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function ApplicationCard({ app, onDecision }) {
  const [loading, setLoading] = useState('');
  const decide = async (status) => {
    setLoading(status);
    try {
      await applicationAPI.updateStatus({ applicationId: app._id, status });
      toast.success(status === 'accepted' ? `${app.applicant?.name} accepted!` : 'Application declined.');
      onDecision(app._id, status);
    } catch { toast.error('Failed to update application.'); }
    finally { setLoading(''); }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 bg-[#fafaf9] border border-[#efefed] rounded-xl hover:border-[#d0d0ce] transition-colors">
      <Link href={`/profile/${app.applicant?._id}`} className="flex items-start gap-3 flex-1 group">
        <Avatar name={app.applicant?.name} image={app.applicant?.profileImage} />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-[#111110] group-hover:underline">{app.applicant?.name}</div>
          <div className="text-xs text-[#6b6b66] mt-0.5">@{app.applicant?.username} · <span className="capitalize">{app.applicant?.role?.replace('-',' ')}</span></div>
          <div className="text-xs text-[#111110]/80 mt-1">For: <span className="text-[#6b6b66]">{app.roleApplyingFor}</span></div>
          <p className="text-xs text-[#6b6b66] mt-2 leading-relaxed line-clamp-2 italic">"{app.message}"</p>
          <div className="text-xs text-[#a3a39e] mt-1.5">{new Date(app.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
        {app.status === 'pending' ? (
          <>
            <button onClick={() => decide('accepted')} disabled={!!loading}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-40">
              {loading==='accepted'?'…':'Accept'}
            </button>
            <button onClick={() => decide('rejected')} disabled={!!loading}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
              {loading==='rejected'?'…':'Decline'}
            </button>
          </>
        ) : (
          <span className={STATUS_CLASS[app.status]}>{STATUS_ICON[app.status]} {app.status}</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body, cta, href }) {
  return (
    <div className="bg-white rounded-2xl border border-[#efefed] text-center py-10 sm:py-20 px-4 sm:px-8">
      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{icon}</div>
      <p className="font-bold text-[#111110] mb-2">{title}</p>
      <p className="text-[#6b6b66] text-sm mb-6 sm:mb-8 max-w-xs mx-auto leading-relaxed">{body}</p>
      <Link href={href}
        className="inline-block bg-[#0e0e0d] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2d2d2b] transition-colors active:scale-[0.98]">
        {cta}
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab]                       = useState('projects');
  const [myProjects, setMyProjects]         = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [recommended, setRecommended]       = useState([]);
  const [incomingApps, setIncomingApps]     = useState({});
  const [followingFeed, setFollowingFeed]   = useState([]);
  const [feedLoading, setFeedLoading]       = useState(false);
  const [myReviews, setMyReviews]           = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [dataLoading, setDataLoading]       = useState(true);
  const [recLoading, setRecLoading]         = useState(false);
  const [isMentor, setIsMentor]             = useState(false);
  const [mentorApps, setMentorApps]         = useState([]);
  const [mentorAppsLoading, setMentorAppsLoading] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [projRes, appRes] = await Promise.all([projectAPI.getMine(), applicationAPI.getMine()]);
      setMyProjects(projRes.data.data);
      setMyApplications(appRes.data.data);
      const incoming = {};
      await Promise.all(projRes.data.data.map(async (p) => {
        try { const r = await applicationAPI.getForProject(p._id); incoming[p._id] = r.data.data; }
        catch { incoming[p._id] = []; }
      }));
      setIncomingApps(incoming);
    } catch { toast.error('Failed to load dashboard.'); }
    finally { setDataLoading(false); }
  }, [user]);

  const fetchRecommended = useCallback(async () => {
    if (!user) return;
    setRecLoading(true);
    try { const { data } = await projectAPI.getRecommended(); setRecommended(data.data); }
    catch { /* silent */ }
    finally { setRecLoading(false); }
  }, [user]);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setFeedLoading(true);
    try { const { data } = await followAPI.getFeed(); setFollowingFeed(data.data || []); }
    catch { /* silent */ }
    finally { setFeedLoading(false); }
  }, [user]);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setReviewsLoading(true);
    const myId = user._id || user.id;
    try { const { data } = await reviewAPI.getForUser(myId); setMyReviews(data.data || []); }
    catch { /* silent */ }
    finally { setReviewsLoading(false); }
  }, [user]);

  const fetchMentorApps = useCallback(async () => {
    if (!user) return;
    setMentorAppsLoading(true);
    try {
      // Check if the user is a mentor
      const profileRes = await profileAPI.getMe();
      const prof = profileRes.data?.data;
      if (prof?.isMentor) {
        setIsMentor(true);
        const { data } = await mentorAPI.getApplications();
        setMentorApps(data.data || []);
      } else {
        setIsMentor(false);
      }
    } catch { /* silent */ }
    finally { setMentorAppsLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); fetchRecommended(); fetchFeed(); fetchReviews(); fetchMentorApps(); }, [fetchAll, fetchRecommended, fetchFeed, fetchReviews, fetchMentorApps]);

  const handleDecision = (applicationId, status) => {
    setIncomingApps((prev) => {
      const updated = { ...prev };
      for (const pid in updated) updated[pid] = updated[pid].map((a) => a._id === applicationId ? { ...a, status } : a);
      return updated;
    });
  };

  const handleMentorDecision = (requestId, action) => {
    setMentorApps((prev) => prev.filter((r) => r._id !== requestId));
  };

  const allIncoming        = Object.values(incomingApps).flat();
  const pendingCount       = allIncoming.filter((a) => a.status === 'pending').length;
  const acceptedCount      = myApplications.filter((a) => a.status === 'accepted').length;
  const pendingMentorCount = mentorApps.filter((r) => r.status === 'pending').length;

  if (authLoading || dataLoading) return <div className="min-h-screen bg-[#fafaf9]"><SkeletonPage /></div>;
  if (!user) return null;

  const tabs = [
    { key: 'projects',    label: 'My Projects' },
    { key: 'incoming',    label: `Incoming${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'applied',     label: 'My Applications' },
    ...(isMentor ? [{ key: 'mentorship', label: `🎓 Mentorship${pendingMentorCount > 0 ? ` (${pendingMentorCount})` : ''}` }] : []),
    { key: 'following',   label: '👥 Following' },
    { key: 'ratings',     label: `⭐ Ratings${myReviews.length > 0 ? ` (${myReviews.length})` : ''}` },
    { key: 'recommended', label: '✦ For You' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Dashboard Header */}
      <div
        className="bg-[#0e0e0d] pt-8 pb-10 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        <div className="absolute top-0 left-1/4 w-72 h-48 bg-[#6C63FF]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold mb-2">Dashboard</p>
              <h1 className="text-3xl sm:text-4xl font-[Playfair_Display] text-white">
                Hey, {user.name?.split(' ')[0]}
              </h1>
              <p className="text-white/40 mt-1 text-sm">@{user.username} · <span className="capitalize">{user.role?.replace('-',' ')}</span></p>
            </div>
            <div className="flex gap-3">
              <Link href="/profile/edit"
                className="text-sm font-semibold px-5 py-2.5 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all">
                Edit Profile
              </Link>
              <Link href="/create-project"
                className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98]">
                + Post Project
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'My Projects',       value: myProjects.length,     highlight: false },
              { label: 'Applications Sent', value: myApplications.length, highlight: false },
              { label: 'Accepted',          value: acceptedCount,         highlight: acceptedCount > 0 },
              { label: 'Pending Review',    value: pendingCount,          highlight: pendingCount > 0 },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-5 text-center hover:bg-white/8 transition-colors">
                <div className={`text-2xl sm:text-3xl font-black mb-0.5 sm:mb-1 ${s.highlight ? 'text-[#7C75FF]' : 'text-white'}`}>{s.value}</div>
                <div className="text-[10px] sm:text-xs text-white/40 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-10">

        {/* Profile completeness + email verification banner */}
        <ProfileCompletenessBanner user={user} />

        {/* Tabs */}
        <div className="w-full overflow-x-auto mb-8 -mx-0">
          <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 shadow-sm w-max min-w-full sm:w-fit">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-[#0e0e0d] text-white shadow-sm'
                    : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#f7f7f6]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── My Projects ── */}
        {tab === 'projects' && (
          myProjects.length === 0
            ? <EmptyState icon="🎬" title="No projects yet" body="Post your first project and start building a team." cta="Post a Project" href="/create-project" />
            : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {myProjects.map((p) => (
                  <div key={p._id} className="flex flex-col gap-2">
                    <ProjectCard project={p} />
                    {/* Auto-suspended badge (reported by a user, awaiting admin review) */}
                    {p.autoSuspended && (
                      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-red-100 border border-red-300 text-red-800">
                        <span>⛔</span>
                        <span>Temporarily suspended — reported by a user, admin is reviewing</span>
                      </div>
                    )}
                    {p.timelineStage === 'released' ? (
                      <div className="flex gap-1.5 sm:gap-2">
                        <Link href={`/projects/${p._id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold bg-green-500 text-white py-2 sm:py-2.5 px-2 rounded-lg hover:bg-green-600 transition-colors">
                          🚀 <span className="hidden sm:inline">View </span>Done
                        </Link>
                        <Link href={`/projects/${p._id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold border border-green-200 text-green-700 py-2 sm:py-2.5 px-2 rounded-lg hover:bg-green-50 transition-colors">
                          ⭐ Rate
                        </Link>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 sm:gap-2">
                        <Link href={`/projects/${p._id}/team?tab=chat`}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold bg-[#0e0e0d] text-white py-2 sm:py-2.5 px-2 rounded-lg hover:bg-[#2d2d2b] transition-colors">
                          💬 Chat
                        </Link>
                        <Link href={`/projects/${p._id}/team`}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold border border-[#e0e0dd] text-[#111110] py-2 sm:py-2.5 px-2 rounded-lg hover:border-[#0e0e0d] transition-colors">
                          👥 Team
                        </Link>
                        <Link href={`/projects/${p._id}/applications`}
                          className="flex-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold border border-[#e0e0dd] text-[#111110] py-2 sm:py-2.5 px-2 rounded-lg hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors">
                          📬 Apps
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
        )}

        {/* ── Incoming ── */}
        {tab === 'incoming' && (
          <div className="flex flex-col gap-5">
            {myProjects.map((project) => {
              const apps = incomingApps[project._id] || [];
              if (apps.length === 0) return null;
              return (
                <div key={project._id} className="bg-white rounded-2xl border border-[#efefed] p-6">
                  <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#efefed]">
                    <Link href={`/projects/${project._id}`} className="font-bold text-[#111110] hover:underline">{project.title}</Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs capitalize bg-[#f7f7f6] border border-[#e0e0dd] text-[#6b6b66] px-2.5 py-1 rounded-full">
                        {project.projectType?.replace('-',' ')}
                      </span>
                      <span className="text-xs text-[#6b6b66]">{apps.length} application{apps.length!==1?'s':''}</span>
                      <Link href={`/projects/${project._id}/applications`}
                        className="text-xs font-semibold text-[#6C63FF] hover:underline">
                        View All →
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {apps.map((app) => <ApplicationCard key={app._id} app={app} onDecision={handleDecision} />)}
                  </div>
                </div>
              );
            })}
            {allIncoming.length === 0 && (
              <EmptyState icon="📬" title="No applications yet" body="Applications will appear here once creators apply to your projects." cta="Browse Projects" href="/projects" />
            )}
          </div>
        )}

        {/* ── My Applications ── */}
        {tab === 'applied' && (
          <div className="flex flex-col gap-3">
            {myApplications.length === 0
              ? <EmptyState icon="🔍" title="No applications sent" body="Browse open projects and apply to join a creative team." cta="Explore Projects" href="/projects" />
              : myApplications.map((app) => (
                  <div key={app._id}
                    className={`bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-all ${
                      app.project?.timelineStage === 'released' ? 'border-green-200' : 'border-[#efefed]'
                    }`}>
                    {app.project?.timelineStage === 'released' && (
                      <div className="sm:hidden w-full bg-green-500 text-white text-[10px] font-bold tracking-widest uppercase text-center py-1 -mx-5 -mt-5 mb-0 px-5 rounded-t-xl">
                        🚀 Completed · Released
                      </div>
                    )}
                    <Link href={`/projects/${app.project?._id}`} className="flex-1 min-w-0 group">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-[#111110] group-hover:underline truncate">{app.project?.title}</span>
                        {app.project?.timelineStage === 'released' && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wide text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                            🚀 Released
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-[#6b6b66]">Role: {app.roleApplyingFor}</span>
                        <span className="text-xs text-[#a3a39e]">·</span>
                        <span className="text-xs text-[#6b6b66] capitalize">{app.project?.projectType?.replace('-',' ')}</span>
                      </div>
                      <p className="text-xs text-[#a3a39e] mt-1.5 italic line-clamp-1">"{app.message}"</p>
                      <div className="text-xs text-[#a3a39e] mt-1">
                        {new Date(app.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={STATUS_CLASS[app.status]}>{STATUS_ICON[app.status]} {app.status}</span>
                      {app.status === 'accepted' && app.project?.timelineStage !== 'released' && (
                        <Link href={`/projects/${app.project?._id}/team`}
                          className="text-xs font-semibold bg-[#0e0e0d] text-white px-3 py-1.5 rounded-lg hover:bg-[#2d2d2b] transition-colors whitespace-nowrap">
                          👥 Go to Team Dashboard
                        </Link>
                      )}
                      {app.status === 'accepted' && app.project?.timelineStage === 'released' && (
                        <Link href={`/projects/${app.project?._id}`}
                          className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">
                          ⭐ Rate Teammates
                        </Link>
                      )}
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* ── Mentorship Applications ── */}
        {tab === 'mentorship' && (
          <div className="flex flex-col gap-5">
            {/* Mentor status quick-toggle */}
            <div className="bg-white rounded-2xl border border-[#efefed] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111110] text-sm">Mentorship Availability</p>
                <p className="text-xs text-[#6b6b66] mt-0.5">Control whether people can apply to you as a mentor.</p>
              </div>
              <MentorStatusToggle />
            </div>

            {mentorAppsLoading ? (
              <div className="bg-white rounded-2xl border border-[#efefed] p-10 text-center text-[#a3a39e] text-sm">Loading applications…</div>
            ) : mentorApps.length === 0 ? (
              <EmptyState icon="🎓" title="No applications yet" body="When someone applies for mentorship with you, it will appear here." cta="View Your Profile" href={`/profile/${user._id || user.id}`} />
            ) : (
              <div className="bg-white rounded-2xl border border-[#efefed] p-6">
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#efefed]">
                  <p className="font-bold text-[#111110]">Mentorship Applications</p>
                  <span className="text-xs text-[#6b6b66]">{mentorApps.length} application{mentorApps.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {mentorApps.map((req) => (
                    <MentorApplicationCard key={req._id} req={req} onDecision={handleMentorDecision} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Following Feed ── */}
        {tab === 'following' && (
          <div>
            <p className="text-[#6b6b66] text-sm mb-6">Latest projects from creators you follow.</p>
            {feedLoading
              ? <SkeletonGrid count={6} />
              : followingFeed.length === 0
                ? <EmptyState icon="👥" title="Your feed is empty" body="Follow creators on the Explore page to see their projects here." cta="Explore Creators" href="/explore" />
                : <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">{followingFeed.map((p) => <ProjectCard key={p._id} project={p} />)}</div>
            }
          </div>
        )}

        {/* ── Ratings ── */}
        {tab === 'ratings' && (
          <div>
            {reviewsLoading ? (
              <div className="bg-white rounded-2xl border border-[#efefed] p-10 text-center text-[#a3a39e] text-sm">Loading ratings…</div>
            ) : myReviews.length === 0 ? (
              <EmptyState icon="⭐" title="No ratings yet" body="Complete a released project and your teammates can rate your collaboration." cta="Browse Projects" href="/projects" />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Average summary */}
                {(() => {
                  const avg = (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1);
                  return (
                    <div className="bg-[#0e0e0d] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="text-center flex-shrink-0">
                        <div className="text-4xl sm:text-5xl font-black text-white">{avg}</div>
                        <div className="flex gap-0.5 justify-center mt-2">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={`text-lg ${s <= Math.round(avg) ? 'text-[#7C75FF]' : 'text-white/20'}`}>★</span>
                          ))}
                        </div>
                        <div className="text-xs text-white/40 mt-1">{myReviews.length} rating{myReviews.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="hidden sm:block w-px h-12 bg-white/10" />
                      <p className="text-xs sm:text-sm text-white/50 text-center sm:text-left">Ratings received from teammates on completed collaborative projects.</p>
                    </div>
                  );
                })()}
                {/* Individual reviews */}
                {myReviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-xl border border-[#efefed] p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] text-[#3730A3] text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {review.reviewer?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <Link href={`/profile/${review.reviewer?._id}`} className="font-semibold text-sm text-[#111110] hover:underline">
                            {review.reviewer?.name}
                          </Link>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} className={`text-sm ${s <= review.rating ? 'text-[#7C75FF]' : 'text-[#e0e0dd]'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-[#6b6b66] mb-2">
                          on <Link href={`/projects/${review.project?._id}`} className="hover:underline">{review.project?.title || 'a project'}</Link>
                          {' · '}{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-[#6b6b66] italic leading-relaxed">"{review.comment}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Recommended ── */}
        {tab === 'recommended' && (
          <div>
            <p className="text-[#6b6b66] text-sm mb-6">
              Matched to your role as a <span className="text-[#111110] font-medium capitalize">{user.role?.replace('-',' ')}</span> — projects you haven't applied to yet.
            </p>
            {recLoading
              ? <SkeletonGrid count={6} />
              : recommended.length === 0
                ? <EmptyState icon="✦" title="No recommendations yet" body="Complete your profile with your role to get matched with relevant projects." cta="Edit Profile" href="/profile/edit" />
                : <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">{recommended.map((p) => <ProjectCard key={p._id} project={p} />)}</div>
            }
            {recommended.length > 0 && (
              <div className="mt-8 text-center">
                <Link href="/projects"
                  className="inline-block border border-[#e0e0dd] text-[#0e0e0d] font-semibold text-sm px-6 py-2.5 rounded-lg hover:border-[#0e0e0d] transition-all">
                  Browse All Projects →
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── ProfileCompletenessBanner ─────────────────────────────────────────── */
function ProfileCompletenessBanner({ user }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    profileAPI.getMe().then(({ data }) => setProfile(data?.data)).catch(() => {});
  }, []);

  if (!profile) return null;

  const { score, missing, label } = computeCompletenessScore(profile, user);
  const color = getCompletenessColor(score);

  // Only show banner if score < 90 or email not verified
  if (score >= 90 && user?.isEmailVerified) return null;

  return (
    <div className="mb-6 bg-white border border-[#efefed] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[#111110]">Profile Completeness</p>
          <p className="text-xs text-[#6b6b66]">{label} — {score}% complete</p>
        </div>
        <Link href="/profile/edit" className="text-xs font-semibold text-[#6C63FF] hover:underline">
          Complete Profile →
        </Link>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-[#f0f0ee] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {/* Missing items */}
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {!user?.isEmailVerified && (
            <Link href="/verify-email"
              className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium hover:bg-amber-100 transition-colors">
              ⚠️ Verify email
            </Link>
          )}
          {missing.filter(m => m !== 'Verified email').slice(0, 4).map((m) => (
            <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-[#f5f5f3] border border-[#e0e0dd] text-[#6b6b66]">
              + {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── MentorStatusToggle ────────────────────────────────────────────────── */
function MentorStatusToggle() {
  const [status, setStatus]   = useState('open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    profileAPI.getMe()
      .then(({ data }) => { if (data?.data?.mentorStatus) setStatus(data.data.mentorStatus); })
      .catch(() => {});
  }, []);

  const toggle = async (val) => {
    if (loading || val === status) return;
    setLoading(true);
    const prev = status;
    setStatus(val);
    try {
      await mentorAPI.updateStatus(val);
      toast.success(`Status updated to "${val}"`);
    } catch {
      setStatus(prev);
      toast.error('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const CFG = {
    open:   { label: '🟢 Open',   cls: 'bg-green-500 text-white border-green-500' },
    paused: { label: '⏸ Paused', cls: 'bg-yellow-400 text-white border-yellow-400' },
    closed: { label: '🔴 Closed', cls: 'bg-red-500 text-white border-red-500' },
  };

  return (
    <div className="flex gap-2 flex-shrink-0 flex-wrap">
      {Object.entries(CFG).map(([key, { label, cls }]) => (
        <button key={key} onClick={() => toggle(key)} disabled={loading}
          className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all disabled:opacity-50 ${
            status === key ? cls : 'border-[#e0e0dd] text-[#6b6b66] hover:border-[#111110] hover:text-[#111110]'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── MentorApplicationCard ─────────────────────────────────────────────── */
function MentorApplicationCard({ req, onDecision }) {
  const router              = useRouter();
  const [loading, setLoading] = useState('');

  const decide = async (action) => {
    setLoading(action);
    try {
      if (action === 'accept') {
        const res    = await mentorAPI.acceptRequest(req._id);
        const convId = res.data?.data?._id;
        toast.success(`Accepted! Opening chat with ${req.sender?.name}…`);
        onDecision(req._id, 'accepted');
        router.push(convId ? `/messages?conv=${convId}` : '/messages');
      } else {
        await mentorAPI.declineRequest(req._id);
        toast.success('Application declined.');
        onDecision(req._id, 'declined');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 bg-[#fafaf9] border border-[#efefed] rounded-xl hover:border-[#d0d0ce] transition-colors">
      <Link href={`/profile/${req.sender?._id}`} className="flex items-start gap-3 flex-1 group">
        <Avatar name={req.sender?.name} image={req.sender?.profileImage} />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-[#111110] group-hover:underline">{req.sender?.name}</div>
          <div className="text-xs text-[#6b6b66] mt-0.5">@{req.sender?.username} · <span className="capitalize">{req.sender?.role?.replace('-',' ')}</span></div>
          {req.message && (
            <p className="text-xs text-[#6b6b66] mt-2 leading-relaxed italic line-clamp-2">"{req.message}"</p>
          )}
          <div className="text-xs text-[#a3a39e] mt-1.5">{new Date(req.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
        {req.status === 'pending' ? (
          <>
            <button onClick={() => decide('accept')} disabled={!!loading}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5750D4] transition-colors disabled:opacity-40">
              {loading === 'accept' ? '…' : 'Accept & Chat'}
            </button>
            <button onClick={() => decide('decline')} disabled={!!loading}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
              {loading === 'decline' ? '…' : 'Decline'}
            </button>
          </>
        ) : (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            req.status === 'accepted'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {req.status === 'accepted' ? '✅' : '❌'} {req.status}
          </span>
        )}
      </div>
    </div>
  );
}
