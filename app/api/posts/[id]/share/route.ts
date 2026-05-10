import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePostViews } from '@/lib/post-cache';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const payload = await req.json().catch(() => ({}));
  const note = String(payload.note ?? '').trim() || null;

  const share = await prisma.share.upsert({
    where: { userId_postId: { userId: currentUser.id, postId: params.id } },
    update: { note },
    create: { userId: currentUser.id, postId: params.id, note },
  });
  revalidatePostViews();

  return NextResponse.json(share);
}
