import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { EventsBoard } from '@/components/events-board';

async function getEvents(userId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'asc' },
    include: { college: true },
  });
  return { user, events };
}

export default async function EventsPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const { user, events } = await getEvents(userId);
  if (!user) redirect('/onboarding');

  return <EventsBoard events={events} currentRole={user.role} />;
}
