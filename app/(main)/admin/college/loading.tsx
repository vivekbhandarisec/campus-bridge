import { Skeleton } from '@/components/Skeleton';

export default function CollegeAdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
