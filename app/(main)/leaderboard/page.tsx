import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { LeaderboardTable } from '@/components/leaderboard-table';

export const revalidate = 300; // Revalidate every 5 minutes

interface LeaderboardPageProps {
  searchParams?: { page?: string; domain?: string };
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) redirect('/onboarding');

  const page = parseInt(searchParams?.page || '1');
  const limit = 50;
  const skip = (page - 1) * limit;
  const domainFilter = searchParams?.domain;

  const whereClause = {
    role: 'STUDENT' as const,
    ...(domainFilter && domainFilter !== 'ALL' && { domain: domainFilter }),
  };

  const [entries, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      orderBy: [{ campusCred: 'desc' }, { name: 'asc' }],
      skip,
      take: limit,
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
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <LeaderboardTable 
      entries={entries} 
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}
