'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function SessionRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };

    window.addEventListener('pageshow', refresh);

    return () => {
      window.removeEventListener('pageshow', refresh);
    };
  }, [isLoaded, router]);

  return <>{children}</>;
}
