import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const mentorships = await prisma.mentorRelation.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ mentorId: currentUser.id }, { menteeId: currentUser.id }],
    },
    orderBy: { startedAt: 'desc' },
    include: {
      mentor: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
      mentee: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
    },
  });

  return NextResponse.json({ mentorships });
}
