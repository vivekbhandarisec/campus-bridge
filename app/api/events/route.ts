import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { EventType } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const eventType = type && type !== 'ALL' ? (type as EventType) : undefined;

  const events = await prisma.event.findMany({
    where: eventType ? { type: eventType } : undefined,
    include: { college: true },
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser || currentUser.role !== 'COLLEGE_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const college = await prisma.college.findUnique({ where: { adminClerkId: userId } });
  if (!college) {
    return NextResponse.json({ message: 'College not found' }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, type, startDate, registrationDeadline, prize, teamSize, tags, link } = body;
  if (!title || !description || !type || !startDate) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      type,
      collegeId: college.id,
      startDate: new Date(startDate),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      prize,
      teamSize,
      tags: Array.isArray(tags) ? tags : [],
      link,
    },
  });

  return NextResponse.json(event);
}
