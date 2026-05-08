import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MatchPanel } from '@/components/match-panel';

async function validateStudent(userId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  return user;
}

export default async function MatchPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await validateStudent(userId);
  if (!currentUser) redirect('/onboarding');
  if (currentUser.role !== 'STUDENT') redirect('/feed');

  return (
    <div className="space-y-8">
      <MatchPanel />
    </div>
  );
}
