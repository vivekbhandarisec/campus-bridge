'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';

const criticalRoutes = ['/feed', '/events', '/search', '/messages', '/leaderboard'];

const roleSpecificRoutes = {
  STUDENT: ['/match'],
  ALUMNI: ['/dashboard'],
};

export function OptimizedRouteWarmup({ role }: { role: Role | null }) {
  const router = useRouter();

  useEffect(() => {
    const routes = [
      ...criticalRoutes,
      ...(role ? roleSpecificRoutes[role] ?? [] : []),
    ];
    const prefetchRoutes = () => {
      routes.forEach((route) => router.prefetch(route));
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const warmup = setTimeout(prefetchRoutes, 1200);

    return () => clearTimeout(warmup);
  }, [role, router]);

  return null;
}
