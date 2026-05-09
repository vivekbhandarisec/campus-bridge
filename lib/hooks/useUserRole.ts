'use client';

import type { Role } from '@prisma/client';
import { useEffect, useState } from 'react';

let cachedRole: Role | null | undefined;
let roleRequest: Promise<Role | null> | null = null;

async function fetchRole(): Promise<Role | null> {
  if (cachedRole !== undefined) return cachedRole;
  if (roleRequest) return roleRequest;

  roleRequest = fetch('/api/users/me')
    .then((response) => (response.ok ? response.json() : null))
    .then((user) => {
      cachedRole = user?.role ?? null;
      return cachedRole;
    })
    .catch(() => {
      cachedRole = null;
      return null;
    })
    .finally(() => {
      roleRequest = null;
    }) as Promise<Role | null>;

  return roleRequest;
}

export function useUserRole() {
  const [role, setRole] = useState<Role | null>(cachedRole ?? null);
  const [loading, setLoading] = useState(cachedRole === undefined);

  useEffect(() => {
    let active = true;

    fetchRole().then((nextRole) => {
      if (active) {
        setRole(nextRole);
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { role, loading };
}
