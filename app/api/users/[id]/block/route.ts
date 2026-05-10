import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  if (currentUser.id === params.id) {
    return NextResponse.json({ message: 'You cannot block yourself' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!target) return NextResponse.json({ message: 'Target user not found' }, { status: 404 });

  const block = await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: currentUser.id, blockedId: target.id } },
    update: {},
    create: { blockerId: currentUser.id, blockedId: target.id },
  });

  await prisma.messageRequest.updateMany({
    where: {
      status: 'PENDING',
      OR: [
        { requesterId: currentUser.id, receiverId: target.id },
        { requesterId: target.id, receiverId: currentUser.id },
      ],
    },
    data: { status: 'DECLINED', respondedAt: new Date() },
  });

  return NextResponse.json({ blocked: true, blockId: block.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  await prisma.userBlock.deleteMany({
    where: { blockerId: currentUser.id, blockedId: params.id },
  });

  return NextResponse.json({ blocked: false });
}
