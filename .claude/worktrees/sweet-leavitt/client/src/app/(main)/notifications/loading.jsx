export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 bg-white/10 rounded-lg w-1/3 animate-pulse" />
        </div>

        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.01] animate-pulse">
              <div className="w-6 h-6 rounded bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
              <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
