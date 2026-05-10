import prisma from '@/lib/prisma';
import type { Role } from '@prisma/client';

export type MessagingUser = {
  id: string;
  role: Role;
  college: string;
};

export function isSameCollege(user: Pick<MessagingUser, 'college'>, other: Pick<MessagingUser, 'college'>) {
  return user.college.trim().toLowerCase() === other.college.trim().toLowerCase();
}

export function messagingEligibility(currentUser: MessagingUser, targetUser: MessagingUser) {
  if (currentUser.id === targetUser.id) {
    return { allowed: false, reason: 'You cannot message yourself.' };
  }

  if (currentUser.role === 'STUDENT' && targetUser.role === 'ALUMNI') {
    return isSameCollege(currentUser, targetUser)
      ? { allowed: true, sameCollege: true }
      : { allowed: false, reason: 'Students can message alumni from their own college only.' };
  }

  if (currentUser.role === 'STUDENT' && targetUser.role === 'STUDENT') {
    return { allowed: true, sameCollege: isSameCollege(currentUser, targetUser) };
  }

  if (currentUser.role === 'ALUMNI' && targetUser.role === 'STUDENT') {
    return { allowed: true, sameCollege: isSameCollege(currentUser, targetUser) };
  }

  return { allowed: false, reason: 'This message path is not available.' };
}

export async function findAcceptedMessageRequest(userId: string, otherUserId: string) {
  return prisma.messageRequest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userId, receiverId: otherUserId },
        { requesterId: otherUserId, receiverId: userId },
      ],
    },
    select: { id: true },
  });
}

export async function findLatestMessageRequest(userId: string, otherUserId: string) {
  return prisma.messageRequest.findFirst({
    where: {
      OR: [
        { requesterId: userId, receiverId: otherUserId },
        { requesterId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findBlockBetween(userId: string, otherUserId: string) {
  return prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
}

export async function getMessageRateLimitStatus(senderId: string) {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recentMessages, recentRequests] = await Promise.all([
    prisma.message.count({ where: { senderId, createdAt: { gte: oneMinuteAgo } } }),
    prisma.messageRequest.count({ where: { requesterId: senderId, createdAt: { gte: oneHourAgo } } }),
  ]);

  if (recentMessages >= 8) {
    return { limited: true, reason: 'You are sending messages too quickly. Please wait a minute.' };
  }
  if (recentRequests >= 5) {
    return { limited: true, reason: 'You have sent too many message requests recently. Please try again later.' };
  }

  return { limited: false };
}
