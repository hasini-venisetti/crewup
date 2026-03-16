'use client';

/**
 * Root error boundary for Next.js App Router.
 * Catches unhandled errors in any page/layout below the root.
 * Displays the actual error message so it's easy to debug.
 */
export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-[#111110] mb-2">Something went wrong</h1>
          <p className="text-[#6b6b66] text-sm">
            An unexpected error occurred. Please try again or contact support.
          </p>
        </div>

        {/* Show error details for debugging */}
        {error?.message && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Error details</p>
            <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
            {error?.stack && (
              <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#111110] text-white text-sm font-semibold rounded-lg hover:bg-[#2d2d2b] transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-[#e0e0dd] text-[#6b6b66] text-sm font-semibold rounded-lg hover:border-[#111110] hover:text-[#111110] transition"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
