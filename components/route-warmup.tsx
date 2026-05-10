'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';

const commonRoutes = ['/feed', '/events', '/search', '/messages', '/leaderboard'];

export function RouteWarmup({ role }: { role: Role | null }) {
  const router = useRouter();

  useEffect(() => {
    const roleRoutes =
      role === 'STUDENT'
        ? ['/match']
        : role === 'ALUMNI'
          ? ['/dashboard']
          : [];

    const warmup = window.setTimeout(() => {
      [...commonRoutes, ...roleRoutes].forEach((route) => router.prefetch(route));
    }, 500);

    return () => window.clearTimeout(warmup);
  }, [role, router]);

  return null;
}
