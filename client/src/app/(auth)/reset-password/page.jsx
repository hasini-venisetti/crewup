'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import Logo from '@/components/ui/Logo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
      toast.success('Password reset! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Reset failed. The link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#111110] mb-2">Invalid reset link</h1>
        <p className="text-sm text-[#6b6b66] mb-6">
          This link is missing a token. Please request a new password reset.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-[#111110] underline hover:no-underline">
          Request new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#111110] mb-2">Password updated!</h1>
        <p className="text-sm text-[#6b6b66]">Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-[#111110] mb-2">Set new password</h1>
      <p className="text-sm text-[#6b6b66] mb-8 leading-relaxed">
        Choose a strong password of at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#111110] mb-2">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
              placeholder="At least 8 characters"
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 pr-10 focus:outline-none focus:border-[#111110] transition placeholder:text-[#b0b0aa]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a39e] hover:text-[#111110] transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-[#111110] mb-2">
            Confirm new password
          </label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            placeholder="Repeat your new password"
            className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition placeholder:text-[#b0b0aa]"
          />
          {confirm && password !== confirm && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-[#6b6b66] hover:text-[#111110] transition">
          ← Back to login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Logo className="h-8 w-auto" />
          </Link>
        </div>

        <div className="bg-white border border-[#e8e8e5] rounded-sm p-8 shadow-sm">
          <Suspense fallback={<div className="text-center text-sm text-[#6b6b66]">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
