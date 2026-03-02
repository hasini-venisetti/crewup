'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { profileAPI, portfolioAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ROLES = ['Director','Cinematographer','Editor','Musician','Actor','Photographer','Writer','Producer','Sound Designer','Colorist','VFX Artist','Animator','Scriptwriter','Production Designer','Costume Designer','Makeup Artist'];
const EXP_LEVELS = ['beginner','intermediate','advanced','professional'];
const AVAIL_OPTIONS = [
  { value: 'available',      label: '🟢 Available',       desc: 'Actively looking for projects' },
  { value: 'open-to-offers', label: '🟡 Open to Offers',  desc: 'Interested but not actively looking' },
  { value: 'busy',           label: '🔴 Currently Busy',  desc: 'Not taking new projects right now' },
];
const PORTFOLIO_TYPES = ['video','image','audio','link','other'];
const COMMON_SKILLS = ['Premiere Pro','After Effects','DaVinci Resolve','Final Cut Pro','Lightroom','Photoshop','Illustrator','Blender','Cinema 4D','Audacity','Logic Pro','Ableton','Avid','CapCut','Canva','Photography','Videography','Color Grading','Sound Mixing','Motion Graphics','3D Modeling','Scriptwriting','Storyboarding','Directing','Acting','Voice Acting','Narration'];
const MENTOR_FIELDS = ['Film', 'Music', 'Photography', 'Writing', 'Design', 'Editing', 'Acting', 'Animation'];

