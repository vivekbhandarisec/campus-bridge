'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';

// Only prefetch critical routes that users are most likely to visit
const criticalRoutes = ['/feed', '/events'];

const roleSpecificRoutes = {
  STUDENT: ['/match'],
  ALUMNI: ['/dashboard'],
  COLLEGE_ADMIN: ['/admin/college'],
};

export function OptimizedRouteWarmup({ role }: { role: Role | null }) {
  const router = useRouter();

  useEffect(() => {
    // Delay prefetching to not block initial page load
    const warmup = window.setTimeout(() => {
      // Prefetch critical routes first
      criticalRoutes.forEach((route) => router.prefetch(route));

      // Prefetch role-specific routes
      if (role && roleSpecificRoutes[role]) {
        roleSpecificRoutes[role].forEach((route) => router.prefetch(route));
      }
    }, 1000); // Increased delay to prioritize initial page load

    return () => window.clearTimeout(warmup);
  }, [role, router]);

  return null;
}
