/**
 * not-found.jsx
 * Next.js App Router renders this for any unmatched route.
 */
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080808',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '480px' }}>
        {/* 404 number */}
        <div
          style={{
            fontSize: 'clamp(6rem, 15vw, 10rem)',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            lineHeight: 1,
            color: 'rgba(255,255,255,0.04)',
            marginBottom: '-1rem',
          }}
        >
          404
        </div>

        <div
          style={{
            display: 'inline-block',
            backgroundColor: 'rgba(245,158,11,0.12)',
            color: '#7C75FF',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.3rem 0.9rem',
            borderRadius: '100px',
            border: '1px solid rgba(245,158,11,0.25)',
            marginBottom: '1.25rem',
          }}
        >
          Page Not Found
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#fff',
            marginBottom: '1rem',
          }}
        >
          Scene missing.
        </h1>

        <p
          style={{
            color: '#6b7280',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or was moved.
          Let&apos;s get you back to the set.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              backgroundColor: '#7C75FF',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go Home
          </Link>
          <Link
            href="/projects"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Explore Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
