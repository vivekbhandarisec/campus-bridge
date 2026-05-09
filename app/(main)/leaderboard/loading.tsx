import { Skeleton } from '@/components/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24" />
      <Skeleton className="h-96" />
    </div>
  );
}
