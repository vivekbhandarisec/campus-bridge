'use client';

import type { Role } from '@prisma/client';
import { useEffect, useState } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      try {
        const response = await fetch('/api/users/me', { cache: 'no-store' });
        if (!response.ok) {
          if (active) setRole(null);
          return;
        }

        const user = await response.json();
        if (active) setRole(user.role ?? null);
      } catch {
        if (active) setRole(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRole();
    return () => {
      active = false;
    };
  }, []);

  return { role, loading };
}
