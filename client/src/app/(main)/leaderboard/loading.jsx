export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="pt-24 pb-20 px-4 max-w-[1200px] mx-auto">
        <div className="text-center mb-12 space-y-4">
          <div className="h-12 bg-white/10 rounded-lg w-1/2 mx-auto animate-pulse" />
          <div className="h-5 bg-white/10 rounded-lg w-1/3 mx-auto animate-pulse" />
        </div>

        <div className="flex gap-2 justify-center mb-12">
          <div className="h-10 bg-white/10 rounded-lg w-32 animate-pulse" />
          <div className="h-10 bg-white/10 rounded-lg w-32 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card h-48 sm:h-56 animate-pulse rounded-2xl"
            />
          ))}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
