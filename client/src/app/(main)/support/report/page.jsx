'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ReportIssue() {
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    url: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Report submitted:', formData);
    setFormData({ issueType: '', description: '', url: '', email: '' });
  };

  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Report & Feedback</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Report an Issue</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12">Help us keep CREWUPFILMS safe and welcoming. Report bugs, inappropriate content, or other issues you encounter. Our moderation team reviews all reports within 24-48 hours.</p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div>
            <label htmlFor="issueType" className="block text-sm font-medium text-[#111110] mb-2">
              Issue Type *
            </label>
            <select
              id="issueType"
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              required
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
            >
              <option value="">Select an issue type</option>
              <option value="bug">Bug Report</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="fake">Fake Profile</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#111110] mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="Please describe the issue in detail..."
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-[#111110] mb-2">
              Link (optional)
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="Link to the affected page or profile (if applicable)"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#111110] mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="your@email.com"
            />
          </div>

          <button type="submit" className="bg-[#111110] text-white text-sm font-medium px-6 py-3 hover:bg-[#2d2d2b] transition">
            Submit Report
          </button>
        </form>

        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-6">
          <h3 className="text-lg font-semibold text-[#111110] mb-3">What happens next?</h3>
          <p className="text-[#6b6b66] text-sm leading-relaxed mb-4">
            Our team reviews all reports within 24-48 hours. Depending on the issue type and severity, we may:
          </p>
          <ul className="text-[#6b6b66] text-sm space-y-2">
            <li>• Investigate the reported content or account</li>
            <li>• Remove inappropriate content</li>
            <li>• Suspend or terminate violating accounts</li>
            <li>• Fix bugs and improve our platform</li>
            <li>• Follow up with you if we need more details</li>
          </ul>
          <p className="text-[#6b6b66] text-sm mt-4">
            We appreciate your help in keeping CREWUPFILMS safe and trustworthy.
          </p>
        </div>

        <div className="mt-12 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm">
            Need something else? <Link href="/support" className="text-[#111110] underline hover:no-underline">View our Help Center</Link> or <Link href="/contact" className="text-[#111110] underline hover:no-underline">contact us directly</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
