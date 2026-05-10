import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, college: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const [incoming, outgoing] = await Promise.all([
    prisma.messageRequest.findMany({
      where: { receiverId: currentUser.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { id: true, name: true, college: true, avatarUrl: true, role: true } },
      },
    }),
    prisma.messageRequest.findMany({
      where: { requesterId: currentUser.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: { select: { id: true, name: true, college: true, avatarUrl: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json({
    incoming: incoming.map((request) => ({
      id: request.id,
      initialMessage: request.initialMessage,
      createdAt: request.createdAt,
      user: request.requester,
      sameCollege: request.requester.college.toLowerCase() === currentUser.college.toLowerCase(),
    })),
    outgoing: outgoing.map((request) => ({
      id: request.id,
      initialMessage: request.initialMessage,
      createdAt: request.createdAt,
      user: request.receiver,
      sameCollege: request.receiver.college.toLowerCase() === currentUser.college.toLowerCase(),
    })),
  });
}
