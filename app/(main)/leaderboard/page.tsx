import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { LeaderboardTable } from '@/components/leaderboard-table';

export default async function LeaderboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) redirect('/onboarding');

  const entries = await prisma.user.findMany({
    where: { role: 'ALUMNI' },
    orderBy: { campusCred: 'desc' },
    take: 20,
  });

  return <LeaderboardTable entries={entries} />;
}
