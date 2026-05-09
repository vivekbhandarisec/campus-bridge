import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const other = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });
  if (!other) {
    return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: other.id },
        { senderId: other.id, receiverId: currentUser.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const other = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });
  if (!other) {
    return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
  }

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ message: 'Missing message content' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: currentUser.id,
      receiverId: other.id,
      content,
    },
  });

  return NextResponse.json(message);
}
