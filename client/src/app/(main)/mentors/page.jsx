'use client';

import { useState, useEffect } from 'react';
import { mentorAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const FIELDS = ['Film', 'Photography', 'Animation', 'VFX', 'Sound Design', 'Directing'];
const AVAIL_CONFIG = {
  'Available': { color: 'bg-green-500', label: 'Available' },
  'Open to Offers': { color: 'bg-[#6C63FF]', label: 'Open to Offers' },
  'Busy': { color: 'bg-red-400', label: 'Busy' }
};

export default function MentorsPage() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [field, setField] = useState('');
  const [availability, setAvailability] = useState('');

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const res = await mentorAPI.getAll({ field, availability });
        const data = res.data?.data || res.data?.mentors || [];
        setMentors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, [field, availability]);

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section with Dot Grid */}
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
            Mentorship
          </div>
          <h1 className="font-[Playfair_Display] text-5xl font-bold text-white mb-3">
            Find a Mentor
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mb-6">
            Connect with industry experts to elevate your craft
          </p>
          {!user && (
            <button className="bg-[#6C63FF] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#5750D4] transition">
              Become a Mentor
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-[#efefed] p-5 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field Filter */}
            <div>
              <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                Field
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                <option value="">All Fields</option>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-semibold text-[#0e0e0d] mb-2">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full rounded-lg border border-[#e0e0dd] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition"
              >
                <option value="">All Statuses</option>
                {Object.entries(AVAIL_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-[#6b6b66]">Loading mentors...</div>
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="rounded-2xl border border-[#efefed] p-6 hover:shadow-lg hover:-translate-y-1 transition duration-300 bg-white"
              >
                {/* Header with Avatar and Availability */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-lg">
                      {mentor.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0e0e0d]">{mentor.name}</h3>
                      <p className="text-xs text-[#6b6b66]">{mentor.expertise}</p>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      AVAIL_CONFIG[mentor.availability]?.color || 'bg-gray-400'
                    } animate-pulse`}
                  />
                </div>

                {/* Availability Badge */}
                <div className="mb-4">
                  <span className="text-xs font-medium text-[#6b6b66]">
                    {AVAIL_CONFIG[mentor.availability]?.label || mentor.availability}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-sm text-[#6b6b66] mb-4 line-clamp-2">{mentor.bio}</p>

                {/* Field Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.fields?.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="bg-[#f0eeff] text-[#4740CC] border border-[#c9c4ff] rounded-full text-xs px-2.5 py-1 font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Rate and CTA */}
                <div className="flex items-center justify-between border-t border-[#efefed] pt-4">
                  {mentor.rate && Number(mentor.rate) > 0 ? (
                    <span className="text-sm font-semibold text-[#0e0e0d]">
                      {mentor.currency || ''} {Number(mentor.rate).toLocaleString()}/hr
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-green-600">Free</span>
                  )}
                  <a
                    href={`/mentors/${mentor.id}`}
                    className="text-[#5750D4] font-semibold text-sm hover:text-[#4740CC] transition"
                  >
                    View Profile →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#e0e0dd] p-12 text-center">
            <div className="text-[#6b6b66] mb-4">No mentors found matching your criteria.</div>
            <button
              onClick={() => {
                setField('');
                setAvailability('');
              }}
              className="bg-[#6C63FF] text-white rounded-xl px-6 py-2.5 font-semibold hover:bg-[#5750D4] transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
