'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { Capability, Role } from '@prisma/client';

interface UserData {
  id: string;
  name: string;
  role: Role | null;
  college: string | null;
  campusCred: number;
  isAvailable: boolean;
  capabilities: Array<{ capability: Capability }>;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (signal?: AbortSignal) => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/me', {
        cache: 'no-store',
        signal,
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401 || response.status === 404) {
        setUser(null);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to fetch user data:', error);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    const controller = new AbortController();
    refreshUser(controller.signal);
    return () => controller.abort();
  }, [isLoaded, refreshUser]);

  const value = useMemo(() => ({ user, loading, refreshUser: () => refreshUser() }), [loading, refreshUser, user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
