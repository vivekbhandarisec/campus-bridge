'use client';

import { Navbar } from '@/components/navbar';
import { useUser } from '@/contexts/UserContext';

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <>
      <Navbar role={user?.role || null} />
      {children}
    </>
  );
}
