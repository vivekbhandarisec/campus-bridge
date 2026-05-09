import { Skeleton } from '@/components/Skeleton';

export default function MessagesLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
  );
}
