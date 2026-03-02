'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProjectCard from '@/components/ui/ProjectCard';
import { SkeletonGrid, SkeletonPage } from '@/components/ui/SkeletonCard';
import { projectAPI, applicationAPI, followAPI, reviewAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const STATUS_CLASS = {
  pending:  'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200',
  rejected: 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200',
};
const STATUS_ICON = { pending: '⏳', accepted: '✅', rejected: '❌' };

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-12 h-12 text-base';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-amber-800 font-bold flex items-center justify-center flex-shrink-0`}>
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
    <div className="bg-white rounded-2xl border border-[#efefed] text-center py-20 px-8">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-bold text-[#111110] mb-2">{title}</p>
      <p className="text-[#6b6b66] text-sm mb-8 max-w-xs mx-auto leading-relaxed">{body}</p>
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

  useEffect(() => { fetchAll(); fetchRecommended(); fetchFeed(); fetchReviews(); }, [fetchAll, fetchRecommended, fetchFeed, fetchReviews]);

  const handleDecision = (applicationId, status) => {
    setIncomingApps((prev) => {
      const updated = { ...prev };
      for (const pid in updated) updated[pid] = updated[pid].map((a) => a._id === applicationId ? { ...a, status } : a);
      return updated;
    });
  };

  const allIncoming   = Object.values(incomingApps).flat();
  const pendingCount  = allIncoming.filter((a) => a.status === 'pending').length;
  const acceptedCount = myApplications.filter((a) => a.status === 'accepted').length;

  if (authLoading || dataLoading) return <div className="min-h-screen bg-[#fafaf9]"><SkeletonPage /></div>;
  if (!user) return null;

  const tabs = [
    { key: 'projects',    label: 'My Projects' },
    { key: 'incoming',    label: `Incoming${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'applied',     label: 'My Applications' },
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
        <div className="absolute top-0 left-1/4 w-72 h-48 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2">Dashboard</p>
              <h1 className="text-4xl font-[Playfair_Display] text-white">
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
                className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]">
                + Post Project
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'My Projects',       value: myProjects.length,     highlight: false },
              { label: 'Applications Sent', value: myApplications.length, highlight: false },
              { label: 'Accepted',          value: acceptedCount,         highlight: acceptedCount > 0 },
              { label: 'Pending Review',    value: pendingCount,          highlight: pendingCount > 0 },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:bg-white/8 transition-colors">
                <div className={`text-3xl font-black mb-1 ${s.highlight ? 'text-amber-400' : 'text-white'}`}>{s.value}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-10">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 mb-8 w-fit overflow-x-auto shadow-sm">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-[#0e0e0d] text-white shadow-sm'
                  : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#f7f7f6]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── My Projects ── */}
        {tab === 'projects' && (
          myProjects.length === 0
            ? <EmptyState icon="🎬" title="No projects yet" body="Post your first project and start building a team." cta="Post a Project" href="/create-project" />
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myProjects.map((p) => (
                  <div key={p._id} className="flex flex-col gap-2">
                    <ProjectCard project={p} />
                    {p.timelineStage === 'released' ? (
                      <div className="flex gap-2">
                        <Link href={`/projects/${p._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-green-500 text-white py-2.5 px-3 rounded-lg hover:bg-green-600 transition-colors">
                          🚀 View Completed
                        </Link>
                        <Link href={`/projects/${p._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-green-200 text-green-700 py-2.5 px-3 rounded-lg hover:bg-green-50 transition-colors">
                          ⭐ Rate Teammates
                        </Link>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Link href={`/projects/${p._id}/team?tab=chat`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#0e0e0d] text-white py-2.5 px-3 rounded-lg hover:bg-[#2d2d2b] transition-colors">
                          💬 Team Chat
                        </Link>
                        <Link href={`/projects/${p._id}/team`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#e0e0dd] text-[#111110] py-2.5 px-3 rounded-lg hover:border-[#0e0e0d] transition-colors">
                          👥 Team Dashboard
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

        {/* ── Following Feed ── */}
        {tab === 'following' && (
          <div>
            <p className="text-[#6b6b66] text-sm mb-6">Latest projects from creators you follow.</p>
            {feedLoading
              ? <SkeletonGrid count={6} />
              : followingFeed.length === 0
                ? <EmptyState icon="👥" title="Your feed is empty" body="Follow creators on the Explore page to see their projects here." cta="Explore Creators" href="/explore" />
                : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{followingFeed.map((p) => <ProjectCard key={p._id} project={p} />)}</div>
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
                    <div className="bg-[#0e0e0d] rounded-2xl p-6 flex items-center gap-6">
                      <div className="text-center flex-shrink-0">
                        <div className="text-5xl font-black text-white">{avg}</div>
                        <div className="flex gap-0.5 justify-center mt-2">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={`text-lg ${s <= Math.round(avg) ? 'text-amber-400' : 'text-white/20'}`}>★</span>
                          ))}
                        </div>
                        <div className="text-xs text-white/40 mt-1">{myReviews.length} rating{myReviews.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <p className="text-sm text-white/50">Ratings received from teammates on completed collaborative projects.</p>
                    </div>
                  );
                })()}
                {/* Individual reviews */}
                {myReviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-xl border border-[#efefed] p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-amber-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {review.reviewer?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <Link href={`/profile/${review.reviewer?._id}`} className="font-semibold text-sm text-[#111110] hover:underline">
                            {review.reviewer?.name}
                          </Link>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} className={`text-sm ${s <= review.rating ? 'text-amber-400' : 'text-[#e0e0dd]'}`}>★</span>
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
                : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{recommended.map((p) => <ProjectCard key={p._id} project={p} />)}</div>
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
