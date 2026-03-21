'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { adminAPI, contestAPI, contestSubmissionAPI, launchWaitlistAPI, reportAPI } from '@/lib/api';

/* ── helpers ── */
const ROLE_LABEL = {
  filmmaker: 'Filmmaker', actor: 'Actor', editor: 'Editor', writer: 'Writer',
  musician: 'Musician', designer: 'Designer', photographer: 'Photographer',
  'content-creator': 'Content Creator', other: 'Other',
};

function StatCard({ icon, label, value, color = '#6C63FF' }) {
  return (
    <div className="bg-white border border-[#efefed] rounded-2xl p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111110]">{value ?? '—'}</p>
        <p className="text-xs text-[#6b6b66] font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Overview
══════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats]         = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [clearing, setClearing]   = useState(false);
  const [clearResult, setClearResult] = useState(null);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getAnalytics()])
      .then(([s, a]) => { setStats(s.data.data); setAnalytics(a.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClearTestData = async () => {
    const confirmed = window.confirm(
      '⚠️ DANGER: This will permanently delete ALL projects, films, applications, tasks and project chats.\n\nUsers, profiles, waitlist entries and reviews will be kept.\n\nType OK to confirm launch cleanup.'
    );
    if (!confirmed) return;
    setClearing(true); setClearResult(null);
    try {
      const { data } = await adminAPI.clearTestData();
      setClearResult({ ok: true, msg: data.message, deleted: data.deleted });
    } catch (err) {
      setClearResult({ ok: false, msg: err.response?.data?.message || 'Failed to clear data' });
    } finally {
      setClearing(false);
    }
  };

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{Array(5).fill(0).map((_,i) => <div key={i} className="bg-[#efefed] rounded-2xl h-24 animate-pulse" />)}</div>;

  return (
    <div className="space-y-8">
      {/* Platform stats */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#a3a39e] mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="👥" label="Total Users"      value={stats?.totalUsers?.toLocaleString()}    color="#6C63FF" />
          <StatCard icon="🎬" label="Projects Posted"  value={stats?.totalProjects?.toLocaleString()} color="#0ea5e9" />
          <StatCard icon="🎞" label="Released Films"   value={stats?.totalFilms?.toLocaleString()}    color="#10b981" />
          <StatCard icon="🏆" label="Contests"         value={stats?.totalContests?.toLocaleString()} color="#f59e0b" />
          <StatCard icon="🚩" label="Pending Reports"  value={stats?.pendingReports?.toLocaleString() ?? '0'} color="#ef4444" />
        </div>
      </div>

      {/* ── Launch Cleanup ── */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-red-700 mb-1">🚀 Launch Cleanup</h2>
            <p className="text-xs text-red-600">
              Delete all test projects, films, applications, tasks and project chats before going live.
              Users, profiles, waitlist entries and reviews are kept safe.
            </p>
            {clearResult && (
              <div className={`mt-3 p-3 rounded-lg text-xs ${clearResult.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                {clearResult.msg}
                {clearResult.ok && clearResult.deleted && (
                  <div className="mt-1 flex gap-3 flex-wrap text-[11px] text-green-600">
                    {Object.entries(clearResult.deleted).map(([k, v]) => (
                      <span key={k}>✓ {v} {k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleClearTestData}
            disabled={clearing}
            className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : '🗑 Clear Test Data'}
          </button>
        </div>
      </div>

      {/* Weekly analytics */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#a3a39e] mb-4">This Week's Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#efefed] rounded-2xl p-6">
            <p className="text-xs text-[#6b6b66] font-medium mb-2">New Users</p>
            <p className="text-3xl font-bold text-[#111110]">{analytics?.newUsers ?? 0}</p>
            <div className="mt-3 h-2 bg-[#f7f7f6] rounded-full overflow-hidden">
              <div className="h-full bg-[#6C63FF] rounded-full" style={{ width: `${Math.min((analytics?.newUsers / 50) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white border border-[#efefed] rounded-2xl p-6">
            <p className="text-xs text-[#6b6b66] font-medium mb-2">Projects Posted</p>
            <p className="text-3xl font-bold text-[#111110]">{analytics?.newProjects ?? 0}</p>
            <div className="mt-3 h-2 bg-[#f7f7f6] rounded-full overflow-hidden">
              <div className="h-full bg-[#0ea5e9] rounded-full" style={{ width: `${Math.min((analytics?.newProjects / 20) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white border border-[#efefed] rounded-2xl p-6">
            <p className="text-xs text-[#6b6b66] font-medium mb-2">Films Released</p>
            <p className="text-3xl font-bold text-[#111110]">{analytics?.newFilms ?? 0}</p>
            <div className="mt-3 h-2 bg-[#f7f7f6] rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${Math.min((analytics?.newFilms / 10) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Users
══════════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [acting, setActing]     = useState({});

  const load = useCallback(async (s, p) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ search: s, page: p, limit: 15 });
      setUsers(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  const toggleSuspend = async (user) => {
    setActing((a) => ({ ...a, [user._id]: true }));
    try {
      await adminAPI.suspendUser(user._id, !user.isSuspended);
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u));
    } catch {}
    finally { setActing((a) => ({ ...a, [user._id]: false })); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username…"
          className="flex-1 rounded-xl border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
        />
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0e0e0d] text-white text-sm font-semibold hover:bg-[#1a1a18] transition-colors">
          Search
        </button>
      </form>

      <p className="text-xs text-[#6b6b66]">{total} user{total !== 1 ? 's' : ''}</p>

      <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array(8).fill(0).map((_,i) => <div key={i} className="h-12 bg-[#efefed] rounded-xl animate-pulse" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#efefed] bg-[#fafaf9]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">User</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">Rep Score</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efefed]">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-[#fafaf9] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
                        {u.profileImage ? <img src={u.profileImage} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#111110] flex items-center gap-1.5">
                          {u.name}
                          {u.isAdmin && <span className="text-[10px] bg-[#6C63FF]/10 text-[#6C63FF] font-bold px-1.5 py-0.5 rounded">ADMIN</span>}
                        </div>
                        <div className="text-xs text-[#6b6b66]">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#6b6b66] hidden md:table-cell">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#f7f7f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#6C63FF] rounded-full" style={{ width: `${u.reputationScore || 0}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-[#6b6b66]">{u.reputationScore || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      u.isSuspended ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-red-500' : 'bg-green-500'}`} />
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {!u.isAdmin && (
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={acting[u._id]}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                          u.isSuspended
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {acting[u._id] ? '…' : u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
            ← Prev
          </button>
          <span className="text-sm text-[#6b6b66]">Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Contests
══════════════════════════════════════════════════════════════════════ */
const EMPTY_CONTEST = { title: '', description: '', prizeAmount: '', prizeDescription: '', submissionDeadline: '', theme: '', maxDuration: '', allowedLanguages: '', teamFormedAfter: '', rules: [] };

function ContestsTab() {
  const [contests, setContests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_CONTEST);
  const [saving, setSaving]       = useState(false);
  const [winnerModal, setWinnerModal] = useState(null);
  const [winnerInputs, setWinnerInputs] = useState([{ userId: '', placement: 1, note: '' }]);

  useEffect(() => {
    contestAPI.getAll()
      .then(({ data }) => setContests(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_CONTEST); setShowForm(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      title: c.title, description: c.description,
      prizeAmount: c.prizeAmount || '', prizeDescription: c.prizeDescription || '',
      submissionDeadline: c.submissionDeadline ? new Date(c.submissionDeadline).toISOString().slice(0, 10) : '',
      theme: c.theme || '', maxDuration: c.maxDuration || '', allowedLanguages: c.allowedLanguages || '',
      teamFormedAfter: c.teamFormedAfter ? new Date(c.teamFormedAfter).toISOString().slice(0, 10) : '',
      rules: c.rules || [],
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await contestAPI.update(editing, form);
        setContests((prev) => prev.map((c) => c._id === editing ? data.data : c));
      } else {
        const { data } = await contestAPI.create(form);
        setContests((prev) => [data.data, ...prev]);
      }
      setShowForm(false);
    } catch {}
    finally { setSaving(false); }
  };

  const handleEnd = async (id) => {
    if (!confirm('End this contest?')) return;
    try {
      const { data } = await contestAPI.end(id);
      setContests((prev) => prev.map((c) => c._id === id ? data.data : c));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contest? This cannot be undone.')) return;
    try {
      await contestAPI.delete(id);
      setContests((prev) => prev.filter((c) => c._id !== id));
    } catch {}
  };

  const handleWinners = async () => {
    try {
      const { data } = await contestAPI.setWinners(winnerModal._id, { winners: winnerInputs.filter((w) => w.userId.trim()) });
      setContests((prev) => prev.map((c) => c._id === winnerModal._id ? data.data : c));
      setWinnerModal(null);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b6b66]">{contests.length} contest{contests.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold transition-all shadow-md shadow-[#6C63FF]/20">
          + New Contest
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#e0e0dd] rounded-2xl p-6">
          <h3 className="font-semibold text-[#111110] mb-5">{editing ? 'Edit Contest' : 'Create Contest'}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Description</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Prize Amount (₹)</label>
              <input type="number" value={form.prizeAmount} onChange={(e) => setForm({ ...form, prizeAmount: e.target.value })}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Prize Description</label>
              <input value={form.prizeDescription} onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
                placeholder="e.g. Festival Screening + ₹5000 cash"
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Submission Deadline</label>
              <input required type="date" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })}
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Theme</label>
              <input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}
                placeholder="e.g. Hope, Survival, Urban Life…"
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Max Duration</label>
              <input value={form.maxDuration} onChange={(e) => setForm({ ...form, maxDuration: e.target.value })}
                placeholder="e.g. Up to 20 minutes"
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Allowed Languages</label>
              <input value={form.allowedLanguages} onChange={(e) => setForm({ ...form, allowedLanguages: e.target.value })}
                placeholder="e.g. Any, English only, No restrictions"
                className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de]" />
            </div>

            {/* Contest Rules Editor */}
            <div className="md:col-span-2 bg-[#fafaf9] border border-[#e0e0dd] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-3">
                📜 Contest Rules
              </label>
              <div className="space-y-2 mb-3">
                {(form.rules || []).map((rule, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-5 h-5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    <input
                      value={rule}
                      onChange={(e) => {
                        const updated = [...form.rules];
                        updated[i] = e.target.value;
                        setForm({ ...form, rules: updated });
                      }}
                      placeholder={`Rule ${i + 1}`}
                      className="flex-1 rounded-xl border border-[#e0e0dd] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, rules: form.rules.filter((_, idx) => idx !== i) })}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm transition-colors flex-shrink-0"
                    >×</button>
                  </div>
                ))}
                {(form.rules || []).length === 0 && (
                  <p className="text-xs text-[#a3a39e] italic">No custom rules — default platform rules will be shown.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, rules: [...(form.rules || []), ''] })}
                className="text-xs font-semibold text-[#6C63FF] hover:text-[#5750D4] flex items-center gap-1.5 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-sm leading-none">+</span>
                Add Rule
              </button>
            </div>

            {/* Team Formation Date Rule */}
            <div className="bg-[#f0eeff] border border-[#6055de]/20 rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#6055de] uppercase tracking-[0.1em] mb-1">
                🗓 Team Must Be Formed After
              </label>
              <p className="text-xs text-[#6b6b66] mb-2.5">
                Only teams (projects) created <strong>on or after</strong> this date are eligible to participate. Leave blank to allow all projects.
              </p>
              <input
                type="date"
                value={form.teamFormedAfter}
                onChange={(e) => setForm({ ...form, teamFormedAfter: e.target.value })}
                className="w-full rounded-xl border border-[#6055de]/30 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de]"
              />
              {form.teamFormedAfter && (
                <p className="text-xs text-[#6055de] mt-2 font-medium">
                  ✓ Teams formed before {new Date(form.teamFormedAfter).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} will be rejected.
                </p>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition-all">
                {saving ? 'Saving…' : editing ? 'Update Contest' : 'Create Contest'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-[#e0e0dd] text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-28 bg-[#efefed] rounded-2xl animate-pulse" />)}</div>
      ) : contests.length === 0 ? (
        <div className="text-center py-16 text-[#6b6b66] bg-white border border-[#efefed] rounded-2xl">
          <p className="text-3xl mb-2">🏆</p><p className="text-sm">No contests yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map((c) => (
            <div key={c._id} className="bg-white border border-[#efefed] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-[#111110]">{c.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#f7f7f6] text-[#6b6b66] border-[#e0e0dd]'
                    }`}>{c.status === 'open' ? '🟢 Open' : '⚫ Ended'}</span>
                  </div>
                  <p className="text-sm text-[#6b6b66] line-clamp-2 mb-2">{c.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-[#a3a39e]">
                    {c.prizeAmount > 0 && <span>💰 ₹{c.prizeAmount}</span>}
                    {c.prizeDescription && <span>🎁 {c.prizeDescription}</span>}
                    <span>📅 Deadline: {new Date(c.submissionDeadline).toLocaleDateString()}</span>
                    {c.theme && <span>🎨 {c.theme}</span>}
                    {c.maxDuration && <span>⏱ {c.maxDuration}</span>}
                    {c.allowedLanguages && <span>🌐 {c.allowedLanguages}</span>}
                    {c.winners?.length > 0 && <span>🏅 {c.winners.length} winner{c.winners.length !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="text-xs px-3 py-1.5 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">Edit</button>
                  {c.status === 'open' && (
                    <>
                      <button onClick={() => { setWinnerModal(c); setWinnerInputs([{ userId: '', placement: 1, note: '' }]); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">Winners</button>
                      <button onClick={() => handleEnd(c._id)} className="text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors">End</button>
                    </>
                  )}
                  <button onClick={() => handleDelete(c._id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winner modal */}
      {winnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-[#111110] mb-1">Upload Winners</h3>
            <p className="text-sm text-[#6b6b66] mb-5">"{winnerModal.title}"</p>
            <div className="space-y-3 mb-5">
              {winnerInputs.map((w, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#6C63FF]/10 flex items-center justify-center text-xs font-bold text-[#6C63FF] flex-shrink-0 mt-2">#{w.placement}</div>
                  <div className="flex-1 space-y-1.5">
                    <input placeholder="User ID" value={w.userId}
                      onChange={(e) => setWinnerInputs((prev) => prev.map((x, j) => j === i ? { ...x, userId: e.target.value } : x))}
                      className="w-full rounded-xl border border-[#e0e0dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]" />
                    <input placeholder="Note (optional)" value={w.note}
                      onChange={(e) => setWinnerInputs((prev) => prev.map((x, j) => j === i ? { ...x, note: e.target.value } : x))}
                      className="w-full rounded-xl border border-[#e0e0dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]" />
                  </div>
                </div>
              ))}
              <button onClick={() => setWinnerInputs((prev) => [...prev, { userId: '', placement: prev.length + 1, note: '' }])}
                className="text-xs text-[#6C63FF] hover:text-[#5750D4] font-semibold transition-colors">+ Add winner</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleWinners} className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:bg-[#5750D4] transition-all">Save Winners</button>
              <button onClick={() => setWinnerModal(null)} className="px-5 py-2.5 rounded-xl border border-[#e0e0dd] text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Announcements
══════════════════════════════════════════════════════════════════════ */
function AnnouncementsTab() {
  const [form, setForm]       = useState({ title: '', message: '', link: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState('');
  const [error, setError]     = useState('');

  const TEMPLATES = [
    { label: '🎬 New Contest',    title: '🎬 New Short Film Contest is now open!',  message: 'A new contest has just launched on CREWUPFILMS. Submit your short film for a chance to win prizes and get featured.' },
    { label: '🔔 Platform Update', title: '📢 Platform Update',                   message: 'We\'ve just rolled out new features to improve your collaboration experience. Check out what\'s new!' },
    { label: '🏆 Contest Winner',  title: '🏆 Contest Winners Announced',          message: 'The results are in! Check the Films page to see who won this month\'s contest.' },
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) { setError('Title and message are required.'); return; }
    setSending(true); setError(''); setSent('');
    try {
      const { data } = await adminAPI.announce(form);
      setSent(data.message || 'Announcement sent!');
      setForm({ title: '', message: '', link: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send announcement.');
    }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Templates */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a3a39e] mb-3">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.label} onClick={() => setForm({ ...form, title: t.title, message: t.message })}
              className="text-xs px-3 py-1.5 rounded-full border border-[#e0e0dd] text-[#6b6b66] hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors font-medium">
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSend} className="bg-white border border-[#efefed] rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-[#111110]">Send Platform Announcement</h3>

        {sent && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{sent}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. 🎬 New Short Film Contest is now open."
            className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Message</label>
          <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write the announcement body…"
            className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">Link <span className="text-[#a3a39e] normal-case font-normal">(optional)</span></label>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/films or /contests"
            className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#a3a39e]">This will be sent to all active users as a notification.</p>
          <button type="submit" disabled={sending}
            className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold shadow-md shadow-[#6C63FF]/20 transition-all disabled:opacity-50">
            {sending ? 'Sending…' : '📢 Send to All'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Reports
══════════════════════════════════════════════════════════════════════ */
const REASON_LABEL = {
  spam:          { label: 'Spam',            color: 'bg-orange-50 text-orange-700 border-orange-200' },
  inappropriate: { label: 'Inappropriate',   color: 'bg-red-50 text-red-700 border-red-200' },
  copyright:     { label: 'Copyright',       color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  misinformation:{ label: 'Misinformation',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  other:         { label: 'Other',           color: 'bg-[#f7f7f6] text-[#6b6b66] border-[#e0e0dd]' },
};
const STATUS_STYLE = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  reviewed:  'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-[#f7f7f6] text-[#a3a39e] border-[#e0e0dd]',
};

function ReportsTab() {
  const [reports,      setReports]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
  const [acting,       setActing]       = useState({});

  // Resolution modal
  const [modal,        setModal]        = useState(null);
  const [note,         setNote]         = useState('');
  const [warnUser,     setWarnUser]     = useState(false);
  const [suspendAcc,   setSuspendAcc]   = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const load = useCallback(async (s, p) => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getQueue({ status: s, page: p, limit: 20 });
      setReports(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(statusFilter, page); }, [statusFilter, page]);

  const openModal  = (report, action) => { setModal({ report, action }); setNote(''); setWarnUser(false); setSuspendAcc(false); };
  const closeModal = () => { setModal(null); setNote(''); setWarnUser(false); setSuspendAcc(false); };

  const submitResolution = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      await reportAPI.resolve(modal.report._id, modal.action, note.trim(), warnUser);
      // Optionally suspend the reported user's account
      if (suspendAcc && modal.report.reportedUser?._id) {
        await adminAPI.suspendUser(modal.report.reportedUser._id, true);
      }
      setReports((prev) => prev.map((r) =>
        r._id === modal.report._id ? { ...r, status: modal.action, resolutionNote: note.trim() } : r
      ));
      closeModal();
    } catch {}
    finally { setSubmitting(false); }
  };

  const reopen = async (report) => {
    setActing((a) => ({ ...a, [report._id]: true }));
    try {
      await reportAPI.resolve(report._id, 'pending', '', false);
      setReports((prev) => prev.map((r) => r._id === report._id ? { ...r, status: 'pending' } : r));
    } catch {}
    finally { setActing((a) => ({ ...a, [report._id]: false })); }
  };

  const TARGET_ICON = { film: '🎬', project: '📋', user: '👤', message: '💬' };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1">
          {['all', 'pending', 'reviewed', 'dismissed'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? 'bg-[#0e0e0d] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110]'
              }`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6b6b66]">{total} report{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Report list */}
      <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array(6).fill(0).map((_,i) => <div key={i} className="h-16 bg-[#efefed] rounded-xl animate-pulse" />)}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-[#6b6b66]">
            <p className="text-3xl mb-2">🛡️</p>
            <p className="text-sm">No reports {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#efefed]">
            {reports.map((r) => {
              const reason   = REASON_LABEL[r.reason] || REASON_LABEL.other;
              const typeIcon = TARGET_ICON[r.targetType] || '📄';
              const accused  = r.reportedUser;
              return (
                <div key={r._id} className="p-5 hover:bg-[#fafaf9] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">

                      {/* Badges + date */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#f5f3ff] text-[#5750D4] border-[#e0dbff] uppercase">
                          {typeIcon} {r.targetType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${reason.color}`}>{reason.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                        <span className="text-xs text-[#a3a39e]">
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Target title (snapshot — survives deletion) */}
                      <p className="text-sm font-semibold text-[#111110] mb-1.5">
                        {typeIcon}{' '}
                        {r.targetSnapshot
                          ? r.targetSnapshot
                          : <span className="text-[#a3a39e] italic font-normal">Content deleted</span>}
                      </p>

                      {/* Reported user — person the report is AGAINST */}
                      {accused ? (
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[8px] font-bold text-red-600 overflow-hidden flex-shrink-0">
                            {accused.profileImage
                              ? <img src={accused.profileImage} alt="" className="w-full h-full object-cover" />
                              : accused.name?.[0]?.toUpperCase()}
                          </div>
                          <p className="text-xs text-[#6b6b66]">
                            <span className="font-semibold text-red-600">Reported user: </span>
                            <Link href={`/profile/${accused._id}`} className="font-medium text-[#111110] hover:text-[#6C63FF] transition-colors">
                              {accused.name}
                            </Link>
                            <span className="text-[#a3a39e]"> (@{accused.username})</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#a3a39e] mb-1.5 italic">Reported user unavailable</p>
                      )}

                      {/* Filed by — who submitted the report */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-[8px] font-bold text-white overflow-hidden flex-shrink-0">
                          {r.reporter?.profileImage
                            ? <img src={r.reporter.profileImage} alt="" className="w-full h-full object-cover" />
                            : r.reporter?.name?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-xs text-[#6b6b66]">
                          Filed by{' '}
                          <Link href={`/profile/${r.reporter?._id}`} className="font-medium text-[#111110] hover:text-[#6C63FF] transition-colors">
                            {r.reporter?.name}
                          </Link>
                          <span className="text-[#a3a39e]"> (@{r.reporter?.username})</span>
                        </p>
                      </div>

                      {/* Reported content snapshot (message text, film title etc.) */}
                      {r.targetType === 'message' && r.targetSnapshot && (
                        <div className="bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-3 py-2 mt-1.5">
                          <p className="text-[10px] font-bold text-[#a3a39e] uppercase tracking-wide mb-1">Reported message</p>
                          <p className="text-xs text-[#333331] italic leading-relaxed">"{r.targetSnapshot}"</p>
                        </div>
                      )}

                      {/* Reporter's details */}
                      {r.details && (
                        <p className="text-xs text-[#6b6b66] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-1.5 italic">
                          Reporter note: "{r.details}"
                        </p>
                      )}

                      {/* Admin resolution note */}
                      {r.resolutionNote && (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1.5">
                          📝 Admin note: {r.resolutionNote}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => openModal(r, 'reviewed')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors font-medium whitespace-nowrap">
                            ✓ Reviewed
                          </button>
                          <button onClick={() => openModal(r, 'dismissed')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#e0e0dd] text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors font-medium whitespace-nowrap">
                            ✕ Dismiss
                          </button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <button onClick={() => reopen(r)} disabled={acting[r._id]}
                          className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 font-medium whitespace-nowrap">
                          {acting[r._id] ? '…' : '↩ Reopen'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
            ← Prev
          </button>
          <span className="text-sm text-[#6b6b66]">Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 rounded-lg border border-[#e0e0dd] text-sm text-[#6b6b66] hover:border-[#0e0e0d] disabled:opacity-40 transition-all">
            Next →
          </button>
        </div>
      )}

      {/* ── Resolution Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-[#0e0e0d] text-base">
                  {modal.action === 'reviewed' ? '✓ Mark as Reviewed' : '✕ Dismiss Report'}
                </h3>
                <p className="text-xs text-[#6b6b66] mt-1 capitalize">
                  {modal.report.targetType} report · {new Date(modal.report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={closeModal} className="text-[#a3a39e] hover:text-[#111110] transition-colors text-lg leading-none ml-4 flex-shrink-0">✕</button>
            </div>

            {/* Reported content preview */}
            {modal.report.targetSnapshot && (
              <div className="bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-4 py-3 mb-4">
                <p className="text-[10px] font-bold text-[#6b6b66] uppercase tracking-wide mb-1.5">
                  {modal.report.targetType === 'message' ? '💬 Reported message' : modal.report.targetType === 'film' ? '🎬 Film' : modal.report.targetType === 'project' ? '📋 Project' : '📄 Content'}
                </p>
                <p className="text-sm text-[#111110] leading-relaxed italic">
                  {modal.report.targetType === 'message'
                    ? `"${modal.report.targetSnapshot}"`
                    : modal.report.targetSnapshot}
                </p>
              </div>
            )}

            {/* Reported user pill */}
            {modal.report.reportedUser && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0 overflow-hidden">
                  {modal.report.reportedUser.profileImage
                    ? <img src={modal.report.reportedUser.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                    : modal.report.reportedUser.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Reported user</p>
                  <p className="text-sm font-semibold text-[#111110] truncate">
                    {modal.report.reportedUser.name}
                    <span className="text-[#a3a39e] font-normal"> @{modal.report.reportedUser.username}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Reporter's details */}
            {modal.report.details && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">Reporter's note</p>
                <p className="text-sm text-[#333331] italic">"{modal.report.details}"</p>
              </div>
            )}

            {/* Resolution note */}
            <label className="block text-xs font-bold text-[#444442] uppercase tracking-wide mb-2">
              Resolution note <span className="text-[#a3a39e] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                modal.action === 'reviewed'
                  ? 'e.g. Content already deleted, user warned. No further action needed.'
                  : 'e.g. Report appears unfounded — no policy violation found.'
              }
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e0e0dd] text-sm text-[#111110] placeholder-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6055de]/30 focus:border-[#6055de]/50 resize-none mb-3"
            />

            {/* Actions on the reported user */}
            {modal.report.reportedUser && (
              <div className="flex flex-col gap-2 mb-5">
                {/* Warn user */}
                <button
                  onClick={() => setWarnUser((v) => !v)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    warnUser ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-[#e0e0dd] text-[#444442] hover:bg-[#f7f7f6]'
                  }`}
                >
                  <span className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${warnUser ? 'bg-amber-400' : 'bg-[#e0e0dd]'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${warnUser ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </span>
                  <div className="text-left">
                    <p className="font-semibold">⚠️ Send warning to {modal.report.reportedUser.name}</p>
                    <p className="text-xs opacity-70 font-normal">Sends a notification with your note to their account</p>
                  </div>
                </button>

                {/* Suspend account */}
                <button
                  onClick={() => setSuspendAcc((v) => !v)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    suspendAcc ? 'bg-red-50 border-red-300 text-red-800' : 'border-[#e0e0dd] text-[#444442] hover:bg-[#f7f7f6]'
                  }`}
                >
                  <span className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${suspendAcc ? 'bg-red-500' : 'bg-[#e0e0dd]'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${suspendAcc ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </span>
                  <div className="text-left">
                    <p className="font-semibold">🚫 Suspend {modal.report.reportedUser.name}'s account</p>
                    <p className="text-xs opacity-70 font-normal">Blocks them from logging in until manually unsuspended</p>
                  </div>
                </button>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#e0e0dd] text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors font-medium">
                Cancel
              </button>
              <button onClick={submitResolution} disabled={submitting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                  suspendAcc ? 'bg-red-600 hover:bg-red-700' : modal.action === 'reviewed' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#444442] hover:bg-[#0e0e0d]'
                }`}>
                {submitting ? '…' : suspendAcc ? '🚫 Suspend & Resolve' : modal.action === 'reviewed' ? '✓ Confirm Reviewed' : '✕ Confirm Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════ */
/* ─────────────────────────────────────────────────────────────
   TAB: Voting Results
──────────────────────────────────────────────────────────────── */
function VotingTab() {
  const [contests, setContests]   = useState([]);
  const [selected, setSelected]   = useState('');
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    contestAPI.getAll()
      .then(({ data }) => {
        const list = data.data || [];
        setContests(list);
        if (list.length > 0) setSelected(list[0]._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    contestSubmissionAPI.getLeaderboard(selected)
      .then(({ data }) => setResults(data.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selected]);

  const selectedContest = contests.find((c) => c._id === selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111110]">🗳 Voting Results</h2>
          <p className="text-sm text-[#6b6b66] mt-0.5">Contest submissions ranked by community votes</p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-xl border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#6055de] min-w-[220px]"
        >
          {contests.map((c) => (
            <option key={c._id} value={c._id}>{c.title} ({c.status})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-[#efefed] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-[#efefed] rounded-2xl text-center py-16">
          <p className="text-3xl mb-3">🗳</p>
          <p className="text-sm text-[#6b6b66]">No submissions yet for this contest.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#fafaf9] border-b border-[#efefed] flex items-center gap-2">
            <span className="text-sm font-semibold text-[#111110]">{selectedContest?.title}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${selectedContest?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {selectedContest?.status}
            </span>
            <span className="ml-auto text-xs text-[#a3a39e]">{results.length} submission{results.length !== 1 ? 's' : ''}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#efefed]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Film</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden sm:table-cell">Creator</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#6055de]">🗳 Votes</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">♥ Likes</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e] hidden md:table-cell">💬</th>
                <th className="text-right px-5 py-3 pr-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efefed]">
              {results.map((sub, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={sub._id} className={`hover:bg-[#fafaf9] transition-colors ${rank <= 3 ? 'bg-[#fafaf9]/50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold ${
                        rank === 1 ? 'bg-amber-400 text-amber-900' :
                        rank === 2 ? 'bg-gray-200 text-gray-600' :
                        rank === 3 ? 'bg-orange-300 text-orange-800' :
                                     'bg-[#f7f7f6] text-[#6b6b66]'
                      }`}>{rank}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-[#111110] line-clamp-1">{sub.title}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[#6b6b66] hidden sm:table-cell">
                      <div>
                        <p className="text-xs font-medium text-[#111110]">{sub.submittedBy?.name}</p>
                        <p className="text-[11px] text-[#a3a39e]">@{sub.submittedBy?.username}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-[#6055de] text-base">{sub.voteCount ?? sub.votes?.length ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#6b6b66] hidden md:table-cell">
                      {sub.likeCount ?? sub.likes?.length ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#6b6b66] hidden md:table-cell">
                      {sub.commentCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right pr-5">
                      <a href={sub.youtubeLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#6055de] hover:text-[#4d44c8] font-semibold transition-colors">
                        Watch ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Waitlist Tab ─────────────────────────────────────────────────────── */
function WaitlistTab() {
  const [entries, setEntries]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [notifying, setNotifying] = useState(false);
  const [forceNotifying, setForceNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);
  const [notifyingOne, setNotifyingOne] = useState(null); // entry _id being notified

  useEffect(() => {
    launchWaitlistAPI.getAll()
      .then(({ data }) => { setEntries(data.data || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) =>
    !search || e.email.includes(search.toLowerCase()) || e.name?.toLowerCase().includes(search.toLowerCase())
  );

  const copyAll = () => {
    const text = entries.map((e) => e.email).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const unnotifiedCount = entries.filter((e) => !e.notified).length;

  const handleNotifyAll = async () => {
    if (unnotifiedCount === 0) return;
    if (!confirm(`Send launch emails to ${unnotifiedCount} people who haven't been notified yet?`)) return;
    setNotifying(true);
    setNotifyResult(null);
    try {
      const { data } = await launchWaitlistAPI.notify();
      setNotifyResult({ success: true, message: data.message });
      setEntries((prev) => prev.map((e) => ({ ...e, notified: true })));
    } catch (err) {
      setNotifyResult({ success: false, message: err?.response?.data?.message || 'Failed to send emails.' });
    } finally {
      setNotifying(false);
    }
  };

  const handleNotifyOne = async (entry) => {
    if (notifyingOne) return;
    setNotifyingOne(entry._id);
    setNotifyResult(null);
    try {
      const { data } = await launchWaitlistAPI.notifyOne(entry._id);
      setNotifyResult({ success: true, message: data.message });
      setEntries((prev) => prev.map((e) => e._id === entry._id ? { ...e, notified: true } : e));
    } catch (err) {
      setNotifyResult({ success: false, message: err?.response?.data?.message || `Failed to send to ${entry.email}.` });
    } finally {
      setNotifyingOne(null);
    }
  };

  const handleForceNotifyAll = async () => {
    if (!confirm(`Force re-send launch emails to ALL ${total} entries (including already-notified)? Use this if previous sends failed silently.`)) return;
    setForceNotifying(true);
    setNotifyResult(null);
    try {
      const { data } = await launchWaitlistAPI.forceNotify();
      setNotifyResult({ success: true, message: data.message });
      setEntries((prev) => prev.map((e) => ({ ...e, notified: true })));
    } catch (err) {
      setNotifyResult({ success: false, message: err?.response?.data?.message || 'Failed — check EMAIL env vars in Railway.' });
    } finally {
      setForceNotifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0e0e0d] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-3xl font-black text-white">{total.toLocaleString()}</p>
          <p className="text-white/40 text-sm mt-0.5">People on the launch waitlist</p>
          {unnotifiedCount > 0 && (
            <p className="text-xs text-amber-400 mt-1">{unnotifiedCount} not yet notified</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6C63FF] border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3 py-1 rounded-full">
            Launch Waitlist
          </span>
          <button
            onClick={handleNotifyAll}
            disabled={notifying || unnotifiedCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              unnotifiedCount === 0
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-[#6C63FF] hover:bg-[#5750D4] text-white shadow-lg shadow-[#6C63FF]/25'
            } disabled:opacity-60`}
          >
            {notifying ? (
              <><span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" /> Sending…</>
            ) : (
              <>🚀 Notify All {unnotifiedCount > 0 && `(${unnotifiedCount})`}</>
            )}
          </button>
          <div className="flex gap-3 mt-1">
            <button onClick={copyAll}
              className="text-xs text-white/40 hover:text-white transition-colors underline">
              Copy all emails
            </button>
            <button onClick={handleForceNotifyAll} disabled={forceNotifying || total === 0}
              className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors underline disabled:opacity-40">
              {forceNotifying ? 'Sending…' : '⚠ Force re-send all'}
            </button>
          </div>
        </div>
      </div>

      {/* Notify result banner */}
      {notifyResult && (
        <div className={`rounded-xl px-5 py-3.5 text-sm font-medium flex items-center justify-between ${
          notifyResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{notifyResult.success ? '✅' : '❌'} {notifyResult.message}</span>
          <button onClick={() => setNotifyResult(null)} className="text-xs opacity-60 hover:opacity-100 ml-4">✕</button>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors"
      />

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-[#efefed] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#a3a39e] text-sm">
          {search ? 'No matching entries.' : 'No one on the waitlist yet.'}
        </div>
      ) : (
        <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#efefed] bg-[#fafaf9]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#a3a39e]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => (
                <tr key={e._id} className="border-b border-[#efefed] last:border-0 hover:bg-[#fafaf9] transition-colors">
                  <td className="px-5 py-3 text-[#a3a39e] font-mono text-xs">{idx + 1}</td>
                  <td className="px-5 py-3 font-medium text-[#111110]">{e.name || <span className="text-[#c8c8c4]">—</span>}</td>
                  <td className="px-5 py-3 text-[#6b6b66]">{e.email}</td>
                  <td className="px-5 py-3 text-[#a3a39e] text-xs whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    {e.notified
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Notified</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">⏳ Pending</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleNotifyOne(e)}
                      disabled={!!notifyingOne}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                        e.notified
                          ? 'bg-[#f7f7f6] text-[#6b6b66] border border-[#e0e0dd] hover:border-[#6C63FF] hover:text-[#6C63FF]'
                          : 'bg-[#6C63FF] text-white hover:bg-[#5750D4] shadow-sm shadow-[#6C63FF]/20'
                      }`}
                    >
                      {notifyingOne === e._id
                        ? <span className="flex items-center gap-1"><span className="animate-spin inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> Sending…</span>
                        : e.notified ? '↻ Re-send' : '🚀 Notify'
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Risk Monitor — live projects with high/medium risk or auto-suspended
══════════════════════════════════════════════════════════════════════ */
function RiskMonitorTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // all | suspended | high | medium
  const [acting, setActing]     = useState(null);  // id being actioned

  const load = () => {
    setLoading(true);
    adminAPI.getRiskProjects()
      .then(({ data }) => setProjects(data.data || []))
      .catch(() => toast.error('Failed to load risk monitor'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this project and notify the creator?')) return;
    setActing(id);
    try {
      await adminAPI.adminDeleteProject(id);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setActing(null);
    }
  };

  const handleRestore = async (id) => {
    setActing(id);
    try {
      await adminAPI.restoreProject(id);
      toast.success('Project restored ✅');
      setProjects((prev) => prev.map((p) => p._id === id ? { ...p, autoSuspended: false, moderationStatus: 'approved' } : p));
    } catch {
      toast.error('Restore failed');
    } finally {
      setActing(null);
    }
  };

  const filtered = projects.filter((p) => {
    if (filter === 'suspended') return p.autoSuspended;
    if (filter === 'high')      return p.riskLevel === 'high';
    if (filter === 'medium')    return p.riskLevel === 'medium';
    return true;
  });

  const riskConfig = {
    high:   { bar: 'bg-red-500',   bg: 'bg-red-50 border-red-300',    text: 'text-red-700',   label: '🔴 HIGH RISK',   labelClass: 'bg-red-100 text-red-700 border border-red-300' },
    medium: { bar: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: '🟡 MEDIUM RISK', labelClass: 'bg-amber-100 text-amber-700 border border-amber-200' },
    low:    { bar: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '🟢 LOW RISK',    labelClass: 'bg-green-100 text-green-700 border border-green-200' },
  };

  const counts = {
    all:       projects.length,
    suspended: projects.filter((p) => p.autoSuspended).length,
    high:      projects.filter((p) => p.riskLevel === 'high').length,
    medium:    projects.filter((p) => p.riskLevel === 'medium').length,
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111110]">🚨 Risk Monitor</h2>
          <p className="text-sm text-[#6b6b66]">Live projects flagged by the fraud detection system</p>
        </div>
        <button onClick={load} className="text-xs text-[#6C63FF] font-semibold hover:underline">↻ Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: 'all',       label: `All (${counts.all})` },
          { key: 'suspended', label: `⛔ Suspended (${counts.suspended})` },
          { key: 'high',      label: `🔴 High Risk (${counts.high})` },
          { key: 'medium',    label: `🟡 Medium Risk (${counts.medium})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === key ? 'bg-[#0e0e0d] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#efefed] rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold text-[#111110]">All clear!</p>
          <p className="text-sm text-[#6b6b66] mt-1">No flagged projects in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const riskLevel = p.riskLevel || 'low';
            const riskScore = p.riskScore ?? 0;
            const rc = riskConfig[riskLevel];

            return (
              <div key={p._id} className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
                p.autoSuspended ? 'border-red-500' : riskLevel === 'high' ? 'border-red-300' : riskLevel === 'medium' ? 'border-amber-200' : 'border-[#efefed]'
              }`}>

                {/* Risk Score Header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 ${rc.bg}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rc.labelClass}`}>{rc.label}</span>
                    {p.autoSuspended && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-700 text-white">⛔ AUTO-SUSPENDED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${rc.text}`}>Risk: {riskScore}/100</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${rc.bar}`} style={{ width: `${Math.min(riskScore, 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Risk Flags */}
                {p.riskFlags?.length > 0 && (
                  <div className="flex flex-col gap-1 mb-4">
                    {p.riskFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#6b6b66] bg-[#fafaf9] border border-[#efefed] rounded-lg px-3 py-1.5">
                        ⚠️ {flag}
                      </div>
                    ))}
                  </div>
                )}

                {/* Project info */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#6C63FF]">{p.projectType?.replace(/-/g, ' ')}</span>
                      <span className="text-xs text-[#a3a39e]">·</span>
                      <span className="text-xs text-[#a3a39e]">{p.productionType}</span>
                    </div>
                    <h3 className="font-bold text-[#111110] text-base mb-1">{p.title}</h3>
                    <p className="text-sm text-[#6b6b66] line-clamp-2">{p.description}</p>
                  </div>
                  <div className="text-right text-xs text-[#a3a39e] flex-shrink-0">
                    <p>{new Date(p.createdAt).toLocaleDateString()}</p>
                    <p className="mt-1 font-medium text-[#6b6b66]">@{p.createdBy?.username}</p>
                    <p className="mt-0.5">{p.createdBy?.email}</p>
                    {p.createdBy?.isEmailVerified
                      ? <span className="text-green-600 font-semibold">✅ Email verified</span>
                      : <span className="text-red-500 font-semibold">⚠️ Unverified</span>}
                  </div>
                </div>

                {/* Safety info */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Audition',     value: p.auditionFormat?.replace(/-/g, ' ') || '—' },
                    { label: 'Location',     value: p.shootingLocationType?.replace(/-/g, ' ') || '—' },
                    { label: 'Compensation', value: p.isPaid ? (p.compensationDetails || 'Paid — no details') : 'Unpaid / Collab' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#fafaf9] rounded-xl p-3 border border-[#efefed]">
                      <p className="text-xs text-[#a3a39e] mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-[#111110] capitalize">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={acting === p._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {acting === p._id ? '…' : '🗑 Delete Project'}
                  </button>
                  {p.autoSuspended && (
                    <button
                      onClick={() => handleRestore(p._id)}
                      disabled={acting === p._id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {acting === p._id ? '…' : '✅ Restore Project'}
                    </button>
                  )}
                  <a
                    href={`/projects/${p._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 border border-[#e0e0dd] text-sm font-semibold text-[#6b6b66] rounded-xl hover:border-[#111110] hover:text-[#111110] transition-colors"
                  >
                    View →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB: Report Queue (One-Tap Reports)
══════════════════════════════════════════════════════════════════════ */
const REPORT_REASON_LABEL = {
  scam:                 { label: '💰 Scam',               color: 'bg-red-50 text-red-700 border-red-200' },
  harassment:           { label: '😡 Harassment',         color: 'bg-orange-50 text-orange-700 border-orange-200' },
  fake_project:         { label: '🎭 Fake Project',       color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  minor_protection:     { label: '🧒 Minor Safety',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  inappropriate_content:{ label: '🚫 Inappropriate',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  spam:                 { label: '📨 Spam',               color: 'bg-gray-50 text-gray-600 border-gray-200' },
  copyright:            { label: '©️ Copyright',          color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  misinformation:       { label: '❌ Misinfo',            color: 'bg-pink-50 text-pink-700 border-pink-200' },
  other:                { label: '⚠️ Other',              color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

function ReportQueueTab() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('pending');
  const [actingId, setActingId]   = useState(null);
  const [modal,    setModal]      = useState(null);
  const [note,     setNote]       = useState('');
  const [warnUser, setWarnUser]   = useState(false);
  const [suspendAcc, setSuspendAcc] = useState(false);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getQueue({ status: s, limit: 50 });
      setReports(data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const openModal = (report, action) => { setModal({ report, action }); setNote(''); setWarnUser(false); setSuspendAcc(false); };

  const resolve = async () => {
    if (!modal) return;
    setActingId(modal.report._id);
    try {
      await reportAPI.resolve(modal.report._id, modal.action, note.trim(), warnUser);
      if (suspendAcc && modal.report.reportedUser?._id) {
        await adminAPI.suspendUser(modal.report.reportedUser._id, true);
      }
      setReports((prev) => prev.filter((r) => r._id !== modal.report._id));
      setModal(null);
    } catch {}
    finally { setActingId(null); }
  };

  const reopen = async (report) => {
    setActingId(report._id);
    try {
      await reportAPI.resolve(report._id, 'pending', '', false);
      setReports((prev) => prev.map((r) => r._id === report._id ? { ...r, status: 'pending' } : r));
    } catch {}
    finally { setActingId(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1">
          {['pending', 'reviewed', 'dismissed'].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? 'bg-[#0e0e0d] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110]'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6b6b66]">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array(5).fill(0).map((_,i) => <div key={i} className="h-16 bg-[#efefed] rounded-xl animate-pulse" />)}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-[#6b6b66]">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm">No {statusFilter} reports — all clear!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#efefed]">
            {reports.map((r) => {
              const reason = REPORT_REASON_LABEL[r.reason] || REPORT_REASON_LABEL.other;
              return (
                <div key={r._id} className="p-5 hover:bg-[#fafaf9]">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${reason.color}`}>
                          {reason.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f3] text-[#6b6b66] border border-[#e0e0dd] capitalize">
                          {r.targetType}
                        </span>
                        <span className="text-xs text-[#a3a39e]">
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#444442] mb-1">
                        <span className="font-semibold">Reporter:</span> {r.reporter?.name || r.reporter?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#444442] mb-1">
                        <span className="font-semibold">Target ID:</span> <span className="font-mono text-[10px]">{String(r.targetId)}</span>
                      </p>
                      {r.details && (
                        <p className="text-xs text-[#6b6b66] italic mt-1">"{r.details}"</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {statusFilter === 'pending' ? (
                        <>
                          <button onClick={() => openModal(r, 'reviewed')} disabled={actingId === r._id}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                            ✓ Reviewed
                          </button>
                          <button onClick={() => openModal(r, 'dismissed')} disabled={actingId === r._id}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#f5f5f3] text-[#6b6b66] border border-[#e0e0dd] rounded-lg hover:border-[#111110] hover:text-[#111110] transition disabled:opacity-50">
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <button onClick={() => reopen(r)} disabled={actingId === r._id}
                          className="px-3 py-1.5 text-xs font-semibold border border-[#e0e0dd] text-[#6b6b66] rounded-lg hover:border-[#111110] hover:text-[#111110] transition disabled:opacity-50">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#111110] mb-1">
              {modal.action === 'reviewed' ? '✅ Mark as Reviewed' : '🗑 Dismiss Report'}
            </h3>
            <p className="text-xs text-[#6b6b66] mb-4">
              Reported: <span className="font-semibold text-[#111110]">{modal.report.reportedUser?.name || modal.report.reportedUser?.email || 'Unknown user'}</span>
            </p>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Resolution note (optional)..."
              className="w-full border border-[#e0e0dd] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#6C63FF] mb-3"
              rows={3}
            />
            <div className="flex flex-col gap-2 mb-5">
              <button onClick={() => setWarnUser((v) => !v)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  warnUser ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-[#e0e0dd] text-[#444442] hover:bg-[#f7f7f6]'
                }`}>
                <span className="text-lg">{warnUser ? '✅' : '⬜'}</span>
                ⚠️ Send warning to user
              </button>
              <button onClick={() => setSuspendAcc((v) => !v)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  suspendAcc ? 'bg-red-50 border-red-300 text-red-800' : 'border-[#e0e0dd] text-[#444442] hover:bg-[#f7f7f6]'
                }`}>
                <span className="text-lg">{suspendAcc ? '✅' : '⬜'}</span>
                🚫 Suspend user account
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#e0e0dd] text-[#6b6b66] rounded-xl hover:border-[#111110] hover:text-[#111110] transition">
                Cancel
              </button>
              <button onClick={resolve} disabled={!!actingId}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-50 ${
                  suspendAcc ? 'bg-red-600 hover:bg-red-700' : modal.action === 'reviewed' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#444442] hover:bg-[#0e0e0d]'
                }`}>
                {actingId ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'overview',      label: '📊 Overview' },
  { id: 'risk-monitor',  label: '🚨 Risk Monitor' },
  { id: 'report-queue',  label: '⚑ Report Queue' },
  { id: 'users',         label: '👥 Users' },
  { id: 'contests',      label: '🏆 Contests' },
  { id: 'voting',        label: '🗳 Voting' },
  { id: 'announcements', label: '📢 Announcements' },
  { id: 'waitlist',      label: '✉️ Waitlist' },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const [tab, setTab]     = useState(() => searchParams?.get('tab') || 'overview');
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    if (user?.isAdmin) {
      adminAPI.getStats().then(({ data }) => setPendingReports(data.data?.pendingReports || 0)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading || !user?.isAdmin) {
    return <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="bg-[#0e0e0d] border-b border-white/10"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-[Playfair_Display] text-white">Admin Dashboard</h1>
          </div>
          <p className="text-white/40 text-sm">Manage users, contests, and platform activity.</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 mb-8 w-fit flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-[#0e0e0d] text-white shadow-sm'
                  : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#fafaf9]'
              }`}>
              {t.label}
              {t.id === 'reports' && pendingReports > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingReports > 9 ? '9+' : pendingReports}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'overview'      && <OverviewTab />}
        {tab === 'risk-monitor'  && <RiskMonitorTab />}
        {tab === 'report-queue'  && <ReportQueueTab />}
        {tab === 'users'         && <UsersTab />}
        {tab === 'contests'      && <ContestsTab />}
        {tab === 'voting'        && <VotingTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
        {tab === 'waitlist'      && <WaitlistTab />}
      </div>
    </div>
  );
}
