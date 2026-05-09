import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  if (currentUser.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Only students can request mentorship' }, { status: 403 });
  }

  const { mentorId, note } = await req.json();
  if (!mentorId || mentorId === currentUser.id) {
    return NextResponse.json({ message: 'A valid mentorId is required' }, { status: 400 });
  }

  const mentor = await prisma.user.findUnique({ where: { id: mentorId }, select: { role: true } });
  if (!mentor || mentor.role !== 'ALUMNI') {
    return NextResponse.json({ message: 'Mentor must be an alumni user' }, { status: 400 });
  }

  const relation = await prisma.mentorRelation.upsert({
    where: { mentorId_menteeId: { mentorId, menteeId: currentUser.id } },
    update: { note: String(note ?? '').trim() || null, status: 'PENDING' },
    create: {
      mentorId,
      menteeId: currentUser.id,
      note: String(note ?? '').trim() || null,
    },
    include: {
      mentor: { select: { id: true, name: true, avatarUrl: true, headline: true } },
      mentee: { select: { id: true, name: true, avatarUrl: true, headline: true } },
    },
  });

  return NextResponse.json(relation);
}
