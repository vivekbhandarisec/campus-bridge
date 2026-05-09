import { Skeleton } from '@/components/Skeleton';

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36" />
      <Skeleton className="h-20" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
