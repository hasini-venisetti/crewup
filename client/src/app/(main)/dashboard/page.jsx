'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProjectCard from '@/components/ui/ProjectCard';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import { projectAPI, applicationAPI, followAPI, reviewAPI, mentorAPI, profileAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { computeCompletenessScore, getCompletenessColor } from '@/lib/profileCompleteness';

/* ── Status badge config ─────────────────────────────────────────────────── */
const STATUS_BADGE = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_ICON = { pending: '⏳', accepted: '✅', rejected: '❌' };

/* ── Tiny helpers ────────────────────────────────────────────────────────── */
function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-14 h-14 text-base';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#e4e1ff] to-[#c9c4ff] text-[#3730A3] font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white uppercase`}>
      {name?.[0] || '?'}
    </div>
  );
}

function SectionHeader({ icon, title, count, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <h2 className="text-base font-bold text-[#111110]">{title}</h2>
        {count !== undefined && (
          <span className="text-xs font-bold bg-[#f0eeff] text-[#5750D4] px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyCard({ icon, title, body, cta, href }) {
  return (
    <div className="bg-white rounded-2xl border border-[#efefed] text-center py-10 px-6">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-[#111110] text-sm mb-1">{title}</p>
      <p className="text-xs text-[#6b6b66] mb-4 leading-relaxed">{body}</p>
      {cta && (
        <Link href={href} className="inline-block bg-[#0e0e0d] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-[#2d2d2b] transition-colors">
          {cta}
        </Link>
      )}
    </div>
  );
}

/* ── Draft Project Card ──────────────────────────────────────────────────── */
function DraftCard({ project: p, onPublish }) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await projectAPI.publishDraft(p._id);
      toast.success('🎉 Project is now live!');
      onPublish(p._id);
    } catch {
      toast.error('Failed to publish project');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-dashed border-[#c9c4ff] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b82ff] bg-[#f0eeff] px-2 py-0.5 rounded-full">Draft</span>
          <p className="font-semibold text-[#111110] text-sm mt-1.5 leading-snug">{p.title || 'Untitled draft'}</p>
          <p className="text-xs text-[#6b6b66] mt-0.5 capitalize">{(p.projectType || '').replace('-', ' ')} · {p.requiredRoles?.length || 0} roles</p>
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <Link href={`/projects/${p._id}/edit`}
          className="flex-1 text-center text-xs font-semibold border border-[#e0e0dd] text-[#6b6b66] py-2 rounded-xl hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors">
          ✏️ Edit
        </Link>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex-1 text-xs font-semibold bg-[#6C63FF] text-white py-2 rounded-xl hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
        >
          {publishing ? 'Publishing...' : '🚀 Publish'}
        </button>
      </div>
    </div>
  );
}

/* ── Incoming Application Card ───────────────────────────────────────────── */
function IncomingAppItem({ app, onDecision }) {
  const [loading, setLoading] = useState('');

  const decide = async (status) => {
    setLoading(status);
    try {
      await applicationAPI.updateStatus({ applicationId: app._id, status });
      toast.success(status === 'accepted' ? `${app.applicant?.name} accepted!` : 'Application declined.');
      onDecision(app._id, status);
    } catch { toast.error('Failed to update.'); }
    finally { setLoading(''); }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f5f5f3] last:border-0">
      <Link href={`/profile/${app.applicant?._id}`}>
        <Avatar name={app.applicant?.name} image={app.applicant?.profileImage} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111110] truncate">{app.applicant?.name}</p>
        <p className="text-xs text-[#6b6b66] truncate">
          {app.roleApplyingFor} · <span className="text-[#a3a39e]">{app.project?.title || ''}</span>
        </p>
      </div>
      {app.status === 'pending' ? (
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => decide('accepted')} disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-40">
            {loading === 'accepted' ? '…' : '✓'}
          </button>
          <button onClick={() => decide('rejected')} disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
            {loading === 'rejected' ? '…' : '✗'}
          </button>
        </div>
      ) : (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[app.status]}`}>
          {STATUS_ICON[app.status]} {app.status}
        </span>
      )}
    </div>
  );
}

/* ── Profile Completeness Banner ─────────────────────────────────────────── */
function ProfileCompletenessBanner({ user }) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    profileAPI.getMe().then(({ data }) => setProfile(data?.data)).catch(() => {});
  }, []);

  if (!profile) return null;
  const { score, missing, label } = computeCompletenessScore(profile, user);
  const color = getCompletenessColor(score);
  if (score >= 90 && user?.isEmailVerified) return null;

  return (
    <div className="bg-gradient-to-r from-[#f0eeff] to-white border border-[#c9c4ff] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#3730A3]">✦ Complete your profile</p>
          <p className="text-xs text-[#5750D4] mt-0.5">{label} — {score}% done</p>
        </div>
        <Link href="/profile/edit" className="text-xs font-bold text-[#6C63FF] hover:underline">Complete →</Link>
      </div>
      <div className="h-1.5 bg-[#e4e0ff] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!user?.isEmailVerified && (
          <Link href="/verify-email" className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
            ⚠️ Verify email
          </Link>
        )}
        {missing.filter(m => m !== 'Verified email').slice(0, 4).map((m) => (
          <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#c9c4ff] text-[#5750D4]">+ {m}</span>
        ))}
      </div>
    </div>
  );
}

/* ── MentorStatusToggle ──────────────────────────────────────────────────── */
function MentorStatusToggle() {
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    profileAPI.getMe().then(({ data }) => { if (data?.data?.mentorStatus) setStatus(data.data.mentorStatus); }).catch(() => {});
  }, []);
  const toggle = async (val) => {
    if (loading || val === status) return;
    setLoading(true);
    const prev = status;
    setStatus(val);
    try { await mentorAPI.updateStatus(val); toast.success(`Status: ${val}`); }
    catch { setStatus(prev); toast.error('Failed'); }
    finally { setLoading(false); }
  };
  const CFG = {
    open:   { label: '🟢 Open',   cls: 'bg-green-500 text-white border-green-500' },
    paused: { label: '⏸ Paused', cls: 'bg-yellow-400 text-white border-yellow-400' },
    closed: { label: '🔴 Closed', cls: 'bg-red-500 text-white border-red-500' },
  };
  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(CFG).map(([key, { label, cls }]) => (
        <button key={key} onClick={() => toggle(key)} disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${status === key ? cls : 'border-[#e0e0dd] text-[#6b6b66] hover:border-[#111110] hover:text-[#111110]'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── MentorApplicationCard ───────────────────────────────────────────────── */
function MentorApplicationCard({ req, onDecision }) {
  const router = useRouter();
  const [loading, setLoading] = useState('');
  const decide = async (action) => {
    setLoading(action);
    try {
      if (action === 'accept') {
        const res = await mentorAPI.acceptRequest(req._id);
        const convId = res.data?.data?._id;
        toast.success(`Accepted! Opening chat…`);
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
    <div className="flex items-center gap-3 py-3 border-b border-[#f5f5f3] last:border-0">
      <Avatar name={req.sender?.name} image={req.sender?.profileImage} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111110] truncate">{req.sender?.name}</p>
        <p className="text-xs text-[#6b6b66]">Mentorship request</p>
      </div>
      {req.status === 'pending' ? (
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => decide('accept')} disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5750D4] transition-colors disabled:opacity-40">
            {loading === 'accept' ? '…' : 'Accept'}
          </button>
          <button onClick={() => decide('decline')} disabled={!!loading}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
            {loading === 'decline' ? '…' : 'Decline'}
          </button>
        </div>
      ) : (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {req.status === 'accepted' ? '✅' : '❌'} {req.status}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  /* ── data state ── */
  const [myProjects,     setMyProjects]     = useState([]);
  const [myDrafts,       setMyDrafts]       = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [recommended,    setRecommended]    = useState([]);
  const [incomingApps,   setIncomingApps]   = useState({});
  const [followingFeed,  setFollowingFeed]  = useState([]);
  const [myReviews,      setMyReviews]      = useState([]);
  const [isMentor,       setIsMentor]       = useState(false);
  const [mentorApps,     setMentorApps]     = useState([]);

  /* ── loading states ── */
  const [dataLoading, setDataLoading] = useState(true);
  const [recLoading,  setRecLoading]  = useState(false);

  /* ── UI toggles ── */
  const [showAllApps, setShowAllApps] = useState(false);
  const [showAllRec,  setShowAllRec]  = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  /* ── Fetch everything ── */
  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [projRes, appRes] = await Promise.all([projectAPI.getMine(), applicationAPI.getMine()]);
      setMyProjects(projRes.data.data);
      setMyDrafts(projRes.data.drafts || []);
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

  useEffect(() => {
    if (!user) return;
    fetchAll();

    // Recommended
    setRecLoading(true);
    projectAPI.getRecommended()
      .then(({ data }) => setRecommended(data.data))
      .catch(() => {})
      .finally(() => setRecLoading(false));

    // Following feed
    followAPI.getFeed().then(({ data }) => setFollowingFeed(data.data || [])).catch(() => {});

    // Reviews
    const myId = user._id || user.id;
    reviewAPI.getForUser(myId).then(({ data }) => setMyReviews(data.data || [])).catch(() => {});

    // Mentor
    profileAPI.getMe().then(({ data }) => {
      const prof = data?.data;
      if (prof?.isMentor) {
        setIsMentor(true);
        mentorAPI.getApplications().then(({ data: d }) => setMentorApps(d.data || [])).catch(() => {});
      }
    }).catch(() => {});
  }, [user, fetchAll]);

  /* ── Decision handlers ── */
  const handleDecision = (applicationId, status) => {
    setIncomingApps((prev) => {
      const updated = { ...prev };
      for (const pid in updated) updated[pid] = updated[pid].map((a) => a._id === applicationId ? { ...a, status } : a);
      return updated;
    });
  };

  const handleMentorDecision = (requestId) => {
    setMentorApps((prev) => prev.filter((r) => r._id !== requestId));
  };

  /* ── Derived values ── */
  const allIncoming    = Object.values(incomingApps).flat();
  const pendingIncoming = allIncoming.filter((a) => a.status === 'pending');
  const acceptedApps   = myApplications.filter((a) => a.status === 'accepted');
  const pendingMentors = mentorApps.filter((r) => r.status === 'pending');

  /* ── Loading skeleton ── */
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f3]">
        <div className="bg-[#0e0e0d] h-40" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-[#efefed]" />)}
            </div>
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-[#efefed]" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  /* ── Layout ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f5f5f3]">

      {/* ════════ HEADER ════════ */}
      <div className="bg-[#0e0e0d] relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute top-0 left-1/4 w-96 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 py-6 pb-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <Link href={`/profile/${user._id || user.id}`}
                className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-xl font-bold text-white ring-2 ring-[#6C63FF]/40 hover:ring-[#6C63FF]/70 transition-all">
                {user.profileImage
                  ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  : user.name?.[0]?.toUpperCase() || '?'}
              </Link>
              <div>
                <p className="text-[10px] text-[#6C63FF] font-bold tracking-[.2em] uppercase mb-0.5">Creator Dashboard</p>
                <h1 className="text-xl sm:text-2xl font-[Playfair_Display] text-white">Hey, {user.name?.split(' ')[0]} 👋</h1>
                <p className="text-white/40 text-xs mt-0.5">
                  @{user.username} · <span className="capitalize text-white/55">{user.role?.replace('-', ' ')}</span>
                </p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              <Link href="/profile/edit"
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-white/15 text-white/60 hover:border-white/35 hover:text-white transition-all">
                Edit Profile
              </Link>
              <Link href="/create-project"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#7C75FF] text-white flex items-center gap-1.5 transition-all">
                <span className="font-bold text-sm">+</span> Post Project
              </Link>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'My Projects',  value: myProjects.length,     icon: '🎬', color: false, href: '#projects' },
              { label: 'Applied To',   value: myApplications.length, icon: '📨', color: false, href: '#applications' },
              { label: 'Accepted',     value: acceptedApps.length,   icon: '✅', color: acceptedApps.length > 0, href: '#applications' },
              { label: 'New Requests', value: pendingIncoming.length, icon: '📬', color: pendingIncoming.length > 0, href: '#incoming' },
            ].map((s) => (
              <a key={s.label} href={s.href}
                className={`rounded-xl p-3 sm:p-4 block transition-all cursor-pointer relative overflow-hidden group
                  ${s.color ? 'bg-[#6C63FF]/20 border border-[#6C63FF]/40' : 'bg-white/5 border border-white/10 hover:bg-white/8'}`}>
                <div className="text-lg mb-1">{s.icon}</div>
                <div className={`text-2xl sm:text-3xl font-black leading-none ${s.color ? 'text-[#c9c4ff]' : 'text-white'}`}>{s.value}</div>
                <div className={`text-[10px] font-semibold mt-1 ${s.color ? 'text-[#a09aff]' : 'text-white/45'}`}>{s.label}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ BODY ════════ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">

        {/* Profile completeness - only if needed */}
        <div className="mb-6">
          <ProfileCompletenessBanner user={user} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ════ MAIN CONTENT (Left) ════ */}
          <div className="space-y-8 min-w-0">

            {/* ── MY PROJECTS ── */}
            <section id="projects">
              <SectionHeader
                icon="🎬"
                title="My Projects"
                count={myProjects.length}
                action={
                  <Link href="/create-project"
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#111110] text-white hover:bg-[#333] transition-colors flex items-center gap-1">
                    <span className="font-bold">+</span> New
                  </Link>
                }
              />
              {myProjects.length === 0 ? (
                <EmptyCard icon="🎬" title="No projects yet"
                  body="Post your first project and start building a creative team."
                  cta="Post a Project" href="/create-project" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myProjects.map((p) => (
                    <div key={p._id} className="bg-white rounded-2xl border border-[#efefed] p-3 hover:shadow-md hover:border-[#d0d0ce] transition-all flex flex-col gap-2">
                      <ProjectCard project={p} />

                      {/* Auto-suspended warning */}
                      {p.autoSuspended && (
                        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-red-100 border border-red-300 text-red-800">
                          <span>⛔</span>
                          <span>Suspended — reported, admin reviewing</span>
                        </div>
                      )}

                      {/* Stage badge */}
                      <span className={`self-start inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        p.timelineStage === 'released'   ? 'bg-green-100 text-green-700' :
                        p.timelineStage === 'production' ? 'bg-orange-100 text-orange-700' :
                        'bg-[#f0eeff] text-[#5750D4]'
                      }`}>
                        {p.timelineStage === 'released' ? '🚀' : p.timelineStage === 'production' ? '🎬' : '📋'}
                        <span className="capitalize">{(p.timelineStage || 'planning').replace('-', ' ')}</span>
                      </span>

                      {/* Action buttons */}
                      {p.timelineStage === 'released' ? (
                        <div className="flex gap-2">
                          <Link href={`/projects/${p._id}`}
                            className="flex-1 text-center text-xs font-semibold bg-green-50 text-green-700 border border-green-200 py-2 rounded-xl hover:bg-green-100 transition-colors">
                            View Project
                          </Link>
                          <Link href={`/projects/${p._id}`}
                            className="flex-1 text-center text-xs font-semibold bg-[#f0eeff] text-[#5750D4] border border-[#c9c4ff] py-2 rounded-xl hover:bg-[#e4e0ff] transition-colors">
                            ⭐ Rate Team
                          </Link>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Link href={`/projects/${p._id}/team?tab=chat`}
                            className="flex-1 text-center text-xs font-semibold bg-[#6C63FF] text-white py-2 rounded-xl hover:bg-[#5750D4] transition-colors">
                            💬 Chat
                          </Link>
                          <Link href={`/projects/${p._id}/team`}
                            className="flex-1 text-center text-xs font-semibold border border-[#e0e0dd] text-[#111110] py-2 rounded-xl hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors">
                            👥 Team
                          </Link>
                          <Link href={`/projects/${p._id}/applications`}
                            className="flex-1 text-center text-xs font-semibold border border-[#e0e0dd] text-[#6b6b66] py-2 rounded-xl hover:border-[#111110] hover:text-[#111110] transition-colors">
                            📬 Apps
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── DRAFTS ── */}
            {myDrafts.length > 0 && (
              <section id="drafts">
                <SectionHeader icon="💾" title="Drafts" count={myDrafts.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myDrafts.map((p) => (
                    <DraftCard key={p._id} project={p} onPublish={(id) => {
                      setMyDrafts((prev) => prev.filter((d) => d._id !== id));
                      setMyProjects((prev) => [{ ...p, isDraft: false }, ...prev]);
                    }} />
                  ))}
                </div>
              </section>
            )}

            {/* ── MY APPLICATIONS ── */}
            <section id="applications">
              <SectionHeader icon="📨" title="My Applications" count={myApplications.length} />
              {myApplications.length === 0 ? (
                <EmptyCard icon="🔍" title="No applications yet"
                  body="Browse open projects and apply to join a creative team."
                  cta="Browse Projects" href="/projects" />
              ) : (
                <div className="bg-white rounded-2xl border border-[#efefed] overflow-hidden">
                  {(showAllApps ? myApplications : myApplications.slice(0, 5)).map((app) => (
                    <div key={app._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[#f5f5f3] last:border-0 hover:bg-[#fafaf9] transition-colors">
                      <Link href={`/projects/${app.project?._id}`} className="flex-1 min-w-0 group">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#111110] group-hover:underline truncate">{app.project?.title}</span>
                          {app.project?.timelineStage === 'released' && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                              🚀 Released
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b6b66] mt-0.5">
                          Role: {app.roleApplyingFor} · <span className="capitalize">{app.project?.projectType?.replace('-', ' ')}</span>
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${STATUS_BADGE[app.status]}`}>
                          {STATUS_ICON[app.status]} {app.status}
                        </span>
                        {app.status === 'accepted' && app.project?.timelineStage !== 'released' && (
                          <Link href={`/projects/${app.project?._id}/team`}
                            className="text-xs font-semibold bg-[#0e0e0d] text-white px-3 py-1.5 rounded-lg hover:bg-[#2d2d2b] transition-colors whitespace-nowrap">
                            👥 Team Dashboard
                          </Link>
                        )}
                        {app.status === 'accepted' && app.project?.timelineStage === 'released' && (
                          <Link href={`/projects/${app.project?._id}`}
                            className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">
                            ⭐ Rate
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {myApplications.length > 5 && (
                    <button onClick={() => setShowAllApps(!showAllApps)}
                      className="w-full py-3 text-xs font-semibold text-[#6C63FF] hover:text-[#5750D4] hover:bg-[#f0eeff] transition-colors">
                      {showAllApps ? '▲ Show less' : `▼ Show all ${myApplications.length} applications`}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ── MENTORSHIP (if mentor) ── */}
            {isMentor && (
              <section>
                <SectionHeader icon="🎓" title="Mentorship"
                  count={pendingMentors.length > 0 ? pendingMentors.length : undefined}
                  action={<MentorStatusToggle />}
                />
                {mentorApps.length === 0 ? (
                  <EmptyCard icon="🎓" title="No applications yet"
                    body="When someone applies for your mentorship, it will appear here."
                    cta="View Profile" href={`/profile/${user._id || user.id}`} />
                ) : (
                  <div className="bg-white rounded-2xl border border-[#efefed] px-5">
                    {mentorApps.map((req) => (
                      <MentorApplicationCard key={req._id} req={req} onDecision={handleMentorDecision} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── RECOMMENDED ── */}
            <section>
              <SectionHeader icon="✦" title="Recommended for You"
                action={
                  <Link href="/projects" className="text-xs text-[#6C63FF] hover:underline font-semibold">Browse all →</Link>
                }
              />
              <div className="bg-[#f0eeff] border border-[#c9c4ff] rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span className="text-sm">✦</span>
                <p className="text-sm text-[#5750D4]">
                  Matched for <strong className="text-[#3730A3] capitalize">{user.role?.replace('-', ' ')}</strong> — projects you haven't applied to yet.
                </p>
              </div>
              {recLoading ? (
                <SkeletonGrid count={4} />
              ) : recommended.length === 0 ? (
                <EmptyCard icon="✦" title="No recommendations yet"
                  body="Complete your profile with your role to get matched with projects." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(showAllRec ? recommended : recommended.slice(0, 4)).map((p) => (
                      <div key={p._id} className="bg-white rounded-2xl border border-[#efefed] p-3 hover:shadow-md transition-all">
                        <ProjectCard project={p} />
                      </div>
                    ))}
                  </div>
                  {recommended.length > 4 && (
                    <button onClick={() => setShowAllRec(!showAllRec)}
                      className="mt-3 w-full py-3 text-xs font-semibold border border-[#e0e0dd] rounded-xl text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition-all">
                      {showAllRec ? '▲ Show less' : `▼ Show ${recommended.length - 4} more`}
                    </button>
                  )}
                </>
              )}
            </section>

          </div>{/* /main content */}

          {/* ════ SIDEBAR (Right) ════ */}
          <aside className="space-y-4 lg:sticky lg:top-20">

            {/* ── INCOMING APPLICATIONS ── */}
            <div id="incoming" className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-[#f5f5f3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📬</span>
                  <span className="font-bold text-sm text-[#111110]">Incoming</span>
                  {pendingIncoming.length > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {pendingIncoming.length}
                    </span>
                  )}
                </div>
                {allIncoming.length > 0 && (
                  <span className="text-xs text-[#a3a39e]">{allIncoming.length} total</span>
                )}
              </div>
              <div className="px-5">
                {allIncoming.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-2xl mb-2">📬</p>
                    <p className="text-xs text-[#a3a39e]">No applications yet</p>
                  </div>
                ) : (
                  <>
                    {allIncoming.slice(0, 6).map((app) => (
                      <IncomingAppItem key={app._id} app={app} onDecision={handleDecision} />
                    ))}
                    {allIncoming.length > 6 && (
                      <div className="py-3 text-center">
                        <Link href={`/projects/${myProjects[0]?._id}/applications`}
                          className="text-xs font-semibold text-[#6C63FF] hover:underline">
                          View all {allIncoming.length} →
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── MY RATINGS ── */}
            {myReviews.length > 0 && (
              <div className="bg-[#0e0e0d] rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">⭐</span>
                    <span className="text-sm font-bold text-white">My Ratings</span>
                  </div>
                  {(() => {
                    const avg = (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1);
                    return (
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-black text-white leading-none">{avg}</div>
                          <div className="flex gap-0.5 justify-center mt-1">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={`text-base ${s <= Math.round(avg) ? 'text-[#7C75FF]' : 'text-white/15'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-white/50">{myReviews.length} rating{myReviews.length !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-white/30 mt-0.5 leading-relaxed">From project collaborators</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── FOLLOWING FEED ── */}
            {followingFeed.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#efefed] shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-[#f5f5f3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <span className="font-bold text-sm text-[#111110]">Following</span>
                  </div>
                  <Link href="/explore" className="text-xs text-[#6C63FF] hover:underline font-semibold">Explore</Link>
                </div>
                <div className="px-5 divide-y divide-[#f5f5f3]">
                  {followingFeed.slice(0, 3).map((p) => (
                    <div key={p._id} className="py-3">
                      <Link href={`/projects/${p._id}`} className="block group">
                        <p className="text-sm font-semibold text-[#111110] group-hover:underline truncate">{p.title}</p>
                        <p className="text-xs text-[#6b6b66] mt-0.5 capitalize">{p.projectType?.replace('-', ' ')} · {p.createdBy?.name}</p>
                      </Link>
                    </div>
                  ))}
                  {followingFeed.length > 3 && (
                    <div className="py-3 text-center">
                      <Link href="/feed" className="text-xs font-semibold text-[#6C63FF] hover:underline">
                        +{followingFeed.length - 3} more →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── QUICK LINKS ── */}
            <div className="bg-white rounded-2xl border border-[#efefed] shadow-sm p-3">
              <p className="text-[10px] font-bold text-[#a3a39e] uppercase tracking-widest px-2 pb-2">Quick Links</p>
              {[
                { href: '/projects',     icon: '🔍', label: 'Browse Projects' },
                { href: '/explore',      icon: '🌐', label: 'Explore Creators' },
                { href: '/messages',     icon: '💬', label: 'Messages' },
                { href: '/leaderboard',  icon: '🏆', label: 'Leaderboard' },
                { href: '/projects/map', icon: '🗺️', label: 'Project Map' },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6b6b66] hover:bg-[#f5f5f3] hover:text-[#111110] transition-all">
                  <span className="text-base w-5 text-center">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
