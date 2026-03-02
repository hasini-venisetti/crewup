'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Feedback() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedbackType: '',
    message: '',
    rating: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRating = (star) => {
    setFormData(prev => ({
      ...prev,
      rating: star
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback submitted:', formData);
    setFormData({ name: '', email: '', feedbackType: '', message: '', rating: 0 });
  };

  return (
    <main className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#6b6b66] font-medium mb-4">Help Us Improve</p>
        <h1 className="text-5xl font-[Playfair_Display] text-[#111110] mb-6">Send Us Your Feedback</h1>
        <p className="text-[#6b6b66] leading-relaxed mb-12">Help us build a better CREWUPFILMS. Your feedback directly influences the features and improvements we work on. Whether it's a feature request, bug report, or general thoughts, we want to hear from you.</p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#111110] mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#111110] mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="feedbackType" className="block text-sm font-medium text-[#111110] mb-2">
              Feedback Type
            </label>
            <select
              id="feedbackType"
              name="feedbackType"
              value={formData.feedbackType}
              onChange={handleChange}
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
            >
              <option value="">Select a feedback type</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="general">General Feedback</option>
              <option value="compliment">Compliment</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-[#111110] mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="6"
              className="w-full border border-[#e0e0dd] bg-white text-[#111110] text-sm px-4 py-3 focus:outline-none focus:border-[#111110] transition"
              placeholder="Tell us what you think..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111110] mb-3">
              Rate Your Experience
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`text-2xl cursor-pointer transition ${
                    formData.rating >= star ? 'text-[#111110]' : 'text-[#d0d0cb]'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            {formData.rating > 0 && (
              <p className="text-xs text-[#6b6b66] mt-2">You rated: {formData.rating} out of 5 stars</p>
            )}
          </div>

          <button type="submit" className="bg-[#111110] text-white text-sm font-medium px-6 py-3 hover:bg-[#2d2d2b] transition">
            Send Feedback
          </button>
        </form>

        <div className="bg-[#fafaf9] border border-[#efefed] rounded-sm p-8">
          <h3 className="text-lg font-semibold text-[#111110] mb-3">Thank You</h3>
          <p className="text-[#6b6b66] text-sm leading-relaxed">
            We review all feedback and take it seriously. Your insights help us prioritize features and fix issues. Even if we can't respond to every submission, know that your feedback is heard and valued. If you provided your email, we may follow up with you about your feedback.
          </p>
        </div>

        <div className="mt-12 pt-12 border-t border-[#efefed]">
          <p className="text-[#6b6b66] text-sm">
            Other ways to help: <Link href="/support/report" className="text-[#111110] underline hover:no-underline">Report an issue</Link> or <Link href="/contact" className="text-[#111110] underline hover:no-underline">contact us</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
