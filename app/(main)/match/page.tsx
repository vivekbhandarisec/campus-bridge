import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MatchPanel } from '@/components/match-panel';
import { getMentorMatches } from '@/lib/mentor-matches';

async function validateStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, domain: true, skills: true, bio: true, headline: true },
  });
  return user;
}

export default async function MatchPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await validateStudent(userId);
  if (!currentUser) redirect('/onboarding');
  if (currentUser.role !== 'STUDENT') redirect('/feed?notice=student-only');
  const matches = await getMentorMatches(currentUser);

  return (
    <div className="space-y-8">
      <MatchPanel initialMatches={matches} />
    </div>
  );
}
