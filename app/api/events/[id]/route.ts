import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { EventType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hasAnyCapability } from '@/lib/capabilities';

const EVENT_TYPES = new Set(['HACKATHON', 'CTF', 'INTERNSHIP', 'WORKSHOP']);

function cleanTags(value: unknown) {
  return Array.isArray(value)
    ? value.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
}

function cleanOptionalUrl(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

async function getOrganizer() {
  const { userId } = auth();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { clerkId: userId },
    include: { capabilities: { select: { capability: true } } },
  });
}

function revalidateEventViews(eventId: string) {
  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/feed');
  revalidatePath('/dashboard');
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getOrganizer();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, organizerId: true },
  });
  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

  const canManage = event.organizerId === currentUser.id || hasAnyCapability(currentUser, ['ADMIN']);
  if (!canManage) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const rawType = String(body.type ?? '').trim();
  const link = cleanOptionalUrl(body.link);

  if (!title || !description || !rawType || !body.startDate) {
    return NextResponse.json({ message: 'Title, description, type, and start date are required.' }, { status: 400 });
  }
  if (!EVENT_TYPES.has(rawType)) {
    return NextResponse.json({ message: 'Invalid event type.' }, { status: 400 });
  }
  if (link === '') {
    return NextResponse.json({ message: 'Event link must be a valid HTTP or HTTPS URL.' }, { status: 400 });
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      title,
      description,
      type: rawType as EventType,
      startDate: new Date(body.startDate),
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
      prize: String(body.prize ?? '').trim() || null,
      teamSize: String(body.teamSize ?? '').trim() || null,
      tags: cleanTags(body.tags),
      link,
    },
    include: {
      college: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
  });

  revalidateEventViews(event.id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getOrganizer();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, organizerId: true },
  });
  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

  const canManage = event.organizerId === currentUser.id || hasAnyCapability(currentUser, ['ADMIN']);
  if (!canManage) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  await prisma.$transaction([
    prisma.eventRegistration.deleteMany({ where: { eventId: event.id } }),
    prisma.achievementBadge.updateMany({ where: { eventId: event.id }, data: { eventId: null } }),
    prisma.event.delete({ where: { id: event.id } }),
  ]);

  revalidateEventViews(event.id);
  return NextResponse.json({ ok: true });
}
