import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePostViews } from '@/lib/post-cache';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { body, imageUrls, linkUrl } = await request.json();

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        body,
        imageUrls,
        linkUrl,
        updatedAt: new Date(),
      },
    });
    revalidatePostViews();

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: {
        authorId: true,
        poll: {
          select: {
            id: true,
            options: { select: { id: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pollOptionIds = post.poll?.options.map((option) => option.id) ?? [];
    await prisma.$transaction([
      ...(post.poll
        ? [
            prisma.pollVote.deleteMany({ where: { optionId: { in: pollOptionIds } } }),
            prisma.pollOption.deleteMany({ where: { pollId: post.poll.id } }),
            prisma.poll.delete({ where: { id: post.poll.id } }),
          ]
        : []),
      prisma.like.deleteMany({ where: { postId: params.id } }),
      prisma.comment.deleteMany({ where: { postId: params.id } }),
      prisma.share.deleteMany({ where: { postId: params.id } }),
      prisma.bookmark.deleteMany({ where: { postId: params.id } }),
      prisma.post.delete({ where: { id: params.id } }),
    ]);
    revalidatePostViews();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
