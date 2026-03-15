'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

/* ── Password strength indicator ─────────────────────────────────────────── */
function PasswordStrength({ password }) {
  let strength = 0;
  if (password.length >= 8)  strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password))   strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  const label = strength >= 4 ? 'Strong' : strength >= 3 ? 'Medium' : 'Weak';
  const color = strength >= 4 ? 'bg-green-500' : strength >= 3 ? 'bg-[#6C63FF]' : 'bg-red-500';

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? color : 'bg-[#f0f0ee]'}`} />
        ))}
      </div>
      <p className={`text-xs ${color.replace('bg-', 'text-')}`}>{label}</p>
    </div>
  );
}

/* ── Input helper ─────────────────────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm text-[#6b6b66] block mb-1.5 font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#a3a39e] mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition';
const disabledInputCls = 'w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#a3a39e] cursor-not-allowed';
const btnPrimary = 'bg-[#6C63FF] text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#5750D4] disabled:opacity-50 transition-colors';
const card = 'bg-white rounded-xl border border-[#efefed] p-7 shadow-sm';

/* ── Profile Tab ─────────────────────────────────────────────────────────── */
function ProfileTab({ user, onUpdate }) {
  const [name, setName]   = useState(user?.name || '');
  const [dob, setDob]     = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  // Max DOB = today, min = 100 years ago
  const today    = new Date().toISOString().split('T')[0];
  const minDate  = new Date(Date.now() - 100 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!dob)         { toast.error('Date of birth is required'); return; }
    setLoading(true);
    try {
      const { data } = await api.put('/auth/update-me', { name: name.trim(), dateOfBirth: dob });
      toast.success('Profile updated');
      if (onUpdate) onUpdate(data.user);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-1">Personal Information</h3>
        <p className="text-sm text-[#a3a39e] mb-6">Your name and date of birth are used for age verification and personalisation.</p>
        <form onSubmit={handleSave} className="space-y-5 max-w-md">
          <Field label="Full Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your full name" />
          </Field>
          <Field label="Username" hint="Username cannot be changed after registration.">
            <input type="text" value={`@${user?.username || ''}`} disabled className={disabledInputCls} />
          </Field>
          <Field
            label="Date of Birth"
            hint={user?.dateOfBirth ? `You are currently ${Math.floor((Date.now() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} years old.` : 'Required to confirm you meet age requirements.'}
          >
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={today}
              min={minDate}
              className={inputCls}
            />
          </Field>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Account Tab ──────────────────────────────────────────────────────────── */
function AccountTab({ user, onUpdate }) {
  const [email, setEmail]   = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const router = useRouter();

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!password) { toast.error('Enter your password to confirm'); return; }
    setLoading('email');
    try {
      await api.put('/users/me/email', { newEmail, password });
      toast.success('Email updated');
      setNewEmail(''); setPassword('');
      onUpdate({ email: newEmail });
    } catch {
      toast.error('Failed to update email');
    } finally { setLoading(''); }
  };

  const handleDeleteAccount = async () => {
    if (deleteUsername !== user?.username) { toast.error('Username does not match'); return; }
    setLoading('delete');
    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      localStorage.removeItem('crewup_token');
      localStorage.removeItem('crewup_user');
      router.push('/');
    } catch {
      toast.error('Failed to delete account');
    } finally { setLoading(''); }
  };

  return (
    <div className="space-y-6">
      {/* Change Email */}
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-6">Change Email Address</h3>
        <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
          <Field label="Current Email">
            <input type="email" value={email} disabled className={disabledInputCls} />
          </Field>
          <Field label="New Email">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="new@email.com" />
          </Field>
          <Field label="Confirm with Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Your current password" />
          </Field>
          <button type="submit" disabled={!!loading} className={btnPrimary}>
            {loading === 'email' ? 'Updating…' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-7">
        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-[#6b6b66] mb-4">Permanently deletes your account, projects, and all data. This cannot be undone.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-[#fafaf9] rounded-lg border border-red-200">
            <p className="text-sm text-[#6b6b66]">
              Type your username <span className="font-semibold text-[#111110]">@{user?.username}</span> to confirm:
            </p>
            <input type="text" value={deleteUsername} onChange={(e) => setDeleteUsername(e.target.value)} placeholder="@username" className={inputCls} />
            <div className="flex gap-2">
              <button onClick={() => { setDeleteConfirm(false); setDeleteUsername(''); }} className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#f7f7f6] text-[#6b6b66] hover:bg-[#f0f0ee] transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteUsername !== user?.username || !!loading} className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-100 text-red-600 border border-red-200 hover:bg-red-200 transition-colors disabled:opacity-50">
                {loading === 'delete' ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Security Tab ─────────────────────────────────────────────────────────── */
function SecurityTab({ user }) {
  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-6">Verification Status</h3>
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#efefed] bg-[#fafaf9]">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-sm font-semibold text-[#111110]">Email Address</p>
                <p className="text-xs text-[#6b6b66]">{user?.email}</p>
              </div>
            </div>
            {user?.isEmailVerified ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">✓ Verified</span>
            ) : (
              <Link href="/verify-email" className="text-xs font-semibold text-[#6C63FF] bg-[#f0eeff] border border-[#c9c4ff] px-3 py-1.5 rounded-full hover:bg-[#e6e0ff] transition-colors">
                Verify Now →
              </Link>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#efefed] bg-[#fafaf9]">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="text-sm font-semibold text-[#111110]">Phone Number</p>
                <p className="text-xs text-[#6b6b66]">{user?.phone?.number || 'Not added'}</p>
              </div>
            </div>
            {user?.phone?.isVerified ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">✓ Verified</span>
            ) : (
              <Link href="/verify-phone" className="text-xs font-semibold text-[#6C63FF] bg-[#f0eeff] border border-[#c9c4ff] px-3 py-1.5 rounded-full hover:bg-[#e6e0ff] transition-colors">
                {user?.phone?.number ? 'Verify Now →' : 'Add & Verify →'}
              </Link>
            )}
          </div>

          {/* Age / DOB */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#efefed] bg-[#fafaf9]">
            <div className="flex items-center gap-3">
              <span className="text-xl">🪪</span>
              <div>
                <p className="text-sm font-semibold text-[#111110]">Date of Birth</p>
                <p className="text-xs text-[#6b6b66]">
                  {user?.dateOfBirth ? `${new Date(user.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${Math.floor((Date.now() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} years old` : 'Not added'}
                </p>
              </div>
            </div>
            {user?.dateOfBirth ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">✓ Added</span>
            ) : (
              <button onClick={() => document.querySelector('[data-tab="profile"]')?.click()} className="text-xs font-semibold text-[#6C63FF] bg-[#f0eeff] border border-[#c9c4ff] px-3 py-1.5 rounded-full hover:bg-[#e6e0ff] transition-colors">
                Add in Profile →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <PasswordSection />
    </div>
  );
}

function PasswordSection() {
  const [cur, setCur]       = useState('');
  const [next, setNext]     = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCur, setShowCur]     = useState(false);
  const [showNext, setShowNext]   = useState(false);
  const [showConf, setShowConf]   = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (next !== confirm) { toast.error('Passwords do not match'); return; }
    if (next.length < 8)  { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: next });
      toast.success('Password changed');
      setCur(''); setNext(''); setConfirm('');
    } catch {
      toast.error('Current password is incorrect');
    } finally { setLoading(false); }
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-2.5 text-[#6b6b66] hover:text-[#111110]">
      {show ? '👁️' : '👁️‍🗨️'}
    </button>
  );

  return (
    <div className={card}>
      <h3 className="text-lg font-bold text-[#111110] mb-6">Change Password</h3>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <Field label="Current Password">
          <div className="relative">
            <input type={showCur ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} className={`${inputCls} pr-10`} />
            {eyeBtn(showCur, () => setShowCur(!showCur))}
          </div>
        </Field>
        <Field label="New Password">
          <div className="relative">
            <input type={showNext ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} className={`${inputCls} pr-10`} />
            {eyeBtn(showNext, () => setShowNext(!showNext))}
          </div>
          <PasswordStrength password={next} />
        </Field>
        <Field label="Confirm Password">
          <div className="relative">
            <input type={showConf ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputCls} pr-10`} />
            {eyeBtn(showConf, () => setShowConf(!showConf))}
          </div>
        </Field>
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

/* ── Notifications Tab ────────────────────────────────────────────────────── */
function NotificationsTab({ user }) {
  const NOTIFS = [
    { key: 'appReceived', label: 'New application on my project',  desc: 'Someone applies to your casting call' },
    { key: 'appAccepted', label: 'My application was accepted',    desc: 'You get cast in a project' },
    { key: 'appDeclined', label: 'My application was declined',    desc: 'Your application is not selected' },
    { key: 'roleFilled',  label: 'A role is filled on my project', desc: 'One of your roles is no longer open' },
  ];

  const [prefs, setPrefs]   = useState({ appReceived: true, appAccepted: true, appDeclined: true, roleFilled: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crewup_notif_prefs');
    if (saved) setPrefs(JSON.parse(saved));
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem('crewup_notif_prefs', JSON.stringify(prefs));
    setTimeout(() => { toast.success('Preferences saved'); setLoading(false); }, 300);
  };

  return (
    <div className={card}>
      <h3 className="text-lg font-bold text-[#111110] mb-1">Email Notifications</h3>
      <p className="text-sm text-[#a3a39e] mb-6">Sent to <span className="text-[#111110] font-medium">{user?.email}</span></p>
      <div className="space-y-4 max-w-lg">
        {NOTIFS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#111110]">{label}</p>
              <p className="text-xs text-[#a3a39e]">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors ${prefs[key] ? 'bg-[#6C63FF]' : 'bg-[#e0e0dd]'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
        <div className="pt-4 border-t border-[#efefed]">
          <button onClick={handleSave} disabled={loading} className={btnPrimary}>
            {loading ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Help & Contact Tab ───────────────────────────────────────────────────── */
function HelpTab() {
  const FAQS = [
    { q: 'Why can\'t I post a project?', a: 'You need to verify your email and phone number first. Go to the Security tab and complete both verifications.' },
    { q: 'How do I get the Verified Creator badge?', a: 'Verified badges are awarded by the CREWUPFILMS team. Keep your profile complete, get positive reviews, and maintain a clean record.' },
    { q: 'Can I edit a project after posting?', a: 'Yes — go to your Dashboard, open the project, and click Edit. All applicants will be notified of major changes.' },
    { q: 'Someone asked me to pay a fee. What do I do?', a: 'Never pay. Legitimate productions never charge fees. Report the profile immediately using the ⚑ button.' },
    { q: 'How do I delete my account?', a: 'Go to Settings → Account → Danger Zone. Deletion is permanent and removes all your data.' },
  ];

  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-6">
      {/* Contact */}
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-1">Contact Support</h3>
        <p className="text-sm text-[#a3a39e] mb-6">We typically respond within 24 hours.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:crewupfilms@gmail.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-[#efefed] hover:border-[#6C63FF]/40 hover:bg-[#f8f7ff] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f0eeff] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#e6e0ff] transition-colors">📧</div>
            <div>
              <p className="text-sm font-semibold text-[#111110]">Email Us</p>
              <p className="text-xs text-[#6C63FF]">crewupfilms@gmail.com</p>
            </div>
          </a>
          <a
            href="https://instagram.com/crewupfilms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-[#efefed] hover:border-[#6C63FF]/40 hover:bg-[#f8f7ff] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f0eeff] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#e6e0ff] transition-colors">📸</div>
            <div>
              <p className="text-sm font-semibold text-[#111110]">Instagram</p>
              <p className="text-xs text-[#6C63FF]">@crewupfilms</p>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-6">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-[#efefed] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#fafaf9] transition-colors"
              >
                <span className="text-sm font-semibold text-[#111110] pr-4">{faq.q}</span>
                <span className={`text-[#6b6b66] flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 border-t border-[#efefed] bg-[#fafaf9]">
                  <p className="text-sm text-[#6b6b66] leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className={card}>
        <h3 className="text-lg font-bold text-[#111110] mb-4">Resources</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/safety',            label: '🛡 Safety Guide' },
            { href: '/legal/guidelines',  label: '📋 Community Guidelines' },
            { href: '/legal/terms',       label: '📄 Terms of Service' },
            { href: '/legal/privacy',     label: '🔒 Privacy Policy' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-[#6C63FF] bg-[#f0eeff] border border-[#c9c4ff] px-4 py-2 rounded-xl hover:bg-[#e6e0ff] transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Settings Page ───────────────────────────────────────────────────── */
const TABS = [
  { key: 'profile',       label: '👤 Profile',       icon: '👤' },
  { key: 'security',      label: '🔒 Security',      icon: '🔒' },
  { key: 'account',       label: '⚙️ Account',       icon: '⚙️' },
  { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
  { key: 'help',          label: '💬 Help',          icon: '💬' },
];

function SettingsContent() {
  const { user, loading: authLoading, loginWithToken } = useAuth();
  const router     = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab]       = useState(() => searchParams?.get('tab') || 'profile');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, [searchParams]);

  const handleUpdate = (updated) => {
    setUserData((prev) => ({ ...(prev || user), ...updated }));
    if (loginWithToken && updated.token) loginWithToken(updated.token, updated);
  };

  if (authLoading || !user) return null;

  const currentUser = userData || user;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <div className="bg-[#0e0e0d] relative overflow-hidden h-40 flex items-center">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: 'Playfair Display' }}>Settings</h1>
          <p className="text-white/50 mt-2 text-sm">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible border-b lg:border-b-0 lg:border-r border-[#efefed] pb-4 lg:pb-0 lg:pr-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                data-tab={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2.5 text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-[#0e0e0d] text-white'
                    : 'text-[#6b6b66] hover:bg-[#f7f7f6] hover:text-[#111110]'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {tab === 'profile'       && <ProfileTab       user={currentUser} onUpdate={handleUpdate} />}
            {tab === 'security'      && <SecurityTab      user={currentUser} />}
            {tab === 'account'       && <AccountTab       user={currentUser} onUpdate={(u) => setUserData((p) => ({ ...(p || user), ...u }))} />}
            {tab === 'notifications' && <NotificationsTab user={currentUser} />}
            {tab === 'help'          && <HelpTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
