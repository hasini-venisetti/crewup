'use client';

/**
 * providers.jsx
 *
 * Single root-level client boundary.
 * Wraps the entire app with:
 *   1. AuthProvider  — JWT-based auth context available everywhere
 *   2. Toaster       — react-hot-toast notification system
 *
 * Kept separate from layout.jsx so layout.jsx can stay a server component
 * (required by Next.js for metadata export).
 */

import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}

      {/* Toast notification mount point */}
      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color:      '#f3f4f6',
            border:     '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize:   '0.875rem',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding:    '12px 16px',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.6)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#111' },
            style: { borderColor: 'rgba(34,197,94,0.2)' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#111' },
            style: { borderColor: 'rgba(239,68,68,0.2)' },
          },
        }}
      />
    </AuthProvider>
  );
}
