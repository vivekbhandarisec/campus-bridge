import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePostViews } from '@/lib/post-cache';

async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 30);

  const comments = await prisma.comment.findMany({
    where: { postId: params.id, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        take: 3,
        include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } },
      },
    },
  });

  const hasMore = comments.length > limit;
  const page = hasMore ? comments.slice(0, limit) : comments;
  return NextResponse.json({
    comments: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { body, parentId } = await req.json();
  const text = String(body ?? '').trim();
  if (!text) return NextResponse.json({ message: 'Comment body is required' }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      authorId: currentUser.id,
      postId: params.id,
      body: text,
      parentId: parentId || undefined,
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });
  revalidatePostViews();

  return NextResponse.json(comment);
}
