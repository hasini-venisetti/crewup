'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import Logo from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-[#111110] mb-2">Check your email</h1>
              <p className="text-sm text-[#6b6b66] leading-relaxed mb-6">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
              </p>
              <p className="text-xs text-[#a3a39e] mb-6">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#111110] underline hover:no-underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-[#111110] hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#111110] mb-2">Forgot your password?</h1>
              <p className="text-sm text-[#6b6b66] mb-8 leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#111110] mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition placeholder:text-[#b0b0aa]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#6b6b66] hover:text-[#111110] transition">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
