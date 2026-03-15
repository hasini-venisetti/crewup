'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    type: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/contact`, formData);
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: '', email: '', subject: '', type: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send. Please email us at crewupfilms@gmail.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <div className="relative bg-[#0e0e0d] h-64 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-block bg-[#6C63FF] text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Get in Touch
          </div>
          <h1 className="font-[Playfair_Display] text-5xl font-bold text-white mb-3">
            Contact Us
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Have a question or collaboration idea? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#efefed] p-8 shadow-sm">
              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Thank you! We've received your message and will get back to you soon.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
                  />
                </div>

                {/* Type Select */}
                <div>
                  <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                    Inquiry Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
                  >
                    <option value="">Select an option</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="support">Support Request</option>
                    <option value="feedback">Feedback</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us more about your inquiry..."
                    rows="6"
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6C63FF] text-white rounded-xl px-8 py-3.5 font-bold hover:bg-[#5750D4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-5">
              {/* Email Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-2">Email</h3>
                <a
                  href="mailto:crewupfilms@gmail.com"
                  className="text-[#5750D4] font-semibold hover:text-[#4740CC] transition block mb-1"
                >
                  crewupfilms@gmail.com
                </a>
                <p className="text-xs text-[#6b6b66]">We'll reply within 24 hours</p>
              </div>

              {/* Instagram Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-2">Instagram</h3>
                <a
                  href="https://www.instagram.com/crewupfilms_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5750D4] font-semibold hover:text-[#4740CC] transition block mb-1"
                >
                  @crewupfilms_official
                </a>
                <p className="text-xs text-[#6b6b66]">Follow us for updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
