export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="pt-24 pb-20 px-4 max-w-[1200px] mx-auto">
        <div className="text-center mb-12 space-y-4">
          <div className="h-12 bg-white/10 rounded-lg w-3/4 mx-auto animate-pulse" />
          <div className="h-6 bg-white/10 rounded-lg w-1/2 mx-auto animate-pulse" />
        </div>

        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
                <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card flex flex-col gap-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div>
                <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                <div className="h-3 bg-white/10 rounded mb-3 w-1/2" />
                <div className="h-5 bg-white/10 rounded w-20" />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  <div className="h-5 bg-white/10 rounded-md w-16" />
                  <div className="h-5 bg-white/10 rounded-md w-14" />
                  <div className="h-5 bg-white/10 rounded-md w-12" />
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06] h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
