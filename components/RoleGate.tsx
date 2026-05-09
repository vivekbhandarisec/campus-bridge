'use client';

import type { Role } from '@prisma/client';
import { ReactNode } from 'react';

interface RoleGateProps {
  allow: Role | Role[];
  role: Role | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allow, role, children, fallback = null }: RoleGateProps) {
  const allowedRoles = Array.isArray(allow) ? allow : [allow];

  return role && allowedRoles.includes(role) ? <>{children}</> : <>{fallback}</>;
}
