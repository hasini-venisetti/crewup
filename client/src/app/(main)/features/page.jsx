'use client';

import Link from 'next/link';

const features = [
  { icon: '🎯', title: 'Role-Based Matching',       description: 'Connect with creators in your exact role. Find cinematographers, editors, producers, musicians, photographers, and more.' },
  { icon: '💬', title: 'Real-Time Messaging',        description: 'Stay connected with your team through instant messaging. Discuss ideas, share feedback, and keep projects moving forward.' },
  { icon: '📋', title: 'Project Boards',             description: 'Organize your projects with visual boards. Track tasks, collaborate on details, and manage your creative workflow.' },
  { icon: '📅', title: 'Shooting Schedules',         description: 'Coordinate shoot dates and times with your entire crew. Build schedules that work for everyone on your team.' },
  { icon: '🎓', title: 'Mentorship Matching',        description: 'Learn from experienced creators. Get mentored by industry professionals or mentor the next generation of creators.' },
  { icon: '🔔', title: 'Role Waitlist',              description: "Can't find the right creator for a role? Join the waitlist and we'll notify you when someone joins matching your needs." },
  { icon: '⭐', title: 'Reviews & Ratings',          description: 'Build credibility through authentic reviews. See verified feedback from past collaborations and make informed decisions.' },
  { icon: '🏆', title: 'Leaderboard',               description: 'Celebrate top creators in your community. Gain recognition for your contributions and quality work on projects.' },
  { icon: '📍', title: 'Location-Based Discovery',  description: 'Find creators near you or connect with talent globally. Filter by location to build local teams or expand your network worldwide.' },
  { icon: '🖥️', title: 'Team Dashboard',            description: 'Manage all your projects and collaborators in one place. View team status, upcoming shoots, and project progress at a glance.' },
  { icon: '🔖', title: 'Explore by Tags',            description: 'Discover projects and creators by specific interests. Search by genre, style, equipment, or any custom tag that matters to you.' },
  { icon: '🎨', title: 'Creator Profiles',          description: 'Showcase your work with a complete portfolio. Display your reel, past projects, skills, and testimonials all in one place.' },
];

export default function Features() {
  return (
    <main className="bg-[#fafaf9]">
      {/* Hero */}
      <div
        className="bg-[#0e0e0d] py-24 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* Amber glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold">Platform Capabilities</p>
          </div>
          <h1 className="text-6xl font-[Playfair_Display] text-white mb-4 leading-tight max-w-2xl">
            Features Built for Creators
          </h1>
          <p className="text-white/50 text-lg max-w-xl leading-relaxed">
            Everything you need to find collaborators, manage projects, and build your creative network.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-[#efefed] p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-[#d0d0ce] transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f7f7f6] border border-[#e0e0dd] flex items-center justify-center text-2xl mb-5 group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#0e0e0d] mb-3">{feature.title}</h3>
              <p className="text-[#6b6b66] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-20 rounded-2xl p-12 md:p-16 text-center relative overflow-hidden"
          style={{ background: '#0e0e0d', backgroundImage: 'radial-gradient(circle, #1a1a18 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-4">Get Started Today</p>
            <h2 className="text-4xl font-[Playfair_Display] text-white mb-4">
              Ready to explore all features?
            </h2>
            <p className="text-white/50 mb-10 max-w-md mx-auto">
              Start using CREWUPFILMS for free today. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-8 py-3.5 rounded-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 active:scale-[0.98]"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
