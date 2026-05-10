import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { awardCampusCredOnce } from '@/lib/cred';
import { revalidatePostViews } from '@/lib/post-cache';

async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const result = await prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });
    if (!post) return null;

    const existing = await tx.like.findUnique({
      where: { userId_postId: { userId: currentUser.id, postId: params.id } },
      select: { id: true },
    });

    if (!existing) {
      await tx.like.create({
        data: { userId: currentUser.id, postId: params.id },
      });
    }

    const likes = await tx.like.count({ where: { postId: params.id } });
    return { authorId: post.authorId, likes, created: !existing };
  });

  if (!result) return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  if (result.created && result.likes >= 100) {
    await awardCampusCredOnce(result.authorId, 10, `post:${params.id}:100_likes`);
  }
  revalidatePostViews();

  return NextResponse.json({ liked: true, likes: result.likes });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await prisma.like.deleteMany({ where: { userId: currentUser.id, postId: params.id } });
  revalidatePostViews();
  return NextResponse.json({ liked: false });
}
