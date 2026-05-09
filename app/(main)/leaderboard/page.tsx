import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { LeaderboardTable } from '@/components/leaderboard-table';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function LeaderboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) redirect('/onboarding');

  const entries = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: [{ campusCred: 'desc' }, { name: 'asc' }],
    take: 50,
    select: {
      id: true,
      name: true,
      username: true,
      college: true,
      currentCompany: true,
      campusCred: true,
      domain: true,
      avatarUrl: true,
    },
  });

  return <LeaderboardTable entries={entries} />;
}
