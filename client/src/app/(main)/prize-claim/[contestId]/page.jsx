'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contestAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function PrizeClaimPage() {
  const { contestId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [contest, setContest]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    upiId: '',
    bankDetails: '',
    notes: '',
  });

  useEffect(() => {
    if (contestId) {
      contestAPI.getById(contestId)
        .then(({ data }) => setContest(data.data))
        .catch(() => {});
    }
  }, [contestId]);

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, fullName: user.name }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.upiId) {
      toast.error('Full name, phone number, and UPI ID are required.');
      return;
    }
    setSubmitting(true);
    try {
      await contestAPI.submitPrizeClaim(contestId, form);
      setSubmitted(true);
      toast.success('Payment details submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;
  if (!user) { router.push('/login'); return null; }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#efefed] p-10 max-w-md w-full text-center shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-[#111110] mb-2">Details Submitted!</h2>
          <p className="text-sm text-[#6b6b66] leading-relaxed mb-6">
            We've received your payment details. Our team will process your prize and get in touch with you shortly.
          </p>
          <button onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-[#111110] text-white text-sm font-semibold rounded-xl hover:bg-[#333] transition-all">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#efefed] shadow-sm w-full max-w-lg p-8">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="text-xl font-bold text-[#111110]">Claim Your Prize</h1>
          {contest && (
            <p className="text-sm text-[#6b6b66] mt-1">{contest.title}</p>
          )}
          <p className="text-xs text-[#a3a39e] mt-3 leading-relaxed">
            Fill in your payment details below. This is secure and only visible to the CrewUp Films team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="As per bank records"
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
              UPI ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              placeholder="yourname@upi"
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          {/* Bank Details */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
              Bank Account Details <span className="text-[#a3a39e] font-normal">(optional)</span>
            </label>
            <textarea
              value={form.bankDetails}
              onChange={(e) => setForm({ ...form, bankDetails: e.target.value })}
              placeholder="Account number, IFSC code, bank name..."
              rows={3}
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6b66] uppercase tracking-[0.1em] mb-1.5">
              Any Notes <span className="text-[#a3a39e] font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything you'd like us to know..."
              rows={2}
              className="w-full rounded-xl border border-[#e0e0dd] bg-[#fafaf9] px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors resize-none"
            />
          </div>

          {/* Privacy note */}
          <p className="text-[11px] text-[#a3a39e] leading-relaxed">
            🔒 Your details are only shared with the CrewUp Films admin team for payment processing and will not be visible to anyone else.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] text-white font-semibold text-sm transition-all disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Payment Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
