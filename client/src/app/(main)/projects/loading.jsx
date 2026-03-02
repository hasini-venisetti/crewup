import { SkeletonGrid } from '@/components/ui/SkeletonCard';

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[#080808] pt-24 pb-20 px-4 max-w-[1200px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-10 space-y-2">
        <div className="h-4 w-20 bg-white/5 rounded-full" />
        <div className="h-12 w-64 bg-white/5 rounded-xl" />
        <div className="h-4 w-40 bg-white/5 rounded" />
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-10">
        <div className="h-11 flex-1 max-w-sm bg-white/5 rounded-xl" />
        <div className="h-11 w-44 bg-white/5 rounded-xl" />
        <div className="h-11 w-44 bg-white/5 rounded-xl" />
        <div className="h-11 w-36 bg-white/5 rounded-xl" />
      </div>
      <SkeletonGrid count={9} />
    </div>
  );
}
