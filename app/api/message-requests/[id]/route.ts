import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findBlockBetween } from '@/lib/messaging-policy';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { action } = await req.json().catch(() => ({}));
  if (!['ACCEPT', 'DECLINE'].includes(action)) {
    return NextResponse.json({ message: 'action must be ACCEPT or DECLINE' }, { status: 400 });
  }

  const request = await prisma.messageRequest.findUnique({ where: { id: params.id } });
  if (!request || request.receiverId !== currentUser.id || request.status !== 'PENDING') {
    return NextResponse.json({ message: 'Message request not found' }, { status: 404 });
  }

  const block = await findBlockBetween(request.requesterId, request.receiverId);
  if (block) {
    return NextResponse.json({ message: 'Messaging is blocked between these accounts.' }, { status: 403 });
  }

  const status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
  const result = await prisma.$transaction(async (tx) => {
    const nextRequest = await tx.messageRequest.update({
      where: { id: request.id },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    let message = null;
    if (status === 'ACCEPTED') {
      message = await tx.message.create({
        data: {
          senderId: request.requesterId,
          receiverId: request.receiverId,
          content: request.initialMessage,
        },
      });
    }

    return { request: nextRequest, message };
  });

  return NextResponse.json(result);
}
