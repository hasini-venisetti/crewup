'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyPhonePage() {
  const router  = useRouter();
  const { user, loginWithToken } = useAuth();

  const [phone, setPhone]           = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [code, setCode]             = useState(['', '', '', '', '', '']);
  const [sending, setSending]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [countdown, setCountdown]   = useState(0);
  const [devOtp, setDevOtp]         = useState(''); // shown in dev mode
  const inputRefs = useRef([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.phone?.isVerified) router.replace('/dashboard');
  }, [user]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSend = async () => {
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    setSending(true);
    try {
      const { data } = await authAPI.sendPhoneOTP(phone.trim());
      setOtpSent(true);
      setCountdown(60);
      toast.success(`Code sent to ${phone}`);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        toast(`Dev mode — your OTP is: ${data.devOtp}`, { icon: '🛠', duration: 30000 });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send code. Check the number and try again.');
    } finally { setSending(false); }
  };

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
    setVerifying(true);
    try {
      const { data } = await authAPI.verifyPhone(fullCode);
      if (data.success) {
        if (loginWithToken && data.token) loginWithToken(data.token, data.user);
        // Update user in auth context if no token returned
        toast.success('📱 Phone verified! Your account is now fully verified.');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code. Try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setVerifying(false); }
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
        <div className="px-8 pt-8 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a3a39e]">Step 2 of 2</span>
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-[#111110] rounded-full" />
              <div className="w-8 h-1 bg-[#111110] rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">

            <div className="fade-up flex items-center justify-center w-16 h-16 bg-[#f5f5f3] rounded-2xl mx-auto mb-8">
              <span className="text-3xl">📱</span>
            </div>

            {!otpSent ? (
              <>
                <h1 className="fade-up text-3xl font-[Playfair_Display] text-[#111110] text-center mb-3">
                  Verify your phone
                </h1>
                <p className="fade-up text-sm text-[#6b6b66] text-center mb-8 leading-relaxed">
                  Add your phone number to complete account verification. This helps us keep the platform safe.
                </p>

                <div className="fade-up mb-4">
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">
                    Phone Number (with country code)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full border border-[#e0e0dd] px-4 py-3.5 text-sm text-[#111110] rounded-xl focus:outline-none focus:border-[#111110] focus:ring-2 focus:ring-black/5 transition"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || !phone.trim()}
                  className="fade-up w-full bg-[#111110] text-white text-sm font-medium py-4 rounded-xl hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-5"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code…
                    </span>
                  ) : 'Send Verification Code →'}
                </button>

                <div className="fade-up p-4 bg-[#f5f5f3] rounded-xl mb-5">
                  <p className="text-xs text-[#6b6b66] leading-relaxed">
                    🔒 <strong className="text-[#111110]">Why we need this:</strong> Phone verification helps us prevent fake accounts and protect everyone on the platform, especially minors.
                  </p>
                </div>

                <p className="fade-up text-center text-xs text-[#a3a39e]">
                  <Link href="/dashboard" className="hover:text-[#6b6b66] transition-colors">
                    Skip for now — you won't be able to post projects
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="fade-up text-3xl font-[Playfair_Display] text-[#111110] text-center mb-3">
                  Enter the code
                </h1>
                <p className="fade-up text-sm text-[#6b6b66] text-center mb-8 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <strong className="text-[#111110]">{phone}</strong>.{' '}
                  <button onClick={() => { setOtpSent(false); setCode(['','','','','','']); }}
                    className="text-[#6C63FF] hover:underline text-xs">Change number</button>
                </p>

                {devOtp && (
                  <div className="fade-up mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                    <p className="text-xs text-yellow-700">🛠 Dev OTP: <strong className="font-mono text-lg">{devOtp}</strong></p>
                  </div>
                )}

                {/* OTP inputs */}
                <div className="fade-up flex gap-2 justify-center mb-8" onPaste={handlePaste}>
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

                <button
                  onClick={handleVerify}
                  disabled={verifying || code.join('').length < 6}
                  className="fade-up w-full bg-[#111110] text-white text-sm font-medium py-4 rounded-xl hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-5"
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : 'Verify Phone →'}
                </button>

                <p className="fade-up text-center text-sm text-[#6b6b66] mb-6">
                  Didn't receive it?{' '}
                  <button
                    onClick={handleSend}
                    disabled={sending || countdown > 0}
                    className="text-[#111110] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {sending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </p>

                <div className="fade-up p-4 bg-[#f5f5f3] rounded-xl mb-5">
                  <p className="text-xs text-[#6b6b66] leading-relaxed">
                    🔒 <strong className="text-[#111110]">Security tip:</strong> Never share this code with anyone. CREWUPFILMS will never ask for your code via email or chat.
                  </p>
                </div>

                <p className="fade-up text-center text-xs text-[#a3a39e]">
                  <Link href="/dashboard" className="hover:text-[#6b6b66] transition-colors">
                    Skip for now — you won't be able to post projects
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
