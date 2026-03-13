'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { reportAPI } from '@/lib/api';

// ─── Report reason options ────────────────────────────────────────────────────
const REASONS = [
  { value: 'scam',                 label: '💰 Scam / Payment request',       desc: 'Asking for money, fees, or wire transfers' },
  { value: 'harassment',          label: '😡 Harassment',                    desc: 'Threatening, abusive, or unwanted contact' },
  { value: 'fake_project',        label: '🎭 Fake project / casting call',   desc: 'Project appears fraudulent or misleading' },
  { value: 'minor_protection',    label: '🧒 Minor safety concern',          desc: 'Inappropriate contact with a user under 18' },
  { value: 'inappropriate_content', label: '🚫 Inappropriate content',      desc: 'Offensive, explicit, or harmful content' },
  { value: 'spam',                 label: '📨 Spam',                          desc: 'Repetitive or irrelevant messages/posts' },
  { value: 'copyright',           label: '©️ Copyright issue',              desc: 'Unauthorised use of protected material' },
  { value: 'misinformation',      label: '❌ Misinformation',               desc: 'False or misleading information' },
  { value: 'other',               label: '⚠️ Other',                        desc: 'Something else not listed above' },
];

/**
 * One-Tap Report Modal
 *
 * Props:
 *   targetType  — 'user' | 'project' | 'message' | 'film'
 *   targetId    — MongoDB ObjectId string of the target
 *   targetLabel — human-readable label shown in the modal title (optional)
 *   onClose     — called when modal should be dismissed
 */
export default function ReportModal({ targetType, targetId, targetLabel, onClose }) {
  const [selected, setSelected] = useState(null);
  const [details,  setDetails]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select a reason for your report.');
      return;
    }
    setLoading(true);
    try {
      await reportAPI.submit({ targetType, targetId, reason: selected, details });
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit report. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed]">
          <h2 className="text-base font-bold text-[#111110]">
            ⚑ Report {targetLabel || targetType}
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b8b86] hover:text-[#111110] text-xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {done ? (
          /* ── Thank-you state ── */
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-[#111110] mb-2">Report submitted</h3>
            <p className="text-sm text-[#6b6b66] leading-relaxed mb-6">
              Thank you for helping keep CREWUPFILMS safe. Our moderation team will review your report.
              Your identity is kept confidential.
            </p>
            <button
              onClick={onClose}
              className="bg-[#111110] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2d2d2b] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Selection state ── */
          <div className="px-6 py-5">
            <p className="text-sm text-[#6b6b66] mb-4">
              Select the reason that best describes the issue. All reports are confidential.
            </p>

            {/* Reason list */}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selected === r.value
                      ? 'border-[#111110] bg-[#f5f5f3]'
                      : 'border-[#e8e8e5] hover:border-[#c0c0bc] bg-white'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#111110]">{r.label}</p>
                  <p className="text-xs text-[#8b8b86] mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add additional details (optional)…"
              rows={3}
              maxLength={500}
              className="w-full text-sm border border-[#e8e8e5] rounded-xl px-4 py-3 resize-none outline-none focus:border-[#111110] transition-colors text-[#111110] placeholder-[#b0b0aa] mb-4"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm font-semibold border border-[#e0e0dd] rounded-xl text-[#6b6b66] hover:border-[#111110] hover:text-[#111110] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selected}
                className="flex-1 py-3 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit Report'}
              </button>
            </div>

            <p className="text-xs text-[#a3a39e] text-center mt-3">
              If you are in immediate danger, contact local emergency services (100 / 112 in India).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
