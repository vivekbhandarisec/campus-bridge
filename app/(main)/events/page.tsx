import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';
import { EventsBoard } from '@/components/events-board';

async function getEvents(userId: string, filters?: {
  type?: string;
  college?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  noStore();
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { capabilities: { select: { capability: true } } },
  });
  
  const whereClause: any = {};
  
  if (filters?.type && filters.type !== 'ALL') {
    whereClause.type = filters.type;
  }
  
  if (filters?.college) {
    whereClause.college = {
      name: { contains: filters.college, mode: 'insensitive' }
    };
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.startDate = {};
    if (filters.startDate) {
      whereClause.startDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      whereClause.startDate.lte = new Date(filters.endDate);
    }
  }
  
  if (filters?.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { college: { name: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    orderBy: [{ createdAt: 'desc' }, { startDate: 'asc' }],
    include: { college: true },
  });
  
  return { user, events };
}

export const dynamic = 'force-dynamic';

interface EventsPageProps {
  searchParams?: {
    type?: string;
    college?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const { user, events } = await getEvents(userId, searchParams);
  if (!user) redirect('/onboarding');

  const canOrganize = user.capabilities.some((item) => item.capability === 'ORGANIZER' || item.capability === 'ADMIN');

  return <EventsBoard events={events} canOrganize={canOrganize} filters={searchParams} />;
}
