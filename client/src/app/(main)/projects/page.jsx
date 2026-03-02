'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/ui/ProjectCard';
import { projectAPI } from '@/lib/api';

const filterTabs = ['All', 'Film', 'Music', 'Photography', 'Podcast', 'Art'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isPaid, setIsPaid] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = {};
    if (activeTab !== 'All') params.projectType = activeTab.toLowerCase().replace(' ', '-');
    if (isPaid) params.isPaid = true;
    if (isRemote) params.isRemote = true;
    
    projectAPI
      .getAll(params)
      .then((res) => {
        const raw = res.data?.data ?? res.data?.projects ?? [];
        const data = Array.isArray(raw) ? raw : [];
        setProjects(data);
        setHasMore(data.length >= 10);
      })
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, [activeTab, isPaid, isRemote]);

  const topRoles = ['Director', 'Editor', 'Cinematographer', 'Musician', 'Photographer'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-[#0e0e0d] px-6 py-24 sm:px-8"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      >
        <div className="relative z-10 mx-auto max-w-6xl">
          <h1 className="font-['Playfair_Display'] text-4xl font-bold text-white sm:text-5xl">
            Discover <span className="text-amber-500">Projects</span>
          </h1>
          <p className="mt-3 text-base text-gray-400">Find amazing film, music, and creative projects looking for talented crew members.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Filter Tabs */}
            <div className="mb-6 rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#efefed]">
              <div className="space-y-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-[#0e0e0d] text-white'
                        : 'text-[#111110] hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Paid Toggle */}
              <div className="rounded-xl border border-[#efefed] bg-white p-4 shadow-sm">
                <label className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPaid(!isPaid)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPaid ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPaid ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-[#111110]">Paid Projects</span>
                </label>
              </div>

              {/* Remote Toggle */}
              <div className="rounded-xl border border-[#efefed] bg-white p-4 shadow-sm">
                <label className="flex items-center gap-3">
                  <button
                    onClick={() => setIsRemote(!isRemote)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isRemote ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isRemote ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-[#111110]">Remote Only</span>
                </label>
              </div>

              {/* CTA Card */}
              <div className="rounded-xl border border-[#efefed] bg-white p-6 shadow-sm">
                <h3 className="font-['Playfair_Display'] mb-3 text-lg font-bold text-[#111110]">
                  Discover Creators
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Find talented filmmakers, musicians, and artists for your next project.
                </p>
                <Link
                  href="/creators"
                  className="inline-block w-full rounded-lg bg-[#0e0e0d] px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2b]"
                >
                  Explore Creators
                </Link>
              </div>

              {/* Top Roles */}
              <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-600">
                  ✦ Top Roles
                </h4>
                <div className="space-y-2">
                  {topRoles.map((role) => (
                    <button
                      key={role}
                      className="block w-full text-left rounded-lg px-3 py-2 text-sm text-[#111110] transition-colors hover:bg-amber-50"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-[#efefed] bg-white p-4"
                  >
                    <div className="mb-4 h-48 rounded-lg bg-gray-200" />
                    <div className="mb-3 h-6 w-3/4 rounded-lg bg-gray-200" />
                    <div className="mb-2 h-4 w-full rounded-lg bg-gray-100" />
                    <div className="h-4 w-2/3 rounded-lg bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white py-20 text-center">
                <div className="mb-4 text-4xl text-amber-500">✦</div>
                <h3 className="font-['Playfair_Display'] mb-2 text-2xl font-bold text-[#111110]">
                  No Projects Found
                </h3>
                <p className="mb-6 max-w-sm text-gray-600">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('All');
                    setIsPaid(false);
                    setIsRemote(false);
                  }}
                  className="rounded-lg bg-[#0e0e0d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2b]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
