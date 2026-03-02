'use client';

import { useState } from 'react';

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // API call would go here
      // await contactAPI.submitForm(formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        type: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
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
          <div className="inline-block bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
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
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
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
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
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
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
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
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
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
                    className="w-full rounded-lg border border-[#e0e0dd] bg-[#fafaf9] px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 text-white rounded-xl px-8 py-3.5 font-bold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  href="mailto:hello@crewupfilms.com"
                  className="text-amber-600 font-semibold hover:text-amber-700 transition block mb-1"
                >
                  hello@crewupfilms.com
                </a>
                <p className="text-xs text-[#6b6b66]">We'll reply within 24 hours</p>
              </div>

              {/* Support Email Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-2">Support</h3>
                <a
                  href="mailto:support@crewupfilms.com"
                  className="text-amber-600 font-semibold hover:text-amber-700 transition block mb-1"
                >
                  support@crewupfilms.com
                </a>
                <p className="text-xs text-[#6b6b66]">For account and technical issues</p>
              </div>

              {/* Phone Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-2">Phone</h3>
                <a
                  href="tel:+1234567890"
                  className="text-amber-600 font-semibold hover:text-amber-700 transition block mb-1"
                >
                  +1 (234) 567-890
                </a>
                <p className="text-xs text-[#6b6b66]">Mon-Fri, 9am-6pm EST</p>
              </div>

              {/* Address Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-2">Location</h3>
                <p className="text-sm text-[#6b6b66] mb-1">
                  123 Creative Street<br />
                  Los Angeles, CA 90001
                </p>
                <p className="text-xs text-[#6b6b66]">Available for meetings by appointment</p>
              </div>

              {/* Social Links Card */}
              <div className="rounded-xl border border-[#efefed] p-5 bg-white">
                <h3 className="font-semibold text-[#0e0e0d] mb-3">Follow Us</h3>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#f7f7f6] hover:bg-amber-50 flex items-center justify-center transition"
                    title="Twitter"
                  >
                    <span className="text-[#6b6b66] hover:text-amber-600">𝕏</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#f7f7f6] hover:bg-amber-50 flex items-center justify-center transition"
                    title="Instagram"
                  >
                    <span className="text-[#6b6b66] hover:text-amber-600">📷</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#f7f7f6] hover:bg-amber-50 flex items-center justify-center transition"
                    title="LinkedIn"
                  >
                    <span className="text-[#6b6b66] hover:text-amber-600">in</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
