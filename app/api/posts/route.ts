import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { awardCampusCred } from '@/lib/cred';

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50);

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: {
        select: {
          name: true,
          college: true,
          avatarUrl: true,
        },
      },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const { content, type } = await req.json();
  if (!content || !type) {
    return NextResponse.json({ message: 'Missing content or type' }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: currentUser.id,
      content,
      type,
    },
    include: {
      author: {
        select: {
          name: true,
          college: true,
          avatarUrl: true,
        },
      },
    },
  });

  await awardCampusCred(currentUser.id, 10, 'created_post');
  return NextResponse.json(post);
}
