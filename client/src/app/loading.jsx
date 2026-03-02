/**
 * Global loading.jsx
 * Next.js App Router renders this automatically during top-level navigation.
 */
export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080808',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderTopColor: '#f59e0b',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '0.8rem', color: '#4b5563', letterSpacing: '0.05em' }}>
          CREWUPFILMS
        </p>
      </div>
    </div>
  );
}
