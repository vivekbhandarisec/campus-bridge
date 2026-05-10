import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePostViews } from '@/lib/post-cache';

export async function DELETE(_req: Request, { params }: { params: { cid: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const comment = await prisma.comment.findUnique({
    where: { id: params.cid },
    select: {
      id: true,
      authorId: true,
      post: { select: { authorId: true } },
    },
  });

  if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
  const canDelete = comment.authorId === currentUser.id || comment.post.authorId === currentUser.id;
  if (!canDelete) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { parentId: params.cid } }),
    prisma.comment.delete({ where: { id: params.cid } }),
  ]);
  revalidatePostViews();
  return NextResponse.json({ success: true });
}
