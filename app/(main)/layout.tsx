import { auth } from '@clerk/nextjs/server';
import { PageShell } from '@/components/layout/PageShell';
import prisma from '@/lib/prisma';
import { MainLayoutClient } from './MainLayoutClient';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  const navUser = userId
    ? await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          role: true,
          capabilities: { select: { capability: true } },
        },
      })
    : null;

  return (
    <div className="min-h-screen">
      <MainLayoutClient navUser={navUser}>
        <main className="py-6 pb-24 lg:pb-6">
          <PageShell>
            {children}
          </PageShell>
        </main>
      </MainLayoutClient>
    </div>
  );
}
