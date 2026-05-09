import { Skeleton } from '@/components/Skeleton';

export default function MatchLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}
