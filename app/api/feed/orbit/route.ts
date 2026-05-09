import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const getOrbitPosts = unstable_cache(
  async (currentUserId: string, orbitedUserIds: string[], cursor: string | null, limit: number) => {
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: [currentUserId, ...orbitedUserIds] },
        visibility: { in: ['PUBLIC', 'CONNECTIONS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, college: true, role: true } },
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        _count: { select: { likes: true, comments: true, shares: true, bookmarks: true } },
        likes: { where: { userId: currentUserId }, select: { id: true }, take: 1 },
        bookmarks: { where: { userId: currentUserId }, select: { id: true }, take: 1 },
      },
    });
    return posts;
  },
  ['orbit-posts'],
  { revalidate: 60 } // Cache for 1 minute
);

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  const orbited = await prisma.orbit.findMany({
    where: { fromUserId: currentUser.id },
    select: { toUserId: true },
  });

  const posts = await getOrbitPosts(currentUser.id, orbited.map((item) => item.toUserId), cursor, limit);

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  return NextResponse.json({
    posts: page.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      isBookmarked: post.bookmarks.length > 0,
      likes: undefined,
      bookmarks: undefined,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}
