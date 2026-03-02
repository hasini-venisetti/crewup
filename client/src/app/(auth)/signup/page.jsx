'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';

const roleOptions = [
  { label: 'Director',        value: 'filmmaker' },
  { label: 'Cinematographer', value: 'filmmaker' },
  { label: 'Actor',           value: 'actor' },
  { label: 'Editor',          value: 'editor' },
  { label: 'Musician',        value: 'musician' },
  { label: 'Photographer',    value: 'photographer' },
  { label: 'Writer',          value: 'writer' },
  { label: 'Producer',        value: 'filmmaker' },
  { label: 'Designer',        value: 'designer' },
  { label: 'Content Creator', value: 'content-creator' },
  { label: 'Other',           value: 'other' },
];

const stepPanels = [
  {
    bg: '#111110',
    dark: true,
    label: 'Welcome to CREWUPFILMS',
    heading: 'Where your creative journey begins.',
    body: "CREWUPFILMS is a platform built for independent creators — directors, editors, musicians, photographers, and everyone in between. Your profile is your identity here. It's how other creators discover you and decide to collaborate.",
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
    bg: '#111110',
    dark: true,
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
    bg: '#111110',
    dark: true,
    label: 'A global creative community',
    heading: 'Creativity has no borders — but location matters.',
    body: 'Many projects are local — on-site shoots, studio sessions, live events. Sharing your city helps creators nearby find you. You can also collaborate remotely with creators worldwide.',
    safety: {
      title: '🔒 Meet Safely in Person',
      points: [
        'For first in-person meetings, choose public locations like coffee shops or studios.',
        "Let someone you trust know where you'll be meeting.",
        'Video calls are a great way to connect and verify before meeting in person.',
      ],
    },
  },
  {
    bg: '#111110',
    dark: true,
    label: 'Get discovered',
    heading: 'Your skills are your story.',
    body: 'Skills are how project owners search for collaborators. The more specific and honest you are, the better your matches. Think beyond job titles — tools, techniques, and genres you actually work in.',
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
    bg: '#111110',
    dark: true,
    label: 'Almost there',
    heading: 'Your account is the key to your crew.',
    body: "Once you're in, you can apply to projects, message creators, build your portfolio, and start collaborating. CREWUPFILMS is free — no hidden fees, no paywalls for core features.",
    safety: {
      title: '🔒 Protect Your Account',
      points: [
        'Use a strong, unique password — never reuse passwords across platforms.',
        'Your email is private and never shared with other users or third parties.',
        'We will never ask for your password via email, chat, or any message.',
      ],
    },
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', role: '',
    location: { city: '', country: '' },
    skills: [], username: '', email: '', password: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = (val) => {
    if (!val) return 'Username is required';
    if (val.length < 3) return 'At least 3 characters';
    if (val.length > 30) return 'Max 30 characters';
    if (!/^[a-z0-9_]+$/.test(val)) return 'Only lowercase letters, numbers, and underscores';
    return '';
  };

  const panel = stepPanels[currentStep - 1];

  const handleContinue = () => {
    if (currentStep === 1 && !formData.name.trim()) { toast.error('Please enter your name'); return; }
    // Auto-suggest username from name when leaving step 1, if not already set
    if (currentStep === 1 && !formData.username) {
      const suggested = formData.name.toLowerCase().trim()
        .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'creator';
      setFormData((prev) => ({ ...prev, username: suggested }));
    }
    if (currentStep === 2 && !formData.role) { toast.error('Please select a role'); return; }
    if (currentStep === 3 && (!formData.location.city.trim() || !formData.location.country.trim())) {
      toast.error('Please enter city and country'); return;
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1);
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

  const handleCreateAccount = async () => {
    if (!formData.username.trim()) { toast.error('Please choose a username'); return; }
    const uErr = validateUsername(formData.username);
    if (uErr) { toast.error(uErr); return; }
    if (!formData.email.trim() || !formData.password.trim()) { toast.error('Please enter email and password'); return; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setIsLoading(true);
    try {
      await register({
        name: formData.name, username: formData.username,
        email: formData.email, password: formData.password,
        role: formData.role || 'other',
        location: formData.location, skills: formData.skills,
      });
      toast.success("Account created! Let's build your profile 🎬");
      router.push('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        .field-input-dark {
          width: 100%; background: #1a1a19; border: 1px solid #2d2d2b;
          color: white; font-size: 14px; padding: 14px 16px;
          outline: none; transition: border-color 0.2s; font-family: inherit;
        }
        .field-input-dark:focus { border-color: #6b6b66; }
        .field-input-dark::placeholder { color: #444442; }
      `}</style>

      <div className="flex h-screen bg-white overflow-hidden">

        {/* ── Left — Form ── */}
        <div className="w-full md:w-[48%] flex flex-col relative overflow-y-auto">

          {/* Progress bar */}
          <div className="sticky top-0 z-10 h-1 bg-[#efefed] flex-shrink-0">
            <div className="h-full bg-[#111110] transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }} />
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
                Step {currentStep} of 5
              </p>

              <h1 className="form-anim text-3xl md:text-4xl font-[Playfair_Display] text-[#111110] mb-8 leading-tight"
                style={{ animationDelay: '0.08s' }}>
                {["What's your name?", 'What best describes you?', 'Where are you based?', 'What are your main skills?', 'Create your account'][currentStep - 1]}
              </h1>

              {/* Step 1 — Name */}
              {currentStep === 1 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Full name</label>
                  <input type="text" placeholder="e.g. Priya Sharma" className="field-input mb-8"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
              )}

              {/* Step 2 — Role */}
              {currentStep === 2 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <div className="grid grid-cols-2 gap-2.5 mb-8">
                    {roleOptions.map((role) => (
                      <button key={role.label}
                        onClick={() => setFormData({ ...formData, role: role.value })}
                        className={`py-3 px-4 text-sm font-medium transition-colors text-left ${
                          formData.role === role.value
                            ? 'bg-[#111110] text-white'
                            : 'border border-[#e0e0dd] text-[#111110] hover:border-[#111110]'
                        }`}>
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Location */}
              {currentStep === 3 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">City</label>
                  <input type="text" placeholder="e.g. Mumbai" className="field-input mb-4"
                    value={formData.location.city}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} />
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Country</label>
                  <input type="text" placeholder="e.g. India" className="field-input mb-8"
                    value={formData.location.country}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })} />
                </div>
              )}

              {/* Step 4 — Skills */}
              {currentStep === 4 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Add a skill</label>
                  <input type="text" placeholder="Type a skill and press Enter"
                    className="field-input mb-4"
                    value={skillInput}
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

              {/* Step 5 — Account */}
              {currentStep === 5 && (
                <div className="form-anim" style={{ animationDelay: '0.16s' }}>
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Username</label>
                  <div className="relative mb-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3a39e] text-sm pointer-events-none">@</span>
                    <input
                      type="text"
                      placeholder="your_username"
                      className="field-input pl-8"
                      value={formData.username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setFormData({ ...formData, username: val });
                        setUsernameError(validateUsername(val));
                      }}
                      maxLength={30}
                    />
                  </div>
                  {usernameError
                    ? <p className="text-xs text-red-400 mb-4">{usernameError}</p>
                    : formData.username
                      ? <p className="text-xs text-green-600 mb-4">Looks good!</p>
                      : <p className="text-xs text-[#a3a39e] mb-4">Letters, numbers, and underscores only.</p>
                  }
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Email address</label>
                  <input type="email" placeholder="you@example.com" className="field-input mb-4"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <label className="block text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-2">Password</label>
                  <input type="password" placeholder="Min. 8 characters" className="field-input mb-2"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <p className="text-xs text-[#a3a39e] mb-8">At least 8 characters. Never shared with anyone.</p>
                </div>
              )}

              {/* Buttons */}
              <div className="form-anim flex gap-3" style={{ animationDelay: '0.24s' }}>
                {currentStep > 1 && (
                  <button onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 border border-[#e0e0dd] text-[#6b6b66] text-sm font-medium py-3 hover:border-[#111110] hover:text-[#111110] transition">
                    ← Back
                  </button>
                )}
                {currentStep < 5 ? (
                  <button onClick={handleContinue}
                    className="flex-1 bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition">
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleCreateAccount} disabled={isLoading}
                    className="flex-1 bg-[#111110] text-white text-sm font-medium py-3 hover:bg-[#2d2d2b] transition disabled:opacity-60">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : 'Create Account'}
                  </button>
                )}
              </div>

              {currentStep === 5 && (
                <p className="text-xs text-center mt-5 text-[#6b6b66]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#111110] font-semibold hover:underline">Sign in</Link>
                </p>
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
          {/* Dark step dot grid */}
          {panel.dark && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />
          )}

          {/* Top label */}
          <p className={`relative text-xs uppercase tracking-widest font-medium ${panel.dark ? 'text-[#444442]' : 'text-[#a3a39e]'}`}>
            {panel.label}
          </p>

          {/* Main content */}
          <div className="relative">
            <h2 className={`text-3xl md:text-4xl font-[Playfair_Display] leading-snug mb-5 ${panel.dark ? 'text-white' : 'text-[#111110]'}`}>
              {panel.heading}
            </h2>
            <p className="text-sm leading-relaxed mb-10 max-w-xs text-[#6b6b66]">
              {panel.body}
            </p>

            {/* Safety card */}
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

          {/* Step progress dots */}
          <div className="relative flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
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
