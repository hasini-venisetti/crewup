'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { profileAPI, portfolioAPI } from '@/lib/api';
import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ROLES = ['Director','Cinematographer','Editor','Musician','Actor','Photographer','Writer','Producer','Sound Designer','Colorist','VFX Artist','Animator','Scriptwriter','Production Designer','Costume Designer','Makeup Artist','Other'];
const ROLE_VALUES = ROLES.map(r => r.toLowerCase().replace(/\s+/g, '-'));
const EXP_LEVELS = ['beginner','intermediate','advanced','professional'];
const AVAIL_OPTIONS = [
  { value: 'available',      label: '🟢 Available',       desc: 'Actively looking for projects' },
  { value: 'open-to-offers', label: '🟡 Open to Offers',  desc: 'Interested but not actively looking' },
  { value: 'busy',           label: '🔴 Currently Busy',  desc: 'Not taking new projects right now' },
];
const PORTFOLIO_TYPES = [
  { value: 'video',       label: '▶  Video',       desc: 'Film reel, YouTube, Vimeo' },
  { value: 'image',       label: '🖼  Image',       desc: 'Photo, design, artwork' },
  { value: 'audio',       label: '🎵  Audio',       desc: 'Music, podcast, demo' },
  { value: 'certificate', label: '🏆  Certificate', desc: 'Course, award, credential' },
  { value: 'link',        label: '🔗  Link',        desc: 'Website, article, project' },
  { value: 'other',       label: '📁  Other',       desc: 'Anything else' },
];
const COMMON_SKILLS = ['Premiere Pro','After Effects','DaVinci Resolve','Final Cut Pro','Lightroom','Photoshop','Illustrator','Blender','Cinema 4D','Audacity','Logic Pro','Ableton','Avid','CapCut','Canva','Photography','Videography','Color Grading','Sound Mixing','Motion Graphics','3D Modeling','Scriptwriting','Storyboarding','Directing','Acting','Voice Acting','Narration'];
const MENTOR_FIELDS = [
  'Directing', 'Screenwriting', 'Cinematography', 'Editing', 'Color Grading',
  'Sound Design', 'VFX', 'Animation', 'Acting', 'Production Design',
  'Film', 'Photography', 'Music', 'Writing', 'Design',
  'Casting', 'Producing', 'Makeup & Styling', 'Storyboarding', 'Motion Graphics',
];
const SESSION_TYPES = ['1:1 Video Call', 'Portfolio Review', 'Project Guidance', 'Career Mentorship', 'Script Review', 'Reel Feedback'];
const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];
const TIMEZONES = [
  { value: 'Asia/Kolkata',    label: 'IST — India (UTC+5:30)' },
  { value: 'Asia/Dubai',      label: 'GST — Dubai (UTC+4)' },
  { value: 'Asia/Singapore',  label: 'SGT — Singapore (UTC+8)' },
  { value: 'Asia/Tokyo',      label: 'JST — Tokyo (UTC+9)' },
  { value: 'Europe/London',   label: 'GMT/BST — London' },
  { value: 'Europe/Paris',    label: 'CET — Paris (UTC+1/2)' },
  { value: 'America/New_York',label: 'ET — New York (UTC-5/4)' },
  { value: 'America/Los_Angeles','label': 'PT — Los Angeles (UTC-8/7)' },
  { value: 'America/Chicago', label: 'CT — Chicago (UTC-6/5)' },
  { value: 'Australia/Sydney',label: 'AEST — Sydney (UTC+10/11)' },
];
const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const inputCls = 'w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition';
const labelCls = 'block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState(searchParams.get('tab') || 'basic');
  const [form, setForm]         = useState({
    name: '', roles: [], bio: '', gender: '',
    experienceLevel: 'beginner', availability: 'available',
    location: { city: '', district: '', state: '', country: '' },
    skills: [],
    socialLinks: { instagram: '', youtube: '', vimeo: '', linkedin: '', website: '' },
    portfolioLinks: [{ label: '', url: '' }],
    isMentor: false, mentorBio: '', mentorFields: [], mentorRate: '', mentorCurrency: 'INR',
    mentorStatus: 'open', mentorExperience: '', mentorSessionTypes: [], mentorLocationType: 'online', mentorLanguages: [],
    mentorTimezone: 'Asia/Kolkata', mentorSessionDuration: 60, mentorWeeklySchedule: [],
    locationVisible: true,
    // Phase 5: Emergency contact & verification links
    emergencyContact: { name: '', phone: '', relationship: '' },
    verificationLinks: { imdb: '', instagram: '' },
  });
  const [skillInput, setSkillInput]         = useState('');
  const [otherRoleInput, setOtherRoleInput] = useState('');
  const [portfolio, setPortfolio]           = useState([]);
  const [picturePreview, setPicturePreview] = useState('');
  const [uploadingPic, setUploadingPic]     = useState(false);
  const picInputRef = useRef(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem]       = useState({ title: '', description: '', type: 'other', link: '', tags: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', certificateFileUrl: '' });
  const [certFileName, setCertFileName] = useState('');
  const certFileRef = useRef(null);
  const [deletingId, setDeletingId] = useState('');
  const [availSlots, setAvailSlots] = useState([]);        // { startDate, endDate, note }
  const [newSlot, setNewSlot]       = useState({ startDate: '', endDate: '', note: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    profileAPI.getMe()
      .then(({ data }) => {
        const p = data.data;
        setProfile(p);
        setPortfolio(p.portfolio || []);
        setAvailSlots((p.availabilitySlots || []).map((s) => ({
          ...s,
          startDate: s.startDate ? s.startDate.slice(0, 10) : '',
          endDate:   s.endDate   ? s.endDate.slice(0, 10)   : '',
        })));
        setForm({
          name:            p.user?.name       || '',
          roles:           p.user?.roles?.length ? p.user.roles : (p.user?.role ? [p.user.role] : []),
          bio:             p.bio              || '',
          gender:          p.user?.gender     || '',
          experienceLevel: p.experienceLevel  || 'beginner',
          availability:    p.availability     || 'available',
          location:        p.location         || { city: '', district: '', country: '' },
          locationVisible: p.locationVisible  !== false, // default true if not set
          skills:          p.skills           || [],
          socialLinks:     p.socialLinks      || { instagram: '', youtube: '', vimeo: '', linkedin: '', website: '' },
          portfolioLinks:  p.portfolioLinks?.length ? p.portfolioLinks : [{ label: '', url: '' }],
          isMentor:           p.isMentor            || false,
          mentorBio:          p.mentorBio           || '',
          mentorFields:       p.mentorFields        || [],
          mentorRate:         p.mentorRate != null ? String(p.mentorRate) : '',
          mentorCurrency:     p.mentorCurrency      || 'INR',
          mentorStatus:           p.mentorStatus        || 'open',
          mentorExperience:       p.mentorExperience != null ? String(p.mentorExperience) : '',
          mentorSessionTypes:     p.mentorSessionTypes  || [],
          mentorLocationType:     p.mentorLocationType  || 'online',
          mentorLanguages:        p.mentorLanguages     || [],
          mentorTimezone:         p.mentorTimezone      || 'Asia/Kolkata',
          mentorSessionDuration:  p.mentorSessionDuration != null ? p.mentorSessionDuration : 60,
          mentorWeeklySchedule:   p.mentorWeeklySchedule || [],
          emergencyContact:   p.emergencyContact   || { name: '', phone: '', relationship: '' },
          verificationLinks:  p.verificationLinks  || { imdb: '', instagram: '' },
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const set      = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setSocial = (k, v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [k]: v } }));
  const setLoc    = (k, v) => setForm((prev) => ({ ...prev, location: { ...prev.location, [k]: v } }));

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 20) set('skills', [...form.skills, s]);
    setSkillInput('');
  };
  const removeSkill = (s) => set('skills', form.skills.filter((x) => x !== s));

  const handleSave = async () => {
    if (form.isMentor && (form.mentorRate === '' || form.mentorRate === null || form.mentorRate === undefined || Number(form.mentorRate) < 0)) {
      toast.error('Please set your hourly rate (enter 0 for free mentorship).');
      setTab('mentor'); return;
    }
    setSaving(true);
    try {
      await profileAPI.update({
        ...form, name: form.name, roles: form.roles, role: form.roles[0] || 'other',
        portfolioLinks: form.portfolioLinks.filter((l) => l.url),
        availabilitySlots: availSlots.filter((s) => s.startDate && s.endDate),
        isMentor: form.isMentor, mentorBio: form.mentorBio, mentorFields: form.mentorFields,
        mentorRate: form.mentorRate !== '' ? Number(form.mentorRate) : null,
        mentorCurrency: form.mentorCurrency,
        mentorStatus: form.mentorStatus,
        mentorExperience: form.mentorExperience !== '' ? Number(form.mentorExperience) : null,
        mentorSessionTypes: form.mentorSessionTypes,
        mentorLocationType: form.mentorLocationType,
        mentorLanguages: form.mentorLanguages,
        mentorTimezone: form.mentorTimezone,
        mentorSessionDuration: form.mentorSessionDuration,
        mentorWeeklySchedule: form.mentorWeeklySchedule,
        locationVisible: form.locationVisible,
        // Phase 5: Emergency contact & verification links
        emergencyContact:  form.emergencyContact,
        verificationLinks: form.verificationLinks,
      });
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 1.5 * 1024 * 1024) { toast.error('Image must be under 1.5 MB'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target.result; // base64 data URL
      setPicturePreview(imageData);
      setUploadingPic(true);
      try {
        await profileAPI.uploadPicture(imageData);
        toast.success('Profile picture updated!');
      } catch {
        toast.error('Failed to upload picture');
        setPicturePreview('');
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPortfolioItem = async () => {
    if (!newItem.title.trim()) return toast.error('Title is required');
    if (newItem.type === 'certificate' && !newItem.issuer.trim()) return toast.error('Issuing organisation is required for certificates');
    try {
      const tags = newItem.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await portfolioAPI.add({ ...newItem, tags });
      const { data } = await profileAPI.getMe();
      setPortfolio(data.data.portfolio || []);
      setNewItem({ title: '', description: '', type: 'other', link: '', tags: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', certificateFileUrl: '' });
      setCertFileName('');
      setAddingItem(false);
      toast.success('Portfolio item added!');
    } catch { toast.error('Failed to add item'); }
  };

  const handleCertFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) { toast.error('Only PDF or image files are supported'); return; }
    if (file.size > 3.5 * 1024 * 1024) { toast.error('File must be under 3.5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewItem((prev) => ({ ...prev, certificateFileUrl: ev.target.result }));
      setCertFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePortfolioItem = async (itemId) => {
    setDeletingId(itemId);
    try {
      await portfolioAPI.delete(itemId);
      setPortfolio((prev) => prev.filter((i) => i._id !== itemId));
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
    finally { setDeletingId(''); }
  };

  if (authLoading || loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!user) return null;

  const TABS = [
    { key: 'basic',        label: 'Basic Info' },
    { key: 'skills',       label: 'Skills' },
    { key: 'availability', label: '📅 Availability' },
    { key: 'portfolio',    label: 'Portfolio' },
    { key: 'links',        label: 'Links' },
    { key: 'mentor',       label: '🎓 Mentor' },
    { key: 'safety',       label: '🛡 Safety' },
  ];

  const addSlot = () => {
    if (!newSlot.startDate || !newSlot.endDate) return toast.error('Pick a start and end date');
    if (newSlot.endDate < newSlot.startDate)    return toast.error('End date must be after start date');
    setAvailSlots((prev) => [...prev, { ...newSlot }]);
    setNewSlot({ startDate: '', endDate: '', note: '' });
  };
  const removeSlot = (i) => setAvailSlots((prev) => prev.filter((_, idx) => idx !== i));

  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Header */}
      <div
        className="bg-[#0e0e0d] pt-8 pb-10 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        <div className="relative max-w-[700px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <Link href={`/profile/${user._id || user.id}`}
              className="text-sm text-white/40 hover:text-white/80 transition-colors">
              ← View Profile
            </Link>
            <button onClick={handleSave} disabled={saving}
              className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#6C63FF] font-bold mb-2">Profile</p>
          <h1 className="text-4xl font-[Playfair_Display] text-white">Edit Profile</h1>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-6 py-10">

        {/* Tab Nav */}
        <div className="flex gap-1 bg-white border border-[#efefed] rounded-xl p-1 mb-8 w-fit overflow-x-auto shadow-sm">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.key ? 'bg-[#0e0e0d] text-white shadow-sm' : 'text-[#6b6b66] hover:text-[#111110] hover:bg-[#f7f7f6]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO ── */}
        {tab === 'basic' && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-8 flex flex-col gap-6">

            {/* Profile Picture */}
            <div>
              <label className={labelCls}>Profile Picture</label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c9c4ff] to-[#e4e1ff] flex items-center justify-center text-2xl font-bold text-[#3730A3] flex-shrink-0 overflow-hidden">
                  {(picturePreview || profile?.user?.profileImage)
                    ? <img src={picturePreview || profile.user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    : <span>{profile?.user?.name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={picInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureChange}
                  />
                  <button
                    type="button"
                    onClick={() => picInputRef.current?.click()}
                    disabled={uploadingPic}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e0e0dd] text-[#111110] hover:border-[#6C63FF] hover:text-[#6C63FF] transition-all disabled:opacity-50"
                  >
                    {uploadingPic ? 'Uploading…' : 'Change Photo'}
                  </button>
                  <p className="text-xs text-[#a3a39e]">JPG, PNG or WebP · Max 1.5 MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Full Name</label>
              <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className={labelCls}>Gender <span className="normal-case text-[#a3a39e] font-normal">· optional, never shown publicly</span></label>
              <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Roles <span className="normal-case font-normal text-[#a3a39e]">(select all that apply)</span></label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ROLES.map((r, i) => {
                  const val = ROLE_VALUES[i];
                  const selected = form.roles.includes(val);
                  return (
                    <button key={r} type="button"
                      onClick={() => {
                        const next = selected
                          ? form.roles.filter(x => x !== val)
                          : [...form.roles, val];
                        set('roles', next);
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium text-left transition-all flex items-center gap-1.5 ${
                        selected
                          ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]'
                          : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#0e0e0d]'
                      }`}>
                      {selected && <span className="text-xs leading-none">✓</span>}
                      {r}
                    </button>
                  );
                })}
              </div>

              {/* Custom roles — shown when Other is selected */}
              {form.roles.includes('other') && (
                <div className="mt-3">
                  {/* existing custom roles as tags */}
                  {form.roles.filter(r => !ROLE_VALUES.includes(r) && r !== 'other').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.roles.filter(r => !ROLE_VALUES.includes(r) && r !== 'other').map(r => (
                        <span key={r} className="inline-flex items-center gap-1 bg-[#f0eeff] text-[#5750D4] text-xs font-medium px-2.5 py-1 rounded-full">
                          {r}
                          <button type="button" onClick={() => set('roles', form.roles.filter(x => x !== r))} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a custom role and press Enter…"
                      className={`${inputCls} flex-1`}
                      value={otherRoleInput}
                      onChange={(e) => setOtherRoleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && otherRoleInput.trim()) {
                          e.preventDefault();
                          const val = otherRoleInput.trim().toLowerCase();
                          if (!form.roles.includes(val)) set('roles', [...form.roles, val]);
                          setOtherRoleInput('');
                        }
                      }}
                    />
                    <button type="button"
                      onClick={() => {
                        if (!otherRoleInput.trim()) return;
                        const val = otherRoleInput.trim().toLowerCase();
                        if (!form.roles.includes(val)) set('roles', [...form.roles, val]);
                        setOtherRoleInput('');
                      }}
                      className="px-3 py-2 rounded-lg bg-[#0e0e0d] text-white text-xs font-semibold hover:bg-[#2d2d2b] transition">
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-[#a3a39e] mt-1">Press Enter or click Add for each role</p>
                </div>
              )}

              {form.roles.length > 0 && (
                <p className="text-xs text-[#6C63FF] mt-2">Primary role: <strong>{form.roles[0]}</strong></p>
              )}
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea className={`${inputCls} min-h-[120px] resize-none`} value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell the community about yourself, your work, and what you're passionate about…" maxLength={500} />
              <p className="text-xs text-[#a3a39e] mt-1">{form.bio.length}/500</p>
            </div>
            <div>
              <label className={labelCls}>Experience Level</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {EXP_LEVELS.map((l) => (
                  <button key={l} type="button" onClick={() => set('experienceLevel', l)}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${
                      form.experienceLevel === l ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#0e0e0d]'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Availability Status</label>
              <p className="text-xs text-[#a3a39e] mb-3">Shown on your profile and in Explore so project owners know if you're open.</p>
              <div className="flex flex-col gap-2">
                {AVAIL_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => set('availability', opt.value)}
                    className={`flex items-center justify-between p-4 border rounded-xl text-left transition-all ${
                      form.availability === opt.value ? 'border-[#6C63FF] bg-[#f0eeff]/50' : 'border-[#e0e0dd] bg-white hover:border-[#0e0e0d]'
                    }`}>
                    <div>
                      <p className="text-sm font-medium text-[#111110]">{opt.label}</p>
                      <p className="text-xs text-[#a3a39e]">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.availability === opt.value ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#e0e0dd]'
                    }`}>
                      {form.availability === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="District (e.g. Hyderabad, Rangareddy)"
                  value={form.location.district || ''}
                  onChange={(e) => setLoc('district', e.target.value)} />
                <input className={inputCls} placeholder="State (e.g. Telangana)"
                  value={form.location.state || ''}
                  onChange={(e) => setLoc('state', e.target.value)} />
              </div>
              <div className="mb-3">
                <input className={inputCls} placeholder="Country (e.g. India)" value={form.location.country} onChange={(e) => setLoc('country', e.target.value)} />
              </div>
              {/* Map visibility toggle */}
              <button
                type="button"
                onClick={() => set('locationVisible', !form.locationVisible)}
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition-all ${
                  form.locationVisible
                    ? 'bg-[#f0fdf4] border-[#bbf7d0] hover:border-[#86efac]'
                    : 'bg-[#fafaf9] border-[#e0e0dd] hover:border-[#c0c0be]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{form.locationVisible ? '🗺️' : '🙈'}</span>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${form.locationVisible ? 'text-[#15803d]' : 'text-[#6b6b66]'}`}>
                      {form.locationVisible ? 'Visible on Creator Map' : 'Hidden from Creator Map'}
                    </p>
                    <p className="text-xs text-[#a3a39e] mt-0.5">
                      {form.locationVisible
                        ? 'Other creators can find you by city on the map.'
                        : 'Your pin won\'t appear on the map — location still saved for display on your profile.'}
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${form.locationVisible ? 'bg-green-500' : 'bg-[#d0d0ce]'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.locationVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {tab === 'skills' && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-8 flex flex-col gap-6">
            <div>
              <h2 className="font-bold text-[#111110] mb-1">Your Skills</h2>
              <p className="text-xs text-[#a3a39e]">Add up to 20 skills. Click common skills below or type your own.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6b6b66] mb-3 uppercase tracking-[0.12em]">Quick Add</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} disabled={form.skills.includes(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      form.skills.includes(s) ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'bg-white text-[#6b6b66] border-[#e0e0dd] hover:border-[#0e0e0d] hover:text-[#111110]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="Custom skill…" value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} />
              <button type="button" onClick={() => addSkill(skillInput)}
                className="px-4 py-2.5 rounded-lg border border-[#e0e0dd] text-sm font-semibold text-[#111110] hover:border-[#0e0e0d] transition-all">
                Add
              </button>
            </div>
            {form.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6b6b66] mb-3 uppercase tracking-[0.12em]">Your Skills ({form.skills.length}/20)</p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 bg-[#0e0e0d] text-white text-xs px-3 py-1.5 rounded-full">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="text-white/50 hover:text-white">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABILITY CALENDAR ── */}
        {tab === 'availability' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#efefed] p-8">
              <h2 className="text-base font-bold text-[#111110] mb-1">Availability Calendar</h2>
              <p className="text-sm text-[#6b6b66] mb-6">Tell project owners when you're free to join a project. These dates show on your public profile.</p>

              {/* Existing slots */}
              {availSlots.length > 0 && (
                <div className="flex flex-col gap-2 mb-6">
                  {availSlots.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-[#f7f7f6] border border-[#e0e0dd] rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111110]">{fmtDate(slot.startDate)} → {fmtDate(slot.endDate)}</p>
                        {slot.note && <p className="text-xs text-[#6b6b66] mt-0.5 truncate">{slot.note}</p>}
                      </div>
                      <button onClick={() => removeSlot(i)} className="text-[#a3a39e] hover:text-red-500 transition-colors text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new slot */}
              <div className="border border-dashed border-[#d0d0cc] rounded-xl p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-wider">Add Available Period</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b6b66] font-medium block mb-1">From</label>
                    <input type="date" value={newSlot.startDate} onChange={(e) => setNewSlot((p) => ({ ...p, startDate: e.target.value }))}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b6b66] font-medium block mb-1">To</label>
                    <input type="date" value={newSlot.endDate} onChange={(e) => setNewSlot((p) => ({ ...p, endDate: e.target.value }))}
                      min={newSlot.startDate || new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]" />
                  </div>
                </div>
                <input type="text" placeholder="Note (optional) — e.g. 'Weekends only', 'Available for short roles'" value={newSlot.note}
                  onChange={(e) => setNewSlot((p) => ({ ...p, note: e.target.value }))} maxLength={100}
                  className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-3 py-2 text-sm focus:outline-none focus:border-[#6C63FF]" />
                <button onClick={addSlot}
                  className="self-start px-5 py-2 rounded-lg bg-[#111110] text-white text-sm font-semibold hover:bg-[#2a2a28] transition-colors">
                  + Add Period
                </button>
              </div>

              <p className="text-xs text-[#a3a39e] mt-4">Click <strong>Save Changes</strong> above to save your availability.</p>
            </div>
          </div>
        )}

        {/* ── PORTFOLIO ── */}
        {tab === 'portfolio' && (
          <div id="portfolio" className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#efefed] p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-[#111110]">Portfolio Items</h2>
                  <p className="text-xs text-[#a3a39e] mt-1">Showcase videos, photos, audio, or links to your best work</p>
                </div>
                <button onClick={() => setAddingItem(true)}
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#0e0e0d] text-white hover:bg-[#2d2d2b] transition-all">
                  + Add Item
                </button>
              </div>
              {addingItem && (
                <div className="border border-[#6C63FF]/30 bg-[#f0eeff]/20 rounded-xl p-6 mb-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {PORTFOLIO_TYPES.find(t => t.value === newItem.type)?.label?.split(' ')[0] || '📁'}
                    </span>
                    <h3 className="font-semibold text-[#111110] text-sm">Add Portfolio Item</h3>
                  </div>

                  {/* Type selector — card buttons */}
                  <div>
                    <label className={labelCls}>Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PORTFOLIO_TYPES.map((t) => (
                        <button key={t.value} type="button"
                          onClick={() => setNewItem({ ...newItem, type: t.value })}
                          className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                            newItem.type === t.value
                              ? 'border-[#6C63FF] bg-[#f0eeff] text-[#4740CC]'
                              : 'border-[#e0e0dd] bg-white text-[#6b6b66] hover:border-[#c9c4ff]'
                          }`}>
                          <span className="text-base mb-0.5">{t.label.split(' ')[0]}</span>
                          <span className="text-xs font-semibold">{t.label.split('  ')[1]}</span>
                          <span className="text-[10px] text-[#a3a39e] leading-tight mt-0.5">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      {newItem.type === 'certificate' ? 'Certificate / Award Name *' : 'Title *'}
                    </label>
                    <input className={inputCls}
                      placeholder={newItem.type === 'certificate' ? 'e.g. Cinematography Fundamentals' : 'e.g. Short Film Reel 2024'}
                      value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
                  </div>

                  {/* Certificate-specific fields */}
                  {newItem.type === 'certificate' && (
                    <>
                      <div>
                        <label className={labelCls}>Issued by *</label>
                        <input className={inputCls} placeholder="e.g. Coursera, Adobe, FTII, Skillshare"
                          value={newItem.issuer} onChange={(e) => setNewItem({ ...newItem, issuer: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Issue Date</label>
                          <input type="date" className={inputCls}
                            value={newItem.issueDate} onChange={(e) => setNewItem({ ...newItem, issueDate: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Expiry Date <span className="text-[#a3a39e] normal-case">(optional)</span></label>
                          <input type="date" className={inputCls}
                            value={newItem.expiryDate} onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Credential ID <span className="text-[#a3a39e] normal-case">(optional)</span></label>
                        <input className={inputCls} placeholder="e.g. ABC-123456"
                          value={newItem.credentialId} onChange={(e) => setNewItem({ ...newItem, credentialId: e.target.value })} />
                      </div>
                      {/* Certificate file upload */}
                      <div>
                        <label className={labelCls}>Upload Certificate File <span className="text-[#a3a39e] normal-case">(PDF or image, max 3.5 MB)</span></label>
                        <input ref={certFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleCertFileChange} />
                        {newItem.certificateFileUrl ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
                            <span className="text-2xl">{newItem.certificateFileUrl.startsWith('data:application/pdf') ? '📄' : '🖼'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#92400e] truncate">{certFileName}</p>
                              <p className="text-xs text-[#a3a39e]">File attached</p>
                            </div>
                            <button type="button" onClick={() => { setNewItem((p) => ({ ...p, certificateFileUrl: '' })); setCertFileName(''); if (certFileRef.current) certFileRef.current.value = ''; }}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex-shrink-0">Remove</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => certFileRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-[#e0e0dd] hover:border-[#6C63FF] hover:bg-[#f8f7ff] text-[#a3a39e] hover:text-[#6C63FF] transition-all text-sm font-medium">
                            <span>📎</span> Choose file to upload
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none h-20`}
                      placeholder={newItem.type === 'certificate' ? 'What you learned or achieved…' : 'Brief description of this work…'}
                      value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelCls}>
                      {newItem.type === 'certificate' ? 'Credential / Verify URL' : 'Link'}
                      <span className="text-[#a3a39e] normal-case ml-1">(optional)</span>
                    </label>
                    <input className={inputCls}
                      placeholder={newItem.type === 'certificate' ? 'https://certificate-verify-link…' : 'https://…'}
                      value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelCls}>Tags <span className="text-[#a3a39e] normal-case">(comma-separated)</span></label>
                    <input className={inputCls} placeholder="e.g. cinematography, drama, 2024" value={newItem.tags}
                      onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleAddPortfolioItem}
                      className="text-sm font-semibold px-5 py-2 rounded-lg bg-[#6C63FF] hover:bg-[#7C75FF] text-white transition-all">
                      Add to Portfolio
                    </button>
                    <button onClick={() => { setAddingItem(false); setNewItem({ title: '', description: '', type: 'other', link: '', tags: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', certificateFileUrl: '' }); setCertFileName(''); if (certFileRef.current) certFileRef.current.value = ''; }}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e0e0dd] text-[#111110] hover:border-[#0e0e0d] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {portfolio.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {portfolio.map((item) => (
                    <div key={item._id} className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${item.type === 'certificate' ? 'border-[#fde68a] bg-[#fffbeb] hover:border-[#fcd34d]' : 'border-[#efefed] hover:border-[#d0d0ce]'}`}>
                      <span className="text-2xl flex-shrink-0">{{'video':'▶','image':'🖼','audio':'🎵','link':'🔗','certificate':'🏆','other':'📁'}[item.type] || '📁'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-[#111110]">{item.title}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#f7f7f6] text-[#a3a39e] border border-[#e0e0dd] capitalize">{item.type}</span>
                        </div>
                        {item.type === 'certificate' && item.issuer && (
                          <p className="text-xs text-[#92400e] font-semibold mt-0.5">Issued by {item.issuer}</p>
                        )}
                        {item.type === 'certificate' && item.issueDate && (
                          <p className="text-xs text-[#a3a39e] mt-0.5">
                            {new Date(item.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {item.expiryDate && ` — expires ${new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                          </p>
                        )}
                        {item.description && <p className="text-xs text-[#6b6b66] mt-0.5 line-clamp-1">{item.description}</p>}
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5750D4] hover:text-[#4740CC] mt-1 block truncate">{item.link}</a>}
                        {item.certificateFileUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#92400e] bg-[#fef9ee] border border-[#fde68a] px-2 py-0.5 rounded-full mt-1">
                            {item.certificateFileUrl.startsWith('data:application/pdf') ? '📄' : '🖼'} File attached
                          </span>
                        )}
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.tags.map((t) => <span key={t} className="text-[11px] bg-[#f7f7f6] text-[#a3a39e] px-2 py-0.5 rounded-full">{t}</span>)}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeletePortfolioItem(item._id)} disabled={deletingId === item._id}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 disabled:opacity-40 transition-colors">
                        {deletingId === item._id ? '…' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : !addingItem && (
                <div className="text-center py-12 border border-dashed border-[#e0e0dd] rounded-xl">
                  <p className="text-4xl mb-3">🎨</p>
                  <p className="text-sm text-[#6b6b66] mb-4">No portfolio items yet</p>
                  <button onClick={() => setAddingItem(true)}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e0e0dd] text-[#111110] hover:border-[#0e0e0d] transition-all">
                    Add Your First Item
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LINKS ── */}
        {tab === 'links' && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-8 flex flex-col gap-5">
            <div>
              <h2 className="font-bold text-[#111110] mb-1">Social & Portfolio Links</h2>
              <p className="text-xs text-[#a3a39e]">These appear on your public profile</p>
            </div>
            {[
              { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourhandle' },
              { key: 'youtube',   label: 'YouTube',   placeholder: 'youtube.com/@channel' },
              { key: 'vimeo',     label: 'Vimeo',     placeholder: 'vimeo.com/yourpage' },
              { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'linkedin.com/in/yourname' },
              { key: 'website',   label: 'Website',   placeholder: 'yourwebsite.com' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input className={inputCls} placeholder={placeholder}
                  value={form.socialLinks[key]} onChange={(e) => setSocial(key, e.target.value)} />
              </div>
            ))}
            <div className="border-t border-[#efefed] pt-5">
              <div className="flex items-center justify-between mb-3">
                <label className={`${labelCls} mb-0`}>Additional Portfolio Links</label>
                <button type="button" onClick={() => set('portfolioLinks', [...form.portfolioLinks, { label: '', url: '' }])}
                  className="text-xs text-[#6b6b66] hover:text-[#111110] font-semibold transition-colors">+ Add Link</button>
              </div>
              {form.portfolioLinks.map((lnk, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                  <input className={`${inputCls} col-span-2`} placeholder="Label" value={lnk.label}
                    onChange={(e) => { const arr = [...form.portfolioLinks]; arr[i] = { ...arr[i], label: e.target.value }; set('portfolioLinks', arr); }} />
                  <input className={`${inputCls} col-span-3`} placeholder="URL" value={lnk.url}
                    onChange={(e) => { const arr = [...form.portfolioLinks]; arr[i] = { ...arr[i], url: e.target.value }; set('portfolioLinks', arr); }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MENTOR ── */}
        {tab === 'mentor' && (
          <div className="bg-white rounded-2xl border border-[#efefed] p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#111110] mb-1">Mentor Settings</h2>
              <p className="text-sm text-[#6b6b66]">Become a mentor to help creators in your field. Your profile will appear in the Mentor Directory.</p>
            </div>

            {/* Earnings banner */}
            <div className="bg-[#0e0e0d] rounded-xl p-5 flex gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">How earnings work</p>
                <p className="text-xs leading-relaxed text-white/60">You set your own rate — free or paid. Every rupee goes directly to you. CREWUPFILMS takes no commission.</p>
              </div>
            </div>

            {/* Enable mentoring toggle */}
            <div className="flex items-center justify-between p-4 border border-[#efefed] rounded-xl">
              <div>
                <p className="font-medium text-[#111110]">Open to Mentoring</p>
                <p className="text-sm text-[#6b6b66]">Show up in the Mentor Directory</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, isMentor: !f.isMentor }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.isMentor ? 'bg-[#6C63FF]' : 'bg-[#efefed]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMentor ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {form.isMentor && (<>

              {/* Mentor Status */}
              <div>
                <label className={labelCls}>Listing Status</label>
                <p className="text-xs text-[#6b6b66] mb-3">Control whether new mentees can apply to you right now.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'open',   label: '🟢 Open',   desc: 'Accepting requests' },
                    { key: 'paused', label: '⏸ Paused',  desc: 'Temporarily closed' },
                    { key: 'closed', label: '🔴 Closed',  desc: 'Not accepting' },
                  ].map(({ key, label, desc }) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({ ...f, mentorStatus: key }))}
                      className={`p-3 rounded-xl border text-left transition-colors ${form.mentorStatus === key ? 'border-[#6C63FF] bg-[#f0eeff]' : 'border-[#efefed] hover:border-[#6C63FF]/40'}`}>
                      <p className={`text-xs font-semibold ${form.mentorStatus === key ? 'text-[#4740CC]' : 'text-[#111110]'}`}>{label}</p>
                      <p className="text-[10px] text-[#6b6b66] mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentor Bio */}
              <div>
                <label className={labelCls}>Mentor Bio</label>
                <textarea value={form.mentorBio || ''} onChange={e => setForm(f => ({ ...f, mentorBio: e.target.value }))}
                  rows={3} maxLength={500} placeholder="Briefly describe your experience and what you can help mentees with…"
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-[#a3a39e] text-right mt-1">{(form.mentorBio || '').length}/500</p>
              </div>

              {/* Experience */}
              <div>
                <label className={labelCls}>Years of Experience</label>
                <input type="number" min="0" max="50" step="1" placeholder="e.g. 5"
                  value={form.mentorExperience}
                  onChange={e => setForm(f => ({ ...f, mentorExperience: e.target.value }))}
                  className={`${inputCls} w-40`} />
              </div>

              {/* Session Types */}
              <div>
                <label className={labelCls}>Session Types</label>
                <p className="text-xs text-[#6b6b66] mb-3">What kind of sessions do you offer?</p>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map(s => {
                    const active = (form.mentorSessionTypes || []).includes(s);
                    return (
                      <button key={s} type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          mentorSessionTypes: active
                            ? (prev.mentorSessionTypes || []).filter(x => x !== s)
                            : [...(prev.mentorSessionTypes || []), s],
                        }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#6C63FF] text-white border-[#6C63FF]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Type */}
              <div>
                <label className={labelCls}>Session Mode</label>
                <div className="flex gap-2">
                  {[
                    { key: 'online',  label: '🌐 Online Only' },
                    { key: 'offline', label: '📍 In-Person Only' },
                    { key: 'both',    label: '✅ Both' },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({ ...f, mentorLocationType: key }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.mentorLocationType === key ? 'border-[#6C63FF] bg-[#f0eeff] text-[#4740CC]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className={labelCls}>Languages You Mentor In</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => {
                    const active = (form.mentorLanguages || []).includes(lang);
                    return (
                      <button key={lang} type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          mentorLanguages: active
                            ? (prev.mentorLanguages || []).filter(x => x !== lang)
                            : [...(prev.mentorLanguages || []), lang],
                        }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#0e0e0d]'}`}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mentorship Fields */}
              <div>
                <label className={labelCls}>Mentorship Fields</label>
                <div className="flex flex-wrap gap-2">
                  {MENTOR_FIELDS.map(f => {
                    const active = (form.mentorFields || []).includes(f);
                    return (
                      <button key={f} type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          mentorFields: active ? (prev.mentorFields || []).filter(x => x !== f) : [...(prev.mentorFields || []), f],
                        }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${active ? 'bg-[#0e0e0d] text-white border-[#0e0e0d]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#0e0e0d]'}`}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className={`${labelCls} mb-0`}>Hourly Rate</label>
                  <span className="text-xs bg-[#f0f0ee] text-[#6b6b66] border border-[#e0e0dd] px-2 py-0.5 rounded-full font-medium">Enter 0 for free</span>
                </div>
                <p className="text-xs text-[#6b6b66] mb-3">Set your rate per 1-hour session.</p>
                <div className="flex gap-2">
                  <select value={form.mentorCurrency} onChange={e => setForm(f => ({ ...f, mentorCurrency: e.target.value }))}
                    className="rounded-lg border border-[#e0e0dd] text-sm text-[#111110] px-3 py-2.5 focus:outline-none focus:border-[#6C63FF] bg-white w-24">
                    {['INR','USD','EUR','GBP','AED','SGD','AUD','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" min="0" step="1" placeholder="e.g. 500 or 0 for free" value={form.mentorRate}
                    onChange={e => setForm(f => ({ ...f, mentorRate: e.target.value }))}
                    className={`${inputCls} flex-1`} />
                </div>
                {form.mentorRate !== '' && form.mentorRate !== undefined && form.mentorRate !== null ? (
                  Number(form.mentorRate) === 0 ? (
                    <p className="text-xs text-[#6b6b66] mt-2">Mentees will see: <strong className="text-green-700">Free</strong> <span className="text-green-600">— you keep 100%</span></p>
                  ) : Number(form.mentorRate) > 0 ? (
                    <p className="text-xs text-[#6b6b66] mt-2">Mentees will see: <strong className="text-[#111110]">{form.mentorCurrency} {Number(form.mentorRate).toLocaleString()} / hr</strong> <span className="text-green-600">— you keep 100%</span></p>
                  ) : null
                ) : null}
              </div>

              {/* ── Booking Settings ── */}
              <div className="border-t border-[#efefed] pt-6">
                <h3 className="text-sm font-bold text-[#111110] mb-1">📅 Booking & Availability</h3>
                <p className="text-xs text-[#6b6b66] mb-5">Set your timezone, session length, and weekly hours so mentees can book exact time slots.</p>

                {/* Timezone */}
                <div className="mb-5">
                  <label className={labelCls}>Your Timezone</label>
                  <select value={form.mentorTimezone}
                    onChange={e => setForm(f => ({ ...f, mentorTimezone: e.target.value }))}
                    className={inputCls}>
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                {/* Session Duration */}
                <div className="mb-5">
                  <label className={labelCls}>Default Session Duration</label>
                  <div className="flex gap-2">
                    {[30, 60, 90].map(d => (
                      <button key={d} type="button"
                        onClick={() => setForm(f => ({ ...f, mentorSessionDuration: d }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${form.mentorSessionDuration === d ? 'border-[#6C63FF] bg-[#f0eeff] text-[#4740CC]' : 'border-[#efefed] text-[#6b6b66] hover:border-[#6C63FF]/40'}`}>
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div>
                  <label className={labelCls}>Weekly Availability</label>
                  <p className="text-xs text-[#6b6b66] mb-3">Check each day you're available and set your hours. Mentees will only see these slots.</p>
                  <div className="flex flex-col gap-2">
                    {DAYS_OF_WEEK.map((day, idx) => {
                      const slot = (form.mentorWeeklySchedule || []).find(s => s.day === idx);
                      const enabled = !!slot;
                      return (
                        <div key={day} className={`rounded-xl border transition-colors ${enabled ? 'border-[#6C63FF]/40 bg-[#f8f7ff]' : 'border-[#efefed] bg-white'}`}>
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button type="button"
                              onClick={() => {
                                const sched = form.mentorWeeklySchedule || [];
                                if (enabled) {
                                  setForm(f => ({ ...f, mentorWeeklySchedule: sched.filter(s => s.day !== idx) }));
                                } else {
                                  setForm(f => ({ ...f, mentorWeeklySchedule: [...sched, { day: idx, startTime: '09:00', endTime: '17:00' }] }));
                                }
                              }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${enabled ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-[#d0d0cc] hover:border-[#6C63FF]'}`}>
                              {enabled && <span className="text-white text-xs font-bold">✓</span>}
                            </button>
                            <span className={`text-sm font-semibold w-8 ${enabled ? 'text-[#4740CC]' : 'text-[#6b6b66]'}`}>{day}</span>
                            {enabled && (
                              <div className="flex items-center gap-2 ml-auto">
                                <input type="time" value={slot.startTime}
                                  onChange={e => setForm(f => ({ ...f, mentorWeeklySchedule: (f.mentorWeeklySchedule || []).map(s => s.day === idx ? { ...s, startTime: e.target.value } : s) }))}
                                  className="rounded-lg border border-[#e0e0dd] text-sm px-2 py-1.5 focus:outline-none focus:border-[#6C63FF] bg-white" />
                                <span className="text-xs text-[#6b6b66]">to</span>
                                <input type="time" value={slot.endTime}
                                  onChange={e => setForm(f => ({ ...f, mentorWeeklySchedule: (f.mentorWeeklySchedule || []).map(s => s.day === idx ? { ...s, endTime: e.target.value } : s) }))}
                                  className="rounded-lg border border-[#e0e0dd] text-sm px-2 py-1.5 focus:outline-none focus:border-[#6C63FF] bg-white" />
                              </div>
                            )}
                            {!enabled && <span className="text-xs text-[#a3a39e] ml-auto">Not available</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#a3a39e] mt-3">Times are in your selected timezone ({form.mentorTimezone}).</p>
                </div>
              </div>

            </>)}
          </div>
        )}

        {/* ── SAFETY TAB ── */}
        {tab === 'safety' && (
          <div className="flex flex-col gap-6">

            {/* Email verification status */}
            <div className="bg-white rounded-2xl border border-[#efefed] p-6 shadow-sm">
              <h3 className="font-bold text-[#111110] text-sm mb-4">Email Verification</h3>
              {user?.isEmailVerified ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-green-600 text-xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Email verified</p>
                    <p className="text-xs text-green-600">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 text-xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Email not verified</p>
                      <p className="text-xs text-amber-600">Verify to unlock full platform access</p>
                    </div>
                  </div>
                  <a href="/verify-email" className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg transition-colors">
                    Verify Now
                  </a>
                </div>
              )}
            </div>

            {/* Verification links (for Verified Creator badge) */}
            <div className="bg-white rounded-2xl border border-[#efefed] p-6 shadow-sm">
              <h3 className="font-bold text-[#111110] text-sm mb-1">Creator Verification Links</h3>
              <p className="text-xs text-[#a3a39e] mb-4">Provide links to your IMDb or verified social profile. These help our team verify your identity for the Verified Creator badge.</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-[#6b6b66] font-medium block mb-1">IMDb Profile URL</label>
                  <input type="url" placeholder="https://www.imdb.com/name/nm..."
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                    value={form.verificationLinks.imdb}
                    onChange={(e) => setForm(f => ({ ...f, verificationLinks: { ...f.verificationLinks, imdb: e.target.value } }))} />
                </div>
                <div>
                  <label className="text-xs text-[#6b6b66] font-medium block mb-1">Verified Instagram URL</label>
                  <input type="url" placeholder="https://www.instagram.com/yourusername"
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
                    value={form.verificationLinks.instagram}
                    onChange={(e) => setForm(f => ({ ...f, verificationLinks: { ...f.verificationLinks, instagram: e.target.value } }))} />
                </div>
              </div>
              <p className="text-xs text-[#a3a39e] mt-3">After saving, our team will review your links and may grant a Verified Creator badge. This may take 1–3 business days.</p>
            </div>

          </div>
        )}

        {/* Bottom Save */}
        {tab !== 'portfolio' && (
          <div className="mt-6">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-xl bg-[#6C63FF] hover:bg-[#7C75FF] text-white font-semibold text-sm shadow-lg shadow-[#6C63FF]/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
