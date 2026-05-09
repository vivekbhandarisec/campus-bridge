import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { awardCampusCred } from '@/lib/cred';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { action } = await req.json();
  if (!['ACCEPT', 'DECLINE', 'END'].includes(action)) {
    return NextResponse.json({ message: 'action must be ACCEPT, DECLINE, or END' }, { status: 400 });
  }

  const relation = await prisma.mentorRelation.findUnique({ where: { id: params.id } });
  if (!relation || relation.mentorId !== currentUser.id) {
    return NextResponse.json({ message: 'Mentorship request not found' }, { status: 404 });
  }

  const status = action === 'ACCEPT' ? 'ACTIVE' : action === 'DECLINE' ? 'DECLINED' : 'ENDED';
  const updated = await prisma.mentorRelation.update({
    where: { id: params.id },
    data: {
      status,
      startedAt: status === 'ACTIVE' ? new Date() : relation.startedAt,
    },
    include: {
      mentor: { select: { id: true, name: true, avatarUrl: true, headline: true } },
      mentee: { select: { id: true, name: true, avatarUrl: true, headline: true } },
    },
  });

  if (status === 'ACTIVE' && relation.status !== 'ACTIVE') {
    await awardCampusCred(currentUser.id, 20, 'accepted_mentorship_request');
  }

  return NextResponse.json(updated);
}
