'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) { toast.error('Google sign-in is not configured yet.'); return; }
    setGoogleLoading(true);
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  async (response) => {
        try {
          const { data } = await authAPI.googleAuth({ idToken: response.credential });
          if (data.needsUsername) {
            // New user — redirect to signup with Google token stored in sessionStorage
            sessionStorage.setItem('googleIdToken', response.credential);
            sessionStorage.setItem('googleUserInfo', JSON.stringify({ name: data.name, email: data.email, picture: data.picture }));
            router.push('/signup?method=google');
            return;
          }
          if (data.success && data.token) {
            loginWithToken(data.token, data.user);
            toast.success(`Welcome back, ${data.user.name}! 🎬`);
            router.push('/dashboard');
          }
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Google sign-in failed.');
        } finally { setGoogleLoading(false); }
      },
    });
    window.google.accounts.id.prompt();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🎬');
      router.push('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-1 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.05s; }
        .anim-2 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.15s; }
        .anim-3 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.25s; }
        .anim-4 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.35s; }
        .anim-5 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.45s; }
        .anim-6 { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.55s; }
        .field-input {
          width: 100%;
          background: white;
          border: 1px solid #e0e0dd;
          color: #111110;
          font-size: 14px;
          padding: 14px 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .field-input:focus {
          border-color: #111110;
          box-shadow: 0 0 0 3px rgba(17,17,16,0.06);
        }
        .field-input::placeholder { color: #a3a39e; }
      `}</style>

      <div className="flex h-screen bg-white overflow-hidden">

        {/* ── Left — Form ── */}
        <div className="w-full md:w-[48%] flex flex-col justify-center px-8 md:px-16 lg:px-24 relative">
          <div className="anim-1 absolute top-8 left-8 md:left-16 lg:left-24">
            <Logo size="sm" />
          </div>

          <div className="w-full max-w-sm mx-auto">
            <p className="anim-1 text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Sign in</p>
            <h1 className="anim-2 text-4xl md:text-5xl font-[Playfair_Display] text-[#111110] leading-tight mb-2">
              Welcome back.
            </h1>
            <p className="anim-2 text-sm text-[#6b6b66] mb-10">
              Your crew is waiting for you.
            </p>

            <form onSubmit={handleLogin}>
              <div className="anim-3 mb-4">
                <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Email</label>
                <input type="email" placeholder="you@example.com" className="field-input"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="anim-4 mb-2">
                <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="field-input pr-12"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3a39e] hover:text-[#111110] transition text-sm">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="anim-4 flex justify-end mb-8">
                <a href="#" className="text-xs text-[#6b6b66] hover:text-[#111110] transition">Forgot password?</a>
              </div>

              <button type="submit" disabled={isLoading}
                className="anim-5 w-full bg-[#111110] text-white text-sm font-medium py-3.5 hover:bg-[#2d2d2b] active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="anim-6 flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#efefed]" />
              <span className="text-xs text-[#a3a39e]">or</span>
              <div className="flex-1 h-px bg-[#efefed]" />
            </div>

            {/* Google Sign-In */}
            <button onClick={handleGoogleLogin} disabled={googleLoading}
              className="anim-6 w-full flex items-center justify-center gap-3 border border-[#e0e0dd] bg-white hover:bg-[#fafaf9] text-[#111110] text-sm font-medium py-3 rounded transition-all disabled:opacity-60 mb-4">
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
              )}
              Continue with Google
            </button>

            <p className="anim-6 text-sm text-center text-[#6b6b66]">
              New to CREWUPFILMS?{' '}
              <Link href="/signup" className="text-[#111110] font-semibold hover:underline">Create a free account</Link>
            </p>
          </div>
        </div>

        {/* ── Right — Brand panel ── */}
        <div className="hidden md:flex w-[52%] relative bg-[#111110] overflow-hidden flex-col justify-between p-14">

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />

          {/* Top label */}
          <p className="relative text-xs uppercase tracking-widest text-[#444442] font-medium">
            The creative collaboration platform
          </p>

          {/* Center content */}
          <div className="relative">
            <h2 className="text-5xl font-[Playfair_Display] text-white leading-snug mb-6">
              Every great project<br />
              <span className="italic text-[#6b6b66]">starts with the</span><br />
              right team.
            </h2>
            <p className="text-sm text-[#6b6b66] leading-relaxed max-w-xs mb-12">
              CREWUPFILMS is where independent creators — directors, editors, musicians, photographers and more — come together to build something real.
            </p>

            {/* Value props */}
            <div className="flex flex-col gap-5">
              {[
                { icon: '🎬', title: 'Post your project', body: 'Describe your vision and the exact roles you need filled.' },
                { icon: '🔍', title: 'Discover creators', body: 'Browse profiles by role, skill, and location.' },
                { icon: '🤝', title: 'Collaborate in real time', body: 'Messaging, schedules, and team tools — all in one place.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-lg mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                    <p className="text-xs text-[#6b6b66] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom line */}
          <p className="relative text-xs text-[#333331]">
            Free to join. Free to create. Always.
          </p>
        </div>

      </div>
    </>
  );
}
