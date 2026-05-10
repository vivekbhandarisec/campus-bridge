'use client';

import { Navbar } from '@/components/navbar';
import { OptimizedRouteWarmup } from '@/components/optimized-route-warmup';
import type { Capability, Role } from '@prisma/client';

type NavUser = {
  role: Role | null;
  capabilities: Array<{ capability: Capability }>;
} | null;

export function MainLayoutClient({ children, navUser }: { children: React.ReactNode; navUser: NavUser }) {
  return (
    <>
      <Navbar role={navUser?.role || null} capabilities={navUser?.capabilities ?? []} />
      <OptimizedRouteWarmup role={navUser?.role || null} />
      {children}
    </>
  );
}
