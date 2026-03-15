'use client';

import { useState, useCallback, useEffect } from 'react';
import { searchAPI } from '@/lib/api';
import { debounce } from '@/utils/debounce';
import Image from 'next/image';

const SEARCH_TYPES = ['all', 'projects', 'creators'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(
    debounce(async (searchQuery, type, pageNum = 1) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const data = await searchAPI.search({
          query: searchQuery,
          type,
          page: pageNum,
        });
        setResults(pageNum === 1 ? data.results : [...results, ...data.results]);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [results]
  );

  useEffect(() => {
    setPage(1);
    performSearch(query, searchType, 1);
  }, [query, searchType, performSearch]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(query, searchType, nextPage);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <div className="relative bg-[#0e0e0d] h-56 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <h1 className="font-[Playfair_Display] text-5xl font-bold text-white mb-8">
            Search
          </h1>

          {/* Large Integrated Search Bar */}
          <div className="w-full max-w-2xl">
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-center px-5 py-4">
                <svg
                  className="w-5 h-5 text-[#6b6b66] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects, creators, or ideas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 ml-3 bg-transparent focus:outline-none text-[#0e0e0d] placeholder-[#9a9a96]"
                />
                {loading && (
                  <div className="w-5 h-5 border-2 border-[#c9c4ff] border-t-bg-[#f0eeff]0 rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Type Tabs */}
        <div className="flex gap-2 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
            {SEARCH_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                  searchType === type
                    ? 'bg-[#0e0e0d] text-white'
                    : 'text-[#6b6b66] hover:bg-[#f7f7f6]'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {query.trim() ? (
          <>
            {results.length > 0 && (
              <div className="mb-6">
                <span className="text-[#6C63FF] font-semibold">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </div>
            )}

            {searchType === 'creators' && results.length > 0 && (
              <div>
                <h2 className="font-[Playfair_Display] text-2xl text-[#0e0e0d] mb-6">
                  Creators
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {results.map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </div>
            )}

            {searchType === 'projects' && results.length > 0 && (
              <div>
                <h2 className="font-[Playfair_Display] text-2xl text-[#0e0e0d] mb-6">
                  Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {results.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {searchType === 'all' && results.length > 0 && (
              <div>
                {results.filter((r) => r.type === 'creator').length > 0 && (
                  <div className="mb-12">
                    <h2 className="font-[Playfair_Display] text-2xl text-[#0e0e0d] mb-6">
                      Creators
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results
                        .filter((r) => r.type === 'creator')
                        .slice(0, 3)
                        .map((creator) => (
                          <CreatorMiniCard key={creator.id} creator={creator} />
                        ))}
                    </div>
                  </div>
                )}

                {results.filter((r) => r.type === 'project').length > 0 && (
                  <div>
                    <h2 className="font-[Playfair_Display] text-2xl text-[#0e0e0d] mb-6">
                      Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results
                        .filter((r) => r.type === 'project')
                        .slice(0, 4)
                        .map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {results.length === 0 && !loading && query.trim() && (
              <div className="rounded-2xl bg-white border border-[#efefed] shadow-sm p-16 text-center">
                <div className="text-[#6b6b66] text-lg">
                  No results found for "{query}"
                </div>
                <p className="text-[#9a9a96] mt-2">Try different keywords</p>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white border border-[#e0e0dd] rounded-xl px-8 py-3 font-semibold hover:border-[#6C63FF] hover:text-[#5750D4] transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl bg-white border border-[#efefed] shadow-sm p-16 text-center">
            <div className="text-[#6b6b66] text-lg">
              Start typing to search for projects and creators
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ creator }) {
  return (
    <div className="rounded-2xl border border-[#efefed] p-6 hover:shadow-lg hover:-translate-y-1 transition bg-white">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-lg">
          {creator.name?.charAt(0) || 'C'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[#0e0e0d]">{creator.name}</h3>
          <p className="text-xs text-[#6b6b66]">{creator.role}</p>
        </div>
      </div>
      <p className="text-sm text-[#6b6b66] mb-4 line-clamp-2">{creator.bio}</p>
      <a
        href={`/creators/${creator.id}`}
        className="text-[#5750D4] font-semibold text-sm hover:text-[#4740CC] transition"
      >
        View Profile →
      </a>
    </div>
  );
}

function CreatorMiniCard({ creator }) {
  return (
    <a
      href={`/creators/${creator.id}`}
      className="rounded-xl border border-[#efefed] p-4 hover:bg-[#f0eeff] transition bg-white"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#e4e1ff] to-[#f0eeff] flex items-center justify-center text-[#3730A3] font-bold text-sm flex-shrink-0">
          {creator.name?.charAt(0) || 'C'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#0e0e0d] text-sm">{creator.name}</p>
          <p className="text-xs text-[#6b6b66]">{creator.role}</p>
        </div>
      </div>
    </a>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="rounded-2xl border border-[#efefed] p-6 hover:shadow-lg hover:-translate-y-1 transition bg-white">
      {project.thumbnail && (
        <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden bg-[#f0f0ed]">
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <h3 className="font-semibold text-[#0e0e0d] mb-2 line-clamp-2">{project.title}</h3>
      <p className="text-sm text-[#6b6b66] mb-4 line-clamp-2">{project.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#9a9a96] font-medium">{project.category}</span>
        <a
          href={`/projects/${project.id}`}
          className="text-[#5750D4] font-semibold text-sm hover:text-[#4740CC] transition"
        >
          View →
        </a>
      </div>
    </div>
  );
}
