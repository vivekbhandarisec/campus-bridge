import prisma from './prisma';

export async function awardCampusCred(userId: string, points: number, reason: string) {
  await prisma.$transaction([ 
    prisma.credEvent.create({
      data: {
        userId,
        points,
        reason,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { campusCred: { increment: points } },
    }),
  ]);
}

export async function awardCampusCredOnce(userId: string, points: number, reason: string) {
  const existing = await prisma.credEvent.findFirst({
    where: { userId, reason },
    select: { id: true },
  });
  if (existing) return false;

  await awardCampusCred(userId, points, reason);
  return true;
}

export async function awardBadge({
  userId,
  eventId,
  key,
  label,
  description,
  kind,
}: {
  userId: string;
  eventId?: string;
  key: string;
  label: string;
  description?: string;
  kind: 'ACHIEVEMENT' | 'PARTICIPATION' | 'ORGANIZER' | 'PROGRAM';
}) {
  const existing = await prisma.achievementBadge.findFirst({
    where: {
      userId,
      key,
      eventId: eventId ?? null,
    },
    select: { id: true },
  });

  if (existing) return existing;

  return prisma.achievementBadge.create({
    data: {
      userId,
      eventId,
      key,
      label,
      description,
      kind,
    },
  });
}

export async function awardEventRegistrationBadges(userId: string, event: { id: string; title: string; type: string }) {
  await awardBadge({
    userId,
    eventId: event.id,
    key: `event:${event.id}:registered`,
    label: `${event.title} participant`,
    description: `Registered for ${event.title}.`,
    kind: 'PARTICIPATION',
  });

  if (event.type === 'HACKATHON') {
    await awardBadge({
      userId,
      eventId: event.id,
      key: `event:${event.id}:hackathon`,
      label: 'Hackathon participant',
      description: `Joined the ${event.title} hackathon program.`,
      kind: 'PROGRAM',
    });
  }
}

export async function awardEventOrganizerBadge(userId: string, event: { id: string; title: string; type: string }) {
  await awardBadge({
    userId,
    eventId: event.id,
    key: `event:${event.id}:organizer`,
    label: `${event.title} organizer`,
    description: `Hosted or managed ${event.title}.`,
    kind: 'ORGANIZER',
  });
}
