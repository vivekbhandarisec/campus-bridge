import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { awardCampusCredOnce, awardEventRegistrationBadges } from '@/lib/cred';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, type: true, registrationDeadline: true, startDate: true },
  });
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    return NextResponse.json({ message: 'Registration deadline has passed' }, { status: 400 });
  }

  const body = await req.json();
  const lookingForTeam = Boolean(body.lookingForTeam);
  const registration = await prisma.eventRegistration.upsert({
    where: { userId_eventId: { userId: currentUser.id, eventId: event.id } },
    update: { lookingForTeam },
    create: { userId: currentUser.id, eventId: event.id, lookingForTeam },
  });

  await awardCampusCredOnce(currentUser.id, 5, `event:${event.id}:registered`);
  await awardEventRegistrationBadges(currentUser.id, event);
  revalidatePath('/events');
  revalidatePath(`/events/${event.id}`);
  return NextResponse.json({ message: 'Registration updated', registration });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  await prisma.eventRegistration.deleteMany({
    where: { userId: currentUser.id, eventId: params.id },
  });

  revalidatePath('/events');
  revalidatePath(`/events/${params.id}`);
  return NextResponse.json({ registered: false });
}
