'use client';

import { useState } from 'react';

export default function HeroSection() {
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'media',
      title: 'MEDIA AND ENTERTAINMENT',
      description: 'Create stunning visual content with AI-powered tools',
      icon: '🎬'
    },
    {
      id: 'robotics',
      title: 'ROBOTICS AND AUTONOMY',
      description: 'Advanced simulation for autonomous systems',
      icon: '🤖'
    },
    {
      id: 'world-models',
      title: 'GENERAL WORLD MODELS',
      description: 'Comprehensive AI simulation environments',
      icon: '🌍'
    },
    {
      id: 'video-agents',
      title: 'CONVERSATIONAL REAL-TIME VIDEO AGENTS',
      description: 'Interactive AI video experiences',
      icon: '🎥'
    }
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left side - Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Building AI to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Connect the World
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Join the premier platform for AI-powered collaboration, 
                bringing together creators, developers, and innovators worldwide.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105">
                Get Started
              </button>
              <button className="px-8 py-4 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">1000+</div>
                <div className="text-sm text-gray-400">Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>
          </div>

          {/* Right side - Categories */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6">Explore Capabilities</h2>
            {categories.map((category) => (
              <div
                key={category.id}
                className={`group relative p-6 rounded-xl border transition-all duration-300 cursor-pointer
                  ${activeCategory === category.id 
                    ? 'bg-white/10 border-white/30' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-lg font-semibold text-white">
                        {category.title}
                      </h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  <div className={`transition-transform duration-200 ${
                    activeCategory === category.id ? 'rotate-90' : ''
                  }`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
                
                {/* Expanded content */}
                {activeCategory === category.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors">
                        Learn More
                      </button>
                      <button className="px-4 py-2 border border-white/20 text-white text-sm rounded-lg hover:bg-white/10 transition-colors">
                        View Examples
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
