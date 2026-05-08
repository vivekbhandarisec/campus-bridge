'use client';

import type { Role } from '@prisma/client';
import { ReactNode } from 'react';
import { useUserRole } from '@/lib/hooks/useUserRole';

interface RoleGateProps {
  allow: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useUserRole();
  const allowedRoles = Array.isArray(allow) ? allow : [allow];

  if (loading) return null;
  return role && allowedRoles.includes(role) ? <>{children}</> : <>{fallback}</>;
}
