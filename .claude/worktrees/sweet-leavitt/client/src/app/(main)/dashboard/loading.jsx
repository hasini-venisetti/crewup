import { SkeletonPage } from '@/components/ui/SkeletonCard';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav placeholder */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#080808]/90 border-b border-white/[0.06] z-50" />
      <SkeletonPage />
    </div>
  );
}
