import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMentorMatches } from '@/lib/mentor-matches';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, college: true, domain: true, skills: true, bio: true, headline: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (currentUser.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const matches = await getMentorMatches(currentUser);
  return NextResponse.json(matches);
}
