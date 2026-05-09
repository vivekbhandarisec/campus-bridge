import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await prisma.like.upsert({
    where: { userId_postId: { userId: currentUser.id, postId: params.id } },
    update: {},
    create: { userId: currentUser.id, postId: params.id },
  });

  return NextResponse.json({ liked: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await prisma.like.deleteMany({ where: { userId: currentUser.id, postId: params.id } });
  return NextResponse.json({ liked: false });
}
