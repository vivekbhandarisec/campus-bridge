import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { optionId } = await req.json();
  if (!optionId) return NextResponse.json({ message: 'optionId is required' }, { status: 400 });

  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, poll: { postId: params.id } },
    select: { id: true, pollId: true },
  });
  if (!option) return NextResponse.json({ message: 'Poll option not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.pollVote.deleteMany({
      where: { userId: currentUser.id, option: { pollId: option.pollId } },
    }),
    prisma.pollVote.create({
      data: { userId: currentUser.id, optionId: option.id },
    }),
  ]);

  return NextResponse.json({ voted: true });
}
