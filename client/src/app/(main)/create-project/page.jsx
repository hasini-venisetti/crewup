'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const ROLES = ['Director','Cinematographer','Editor','Musician','Actor','Photographer','Writer','Producer','Sound Designer','Colorist','VFX Artist','Animator','Scriptwriter','Production Designer','Costume Designer','Makeup Artist'];
const TYPES = [
  { value: 'short-film', label: 'Short Film' },{ value: 'feature-film', label: 'Feature Film' },
  { value: 'youtube', label: 'YouTube' },{ value: 'music-video', label: 'Music Video' },
  { value: 'podcast', label: 'Podcast' },{ value: 'web-series', label: 'Web Series' },
  { value: 'documentary', label: 'Documentary' },{ value: 'commercial', label: 'Commercial' },
  { value: 'photography', label: 'Photography' },{ value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' },
];

// Phase 2: Safety fields
const PRODUCTION_TYPES = [
  { value: 'student',    label: '🎓 Student',    desc: 'Student or academic production' },
  { value: 'indie',      label: '🎬 Indie',       desc: 'Independent / self-funded' },
  { value: 'commercial', label: '💼 Commercial',  desc: 'Brand, agency, or corporate' },
  { value: 'broadcast',  label: '📺 Broadcast',   desc: 'TV, streaming, or broadcast' },
  { value: 'other',      label: '📦 Other',       desc: 'Doesn\'t fit above categories' },
];
const AUDITION_FORMATS = [
  { value: 'not-applicable',   label: 'Not applicable (non-actor roles)' },
  { value: 'online',           label: '💻 Online / Video call' },
  { value: 'studio',           label: '🏢 At a registered studio' },
  { value: 'production-office', label: '🏛 At a production office' },
  { value: 'flexible',         label: '🔄 Flexible / TBD' },
];
const SHOOTING_LOCATION_TYPES = [
  { value: 'not-specified',   label: 'Not specified yet' },
  { value: 'studio',          label: '🏢 Studio' },
  { value: 'public-location', label: '🌆 Public location' },
  { value: 'remote',          label: '🌐 Fully remote' },
  { value: 'flexible',        label: '🔄 Mix / Flexible' },
];
const PROJECT_TAGS = [
  { value: 'learning-project',       label: '📚 Learning Project',    desc: 'Great for newcomers to practice' },
  { value: 'practice-collaboration', label: '🤝 Practice Collab',     desc: 'Low-stakes team building' },
  { value: 'portfolio-building',     label: '🎨 Portfolio Building',  desc: 'Build your reel together' },
  { value: 'mentorship-available',   label: '🎓 Mentorship Available', desc: 'Experienced lead will guide' },
  { value: 'paid-opportunity',       label: '💰 Paid Opportunity',    desc: 'Compensation offered' },
];
const LEVELS = [
  { value: 'any',          label: 'Open to All',   desc: 'All experience levels welcome' },
  { value: 'beginner',     label: 'Beginner Friendly', desc: 'Perfect for those starting out' },
  { value: 'intermediate', label: 'Intermediate',  desc: 'Some experience required' },
  { value: 'advanced',     label: 'Advanced',      desc: 'Seasoned professionals preferred' },
];

const COMPENSATION_TYPES = [
  { value: 'paid',          label: '💰 Paid',          desc: 'Fixed rate or day rate' },
  { value: 'revenue-share', label: '📊 Revenue Share',  desc: 'Share of profits / backend deal' },
  { value: 'deferred',      label: '⏳ Deferred',       desc: 'Paid upon project sale or funding' },
  { value: 'unpaid',        label: '🤝 Unpaid / Collab', desc: 'Passion project, no payment' },
  { value: 'not-specified', label: '❓ Not Specified',  desc: 'TBD — discuss with applicants' },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roleInput, setRoleInput] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', projectType: '', requiredRoles: [],
    isPaid: false, compensationType: '', budget: '', compensationDetails: '',
    location: { city: '', country: '', isRemote: false },
    deadline: '', experienceLevel: 'any', projectTags: [],
    // Phase 2: Safety fields
    productionType: 'indie',
    auditionFormat: 'not-applicable',
    shootingLocationType: 'not-specified',
    // Role details
    roleDescriptions: {},  // { [roleName]: description string }
    rolePositions:    {},  // { [roleName]: number of spots }
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setLoc = (field, value) => setForm((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));

  const addRole = (role) => {
    if (role && !form.requiredRoles.includes(role)) {
      setForm((prev) => ({
        ...prev,
        requiredRoles: [...prev.requiredRoles, role],
        rolePositions: { ...prev.rolePositions, [role]: 1 },
      }));
    }
    setRoleInput('');
  };
  const removeRole = (role) => {
    const { [role]: _d, ...restDesc } = form.roleDescriptions;
    const { [role]: _p, ...restPos  } = form.rolePositions;
    setForm((prev) => ({
      ...prev,
      requiredRoles:    prev.requiredRoles.filter((r) => r !== role),
      roleDescriptions: restDesc,
      rolePositions:    restPos,
    }));
  };
  const setRoleDesc = (role, val) =>
    setForm((prev) => ({ ...prev, roleDescriptions: { ...prev.roleDescriptions, [role]: val } }));
  const setRolePos = (role, val) =>
    setForm((prev) => ({ ...prev, rolePositions: { ...prev.rolePositions, [role]: Number(val) || 1 } }));

  // Role-specific placeholder hints
  const ROLE_HINTS = {
    'Actor':               'e.g. Female, age 20–30, Tamil-speaking, comfortable with emotional scenes',
    'Actress':             'e.g. Age 18–25, Hindi-speaking, experience in drama preferred',
    'Cinematographer':     'e.g. Night shoot experience required, own DSLR/Mirrorless preferred',
    'Editor':              'e.g. Proficient in Premiere Pro or DaVinci Resolve, short film experience',
    'Musician':            'e.g. Background score / folk / classical, sample work required',
    'Composer':            'e.g. Genre: thriller/drama background score, DAW: Logic/FL Studio',
    'Writer':              'e.g. Short film format, Tamil & English, thriller genre experience',
    'Scriptwriter':        'e.g. Feature-length, Hindi, experience in comedy or drama',
    'Director':            'e.g. Prior short film credits, vision for realistic drama',
    'Producer':            'e.g. Budget management experience, prior film credits preferred',
    'Sound Designer':      'e.g. Location sound OR post-production mixing, own equipment a plus',
    'Colorist':            'e.g. DaVinci Resolve, experience in cinematic grading',
    'VFX Artist':          'e.g. After Effects / Blender, realistic or stylized FX, reel required',
    'Animator':            'e.g. 2D or 3D, software (Maya/Blender/Adobe), style reference needed',
    'Photographer':        'e.g. Behind-the-scenes stills, portrait/BTS experience, own camera',
    'Production Designer': 'e.g. Period drama experience, ability to work within tight budget',
    'Costume Designer':    'e.g. Contemporary wardrobe, knowledge of character-driven dressing',
    'Makeup Artist':       'e.g. Special effects makeup skills, bridal/fashion experience',
  };

  const toggleTag = (tag) => {
    if (form.projectTags.includes(tag)) {
      set('projectTags', form.projectTags.filter((t) => t !== tag));
    } else {
      set('projectTags', [...form.projectTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Project title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.projectType) return toast.error('Select a project type');
    if (form.requiredRoles.length === 0) return toast.error('Add at least one role');
    // Phase 2: Safety validations
    if (!form.compensationType) return toast.error('Please select a compensation type');
    if (form.compensationType === 'paid' && !form.compensationDetails.trim()) return toast.error('Please describe the compensation for paid projects');
    if (!form.location.isRemote && (!form.location.city.trim() || !form.location.country.trim())) return toast.error('Please enter the shooting city and country');
    setLoading(true);
    try {
      const payload = {
        ...form,
        isPaid: form.compensationType === 'paid',
        deadline: form.deadline || undefined,
        budget: form.compensationType === 'paid' ? form.budget : '',
        compensationDetails: ['paid', 'revenue-share', 'deferred'].includes(form.compensationType)
          ? form.compensationDetails
          : '',
      };
      const { data } = await projectAPI.create(payload);
      toast.success('Project submitted! It will be live after our team reviews it.');
      router.push(`/projects/${data.data._id}`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'VERIFICATION_REQUIRED') {
        toast.error('Complete your email, phone, and age verification before posting.', { duration: 6000, icon: '🔒' });
      } else {
        toast.error(err.response?.data?.message || 'Failed to create project');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // ── Verification gate ───────────────────────────────────────────────────
  const missingVerifications = [];
  if (!user.isEmailVerified)         missingVerifications.push({ key: 'email',   icon: '📧', label: 'Verify your email', desc: 'Check your inbox for a verification link', href: '/settings?tab=security' });
  if (!user.phone?.isVerified)       missingVerifications.push({ key: 'phone',   icon: '📱', label: 'Verify your phone number', desc: 'We need to confirm your phone for safety', href: '/settings?tab=security' });
  if (!user.hasDateOfBirth)          missingVerifications.push({ key: 'age',     icon: '🪪', label: 'Add your date of birth', desc: 'Required to confirm you meet our age requirements', href: '/settings?tab=profile' });

  if (missingVerifications.length > 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-[Playfair_Display] font-bold text-[#111110] mb-2">
              Verify your account first
            </h1>
            <p className="text-[#6b6b66] text-sm">
              To keep CrewUp safe for everyone, you must complete the following before posting a project.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {[
              { key: 'email', icon: '📧', label: 'Email verified', done: user.isEmailVerified, href: '/settings?tab=security', desc: 'Verify your email address' },
              { key: 'phone', icon: '📱', label: 'Phone verified', done: user.phone?.isVerified, href: '/settings?tab=security', desc: 'Add and verify a phone number' },
              { key: 'age',   icon: '🪪', label: 'Age confirmed',  done: user.hasDateOfBirth,   href: '/settings?tab=profile',  desc: 'Add your date of birth' },
            ].map((item) => (
              <div key={item.key} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 ${item.done ? 'bg-green-50 border-green-200' : 'bg-white border-[#e0e0dd]'}`}>
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${item.done ? 'text-green-700' : 'text-[#111110]'}`}>{item.label}</p>
                  {!item.done && <p className="text-xs text-[#6b6b66] mt-0.5">{item.desc}</p>}
                </div>
                {item.done ? (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                ) : (
                  <Link href={item.href} className="text-xs font-semibold text-white bg-[#6C63FF] hover:bg-[#7C75FF] px-3 py-1.5 rounded-lg transition-colors">
                    Fix →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#a3a39e]">
            These verifications protect actors and crew from scams and ensure accountability on our platform.
          </p>

          <div className="text-center mt-4">
            <Link href="/projects" className="text-sm text-[#6C63FF] hover:underline">
              ← Browse existing projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="relative z-10 max-w-4xl mx-auto px-4 w-full">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#6C63FF] text-white text-xs font-semibold px-3 py-1 rounded-full">
              New Project
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-[-0.04em]" style={{ fontFamily: 'Playfair Display' }}>
            Post a Project
          </h1>
        </div>
      </div>

      <div className="pt-12 pb-20 px-4 max-w-[700px] mx-auto">
        <Link href="/dashboard" className="text-sm text-[#6b6b66] hover:text-[#111110] mb-8 inline-block transition-colors">
          ← Back to Dashboard
        </Link>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Project Info ── */}
          <section className="bg-white rounded-2xl border border-[#efefed] p-7 shadow-sm flex flex-col gap-5">
            <h2 className="font-bold text-[#111110] text-base mb-1">Project Info</h2>

            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Project Title *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                placeholder="e.g. Indie Short Film - Urban Stories"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Description *</label>
              <textarea
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] min-h-[120px] resize-none"
                placeholder="Tell potential collaborators what this project is about, the vision, timeline, and what kind of commitment you're expecting..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                maxLength={2000}
                required
              />
              <p className="text-xs text-[#a3a39e] mt-1">{form.description.length}/2000</p>
            </div>

            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Project Type *</label>
              <select
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                value={form.projectType}
                onChange={(e) => set('projectType', e.target.value)}
                required
              >
                <option value="">Select type...</option>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Roles Needed ── */}
          <section className="bg-white rounded-2xl border border-[#efefed] p-7 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="font-bold text-[#111110] text-base mb-1">Roles Needed *</h2>
              <p className="text-xs text-[#a3a39e] mb-3">Pick from common roles or type a custom one</p>
            </div>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => addRole(r)}
                  disabled={form.requiredRoles.includes(r)}
                  className={`text-xs px-3 py-1.5 transition-colors border rounded-full font-medium ${
                    form.requiredRoles.includes(r)
                      ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]'
                      : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#0e0e0d] hover:text-[#111110]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Custom role input */}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                placeholder="Custom role..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRole(roleInput.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addRole(roleInput.trim())}
                className="bg-[#0e0e0d] text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#1a1a19] transition-colors"
              >
                Add
              </button>
            </div>

            {/* Selected roles — expandable cards with description + positions */}
            {form.requiredRoles.length > 0 && (
              <div className="flex flex-col gap-3 pt-1">
                {form.requiredRoles.map((r) => (
                  <div key={r} className="border border-[#e0e0dd] rounded-xl bg-[#fafaf9] overflow-hidden">
                    {/* Role header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0e0d]">
                      <span className="text-white text-sm font-semibold">{r}</span>
                      <button
                        type="button"
                        onClick={() => removeRole(r)}
                        className="text-white/50 hover:text-white text-xs font-bold transition-colors"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    {/* Role details */}
                    <div className="px-4 py-3 flex flex-col gap-3">
                      {/* Positions count */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-[#6b6b66] whitespace-nowrap">
                          Positions needed
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRolePos(r, Math.max(1, (form.rolePositions[r] || 1) - 1))}
                            className="w-7 h-7 rounded-full border border-[#e0e0dd] text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#111110] font-bold text-sm transition-colors flex items-center justify-center"
                          >−</button>
                          <span className="text-sm font-bold text-[#111110] w-5 text-center">
                            {form.rolePositions[r] || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRolePos(r, (form.rolePositions[r] || 1) + 1)}
                            className="w-7 h-7 rounded-full border border-[#e0e0dd] text-[#6b6b66] hover:border-[#0e0e0d] hover:text-[#111110] font-bold text-sm transition-colors flex items-center justify-center"
                          >+</button>
                        </div>
                        <span className="text-xs text-[#a3a39e]">
                          {(form.rolePositions[r] || 1) === 1 ? '1 person' : `${form.rolePositions[r]} people`}
                        </span>
                      </div>
                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-[#6b6b66] block mb-1.5">
                          Requirements for this role <span className="text-[#a3a39e] font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={form.roleDescriptions[r] || ''}
                          onChange={(e) => setRoleDesc(r, e.target.value)}
                          placeholder={ROLE_HINTS[r] || 'e.g. Experience level, specific skills, availability, any other requirements…'}
                          maxLength={200}
                          className="w-full rounded-lg border border-[#e0e0dd] bg-white px-3 py-2 text-sm text-[#111110] placeholder:text-[#c0c0bb] focus:outline-none focus:border-[#6C63FF] resize-none"
                        />
                        <p className="text-[11px] text-[#c0c0bb] text-right mt-0.5">
                          {(form.roleDescriptions[r] || '').length}/200
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Experience Level & Tags ── */}
          <section className="bg-white rounded-2xl border border-[#efefed] p-7 shadow-sm flex flex-col gap-5">
            <h2 className="font-bold text-[#111110] text-base mb-1">Who Should Apply?</h2>

            {/* Experience Level */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-3 font-medium">Experience Level</label>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => set('experienceLevel', l.value)}
                    className={`text-left p-3 border rounded-xl transition-all font-medium ${
                      form.experienceLevel === l.value
                        ? 'border-[#0e0e0d] bg-[#0e0e0d] text-white'
                        : 'border-[#e0e0dd] bg-white text-[#111110] hover:border-[#0e0e0d]'
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        form.experienceLevel === l.value ? 'text-white' : 'text-[#111110]'
                      }`}
                    >
                      {l.label}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        form.experienceLevel === l.value ? 'text-white/70' : 'text-[#a3a39e]'
                      }`}
                    >
                      {l.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Tags */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-3 font-medium">
                Project Tags <span className="text-[#a3a39e]">(optional, select all that apply)</span>
              </label>
              <div className="flex flex-col gap-2">
                {PROJECT_TAGS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTag(t.value)}
                    className={`flex items-center justify-between p-3 border rounded-xl text-left transition-all ${
                      form.projectTags.includes(t.value)
                        ? 'border-[#6C63FF] bg-[#f0eeff]/30'
                        : 'border-[#e0e0dd] bg-white hover:border-[#0e0e0d]'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-[#111110]">{t.label}</span>
                      <p className="text-xs text-[#a3a39e] mt-0.5">{t.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 rounded transition-colors ${
                        form.projectTags.includes(t.value)
                          ? 'bg-[#6C63FF] border-[#6C63FF]'
                          : 'border-[#e0e0dd]'
                      }`}
                    >
                      {form.projectTags.includes(t.value) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Details ── */}
          <section className="bg-white rounded-2xl border border-[#efefed] p-7 shadow-sm flex flex-col gap-5">
            <h2 className="font-bold text-[#111110] text-base mb-1">Details</h2>

            {/* ── Compensation Type ── */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-1 font-medium">
                Compensation Type <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#a3a39e] mb-3">Required — applicants must know what to expect.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPENSATION_TYPES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('compensationType', c.value)}
                    className={`text-left p-3 border-2 rounded-xl transition-all ${
                      form.compensationType === c.value
                        ? 'border-[#6C63FF] bg-[#f0eeff]'
                        : 'border-[#e0e0dd] bg-white hover:border-[#6C63FF]/40'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.compensationType === c.value ? 'text-[#3730A3]' : 'text-[#111110]'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-[#a3a39e] mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Compensation details — shown for Paid, Revenue Share, Deferred */}
            {['paid', 'revenue-share', 'deferred'].includes(form.compensationType) && (
              <div className="flex flex-col gap-3">
                {form.compensationType === 'paid' && (
                  <div>
                    <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Rate / Budget</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                      placeholder="e.g. ₹5,000 per day · ₹15,000 total · Negotiable"
                      value={form.budget}
                      onChange={(e) => set('budget', e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-[#6b6b66] block mb-2 font-medium">
                    Compensation Details
                    {form.compensationType === 'paid' && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] min-h-[80px] resize-none"
                    placeholder={
                      form.compensationType === 'paid'
                        ? 'e.g. ₹3,000/day for 2 shoot days, paid within 7 days of wrap. Travel and meals covered.'
                        : form.compensationType === 'revenue-share'
                        ? 'e.g. 10% net revenue share after distribution costs, paid quarterly.'
                        : 'e.g. Full payment upon securing a distribution deal or festival selection.'
                    }
                    value={form.compensationDetails}
                    onChange={(e) => set('compensationDetails', e.target.value)}
                    maxLength={300}
                  />
                  <p className="text-xs text-[#a3a39e] mt-1">{form.compensationDetails.length}/300</p>
                </div>
              </div>
            )}

            {/* ── Scam Protection Notice ── */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-500 text-lg flex-shrink-0">🚫</span>
              <div>
                <p className="text-sm font-bold text-red-800 mb-1">Important Safety Notice</p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Legitimate productions <strong>never</strong> ask actors or crew to pay audition fees, registration fees, or any upfront costs.
                  Requesting payment from applicants is a violation of our guidelines and will result in your account being permanently banned.
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-[#6b6b66] font-medium">Location</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.location.isRemote}
                    onChange={(e) => setLoc('isRemote', e.target.checked)}
                    className="w-4 h-4 accent-bg-[#f0eeff]0"
                  />
                  <span className="text-sm text-[#111110]">Remote</span>
                </label>
              </div>
              {!form.location.isRemote && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                    placeholder="City"
                    value={form.location.city}
                    onChange={(e) => setLoc('city', e.target.value)}
                  />
                  <input
                    type="text"
                    className="rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                    placeholder="Country"
                    value={form.location.country}
                    onChange={(e) => setLoc('country', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">
                Application Deadline <span className="text-[#a3a39e]">(optional)</span>
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </section>

          {/* ── Safety & Casting Details (Phase 2) ── */}
          <section className="bg-white rounded-2xl border border-[#efefed] p-7 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="font-bold text-[#111110] text-base mb-1">Safety & Casting Details</h2>
              <p className="text-xs text-[#a3a39e]">Required to keep CREWUPFILMS safe for everyone.</p>
            </div>

            {/* Production Type */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-3 font-medium">Production Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('productionType', t.value)}
                    className={`text-left p-3 border rounded-xl transition-all ${
                      form.productionType === t.value
                        ? 'border-[#0e0e0d] bg-[#0e0e0d] text-white'
                        : 'border-[#e0e0dd] bg-white text-[#111110] hover:border-[#0e0e0d]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.productionType === t.value ? 'text-white' : 'text-[#111110]'}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${form.productionType === t.value ? 'text-white/70' : 'text-[#a3a39e]'}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Audition Format */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Audition Format *</label>
              <select
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                value={form.auditionFormat}
                onChange={(e) => set('auditionFormat', e.target.value)}
              >
                {AUDITION_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {(form.auditionFormat === 'online') && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
                  ✅ Online auditions are the safest option. Applicants will appreciate it.
                </p>
              )}
            </div>

            {/* Shooting Location Type */}
            <div>
              <label className="text-sm text-[#6b6b66] block mb-2 font-medium">Shooting Location Type *</label>
              <select
                className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                value={form.shootingLocationType}
                onChange={(e) => set('shootingLocationType', e.target.value)}
              >
                {SHOOTING_LOCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {/* Hard block: private residences not allowed */}
              <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-500 flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Private residences are not allowed</strong> for auditions or first meetings.
                  All in-person meetings must take place at registered studios, production offices, or public locations.
                  This protects both you and your applicants.
                </p>
              </div>
            </div>
          </section>

          {/* Go-live notice */}
          <div className="flex items-start gap-3 p-4 bg-[#f0eeff] border border-[#c9c4ff] rounded-2xl">
            <span className="text-lg flex-shrink-0">🚀</span>
            <div>
              <p className="text-sm font-semibold text-[#3730a3] mb-1">Your project goes live instantly</p>
              <p className="text-xs text-[#4740CC] leading-relaxed">
                Once you submit, your project is immediately visible to all creators on CREWUPFILMS.
                Our fraud detection system monitors all listings — any violation of our guidelines can result in removal and account suspension.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#6C63FF] text-white rounded-xl py-4 text-base font-bold w-full hover:bg-[#5750D4] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Project for Review →'}
          </button>
        </form>
      </div>
    </div>
  );
}
