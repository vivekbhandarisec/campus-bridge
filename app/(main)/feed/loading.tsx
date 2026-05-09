import { Skeleton } from '@/components/Skeleton';

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20" />
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,_1fr)] xl:grid-cols-[240px_minmax(0,_1fr)_280px]">
        <Skeleton className="h-80" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
