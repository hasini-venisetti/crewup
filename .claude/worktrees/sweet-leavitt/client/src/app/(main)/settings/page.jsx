'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

function PasswordStrength({ password }) {
  let strength = 0;
  let label = 'Weak';
  let color = 'bg-red-500';

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength >= 4) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (strength >= 3) {
    label = 'Medium';
    color = 'bg-[#6C63FF]';
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < strength ? color : 'bg-[#f0f0ee]'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${color.replace('bg-', 'text-')}`}>{label}</p>
    </div>
  );
}

function AccountTab({ user, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteUsername, setDeleteUsername] = useState('');
  const router = useRouter();

  const handleChangeName = async (e) => {
    e.preventDefault();
    setLoading('name');
    try {
      await api.put('/users/me', { name });
      toast.success('Name updated');
      onUpdate({ name });
    } catch {
      toast.error('Failed to update name');
    } finally {
      setLoading('');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password to confirm');
      return;
    }
    setLoading('email');
    try {
      await api.put('/users/me/email', { newEmail, password });
      toast.success('Email updated');
      setNewEmail('');
      setPassword('');
      onUpdate({ email: newEmail });
    } catch {
      toast.error('Failed to update email');
    } finally {
      setLoading('');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteUsername !== user?.username) {
      toast.error('Username does not match');
      return;
    }
    setLoading('delete');
    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      localStorage.removeItem('crewup_token');
      localStorage.removeItem('crewup_user');
      router.push('/');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Name */}
      <div className="bg-white rounded-xl border border-[#efefed] p-7 shadow-sm">
        <h3 className="text-lg font-bold text-[#111110] mb-4">Change Name</h3>
        <form onSubmit={handleChangeName} className="space-y-4">
          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
            />
          </div>
          <button
            type="submit"
            disabled={!!loading}
            className="bg-[#6C63FF] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
          >
            {loading === 'name' ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white rounded-xl border border-[#efefed] p-7 shadow-sm">
        <h3 className="text-lg font-bold text-[#111110] mb-4">Change Email</h3>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">Current Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#a3a39e] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
            />
          </div>
          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">Confirm with Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
            />
          </div>
          <button
            type="submit"
            disabled={!!loading}
            className="bg-[#6C63FF] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
          >
            {loading === 'email' ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 bg-red-50/50 p-7">
        <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
        <p className="text-sm text-[#6b6b66] mb-4">Deleting your account is permanent and cannot be undone.</p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-white rounded-lg border border-red-200">
            <p className="text-sm text-[#6b6b66]">
              Type your username <span className="text-[#111110] font-semibold">@{user?.username}</span> to confirm deletion:
            </p>
            <input
              type="text"
              value={deleteUsername}
              onChange={(e) => setDeleteUsername(e.target.value)}
              placeholder="@username"
              className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteUsername('');
                }}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#f7f7f6] text-[#6b6b66] hover:bg-[#f0f0ee] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteUsername !== user?.username || !!loading}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-500/20 text-red-600 border border-red-200 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {loading === 'delete' ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-[#efefed] p-7 shadow-sm">
        <h3 className="text-lg font-bold text-[#111110] mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 pr-10 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-[#6b6b66] hover:text-[#111110]"
              >
                {showCurrent ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 pr-10 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-[#6b6b66] hover:text-[#111110]"
              >
                {showNew ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="text-sm text-[#6b6b66] block mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#fafaf9] border border-[#e0e0dd] rounded-lg px-4 py-2.5 pr-10 text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-[#6b6b66] hover:text-[#111110]"
              >
                {showConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#6C63FF] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function NotificationsTab({ user }) {
  const [prefs, setPrefs] = useState({
    appReceived: true,
    appAccepted: true,
    appDeclined: true,
    roleFilled: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crewup_notif_prefs');
    if (saved) setPrefs(JSON.parse(saved));
  }, []);

  const handleToggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('crewup_notif_prefs', JSON.stringify(prefs));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-[#efefed] p-7 shadow-sm">
        <h3 className="text-lg font-bold text-[#111110] mb-6">Email Notifications</h3>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111110] font-medium">New application on my project</p>
              <p className="text-xs text-[#a3a39e]">Get notified when someone applies</p>
            </div>
            <button
              onClick={() => handleToggle('appReceived')}
              className={`w-12 h-7 rounded-full transition-colors ${
                prefs.appReceived ? 'bg-[#6C63FF]' : 'bg-[#f0f0ee]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-all ${
                  prefs.appReceived ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111110] font-medium">My application was accepted</p>
              <p className="text-xs text-[#a3a39e]">Get notified when you're accepted</p>
            </div>
            <button
              onClick={() => handleToggle('appAccepted')}
              className={`w-12 h-7 rounded-full transition-colors ${
                prefs.appAccepted ? 'bg-[#6C63FF]' : 'bg-[#f0f0ee]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-all ${
                  prefs.appAccepted ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111110] font-medium">My application was declined</p>
              <p className="text-xs text-[#a3a39e]">Get notified when you're declined</p>
            </div>
            <button
              onClick={() => handleToggle('appDeclined')}
              className={`w-12 h-7 rounded-full transition-colors ${
                prefs.appDeclined ? 'bg-[#6C63FF]' : 'bg-[#f0f0ee]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-all ${
                  prefs.appDeclined ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111110] font-medium">Role filled on my project</p>
              <p className="text-xs text-[#a3a39e]">Get notified when a role is filled</p>
            </div>
            <button
              onClick={() => handleToggle('roleFilled')}
              className={`w-12 h-7 rounded-full transition-colors ${
                prefs.roleFilled ? 'bg-[#6C63FF]' : 'bg-[#f0f0ee]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-all ${
                  prefs.roleFilled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-[#efefed]">
            <p className="text-xs text-[#a3a39e] mb-3">
              Emails are sent to <span className="text-[#111110] font-semibold">{user?.email}</span>
            </p>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#6C63FF] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('account');
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Dark Hero Section */}
      <div className="bg-[#0e0e0d] relative overflow-hidden h-40 flex items-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-[-0.04em]" style={{ fontFamily: 'Playfair Display' }}>
            Settings
          </h1>
          <p className="text-white/50 mt-2 text-base">Manage your account and preferences</p>
        </div>
      </div>

      <div className="pt-16 pb-20 px-4 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="flex lg:flex-col gap-2 border-b lg:border-b-0 lg:border-r border-[#efefed] pb-6 lg:pb-0 lg:pr-6">
            {[
              { key: 'account', label: 'Account' },
              { key: 'password', label: 'Password' },
              { key: 'notifications', label: 'Notifications' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-[#0e0e0d] text-white'
                    : 'text-[#6b6b66] hover:bg-[#f7f7f6] hover:text-[#111110]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {tab === 'account' && (
              <AccountTab user={userData || user} onUpdate={setUserData} />
            )}
            {tab === 'password' && <PasswordTab />}
            {tab === 'notifications' && (
              <NotificationsTab user={userData || user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
