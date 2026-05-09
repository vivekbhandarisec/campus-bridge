import { Skeleton } from './ui/skeleton';

export function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 animate-pulse" />
            <Skeleton className="h-3 w-24 animate-pulse" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 animate-pulse" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full animate-pulse" />
        <Skeleton className="h-4 w-3/4 animate-pulse" />
        <Skeleton className="h-4 w-1/2 animate-pulse" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16 animate-pulse" />
          <Skeleton className="h-8 w-16 animate-pulse" />
          <Skeleton className="h-8 w-16 animate-pulse" />
        </div>
        <Skeleton className="h-8 w-8 animate-pulse" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="app-card overflow-hidden animate-in fade-in duration-300">
      <div className="h-20 bg-gradient-to-r from-navy via-sky-500 to-teal-600" />
      <div className="-mt-9 p-4 pt-0">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-16 w-16 rounded-full border-4 border-white animate-pulse" />
          <Skeleton className="mt-9 h-9 w-9 rounded-[10px] animate-pulse" />
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-3/4 animate-pulse" />
          <Skeleton className="h-3 w-1/2 animate-pulse" />
          <Skeleton className="h-3 w-2/3 animate-pulse" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
            <Skeleton className="h-5 w-20 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-5/6 animate-pulse" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded animate-pulse" />
            <Skeleton className="h-5 w-16 rounded animate-pulse" />
            <Skeleton className="h-5 w-14 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-reward-500/30 bg-reward-50 px-4 py-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 animate-pulse" />
            <Skeleton className="h-6 w-12 animate-pulse" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 animate-pulse" />
          <Skeleton className="h-4 w-64 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20 animate-pulse" />
          <Skeleton className="h-10 w-32 animate-pulse" />
        </div>
      </div>
      <div className="app-card overflow-x-auto">
        <table className="w-full min-w-[300px] sm:min-w-[600px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Rank</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Name</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Username</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">College</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em]">Score</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-t border-slate-100 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-8 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 animate-pulse" />
                    <Skeleton className="h-3 w-20 animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-16 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-8 w-16 rounded-full animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="app-card overflow-hidden animate-in fade-in duration-300">
      <div className="h-32 bg-gradient-to-r from-teal-500 to-cyan-600" />
      <div className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 animate-pulse" />
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-2/3 animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
              <Skeleton className="h-5 w-20 rounded-full animate-pulse" />
            </div>
            <Skeleton className="h-8 w-20 rounded-[10px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