const inputCls = 'w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition';
const labelCls = 'block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.12em] mb-2';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState('basic');
  const [form, setForm]         = useState({
    name: '', role: '', bio: '',
    experienceLevel: 'beginner', availability: 'available',
    location: { city: '', country: '' },
    skills: [],
    socialLinks: { instagram: '', youtube: '', vimeo: '', linkedin: '', website: '' },
    portfolioLinks: [{ label: '', url: '' }],
    isMentor: false, mentorBio: '', mentorFields: [], mentorRate: '', mentorCurrency: 'INR',
  });
  const [skillInput, setSkillInput] = useState('');
  const [portfolio, setPortfolio]   = useState([]);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem]       = useState({ title: '', description: '', type: 'other', link: '', tags: '' });
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    profileAPI.getMe()
      .then(({ data }) => {
        const p = data.data;
        setProfile(p);
        setPortfolio(p.portfolio || []);
        setForm({
          name:            p.user?.name       || '',
          role:            p.user?.role       || '',
          bio:             p.bio              || '',
          experienceLevel: p.experienceLevel  || 'beginner',
          availability:    p.availability     || 'available',
          location:        p.location         || { city: '', country: '' },
          skills:          p.skills           || [],
          socialLinks:     p.socialLinks      || { instagram: '', youtube: '', vimeo: '', linkedin: '', website: '' },
          portfolioLinks:  p.portfolioLinks?.length ? p.portfolioLinks : [{ label: '', url: '' }],
          isMentor:        p.isMentor         || false,
          mentorBio:       p.mentorBio        || '',
          mentorFields:    p.mentorFields     || [],
          mentorRate:      p.mentorRate != null ? String(p.mentorRate) : '',
          mentorCurrency:  p.mentorCurrency   || 'INR',
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
    if (form.isMentor && (!form.mentorRate || Number(form.mentorRate) <= 0)) {
      toast.error('Please set your hourly rate to become a mentor.');
      setTab('mentor'); return;
    }
    setSaving(true);
    try {
      await profileAPI.update({
        ...form, name: form.name, role: form.role,
        portfolioLinks: form.portfolioLinks.filter((l) => l.url),
        isMentor: form.isMentor, mentorBio: form.mentorBio, mentorFields: form.mentorFields,
        mentorRate: form.mentorRate !== '' ? Number(form.mentorRate) : null,
        mentorCurrency: form.mentorCurrency,
      });
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const handleAddPortfolioItem = async () => {
    if (!newItem.title.trim()) return toast.error('Title is required');
    try {
      const tags = newItem.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await portfolioAPI.add({ ...newItem, tags });
      const { data } = await profileAPI.getMe();
      setPortfolio(data.data.portfolio || []);
      setNewItem({ title: '', description: '', type: 'other', link: '', tags: '' });
      setAddingItem(false);
      toast.success('Portfolio item added!');
    } catch { toast.error('Failed to add item'); }
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
    { key: 'basic',     label: 'Basic Info' },
    { key: 'skills',    label: 'Skills' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'links',     label: 'Links' },
    { key: 'mentor',    label: '🎓 Mentor' },
  ];

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
              className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2">Profile</p>
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
            <div>
              <label className={labelCls}>Full Name</label>
              <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className={labelCls}>Primary Role</label>
              <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="">Select your role…</option>
                {ROLES.map((r) => <option key={r} value={r.toLowerCase().replace(' ', '-')}>{r}</option>)}
              </select>
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
                      form.availability === opt.value ? 'border-amber-500 bg-amber-50/50' : 'border-[#e0e0dd] bg-white hover:border-[#0e0e0d]'
                    }`}>
                    <div>
                      <p className="text-sm font-medium text-[#111110]">{opt.label}</p>
                      <p className="text-xs text-[#a3a39e]">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.availability === opt.value ? 'border-amber-500 bg-amber-500' : 'border-[#e0e0dd]'
                    }`}>
                      {form.availability === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="City"    value={form.location.city}    onChange={(e) => setLoc('city', e.target.value)} />
                <input className={inputCls} placeholder="Country" value={form.location.country} onChange={(e) => setLoc('country', e.target.value)} />
              </div>
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
                <div className="border border-amber-500/30 bg-amber-50/20 rounded-xl p-6 mb-6 flex flex-col gap-4">
                  <h3 className="font-semibold text-[#111110] text-sm">New Portfolio Item</h3>
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input className={inputCls} placeholder="e.g. Short Film Reel 2024" value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none h-20`} placeholder="Brief description of this work…"
                      value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Type</label>
                      <select className={inputCls} value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}>
                        {PORTFOLIO_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Link <span className="text-[#a3a39e] normal-case">(optional)</span></label>
                      <input className={inputCls} placeholder="https://…" value={newItem.link}
                        onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tags <span className="text-[#a3a39e] normal-case">(comma-separated)</span></label>
                    <input className={inputCls} placeholder="e.g. cinematography, drama, 2024" value={newItem.tags}
                      onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddPortfolioItem}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white transition-all">
                      Add to Portfolio
                    </button>
                    <button onClick={() => setAddingItem(false)}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e0e0dd] text-[#111110] hover:border-[#0e0e0d] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {portfolio.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {portfolio.map((item) => (
                    <div key={item._id} className="flex items-start gap-4 p-4 border border-[#efefed] hover:border-[#d0d0ce] rounded-xl transition-all">
                      <span className="text-2xl flex-shrink-0">{{'video':'▶','image':'🖼','audio':'🎵','link':'🔗','other':'📁'}[item.type] || '📁'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#111110]">{item.title}</p>
                        {item.description && <p className="text-xs text-[#6b6b66] mt-0.5 line-clamp-1">{item.description}</p>}
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-700 mt-1 block truncate">{item.link}</a>}
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
            <div className="bg-[#0e0e0d] rounded-xl p-5 flex gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">How earnings work</p>
                <p className="text-xs leading-relaxed text-white/60">
                  You set your rate, you keep most of it. CREWUPFILMS takes a small platform commission on each paid session. Payments go live soon.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-[#efefed] rounded-xl">
              <div>
                <p className="font-medium text-[#111110]">Open to Mentoring</p>
                <p className="text-sm text-[#6b6b66]">Show up in the Mentor Directory</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, isMentor: !f.isMentor }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.isMentor ? 'bg-amber-500' : 'bg-[#efefed]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMentor ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <label className={labelCls}>Mentor Bio</label>
              <textarea value={form.mentorBio || ''} onChange={e => setForm(f => ({ ...f, mentorBio: e.target.value }))}
                rows={3} maxLength={500} placeholder="Briefly describe what you can help with as a mentor…"
                className={`${inputCls} resize-none`} />
            </div>
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
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className={`${labelCls} mb-0`}>Hourly Rate</label>
                {form.isMentor && (
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">Required</span>
                )}
              </div>
              <p className="text-xs text-[#6b6b66] mb-3">Set your rate per 1-hour session.</p>
              <div className={`flex gap-2 ${form.isMentor && (!form.mentorRate || Number(form.mentorRate) <= 0) ? 'ring-2 ring-red-400/30 rounded-lg' : ''}`}>
                <select value={form.mentorCurrency} onChange={e => setForm(f => ({ ...f, mentorCurrency: e.target.value }))}
                  className="rounded-lg border border-[#e0e0dd] text-sm text-[#111110] px-3 py-2.5 focus:outline-none focus:border-amber-500 bg-white w-24">
                  {['INR','USD','EUR','GBP','AED','SGD','AUD','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" min="1" step="1" placeholder="e.g. 500" value={form.mentorRate}
                  onChange={e => setForm(f => ({ ...f, mentorRate: e.target.value }))}
                  className={`${inputCls} flex-1`} />
              </div>
              {form.mentorRate && Number(form.mentorRate) > 0 ? (
                <p className="text-xs text-[#6b6b66] mt-2">
                  Mentees will see: <strong className="text-[#111110]">{form.mentorCurrency} {Number(form.mentorRate).toLocaleString()} / hr</strong>
                  <span className="text-[#a3a39e] ml-1">(CREWUPFILMS commission deducted at payout)</span>
                </p>
              ) : form.isMentor ? (
                <p className="text-xs text-red-500 mt-2">⚠ A rate is required to list yourself as a mentor.</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Bottom Save */}
        {tab !== 'portfolio' && (
          <div className="mt-6">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
