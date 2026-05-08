import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { awardCampusCred } from '@/lib/cred';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  const body = await req.json();
  const lookingForTeam = Boolean(body.lookingForTeam);
  const registration = await prisma.eventRegistration.findFirst({
    where: { userId: currentUser.id, eventId: event.id },
  });

  if (registration) {
    const updated = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { lookingForTeam },
    });
    return NextResponse.json({ message: 'Registration updated', registration: updated });
  }

  await prisma.eventRegistration.create({
    data: {
      userId: currentUser.id,
      eventId: event.id,
      lookingForTeam,
    },
  });

  await awardCampusCred(currentUser.id, 5, 'registered_event');
  return NextResponse.json({ message: 'Registered' });
}
