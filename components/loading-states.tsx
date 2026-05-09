'use client';

import { useState, useEffect } from 'react';
import { PostSkeleton, ProfileCardSkeleton, EventCardSkeleton, LeaderboardSkeleton } from './skeletons';

interface LoadingStateProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function LoadingState({ children, fallback }: LoadingStateProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function FeedLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <main className="min-w-0 space-y-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div className="h-20 w-full bg-muted rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </main>
      <aside className="hidden lg:block space-y-6">
        <ProfileCardSkeleton />
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function SearchLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function LeaderboardLoadingState() {
  return <LeaderboardSkeleton />;
}
