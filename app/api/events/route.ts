import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { EventType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hasAnyCapability } from '@/lib/capabilities';
import { awardEventOrganizerBadge } from '@/lib/cred';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const eventType = type && type !== 'ALL' ? (type as EventType) : undefined;

  const events = await prisma.event.findMany({
    where: eventType ? { type: eventType } : undefined,
    include: { college: { select: { name: true } } },
    orderBy: [{ createdAt: 'desc' }, { startDate: 'asc' }],
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { capabilities: { select: { capability: true } } },
  });
  if (!currentUser || !hasAnyCapability(currentUser, ['ORGANIZER', 'ADMIN'])) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, type, startDate, registrationDeadline, prize, teamSize, tags, link } = body;
  if (!title || !description || !type || !startDate) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const college = await prisma.college.upsert({
    where: { name: currentUser.college },
    update: {},
    create: {
      name: currentUser.college,
      city: 'Unknown',
      state: 'India',
      verified: true,
    },
  });

  const event = await prisma.event.create({
    data: {
      title,
      description,
      type,
      collegeId: college.id,
      organizerId: currentUser.id,
      startDate: new Date(startDate),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      prize,
      teamSize,
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      link,
    },
    include: { college: { select: { name: true } } },
  });
  await awardEventOrganizerBadge(currentUser.id, event);

  revalidatePath('/events');
  revalidatePath('/feed');
  revalidatePath('/dashboard');

  return NextResponse.json(event);
}
