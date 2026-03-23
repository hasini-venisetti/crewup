'use client';

/**
 * useSocket — manages a singleton Socket.io connection per session.
 *
 * FIX: Uses useState (not useRef) so components re-render when the socket
 * connects and event listeners like socket.on('newMessage') actually register.
 *
 * The socket connects once and is reused across components (singleton).
 * It disconnects when the user logs out (handled in disconnectSocket).
 */

import { useState, useEffect } from 'react';
import { io }                  from 'socket.io-client';
import { getToken }            from '@/lib/auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

let socketInstance = null; // singleton — one connection for the entire session

export function useSocket() {
  // Use state so components re-render when socket connects/disconnects
  const [socket, setSocket] = useState(() =>
    socketInstance?.connected ? socketInstance : null
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Already connected — expose it immediately
    if (socketInstance?.connected) {
      setSocket(socketInstance);
      return;
    }

    // Already exists but connecting — just wait for 'connect'
    if (socketInstance) {
      const onConnect = () => setSocket(socketInstance);
      socketInstance.on('connect', onConnect);
      return () => socketInstance.off('connect', onConnect);
    }

    // Create brand-new connection
    const s = io(SOCKET_URL, {
      auth:                { token },
      transports:          ['websocket', 'polling'],
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setSocket(s);
    });

    s.on('disconnect', () => {
      // Keep the instance alive for reconnect; just nullify state
      setSocket(null);
    });

    s.on('reconnect', () => {
      setSocket(s);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socketInstance = s;

    return () => {
      // Don't disconnect on component unmount — keep the singleton alive
    };
  }, []);

  return socket;
}

/** Call this from logout to cleanly close the socket */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
