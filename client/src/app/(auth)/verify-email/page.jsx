'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loginWithToken } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.isEmailVerified) {
      router.replace('/dashboard');
    }
  }, [user]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleInput = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) { toast.error('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.verifyEmail(fullCode);
      if (data.success) {
        // Update auth context with verified user
        if (loginWithToken && data.token) loginWithToken(data.token, data.user);
        toast.success('Email verified! Welcome to CREWUPFILMS 🎬');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code. Try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authAPI.sendEmailOTP();
      toast.success('A new code has been sent to your email');
      setCountdown(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .otp-input {
          width: 48px; height: 56px; text-align: center; font-size: 22px;
          font-weight: 700; border: 2px solid #e0e0dd; background: white;
          color: #111110; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          border-radius: 8px; font-family: monospace;
        }
        .otp-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(17,17,16,0.08); }
        .otp-input.filled { border-color: #111110; background: #f5f5f3; }
      `}</style>

      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8">
          <Logo size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">

            {/* Lock icon */}
            <div className="fade-up flex items-center justify-center w-16 h-16 bg-[#f5f5f3] rounded-2xl mx-auto mb-8" style={{ animationDelay: '0s' }}>
              <span className="text-3xl">🔒</span>
            </div>

            <h1 className="fade-up text-3xl font-[Playfair_Display] text-[#111110] text-center mb-3 leading-tight" style={{ animationDelay: '0.06s' }}>
              Verify your email
            </h1>
            <p className="fade-up text-sm text-[#6b6b66] text-center mb-10 leading-relaxed" style={{ animationDelay: '0.12s' }}>
              We sent a 6-digit code to{' '}
              <strong className="text-[#111110]">{user?.email || 'your email'}</strong>.<br />
              Enter it below to activate your account.
            </p>

            {/* OTP inputs */}
            <div className="fade-up flex gap-2 justify-center mb-8" style={{ animationDelay: '0.18s' }} onPaste={handlePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length < 6}
              className="fade-up w-full bg-[#111110] text-white text-sm font-medium py-4 rounded-xl hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-5"
              style={{ animationDelay: '0.24s' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : 'Verify Email →'}
            </button>

            {/* Resend */}
            <p className="fade-up text-center text-sm text-[#6b6b66]" style={{ animationDelay: '0.3s' }}>
              Didn't receive it?{' '}
              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-[#111110] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </p>

            {/* Safety notice */}
            <div className="fade-up mt-10 p-4 bg-[#f5f5f3] rounded-xl" style={{ animationDelay: '0.36s' }}>
              <p className="text-xs text-[#6b6b66] leading-relaxed">
                🔒 <strong className="text-[#111110]">Security tip:</strong> CREWUPFILMS will never ask for this code via email, chat, or any message. If someone asks for your code, it's a scam.
              </p>
            </div>

            {/* Skip (for now) */}
            <p className="fade-up text-center text-xs text-[#a3a39e] mt-6" style={{ animationDelay: '0.42s' }}>
              <Link href="/dashboard" className="hover:text-[#6b6b66] transition-colors">
                Skip for now — verify later in settings
              </Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
