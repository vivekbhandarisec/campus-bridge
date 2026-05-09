import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: { cid: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const deleted = await prisma.comment.deleteMany({
    where: { id: params.cid, authorId: currentUser.id },
  });

  if (deleted.count === 0) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
