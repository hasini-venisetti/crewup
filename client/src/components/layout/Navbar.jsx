'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notificationAPI } from '@/lib/api';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [unreadCount, setUnreadCount]   = useState(0);
  const [showMenu, setShowMenu]         = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled]         = useState(false);

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

  const handleLogout = () => { logout(); setShowDropdown(false); };

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('#user-dropdown')) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300
      bg-white/80 backdrop-blur-md border-b border-[#efefed]/80
      ${scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.07)]' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/explore',     label: 'Explore' },
              { href: '/projects',    label: 'Projects' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/map',         label: 'Map' },
              { href: '/mentors',     label: 'Mentors' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#6b6b66] hover:text-[#0e0e0d] hover:bg-[#f7f7f6] transition-all duration-150">
                {item.label}
              </Link>
            ))}
            {user && (
              <Link href="/messages"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#6b6b66] hover:text-[#0e0e0d] hover:bg-[#f7f7f6] transition-all duration-150">
                Messages
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">

            {/* Notification bell */}
            {user && (
              <Link href="/notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#6b6b66] hover:text-[#0e0e0d] hover:bg-[#f7f7f6] transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 opacity-70 animate-ping" />
                    <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5 z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </>
                )}
              </Link>
            )}

            {/* Auth */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#efefed] animate-pulse" />
            ) : user ? (
              <div id="user-dropdown" className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d0d0cc] to-[#e8e8e5] flex items-center justify-center text-xs font-bold text-[#0e0e0d] hover:ring-2 hover:ring-[#0e0e0d]/20 transition-all overflow-hidden"
                >
                  {user.profileImage
                    ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </button>

                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-[#efefed] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-56 z-50 overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-[#efefed] bg-[#fafaf9]">
                      <p className="text-sm font-semibold text-[#0e0e0d] truncate">{user.name}</p>
                      <p className="text-xs text-[#6b6b66] truncate mt-0.5">@{user.username}</p>
                    </div>
                    {[
                      { href: '/dashboard',                  label: '⚡ Dashboard' },
                      { href: `/profile/${user._id || user.id}`, label: '👤 My Profile' },
                      { href: '/settings',                   label: '⚙️ Settings' },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}
                        className="flex items-center px-4 py-3 text-sm text-[#0e0e0d] hover:bg-[#f7f7f6] transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-[#efefed]">
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost hidden sm:inline-flex py-2 text-sm">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary py-2 text-sm">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#0e0e0d] hover:bg-[#f7f7f6] transition-colors"
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
          <div className="md:hidden mt-3 pt-3 border-t border-[#efefed] pb-3 space-y-0.5">
            {[
              { href: '/explore',     label: 'Explore' },
              { href: '/projects',    label: 'Projects' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/map',         label: 'Map' },
              { href: '/mentors',     label: 'Mentors' },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setShowMenu(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:text-[#0e0e0d] hover:bg-[#f7f7f6] transition-colors">
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/messages"    onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">Messages</Link>
                <Link href="/notifications" onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">
                  Notifications {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </Link>
                <Link href="/dashboard"   onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">Dashboard</Link>
                <Link href={`/profile/${user._id || user.id}`} onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">My Profile</Link>
                <Link href="/settings"    onClick={() => setShowMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors">Settings</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">Log out</button>
              </>
            )}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link href="/login"  onClick={() => setShowMenu(false)} className="flex-1 btn-ghost text-center py-2">Log in</Link>
                <Link href="/signup" onClick={() => setShowMenu(false)} className="flex-1 btn-primary text-center py-2">Join Free</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
