import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { EventDetail } from '@/components/event-detail';

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const [user, event] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: userId } }),
    prisma.event.findUnique({
      where: { id: params.id },
      include: { college: true, registrations: { include: { user: true } } },
    }),
  ]);

  if (!user) redirect('/onboarding');
  if (!event) redirect('/events');

  const registration = event.registrations.find((item) => item.userId === user.id);
  const participants = event.registrations
    .filter((item) => item.lookingForTeam)
    .map((item) => ({
      id: item.user.id,
      name: item.user.name,
      college: item.user.college,
      skills: item.user.skills,
      lookingForTeam: item.lookingForTeam,
    }));

  return (
    <EventDetail
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        prize: event.prize,
        teamSize: event.teamSize,
        tags: event.tags,
        link: event.link,
        college: { name: event.college.name },
        registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
      }}
      initialRegistered={Boolean(registration)}
      initialLookingForTeam={registration?.lookingForTeam ?? false}
      participants={participants}
    />
  );
}
