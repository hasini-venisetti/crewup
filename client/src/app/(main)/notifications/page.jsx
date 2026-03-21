'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationAPI, messageRequestAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchNotifications();
  }, [user, authLoading]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res  = await notificationAPI.getAll();
      const data = res.data?.data || res.data?.notifications || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupByDate = (notifs) => {
    const groups = {};
    notifs.forEach((notif) => {
      const date = new Date(notif.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(notif);
    });
    return groups;
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleMarkRead = async (notifId) => {
    try {
      await notificationAPI.markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === notifId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await notificationAPI.delete(notifId);
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== notifId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Accept a message/mentorship request directly from the notification
  const handleAcceptRequest = async (notif) => {
    const requestId = notif.data?.requestId;
    const nid       = notif._id || notif.id;

    // If no requestId in notification data, fall back to looking it up by sender
    if (!requestId) {
      const senderId = notif.sender?._id || notif.sender;
      if (!senderId) {
        router.push('/messages?tab=requests');
        return;
      }
      try {
        const statusRes = await messageRequestAPI.getStatus(senderId);
        const rid       = statusRes.data?.data?.requestId;
        if (!rid) { router.push('/messages?tab=requests'); return; }
        const convRes = await messageRequestAPI.accept(rid);
        const convId  = convRes.data?.data?._id;
        // Mark notification as read then navigate
        await notificationAPI.markRead(nid).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === nid ? { ...n, read: true, _accepted: true } : n))
        );
        router.push(convId ? `/messages?conv=${convId}` : '/messages');
      } catch (err) {
        console.error('Accept failed:', err);
        router.push('/messages?tab=requests');
      }
      return;
    }

    try {
      const res    = await messageRequestAPI.accept(requestId);
      const convId = res.data?.data?._id;
      await notificationAPI.markRead(nid).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === nid ? { ...n, read: true, _accepted: true } : n))
      );
      router.push(convId ? `/messages?conv=${convId}` : '/messages');
    } catch (err) {
      console.error('Accept failed:', err?.response?.data || err.message);
      // If already accepted, just navigate
      if (err?.response?.status === 400) {
        router.push('/messages');
      } else {
        router.push('/messages?tab=requests');
      }
    }
  };

  // Decline a message/mentorship request directly from the notification
  const handleDeclineRequest = async (notif) => {
    const requestId = notif.data?.requestId;
    const nid       = notif._id || notif.id;

    if (!requestId) {
      router.push('/messages?tab=requests');
      return;
    }

    try {
      await messageRequestAPI.decline(requestId);
      await notificationAPI.markRead(nid).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === nid ? { ...n, read: true, _declined: true } : n))
      );
    } catch (err) {
      console.error('Decline failed:', err?.response?.data || err.message);
    }
  };

  const groupedNotifications = groupByDate(notifications);
  const unreadCount          = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-[#0e0e0d] px-6 py-16 sm:px-8"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      >
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white sm:text-4xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-[#6C63FF] px-3 py-1 text-sm font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Header with Mark All Read */}
        {unreadCount > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#111110]">
              Your Notifications
            </h2>
            <button
              onClick={handleMarkAllRead}
              className="rounded-lg bg-[#0e0e0d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2b]"
            >
              Mark All as Read
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-[#efefed] bg-white p-4"
              >
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-3/4 rounded-lg bg-gray-200" />
                    <div className="h-3 w-1/2 rounded-lg bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#6C63FF]/70">
                  {date}
                </h3>
                <div className="space-y-2">
                  {notifs.map((notif) => (
                    <NotificationRow
                      key={notif._id || notif.id}
                      notif={notif}
                      timeAgo={timeAgo}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      onAccept={handleAcceptRequest}
                      onDecline={handleDeclineRequest}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#efefed] bg-white py-20 text-center">
            <div className="mb-4 text-4xl text-[#6C63FF]">✦</div>
            <h3 className="font-['Playfair_Display'] mb-2 text-2xl font-bold text-[#111110]">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              You have no notifications at the moment. Check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ notif, timeAgo, onMarkRead, onDelete, onAccept, onDecline }) {
  const [responding, setResponding] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      new_message:              '💬',
      application_received:     '📝',
      application_accepted:     '✅',
      application_declined:     '❌',
      role_filled:              '⭐',
      follow_request:           '👤',
      follow_accepted:          '🤝',
      project_invite:           '🎬',
      message_request:          '💬',
      message_request_accepted: '🤝',
      mentorship_request:       '🎓',
      contest_announcement:     '🏆',
      platform_update:          '📢',
    };
    return icons[type] || '🔔';
  };

  const nid            = notif._id || notif.id;
  const isRead         = notif.read;
  const isAccepted     = notif._accepted;
  const isDeclined     = notif._declined;
  const isActionable   = (notif.type === 'message_request' || notif.type === 'mentorship_request')
                         && !isAccepted && !isDeclined;
  const isAcceptedType = notif.type === 'message_request_accepted';

  const handleAccept = async () => {
    setResponding(true);
    await onAccept(notif);
    setResponding(false);
  };

  const handleDecline = async () => {
    setResponding(true);
    await onDecline(notif);
    setResponding(false);
  };

  return (
    <div
      className={`rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 p-4 ${
        isRead
          ? 'border-[#efefed] bg-white'
          : 'border-l-4 border-l-[#6C63FF] border-r-[#efefed] border-t-[#efefed] border-b-[#efefed] bg-[#fdfcff]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0eeff] text-lg flex-shrink-0">
          {getNotificationIcon(notif.type)}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isRead ? 'text-gray-600' : 'font-semibold text-[#111110]'}`}>
            {notif.title}
          </p>
          <p className="mt-1 text-xs text-gray-500">{notif.message}</p>
          <p className="mt-2 text-xs text-gray-400">{timeAgo(notif.createdAt)}</p>

          {/* Accept / Decline inline action buttons */}
          {isActionable && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAccept}
                disabled={responding}
                className="rounded-lg bg-[#6C63FF] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5750D4] disabled:opacity-50"
              >
                {responding ? '…' : notif.type === 'mentorship_request' ? 'Accept & Chat' : 'Accept'}
              </button>
              <button
                onClick={handleDecline}
                disabled={responding}
                className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {/* Accepted state feedback */}
          {isAccepted && (
            <p className="mt-3 text-xs font-semibold text-green-600">✓ Accepted — opening chat…</p>
          )}

          {/* Declined state feedback */}
          {isDeclined && (
            <p className="mt-3 text-xs font-semibold text-gray-400">Declined</p>
          )}

          {/* Open Chat button for message_request_accepted */}
          {isAcceptedType && notif.link && (
            <div className="mt-3">
              <a
                href={notif.link}
                className="inline-block rounded-lg bg-[#f0eeff] px-4 py-1.5 text-xs font-semibold text-[#5750D4] transition-colors hover:bg-[#e4e1ff]"
              >
                Open Chat →
              </a>
            </div>
          )}

          {/* Prize claim button for contest_announcement with prize-claim link */}
          {notif.type === 'contest_announcement' && notif.link?.startsWith('/prize-claim') && (
            <div className="mt-3">
              <a
                href={notif.link}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                💰 Submit Payment Details →
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {!isRead && (
            <button
              onClick={() => onMarkRead(nid)}
              className="rounded-lg bg-[#f0eeff] px-3 py-1.5 text-xs font-medium text-[#5750D4] transition-colors hover:bg-[#e4e1ff]"
            >
              Mark Read
            </button>
          )}
          <button
            onClick={() => onDelete(nid)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
