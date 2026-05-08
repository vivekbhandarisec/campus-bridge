'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function SessionRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const refresh = () => router.refresh();
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [isLoaded, router]);

  return <>{children}</>;
}
