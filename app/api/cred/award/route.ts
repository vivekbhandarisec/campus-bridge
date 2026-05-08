import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId, points, reason } = await req.json();
  if (!userId || !points || !reason) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });

  if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'COLLEGE_ADMIN')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.credEvent.create({ data: { userId, points, reason } }),
    prisma.user.update({ where: { id: userId }, data: { campusCred: { increment: points } } }),
  ]);

  return NextResponse.json({ message: 'Cred awarded' });
}
