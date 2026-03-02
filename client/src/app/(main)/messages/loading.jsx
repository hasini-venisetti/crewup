export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#080808]/90 border-b border-white/[0.06] z-50" />
      <div className="flex-1 flex pt-16 animate-pulse">
        <div className="w-80 bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="h-5 w-24 bg-white/5 rounded" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-700 text-sm">Loading messages...</div>
        </div>
      </div>
    </div>
  );
}
