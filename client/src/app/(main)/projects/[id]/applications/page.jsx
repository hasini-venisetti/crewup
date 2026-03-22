'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectAPI, applicationAPI, fillRoleAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const STATUS_CLASS = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected' };
const STATUS_ICON = { pending: '⏳', accepted: '✅', rejected: '❌' };

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br bg-[#f0ede8] text-black font-bold flex items-center justify-center flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function ApplicationCard({ app, onDecision }) {
  const [loading, setLoading]         = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineNote, setDeclineNote] = useState('');

  const decide = async (status, reviewNote = '') => {
    setLoading(status);
    try {
      await applicationAPI.updateStatus({ applicationId: app._id, status, reviewNote });
      toast.success(status === 'accepted' ? `${app.applicant?.name} accepted!` : 'Application declined.');
      onDecision(app._id, status);
    } catch {
      toast.error('Failed to update application.');
    } finally {
      setLoading('');
      setShowDeclineForm(false);
    }
  };

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link
          href={`/profile/${app.applicant?._id}`}
          className="flex items-start gap-3 flex-1 group"
        >
          <Avatar name={app.applicant?.name} image={app.applicant?.profileImage} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-[#111110] transition-colors">
              {app.applicant?.name}
            </div>
            <div className="text-xs text-[#6b6b66] mt-0.5">
              @{app.applicant?.username} · <span className="capitalize">{app.applicant?.role?.replace('-', ' ')}</span>
            </div>
            <div className="text-xs text-[#111110]/80 mt-1">
              Applying for: <span className="text-[#6b6b66]">{app.roleApplyingFor}</span>
            </div>
            <p className="text-xs text-[#6b6b66] mt-2 leading-relaxed italic">"{app.message}"</p>
            <div className="text-xs text-[#6b6b66] mt-2">
              Applied {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            {/* Show review note if already declined */}
            {app.status === 'rejected' && app.reviewNote && (
              <div className="mt-2 text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 italic">
                Note to applicant: "{app.reviewNote}"
              </div>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
          {app.status === 'pending' ? (
            <>
              <button
                onClick={() => decide('accepted')}
                disabled={!!loading}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-40"
              >
                {loading === 'accepted' ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => setShowDeclineForm((v) => !v)}
                disabled={!!loading}
                className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 ${
                  showDeclineForm
                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {loading === 'rejected' ? '...' : showDeclineForm ? 'Cancel' : 'Decline'}
              </button>
            </>
          ) : (
            <span className={STATUS_CLASS[app.status]}>
              {STATUS_ICON[app.status]} {app.status}
            </span>
          )}
        </div>
      </div>

      {/* Inline decline note form */}
      {showDeclineForm && app.status === 'pending' && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-red-700">Optional: leave a note for {app.applicant?.name}</p>
          <textarea
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            placeholder='e.g. "We filled this role, but would love to work with you on a future project!"'
            maxLength={300}
            rows={2}
            className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:border-red-400 resize-none transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400">{declineNote.length}/300 · applicant will see this in their notification</span>
            <button
              onClick={() => decide('rejected', declineNote)}
              disabled={!!loading}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading === 'rejected' ? 'Declining…' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FillRoleCard({ role, filled, onFill }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fillRoleAPI.fill(role.projectId, role.role, note);
      toast.success(`${role.role} marked as filled`);
      setOpen(false);
      setNote('');
      onFill(role.role);
    } catch {
      toast.error('Failed to mark role as filled');
    } finally {
      setLoading(false);
    }
  };

  if (filled) {
    return (
      <div className="card  p-4 flex items-center justify-between bg-green-500/5 border border-green-500/20">
        <div>
          <p className="font-semibold text-[#111110] capitalize">{role.role}</p>
          <p className="text-xs text-[#a3a39e] mt-1">Filled on {new Date(filled.filledDate).toLocaleDateString()}</p>
          {filled.note && <p className="text-xs text-[#6b6b66] italic mt-1">"{filled.note}"</p>}
        </div>
        <span className="text-green-400 font-bold">✓</span>
      </div>
    );
  }

  return (
    <div className="card  p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-[#111110] capitalize">{role.role}</p>
        <span className="text-xs text-[#a3a39e]">Not filled</span>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#f7f7f6] text-[#111110] border border-[#7C75FF]/20 hover:bg-[#f0f0ee] transition-colors"
        >
          Mark as Filled
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Found via CREWUPFILMS!"
            className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-3 py-2 text-[#111110] placeholder:text-[#a3a39e] text-sm focus:outline-none resize-none h-20"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setNote('');
              }}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#f7f7f6] text-[#6b6b66] hover:bg-[#f0f0ee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#7C75FF]/10 text-[#111110] border border-[#7C75FF]/20 hover:bg-[#7C75FF]/20 transition-colors disabled:opacity-50"
            >
              {loading ? 'Marking...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [filledRoles, setFilledRoles] = useState({});

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, appRes] = await Promise.all([
        projectAPI.getById(id),
        applicationAPI.getForProject(id),
      ]);

      const proj = projRes.data.data;
      if (String(proj.createdBy?._id) !== String(user?._id || user?.id)) {
        toast.error('Not authorized');
        router.push('/dashboard');
        return;
      }

      setProject(proj);
      setApplications(appRes.data.data || []);
      // Parse filled roles from project
      if (proj.filledRoles) {
        const filled = {};
        proj.filledRoles.forEach((r) => {
          filled[r.role] = r;
        });
        setFilledRoles(filled);
      }
    } catch (err) {
      toast.error('Failed to load applications');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = (applicationId, status) => {
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, status } : a))
    );
  };

  const handleRoleFilled = (role) => {
    setFilledRoles((prev) => ({
      ...prev,
      [role]: { role, filledDate: new Date(), note: '' },
    }));
  };

  const filtered = applications.filter((a) => {
    const statusMatch = filter === 'all' || a.status === filter;
    const roleMatch   = roleFilter === 'all' || a.roleApplyingFor === roleFilter;
    return statusMatch && roleMatch;
  });

  // Unique roles that have applications
  const rolesWithApps = ['all', ...new Set(applications.map((a) => a.roleApplyingFor).filter(Boolean))];

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    declined: applications.filter((a) => a.status === 'rejected').length,
  };

  const allRolesFilled = project?.requiredRoles?.every((r) => filledRoles[r]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
  
        <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
          <div className="h-32 bg-[#f0f0ee]  animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">


      {/* Dark Hero */}
      <div
        className="relative bg-[#0e0e0d] pt-24 pb-10 overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4">
          <Link href={`/projects/${id}`} className="inline-flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition-colors">
            ← Back to Project
          </Link>
          <h1 className="text-3xl md:text-4xl font-[Playfair_Display] text-white">
            Applications
          </h1>
          <p className="text-white/50 mt-2">{project.title}</p>
        </div>
      </div>
      <div className="pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8"></div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Accepted', value: stats.accepted },
            { label: 'Declined', value: stats.declined },
          ].map((s) => (
            <div key={s.label} className="card  p-4 text-center">
              <div className="text-2xl font-black text-[#111110]">{s.value}</div>
              <div className="text-xs text-[#6b6b66] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Role Filter */}
        {rolesWithApps.length > 2 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-[#a3a39e] uppercase tracking-widest mb-2">Filter by Role</p>
            <div className="flex flex-wrap gap-2">
              {rolesWithApps.map((r) => {
                const count = r === 'all' ? applications.length : applications.filter((a) => a.roleApplyingFor === r).length;
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      roleFilter === r
                        ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]'
                        : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#6C63FF] hover:text-[#6C63FF]'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${roleFilter === r ? 'bg-white/20 text-white' : 'bg-[#f0eeff] text-[#5750D4]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-[#f7f7f6] border border-[#efefed] p-1 mb-8 w-fit overflow-x-auto rounded-xl">
          {['all', 'pending', 'accepted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap capitalize ${
                filter === f
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#6b6b66] hover:text-[#111110]'
              }`}
            >
              {f}
              {f !== 'all' && (
                <span className="ml-1.5 text-[10px] font-bold text-[#a3a39e]">
                  {applications.filter((a) => (roleFilter === 'all' || a.roleApplyingFor === roleFilter) && a.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications */}
        <div className="space-y-3 mb-12">
          {filtered.length === 0 ? (
            <div className="card  text-center py-12 px-8">
              <p className="text-[#6b6b66] text-sm">No applications in this category</p>
            </div>
          ) : (
            filtered.map((app) => (
              <ApplicationCard
                key={app._id}
                app={app}
                onDecision={handleDecision}
              />
            ))
          )}
        </div>

        {/* Mark Role as Filled Section */}
        <div className="border-t border-[#efefed] pt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#111110] mb-2">Fill Roles</h2>
            {allRolesFilled && (
              <p className="text-sm text-green-400">
                🎉 All roles filled! Consider updating project status.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {project.requiredRoles?.map((role) => (
              <FillRoleCard
                key={role}
                role={{ role, projectId: id }}
                filled={filledRoles[role]}
                onFill={handleRoleFilled}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
