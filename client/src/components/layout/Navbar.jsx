'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notificationAPI } from '@/lib/api';
import Logo from '@/components/ui/Logo';

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const NOTIF_ICONS = {
  new_message:          '💬',
  application_received: '📝',
  application_accepted: '✅',
  application_declined: '❌',
  role_filled:          '⭐',
  follow_request:       '👤',
  follow_accepted:      '🤝',
  project_invite:       '🎬',
  contest_announcement: '🏆',
  platform_update:      '📢',
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [unreadCount, setUnreadCount]       = useState(0);
  const [showMenu, setShowMenu]             = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [showBellMenu, setShowBellMenu]     = useState(false);
  const [recentNotifs, setRecentNotifs]     = useState([]);
  const [notifsLoading, setNotifsLoading]   = useState(false);
  const [scrolled, setScrolled]             = useState(false);

  const dropdownRef = useRef(null);
  const bellRef     = useRef(null);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Notification polling */
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchCount = async () => {
      try {
        const { data } = await notificationAPI.getUnreadCount();
        setUnreadCount(data?.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCount(); };
    document.addEventListener('visibilitychange', onVisible);
    const onClear = () => setUnreadCount(0);
    window.addEventListener('notifications-cleared', onClear);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('notifications-cleared', onClear);
    };
  }, [user]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#user-dropdown')) setShowDropdown(false);
      if (!e.target.closest('#bell-dropdown'))  setShowBellMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Fetch recent notifications when bell opens */
  const handleBellClick = async () => {
    const next = !showBellMenu;
    setShowBellMenu(next);
    if (!next) return;
    setNotifsLoading(true);
    try {
      const res = await notificationAPI.getAll();
      const all = res.data?.data || res.data?.notifications || [];
      setRecentNotifs((Array.isArray(all) ? all : []).slice(0, 5));
    } catch {
      setRecentNotifs([]);
    } finally {
      setNotifsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const handleLogout = () => { logout(); setShowDropdown(false); };

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300
      bg-black/90 backdrop-blur-md border-b border-white/10
      ${scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.3)]' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Logo size="sm" light={true} />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/explore',     label: 'Explore' },
              { href: '/projects',    label: 'Projects' },
              { href: '/films',       label: 'Films' },
              { href: '/contests',    label: 'Contests' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/map',         label: 'Map' },
              { href: '/mentors',     label: 'Mentors' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                {item.label}
              </Link>
            ))}
            {user && (
              <Link href="/messages"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                Messages
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">

            {/* ── Notification Bell Dropdown ── */}
            {user && (
              <div id="bell-dropdown" className="relative" ref={bellRef}>
                <button
                  onClick={handleBellClick}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full z-10 flex items-center justify-center text-[10px] font-bold text-white leading-none shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                      <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 opacity-40 animate-ping" />
                    </>
                  )}
                </button>

                {showBellMenu && (
                  <div className="absolute top-full right-0 mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-gray-900 border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-800/50">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#6055de] hover:text-[#8b82ff] font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifsLoading ? (
                        <div className="space-y-2 p-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse h-14 rounded-lg bg-white/5" />
                          ))}
                        </div>
                      ) : recentNotifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-2xl mb-2">🔔</p>
                          <p className="text-xs text-white/40">No notifications yet</p>
                        </div>
                      ) : (
                        recentNotifs.map((n) => {
                          const nid  = n._id || n.id;
                          const icon = NOTIF_ICONS[n.type] || '🔔';
                          return (
                            <div
                              key={nid}
                              className={`flex gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${
                                !n.read ? 'bg-[#6055de]/5' : ''
                              }`}
                            >
                              <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-snug ${n.read ? 'text-white/60' : 'text-white font-semibold'}`}>
                                  {n.title}
                                </p>
                                {n.message && (
                                  <p className="text-[11px] text-white/40 truncate mt-0.5">{n.message}</p>
                                )}
                                <p className="text-[10px] text-white/30 mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 bg-[#6055de] rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/10">
                      <Link
                        href="/notifications"
                        onClick={() => setShowBellMenu(false)}
                        className="block text-center text-xs text-[#6055de] hover:text-[#8b82ff] font-medium py-3 transition-colors"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#efefed] animate-pulse" />
            ) : user ? (
              <div id="user-dropdown" className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-[#6055de]/60 transition-all overflow-hidden"
                >
                  {user.profileImage
                    ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </button>

                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-[calc(100vw-1rem)] sm:w-56 max-w-xs z-50 overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-white/10 bg-gray-800/50">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-white/60 truncate mt-0.5">@{user.username}</p>
                    </div>
                    {[
                      { href: '/dashboard',                      label: '⚡ Dashboard' },
                      { href: `/profile/${user._id || user.id}`, label: '👤 My Profile' },
                      { href: '/settings',                       label: '⚙️ Settings' },
                      ...(user.isAdmin ? [{ href: '/admin', label: '🛡 Admin Panel' }] : []),
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}
                        className="flex items-center px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-white/10">
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="px-5 py-2 bg-[#6055de] text-white text-sm font-semibold rounded-lg hover:bg-[#4d44c8] transition-colors shadow-[0_2px_10px_rgba(96,85,222,0.35)]">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              {showMenu ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMenu && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 pb-3 space-y-0.5">
            {[
              { href: '/explore',     label: 'Explore' },
              { href: '/projects',    label: 'Projects' },
              { href: '/films',       label: 'Films' },
              { href: '/contests',    label: 'Contests' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/map',         label: 'Map' },
              { href: '/mentors',     label: 'Mentors' },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setShowMenu(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/messages" onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">Messages</Link>
                <Link href="/notifications" onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
                  Notifications {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </Link>
                <Link href="/dashboard" onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">Dashboard</Link>
                <Link href={`/profile/${user._id || user.id}`} onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">My Profile</Link>
                <Link href="/settings" onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">Settings</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">Log out</button>
              </>
            )}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link href="/login"  onClick={() => setShowMenu(false)} className="flex-1 text-center px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Log in</Link>
                <Link href="/signup" onClick={() => setShowMenu(false)} className="flex-1 text-center px-4 py-2 bg-[#6055de] text-white text-sm font-semibold rounded-lg hover:bg-[#4d44c8] transition-colors">Join Free</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
