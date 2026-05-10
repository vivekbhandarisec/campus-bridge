import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  findAcceptedMessageRequest,
  findBlockBetween,
  findLatestMessageRequest,
  getMessageRateLimitStatus,
  messagingEligibility,
} from '@/lib/messaging-policy';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const [currentUser, other] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, college: true },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true, college: true },
    }),
  ]);
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (!other) {
    return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
  }

  const [acceptedRequest, latestRequest, block] = await Promise.all([
    findAcceptedMessageRequest(currentUser.id, other.id),
    findLatestMessageRequest(currentUser.id, other.id),
    findBlockBetween(currentUser.id, other.id),
  ]);
  const eligibility = messagingEligibility(currentUser, other);

  const messages = acceptedRequest
    ? await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: other.id },
            { senderId: other.id, receiverId: currentUser.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      })
    : [];

  return NextResponse.json({
    messages,
    request: latestRequest
      ? {
          id: latestRequest.id,
          requesterId: latestRequest.requesterId,
          receiverId: latestRequest.receiverId,
          initialMessage: latestRequest.initialMessage,
          status: latestRequest.status,
          createdAt: latestRequest.createdAt,
        }
      : null,
    canMessage: Boolean(acceptedRequest),
    canRequest: eligibility.allowed && !block,
    sameCollege: Boolean(eligibility.sameCollege),
    blocked: block ? block.blockerId === currentUser.id ? 'OUTGOING' : 'INCOMING' : null,
    reason: block ? 'Messaging is blocked between these accounts.' : eligibility.reason ?? null,
  });
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const [currentUser, other] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, college: true },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true, college: true },
    }),
  ]);
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (!other) {
    return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
  }

  const { content } = await req.json();
  const trimmedContent = String(content ?? '').trim();
  if (!trimmedContent) {
    return NextResponse.json({ message: 'Missing message content' }, { status: 400 });
  }
  if (trimmedContent.length > 2000) {
    return NextResponse.json({ message: 'Message is too long' }, { status: 400 });
  }

  const [block, rateLimit, acceptedRequest] = await Promise.all([
    findBlockBetween(currentUser.id, other.id),
    getMessageRateLimitStatus(currentUser.id),
    findAcceptedMessageRequest(currentUser.id, other.id),
  ]);
  if (block) {
    return NextResponse.json({ message: 'Messaging is blocked between these accounts.' }, { status: 403 });
  }

  const eligibility = messagingEligibility(currentUser, other);
  if (!eligibility.allowed) {
    return NextResponse.json({ message: eligibility.reason }, { status: 403 });
  }

  if (rateLimit.limited) {
    return NextResponse.json({ message: rateLimit.reason }, { status: 429 });
  }

  if (!acceptedRequest) {
    const existingRequest = await findLatestMessageRequest(currentUser.id, other.id);
    if (existingRequest?.status === 'PENDING') {
      return NextResponse.json({
        requestPending: true,
        request: existingRequest,
        message: existingRequest.requesterId === currentUser.id
          ? 'Your message request is waiting for approval.'
          : 'Accept the pending request before chatting.',
      }, { status: 202 });
    }

    const request = await prisma.messageRequest.upsert({
      where: { requesterId_receiverId: { requesterId: currentUser.id, receiverId: other.id } },
      update: {
        initialMessage: trimmedContent,
        status: 'PENDING',
        respondedAt: null,
      },
      create: {
        requesterId: currentUser.id,
        receiverId: other.id,
        initialMessage: trimmedContent,
      },
    });

    return NextResponse.json({
      requestPending: true,
      request,
      message: 'Message request sent. The conversation will open after they accept.',
    }, { status: 202 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: currentUser.id,
      receiverId: other.id,
      content: trimmedContent,
    },
  });

  return NextResponse.json(message);
}
