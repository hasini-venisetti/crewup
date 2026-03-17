'use client';

/**
 * useSocket — manages a singleton Socket.io connection per session.
 *
 * Usage:
 *   const socket = useSocket();    // connects automatically when user is logged in
 *   socket.on('newMessage', handler);
 *   socket.emit('sendMessage', { conversationId, text });
 *
 * The socket connects once and is reused across components.
 * It disconnects when the user logs out (token removed).
 */

import { useEffect, useRef } from 'react';
import { io }                from 'socket.io-client';
import { getToken }          from '@/lib/auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

let socketInstance = null;   // singleton

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Reuse existing connection if it exists and is still connected
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    // Create a new connection
    const socket = io(SOCKET_URL, {
      auth:           { token },
      transports:     ['websocket', 'polling'],
      reconnection:   true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      // connected
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socketInstance    = socket;
    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — keep the singleton alive
      // Only disconnect on explicit logout (handled in useAuth)
    };
  }, []);

  return socketRef.current;
}

/** Call this from logout to close the socket connection */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
