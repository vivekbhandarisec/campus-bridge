'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function SessionRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      router.refresh();
    }
    previousUserId.current = userId;

    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };

    window.addEventListener('pageshow', refresh);

    return () => {
      window.removeEventListener('pageshow', refresh);
    };
  }, [isLoaded, router, userId]);

  return <>{children}</>;
}
