/**
 * SkeletonCard — reusable pulsing placeholder for loading states.
 * Matches the dimensions of ProjectCard so layout doesn't jump.
 */
export function SkeletonCard() {
  return (
    <div className="card rounded-2xl overflow-hidden animate-pulse">
      {/* Accent bar */}
      <div className="h-[3px] bg-white/5 -mx-6 -mt-6 mb-0 rounded-t-2xl" />

      <div className="flex flex-col gap-4 pt-4">
        {/* Type + badge row */}
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-white/5 rounded-md" />
          <div className="h-5 w-16 bg-white/5 rounded-md" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-white/5 rounded-md w-4/5" />
          <div className="h-4 bg-white/5 rounded-md w-full" />
          <div className="h-4 bg-white/5 rounded-md w-3/5" />
        </div>

        {/* Roles label */}
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded w-20" />
          <div className="flex gap-1.5">
            <div className="h-6 w-16 bg-white/5 rounded-md" />
            <div className="h-6 w-20 bg-white/5 rounded-md" />
            <div className="h-6 w-14 bg-white/5 rounded-md" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-3 border-t border-white/[0.04]">
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5" />
            <div className="h-4 w-16 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Grid of skeleton cards — drop in wherever projects load */
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Full-page skeleton for dashboard-style pages */
export function SkeletonPage() {
  return (
    <div className="animate-pulse pt-24 pb-20 px-4 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-white/5 rounded-xl" />
          <div className="h-5 w-32 bg-white/5 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-white/5 rounded-xl" />
          <div className="h-10 w-32 bg-white/5 rounded-xl" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card rounded-2xl p-5 text-center space-y-2">
            <div className="h-8 w-12 bg-white/5 rounded mx-auto" />
            <div className="h-3 w-20 bg-white/5 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Tab bar */}
      <div className="h-11 w-72 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-8" />
      {/* Cards */}
      <SkeletonGrid count={3} />
    </div>
  );
}
