'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const IS_CONFIGURED = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id-here';

const roleOptions = [
  { label: 'Director',        value: 'director' },
  { label: 'Cinematographer', value: 'cinematographer' },
  { label: 'Actor',           value: 'actor' },
  { label: 'Editor',          value: 'editor' },
  { label: 'Musician',        value: 'musician' },
  { label: 'Photographer',    value: 'photographer' },
  { label: 'Writer',          value: 'writer' },
  { label: 'Producer',        value: 'producer' },
  { label: 'Designer',        value: 'designer' },
  { label: 'Content Creator', value: 'content-creator' },
  { label: 'Other',           value: 'other' },
];

const TOTAL_STEPS = 8;

const stepPanels = [
  {
    bg: '#111110', dark: true,
    label: 'Welcome to CREWUPFILMS',
    heading: 'Where your creative journey begins.',
    body: "CREWUPFILMS is built for independent creators — directors, editors, musicians, photographers, and everyone in between. Your profile is your identity here.",
    safety: {
      title: '🔒 Check Profiles & Reviews',
      points: [
        'Before collaborating, review their profile, portfolio, and past reviews.',
        'New creators may have limited history — established creators should have positive feedback.',
        'A verified profile with past work is a strong signal of legitimacy.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'Your craft on CREWUPFILMS',
    heading: 'Every great project needs every kind of creator.',
    body: "From short films and music videos to brand shoots and podcasts — CREWUPFILMS is home to creators across every discipline. Your role helps project owners find exactly who they're looking for.",
    safety: {
      title: '🔒 Trust Your Instincts',
      points: [
        "If something feels off about a creator or project, don't proceed.",
        'Check their reviews and past projects — a legitimate collaborator will have a track record.',
        'Report suspicious profiles using the Report button on their page.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'A global creative community',
    heading: 'Creativity has no borders — but location matters.',
    body: 'Many projects are local — on-site shoots, studio sessions, live events. Sharing your city helps creators nearby find you. You can also collaborate remotely worldwide.',
    safety: {
      title: '🔒 Meet Safely in Person',
      points: [
        'For first in-person meetings, choose public locations like coffee shops or studios.',
        "Let someone you trust know where you'll be meeting.",
        'Video calls are a great way to connect before meeting in person.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'Get discovered',
    heading: 'Your skills are your story.',
    body: 'Skills are how project owners search for collaborators. The more specific and honest you are, the better your matches. Think beyond job titles — tools, techniques, and genres.',
    safety: {
      title: '🔒 Keep Contact Info Private Early On',
      points: [
        "Use CREWUPFILMS's messaging system for all initial conversations.",
        "Only exchange phone numbers or social handles once you've built trust.",
        'Never share personal contact info before confirming the collaboration.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'Your profile',
    heading: 'Set up your public identity.',
    body: "Your username is how the community knows you. Your date of birth confirms you meet our age requirements — it's never shown publicly.",
    safety: {
      title: '🔒 Protect Your Identity',
      points: [
        'Your username is permanent — choose something you\'re happy with.',
        'Date of birth is private and only used for age verification.',
        'Optional gender info helps us personalise your experience.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'Secure your account',
    heading: 'Your email is your key.',
    body: "Use an email you check regularly — we'll send your verification code there. Choose a strong password you don't use anywhere else.",
    safety: {
      title: '🔒 Protect Your Account',
      points: [
        'Use a strong, unique password — never reuse passwords across platforms.',
        'Your email is private and never shared with other users or third parties.',
        'We will never ask for your password via email, chat, or any message.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'Almost done',
    heading: 'Check your inbox.',
    body: "We sent a 6-digit code to your email. Enter it below to activate your account. The code is valid for 10 minutes.",
    safety: {
      title: '🔒 Keep Your Code Safe',
      points: [
        'CREWUPFILMS will never ask for this code via chat, email, or phone.',
        'If someone asks for your verification code, it\'s a scam — report it.',
        'Didn\'t get the code? Check your spam folder or request a new one.',
      ],
    },
  },
  {
    bg: '#111110', dark: true,
    label: 'One last step',
    heading: 'Verify your phone number.',
    body: 'A verified phone number keeps the platform safe for everyone. It\'s required to post or join projects — you can always add it later from your settings.',
    safety: {
      title: '🔒 Your Number Is Private',
      points: [
        'Your phone number is never shown publicly to other creators.',
        'We only use it for account security and identity verification.',
        'CREWUPFILMS will never call you or share your number with third parties.',
      ],
    },
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { register, loginWithToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', roles: [],
    location: { city: '', district: '', state: '', country: '' },
    skills: [], username: '', email: '', password: '',
    dateOfBirth: '', gender: '',
  });
  const [skillInput, setSkillInput]     = useState('');
  const [otherRoleText, setOtherRoleText] = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP state (step 7 — email)
  const [otpCode, setOtpCode]         = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Phone state (step 8)
  const [phoneNumber, setPhoneNumber]       = useState('');
  const [phoneOtpSent, setPhoneOtpSent]     = useState(false);
  const [phoneOtp, setPhoneOtp]             = useState(['', '', '', '', '', '']);
  const [phoneSending, setPhoneSending]     = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const phoneOtpRefs = useRef([]);

  // Google OAuth
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googleStep, setGoogleStep]       = useState(false);
  const googleBtnRef = useRef(null);

  // Shared Google callback
  const handleGoogleCallback = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const { data } = await authAPI.googleAuth({ idToken: response.credential });
      if (data.success && data.token) {
        loginWithToken(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}! 🎬`);
        router.push('/dashboard');
      } else if (data.needsUsername) {
        setGoogleIdToken(response.credential);
        if (data.name) setFormData((prev) => ({ ...prev, name: data.name, email: data.email || '' }));
        setGoogleStep(true);
        setCurrentStep(2);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Google sign-up failed.');
    } finally { setGoogleLoading(false); }
  }, [router, loginWithToken]);

  // Load GIS script and render Google's button into hidden container
  useEffect(() => {
    if (!IS_CONFIGURED) return;
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard', size: 'large', theme: 'outline',
          width: String(googleBtnRef.current.offsetWidth || 360),
        });
      }
    };
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
      return () => { try { document.head.removeChild(script); } catch {} };
    }
  }, [handleGoogleCallback]);

  // Email OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // Phone OTP countdown timer
  useEffect(() => {
    if (phoneCountdown <= 0) return;
    const t = setTimeout(() => setPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneCountdown]);

  /* ── Google handlers ── */
  const handleGoogleSignup = () => {
    if (!IS_CONFIGURED) { toast.error('Google sign-in is not configured yet. Contact support.'); }
  };

  const handleGoogleFinish = async () => {
    const err = validateUsername(formData.username);
    if (err) { toast.error(err); return; }
    setIsLoading(true);
    try {
      const resolvedRoles = [
        ...formData.roles,
        ...(otherRoleText.trim() ? [otherRoleText.trim().toLowerCase()] : []),
      ];
      if (!resolvedRoles.length) resolvedRoles.push('other');
      const { data } = await authAPI.googleAuth({
        idToken: googleIdToken, username: formData.username,
        role: resolvedRoles[0], roles: resolvedRoles,
        location: formData.location, skills: formData.skills,
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || '',
      });
      if (data.success && data.token) {
        loginWithToken(data.token, data.user);
        toast.success(`Account created! Welcome, ${data.user.name} 🎬`);
        // Go to phone verification step instead of dashboard
        setPhoneCountdown(0);
        setCurrentStep(8);
      } else {
        toast.error(data.message || 'Failed to create account.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create account.');
    } finally { setIsLoading(false); }
  };

  const validateUsername = (val) => {
    if (!val) return 'Username is required';
    if (val.length < 3) return 'At least 3 characters';
    if (val.length > 30) return 'Max 30 characters';
    if (!/^[a-z0-9_]+$/.test(val)) return 'Only lowercase letters, numbers, and underscores';
    return '';
  };

  const panel = stepPanels[currentStep - 1];

  /* ── Step validation & advance ── */
  const handleContinue = () => {
    if (currentStep === 1 && !formData.name.trim()) { toast.error('Please enter your name'); return; }
    if (currentStep === 1 && !formData.username) {
      const suggested = formData.name.toLowerCase().trim()
        .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'creator';
      setFormData((prev) => ({ ...prev, username: suggested }));
    }
    if (currentStep === 2 && formData.roles.length === 0 && !otherRoleText.trim()) { toast.error('Please select at least one role'); return; }
    if (currentStep === 3 && (!formData.location.district.trim() || !formData.location.country.trim())) {
      toast.error('Please enter district and country');  return;
    }
    if (currentStep === 5) {
      const uErr = validateUsername(formData.username);
      if (uErr) { toast.error(uErr); return; }
      if (!formData.dateOfBirth) { toast.error('Date of birth is required'); return; }
    }
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (formData.skills.length < 10) {
        setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
        setSkillInput('');
      }
    }
  };

  /* ── Step 6: Create account + send OTP ── */
  const handleCreateAccount = async () => {
    if (!formData.email.trim()) { toast.error('Please enter your email'); return; }
    if (!formData.password.trim()) { toast.error('Please enter a password'); return; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!agreedToTerms) { toast.error('Please accept the Terms of Service, Privacy Policy, and Disclaimer to continue.'); return; }

    setIsLoading(true);
    try {
      const resolvedRoles = [
        ...formData.roles,
        ...(otherRoleText.trim() ? [otherRoleText.trim().toLowerCase()] : []),
      ];
      if (!resolvedRoles.length) resolvedRoles.push('other');
      await register({
        name: formData.name, username: formData.username,
        email: formData.email, password: formData.password,
        role: resolvedRoles[0], roles: resolvedRoles,
        location: formData.location, skills: formData.skills,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || '',
      });
      toast.success('Account created! Check your email for the verification code 📧');
      setOtpCountdown(60);
      setCurrentStep(7);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 7: OTP input handlers ── */
  const handleOtpInput = (idx, val) => {
    const digits = val.replace(/\D/g, '');
    // Handle autofill / paste of full 6-digit code into one box
    if (digits.length >= 6) {
      const filled = digits.slice(0, 6).split('');
      setOtpCode(filled);
      otpRefs.current[5]?.focus();
      return;
    }
    const digit = digits.slice(-1);
    const next = [...otpCode];
    next[idx] = digit;
    setOtpCode(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
      const next = [...otpCode];
      next[idx - 1] = '';
      setOtpCode(next);
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const filled = pasted.padEnd(6, '').split('').slice(0, 6);
      setOtpCode(filled);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) { toast.error('Please enter the 6-digit code'); return; }
    setOtpVerifying(true);
    try {
      const { data } = await authAPI.verifyEmail(fullCode);
      if (data.success) {
        if (loginWithToken && data.token) loginWithToken(data.token, data.user);
        toast.success('Email verified! Now verify your phone number 📱');
        setCurrentStep(8);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code. Try again.');
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setOtpVerifying(false); }
  };

  /* ── Step 8: Phone OTP handlers ── */
  const handleSendPhoneOtp = async () => {
    if (!phoneNumber.trim()) { toast.error('Please enter your phone number'); return; }
    setPhoneSending(true);
    try {
      await authAPI.sendPhoneOTP(phoneNumber.trim());
      setPhoneOtpSent(true);
      setPhoneCountdown(60);
      toast.success(`Code sent to ${phoneNumber}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send code. Check the number and try again.');
    } finally { setPhoneSending(false); }
  };

  const handlePhoneOtpInput = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...phoneOtp];
    next[idx] = digit;
    setPhoneOtp(next);
    if (digit && idx < 5) phoneOtpRefs.current[idx + 1]?.focus();
  };

  const handlePhoneOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !phoneOtp[idx] && idx > 0) {
      phoneOtpRefs.current[idx - 1]?.focus();
    }
  };

  const handlePhoneOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setPhoneOtp(pasted.split(''));
      phoneOtpRefs.current[5]?.focus();
    }
  };

  const handleVerifyPhone = async () => {
    const fullCode = phoneOtp.join('');
    if (fullCode.length < 6) { toast.error('Please enter the 6-digit code'); return; }
    setPhoneOtpVerifying(true);
    try {
      const { data } = await authAPI.verifyPhone(fullCode);
      if (data.success) {
        if (loginWithToken && data.token) loginWithToken(data.token, data.user);
        toast.success('Phone verified! Your account is fully set up 🎬');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code. Try again.');
      setPhoneOtp(['', '', '', '', '', '']);
      phoneOtpRefs.current[0]?.focus();
    } finally { setPhoneOtpVerifying(false); }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpResending(true);
    try {
      await authAPI.sendEmailOTP();
      toast.success('New code sent to your email');
      setOtpCountdown(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend. Please try again.');
    } finally { setOtpResending(false); }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelSlide {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .form-anim { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .panel-anim { animation: panelSlide 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .field-input {
          width: 100%; background: white; border: 1px solid #e0e0dd;
          color: #111110; font-size: 14px; padding: 14px 16px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .field-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(17,17,16,0.06); }
        .field-input::placeholder { color: #a3a39e; }
        .otp-box {
          width: 46px; height: 54px; text-align: center; font-size: 22px;
          font-weight: 700; border: 2px solid #e0e0dd; background: white;
          color: #111110; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          font-family: monospace;
        }
        .otp-box:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(17,17,16,0.08); }
        .otp-box.filled { border-color: #111110; background: #f5f5f3; }
      `}</style>

      <div className="flex h-screen bg-white overflow-hidden">

        {/* ── Left — Form ── */}
        <div className="w-full md:w-[48%] flex flex-col relative overflow-y-auto">

          {/* Progress bar */}
          <div className="sticky top-0 z-10 h-1 bg-[#efefed] flex-shrink-0">
            <div className="h-full bg-[#111110] transition-all duration-500"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
          </div>

          {/* Logo */}
          <div className="px-8 md:px-14 pt-8 flex-shrink-0">
            <Logo size="sm" />
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-14 py-10">
            <div className="w-full max-w-sm" key={currentStep}>

              <p className="form-anim text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4"
                style={{ animationDelay: '0s' }}>
                Step {currentStep} of {TOTAL_STEPS}
              </p>

              <h1 className="form-anim text-3xl md:text-4xl font-[Playfair_Display] text-[#111110] mb-8 leading-tight"
                style={{ animationDelay: '0.08s' }}>
                {[
                  "What's your name?",
                  'What best describes you?',
                  'Where are you based?',
                  'What are your main skills?',
                  'Set up your profile',
                  'Secure your account',
                  'Verify your email',
                  'Add your phone number',
                ][currentStep - 1]}
              </h1>

              {/* ── Step 1 — Name ── */}
              {currentStep === 1 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Full name</label>
                  <input type="text" placeholder="e.g. Priya Sharma" className="field-input mb-8"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
              )}

              {/* ── Step 2 — Roles (multi-select) ── */}
              {currentStep === 2 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <p className="text-xs text-[#6b6b66] mb-3">Select all that apply — you can pick more than one.</p>
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {roleOptions.filter(r => r.value !== 'other').map((role) => {
                      const selected = formData.roles.includes(role.value);
                      return (
                        <button key={role.label} type="button"
                          onClick={() => {
                            const next = selected
                              ? formData.roles.filter(r => r !== role.value)
                              : [...formData.roles, role.value];
                            setFormData({ ...formData, roles: next });
                          }}
                          className={`py-3 px-4 text-sm font-medium transition-colors text-left flex items-center gap-2 ${
                            selected
                              ? 'bg-[#111110] text-white'
                              : 'border border-[#e0e0dd] text-[#111110] hover:border-[#111110]'
                          }`}>
                          {selected && <span className="text-xs">✓</span>}
                          {role.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Other role (optional)</label>
                    <input type="text" placeholder="e.g. Lighting Technician, Stunt Coordinator…"
                      className="field-input" value={otherRoleText}
                      onChange={(e) => setOtherRoleText(e.target.value)} maxLength={50} />
                  </div>
                </div>
              )}

              {/* ── Step 3 — Location ── */}
              {currentStep === 3 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">District</label>
                  <input type="text" placeholder="e.g. Hyderabad, Rangareddy, Karimnagar" className="field-input mb-4"
                    value={formData.location.district}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, district: e.target.value, city: e.target.value } })} />
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">State</label>
                  <input type="text" placeholder="e.g. Telangana, Andhra Pradesh" className="field-input mb-4"
                    value={formData.location.state}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} />
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Country</label>
                  <input type="text" placeholder="e.g. India" className="field-input mb-8"
                    value={formData.location.country}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })} />
                </div>
              )}

              {/* ── Step 4 — Skills ── */}
              {currentStep === 4 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Add a skill</label>
                  <input type="text" placeholder="Type a skill and press Enter"
                    className="field-input mb-4" value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill} />
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                    {formData.skills.map((skill, idx) => (
                      <div key={idx} className="bg-[#111110] text-white text-xs px-3 py-1.5 flex items-center gap-2">
                        {skill}
                        <button onClick={() => setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== idx) })}
                          className="text-white/60 hover:text-white transition">×</button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#a3a39e] mb-8">{formData.skills.length}/10 skills added</p>
                </div>
              )}

              {/* ── Step 5 — Username + DOB + Gender ── */}
              {currentStep === 5 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Username</label>
                  <div className="relative mb-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3a39e] text-sm pointer-events-none">@</span>
                    <input type="text" placeholder="your_username" className="field-input pl-8"
                      value={formData.username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setFormData({ ...formData, username: val });
                        setUsernameError(validateUsername(val));
                      }}
                      maxLength={30} />
                  </div>
                  {usernameError
                    ? <p className="text-xs text-red-400 mb-4">{usernameError}</p>
                    : formData.username
                      ? <p className="text-xs text-green-600 mb-4">Looks good!</p>
                      : <p className="text-xs text-[#a3a39e] mb-4">Letters, numbers, and underscores only.</p>
                  }

                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">
                    Date of Birth <span className="text-red-500 normal-case">· required</span>
                  </label>
                  <input type="date" className="field-input mb-1"
                    value={formData.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                  <p className="text-xs text-[#a3a39e] mb-4">Used to confirm your age. Never shown publicly.</p>

                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Gender</label>
                  <select className="field-input mb-1" value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <p className="text-xs text-[#a3a39e] mb-8">Optional. Never shown publicly.</p>
                </div>
              )}

              {/* ── Step 6 — Email + Password ── */}
              {currentStep === 6 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Email address</label>
                  <input type="email" placeholder="you@example.com" className="field-input mb-4"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Password</label>
                  <input type="password" placeholder="Min. 8 characters" className="field-input mb-2"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <p className="text-xs text-[#a3a39e] mb-6">At least 8 characters. Never shared with anyone.</p>

                  {/* ── T&C Acceptance ── */}
                  <label
                    className={`flex items-start gap-3 cursor-pointer p-4 border-2 transition-all select-none ${
                      agreedToTerms
                        ? 'border-[#111110] bg-[#f5f5f3]'
                        : 'border-[#e0e0dd] hover:border-[#a3a39e]'
                    }`}
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                        agreedToTerms ? 'bg-[#111110] border-[#111110]' : 'border-[#d0d0cc] bg-white'
                      }`}>
                        {agreedToTerms && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#6b6b66] leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="/legal/terms" target="_blank" rel="noopener noreferrer"
                        className="text-[#111110] font-semibold underline hover:no-underline"
                        onClick={(e) => e.stopPropagation()}>
                        Terms of Service
                      </a>
                      ,{' '}
                      <a href="/legal/privacy" target="_blank" rel="noopener noreferrer"
                        className="text-[#111110] font-semibold underline hover:no-underline"
                        onClick={(e) => e.stopPropagation()}>
                        Privacy Policy
                      </a>
                      , and{' '}
                      <a href="/legal/disclaimer" target="_blank" rel="noopener noreferrer"
                        className="text-[#111110] font-semibold underline hover:no-underline"
                        onClick={(e) => e.stopPropagation()}>
                        Disclaimer
                      </a>
                      . I understand that CREWUPFILMS does not vet users or guarantee collaboration outcomes.
                    </span>
                  </label>
                  <div className="mb-6" />
                </div>
              )}

              {/* ── Step 7 — Email OTP ── */}
              {currentStep === 7 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <p className="text-sm text-[#6b6b66] mb-6 leading-relaxed">
                    We sent a 6-digit code to{' '}
                    <strong className="text-[#111110]">{formData.email}</strong>.
                    Enter it below to activate your account.
                  </p>

                  {/* OTP inputs */}
                  <div className="flex gap-2 justify-between mb-6" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text" inputMode="numeric" maxLength={1}
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleOtpInput(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`otp-box ${digit ? 'filled' : ''}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  {/* Verify button */}
                  <button
                    onClick={handleVerifyEmail}
                    disabled={otpVerifying || otpCode.join('').length < 6}
                    className="w-full bg-[#111110] text-white text-sm font-medium py-3.5 hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-4">
                    {otpVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying…
                      </span>
                    ) : 'Verify Email →'}
                  </button>

                  {/* Resend */}
                  <p className="text-center text-sm text-[#6b6b66] mb-6">
                    Didn't receive it?{' '}
                    <button onClick={handleResendOtp} disabled={otpResending || otpCountdown > 0}
                      className="text-[#111110] font-semibold hover:underline disabled:opacity-50 disabled:no-underline">
                      {otpResending ? 'Sending…' : otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend code'}
                    </button>
                  </p>

                  {/* Skip */}
                  <p className="text-center text-xs text-[#a3a39e]">
                    <Link href="/dashboard" className="hover:text-[#6b6b66] transition-colors">
                      Skip — you won't be able to post or join projects
                    </Link>
                  </p>
                </div>
              )}

              {/* ── Step 8 — Phone Verification ── */}
              {currentStep === 8 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  {!phoneOtpSent ? (
                    <>
                      <p className="text-sm text-[#6b6b66] mb-6 leading-relaxed">
                        Add your phone number to post and join projects. You can skip this for now and add it later from your settings.
                      </p>
                      <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">
                        Phone Number (with country code)
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="field-input mb-2"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendPhoneOtp()}
                        autoFocus
                      />
                      <p className="text-xs text-[#a3a39e] mb-6">Include your country code, e.g. +91 for India.</p>

                      <button
                        onClick={handleSendPhoneOtp}
                        disabled={phoneSending || !phoneNumber.trim()}
                        className="w-full bg-[#111110] text-white text-sm font-medium py-3.5 hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-4">
                        {phoneSending ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending code…
                          </span>
                        ) : 'Send Verification Code →'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#6b6b66] mb-1 leading-relaxed">
                        We sent a 6-digit code to{' '}
                        <strong className="text-[#111110]">{phoneNumber}</strong>.{' '}
                        <button
                          onClick={() => { setPhoneOtpSent(false); setPhoneOtp(['','','','','','']); }}
                          className="text-[#6b6b66] underline hover:text-[#111110] transition text-xs">
                          Change number
                        </button>
                      </p>

                      {/* Phone OTP inputs */}
                      <div className="flex gap-2 justify-between mb-6 mt-6" onPaste={handlePhoneOtpPaste}>
                        {phoneOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (phoneOtpRefs.current[idx] = el)}
                            type="text" inputMode="numeric" maxLength={1}
                            autoComplete="one-time-code"
                            value={digit}
                            onChange={(e) => handlePhoneOtpInput(idx, e.target.value)}
                            onKeyDown={(e) => handlePhoneOtpKeyDown(idx, e)}
                            className={`otp-box ${digit ? 'filled' : ''}`}
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      {/* Verify button */}
                      <button
                        onClick={handleVerifyPhone}
                        disabled={phoneOtpVerifying || phoneOtp.join('').length < 6}
                        className="w-full bg-[#111110] text-white text-sm font-medium py-3.5 hover:bg-[#2d2d2b] transition disabled:opacity-50 mb-4">
                        {phoneOtpVerifying ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying…
                          </span>
                        ) : 'Verify Phone →'}
                      </button>

                      {/* Resend */}
                      <p className="text-center text-sm text-[#6b6b66] mb-6">
                        Didn't receive it?{' '}
                        <button onClick={handleSendPhoneOtp} disabled={phoneSending || phoneCountdown > 0}
                          className="text-[#111110] font-semibold hover:underline disabled:opacity-50 disabled:no-underline">
                          {phoneSending ? 'Sending…' : phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : 'Resend code'}
                        </button>
                      </p>
                    </>
                  )}

                  {/* Skip */}
                  <p className="text-center text-xs text-[#a3a39e]">
                    <Link href="/dashboard" className="hover:text-[#6b6b66] transition-colors">
                      Skip — you won't be able to post or join projects
                    </Link>
                  </p>
                </div>
              )}

              {/* ── Buttons ── */}
              {currentStep < 7 && (
                <div className="form-anim flex gap-3" style={{ animationDelay: '0.24s' }}>
                  {currentStep > 1 && (
                    <button onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1 border border-[#e0e0dd] text-[#6b6b66] text-sm font-medium py-3 hover:border-[#111110] hover:text-[#111110] transition">
                      ← Back
                    </button>
                  )}
                  {currentStep < 6 ? (
                    <button onClick={handleContinue}
                      className="flex-1 bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition">
                      Continue →
                    </button>
                  ) : (
                    /* Step 6 — create account */
                    <button onClick={googleStep ? handleGoogleFinish : handleCreateAccount} disabled={isLoading || !agreedToTerms}
                      className="flex-1 bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition disabled:opacity-60">
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating…
                        </span>
                      ) : 'Create Account →'}
                    </button>
                  )}
                </div>
              )}

              {/* Sign in link — shown on step 6 */}
              {currentStep === 6 && (
                <p className="text-xs text-center mt-5 text-[#6b6b66]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#111110] font-semibold hover:underline">Sign in</Link>
                </p>
              )}

              {/* Google sign-up — step 1 only */}
              {currentStep === 1 && !googleStep && (
                <div className="mt-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-[#efefed]" />
                    <span className="text-xs text-[#a3a39e]">or</span>
                    <div className="flex-1 h-px bg-[#efefed]" />
                  </div>
                  <div className="relative">
                    {/* Our visible styled button — pointer-events:none so clicks reach Google iframe */}
                    <div
                      style={{ pointerEvents: IS_CONFIGURED ? 'none' : 'auto', opacity: googleLoading ? 0.6 : 1 }}
                      onClick={handleGoogleSignup}
                      className="w-full flex items-center justify-center gap-3 border border-[#e0e0dd] bg-white text-[#111110] text-sm font-medium py-3 rounded transition-all cursor-pointer select-none">
                      {googleLoading ? (
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        </svg>
                      )}
                      Sign up with Google
                    </div>
                    {/* Google's iframe sits on top — transparent but receives all clicks */}
                    <div
                      ref={googleBtnRef}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.01, overflow: 'hidden',
                        pointerEvents: googleLoading ? 'none' : 'auto',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Google finish hint */}
              {googleStep && currentStep === 5 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                  <p className="font-semibold text-blue-800 mb-1">🎉 Google account connected!</p>
                  <p className="text-blue-600 text-xs">Choose a username above then click <strong>Continue</strong>.</p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Right — Step panel ── */}
        <div
          key={`panel-${currentStep}`}
          className="hidden md:flex w-[52%] flex-col justify-between p-14 relative overflow-hidden panel-anim"
          style={{ backgroundColor: panel.bg }}
        >
          {panel.dark && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />
          )}

          <p className={`relative text-xs uppercase tracking-widest font-medium ${panel.dark ? 'text-[#444442]' : 'text-[#a3a39e]'}`}>
            {panel.label}
          </p>

          <div className="relative">
            <h2 className={`text-3xl md:text-4xl font-[Playfair_Display] leading-snug mb-5 ${panel.dark ? 'text-white' : 'text-[#111110]'}`}>
              {panel.heading}
            </h2>
            <p className="text-sm leading-relaxed mb-10 max-w-xs text-[#6b6b66]">
              {panel.body}
            </p>
            <div className={`p-5 ${panel.dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-[#efefed]'}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${panel.dark ? 'text-[#6b6b66]' : 'text-[#111110]'}`}>
                {panel.safety.title}
              </p>
              <ul className="flex flex-col gap-3.5">
                {panel.safety.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${panel.dark ? 'bg-[#444442]' : 'bg-[#d0d0cc]'}`} />
                    <span className="text-sm leading-relaxed text-[#6b6b66]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step dots */}
          <div className="relative flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === currentStep
                    ? `w-6 ${panel.dark ? 'bg-white' : 'bg-[#111110]'}`
                    : `w-1.5 ${panel.dark ? 'bg-white/20' : 'bg-[#d0d0cc]'}`
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
