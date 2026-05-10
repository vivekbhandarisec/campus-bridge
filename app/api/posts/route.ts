import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { awardCampusCred } from '@/lib/cred';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { PUBLIC_POSTS_CACHE_TAG, revalidatePostViews } from '@/lib/post-cache';
import type { PostType, Visibility } from '@prisma/client';

const POST_TYPES = new Set(['TEXT', 'IMAGE', 'POLL', 'LINK']);
const VISIBILITIES = new Set(['PUBLIC', 'CONNECTIONS', 'COLLEGE_ONLY']);
const DAILY_POST_LIMIT = 3;

function postWindowStart() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

async function uploadPostImages(files: File[], authorId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Storage is not configured');
  }

  const imageUrls: string[] = [];

  for (const file of files.slice(0, 4)) {
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${authorId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from('post-images')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}

const getPosts = unstable_cache(
  async (cursor: string | null, limit: number) => {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: { visibility: 'PUBLIC' },
      select: {
        id: true,
        authorId: true,
        body: true,
        type: true,
        visibility: true,
        createdAt: true,
        imageUrls: true,
        linkUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            college: true,
            avatarUrl: true,
            role: true,
          },
        },
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        _count: { select: { likes: true, comments: true, shares: true, bookmarks: true } },
      },
    });

    return posts;
  },
  ['public-posts'],
  { revalidate: 30, tags: [PUBLIC_POSTS_CACHE_TAG] }
);

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50);

  const posts = await getPosts(cursor, limit);

  // Get current user for personalized data
  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const postIds = posts.map((post) => post.id);
  const [likedPosts, bookmarkedPosts, postsInWindow] = await Promise.all([
    prisma.like.findMany({
      where: { userId: currentUser.id, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.bookmark.findMany({
      where: { userId: currentUser.id, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.post.count({ where: { authorId: currentUser.id, createdAt: { gte: postWindowStart() } } }),
  ]);

  const likedPostIds = new Set(likedPosts.map((like) => like.postId));
  const bookmarkedPostIds = new Set(bookmarkedPosts.map((bookmark) => bookmark.postId));

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  return NextResponse.json({
    posts: page.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    postQuota: {
      limit: DAILY_POST_LIMIT,
      used: postsInWindow,
      remaining: Math.max(0, DAILY_POST_LIMIT - postsInWindow),
      windowHours: 24,
    },
  });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const postsInWindow = await prisma.post.count({
    where: { authorId: currentUser.id, createdAt: { gte: postWindowStart() } },
  });
  if (postsInWindow >= DAILY_POST_LIMIT) {
    return NextResponse.json({
      message: 'Daily post limit reached. You can create up to 3 posts every 24 hours.',
      postQuota: {
        limit: DAILY_POST_LIMIT,
        used: postsInWindow,
        remaining: 0,
        windowHours: 24,
      },
    }, { status: 429 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  let body = '';
  let type: PostType = 'TEXT';
  let visibility: Visibility = 'PUBLIC';
  let linkUrl: string | null = null;
  let imageUrls: string[] = [];
  let pollOptions: string[] = [];
  let files: File[] = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    body = String(formData.get('body') ?? '').trim();
    const rawType = String(formData.get('type') ?? 'TEXT');
    const rawVisibility = String(formData.get('visibility') ?? 'PUBLIC');
    type = (POST_TYPES.has(rawType) ? rawType : 'TEXT') as PostType;
    visibility = (VISIBILITIES.has(rawVisibility) ? rawVisibility : 'PUBLIC') as Visibility;
    linkUrl = String(formData.get('linkUrl') ?? '').trim() || null;
    pollOptions = JSON.parse(String(formData.get('pollOptions') ?? '[]')).filter(Boolean);

    files = Array.from(formData.values()).filter(
      (value): value is File => value instanceof File && value.type.startsWith('image/'),
    );
  } else {
    const payload = await req.json();
    body = String(payload.body ?? '').trim();
    const rawType = String(payload.type ?? 'TEXT');
    const rawVisibility = String(payload.visibility ?? 'PUBLIC');
    type = (POST_TYPES.has(rawType) ? rawType : 'TEXT') as PostType;
    visibility = (VISIBILITIES.has(rawVisibility) ? rawVisibility : 'PUBLIC') as Visibility;
    linkUrl = payload.linkUrl ?? null;
    imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls.slice(0, 4) : [];
    pollOptions = Array.isArray(payload.pollOptions) ? payload.pollOptions.filter(Boolean) : [];
  }

  if (!body && type === 'TEXT') {
    return NextResponse.json({ message: 'Missing body or type' }, { status: 400 });
  }
  if (type === 'POLL' && pollOptions.length < 2) {
    return NextResponse.json({ message: 'Poll posts need at least two options' }, { status: 400 });
  }
  if (type === 'LINK' && !linkUrl) {
    return NextResponse.json({ message: 'Link posts need a URL' }, { status: 400 });
  }
  if (type === 'IMAGE' && imageUrls.length === 0) {
    if (files.length === 0) {
      return NextResponse.json({ message: 'Image posts need at least one image' }, { status: 400 });
    }
    try {
      imageUrls = await uploadPostImages(files, currentUser.id);
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      return NextResponse.json({ message: 'Image upload failed' }, { status: 500 });
    }
  }
  if (type === 'IMAGE' && imageUrls.length === 0) {
    return NextResponse.json({ message: 'Image posts need at least one image' }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: currentUser.id,
      body,
      type,
      visibility,
      imageUrls: type === 'IMAGE' ? imageUrls : [],
      linkUrl,
      poll: type === 'POLL'
        ? { create: { options: { create: pollOptions.slice(0, 4).map((text) => ({ text })) } } }
        : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          college: true,
          avatarUrl: true,
          role: true,
        },
      },
      poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
      _count: { select: { likes: true, comments: true, shares: true, bookmarks: true } },
    },
  });

  await awardCampusCred(currentUser.id, 5, 'created_post');
  revalidatePostViews();

  return NextResponse.json({
    ...post,
    postQuota: {
      limit: DAILY_POST_LIMIT,
      used: postsInWindow + 1,
      remaining: Math.max(0, DAILY_POST_LIMIT - postsInWindow - 1),
      windowHours: 24,
    },
  });
}
