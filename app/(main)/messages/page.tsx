import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MessagesPanel } from '@/components/messages-panel';

export default async function MessagesPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) redirect('/onboarding');

  const conversations = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: { sender: true, receiver: true },
    take: 20,
  });

  const peersMap = new Map<string, { name: string; college: string; avatarUrl: string | null; lastMessage: string; updatedAt: string }>();
  conversations.forEach((message) => {
    const other = message.senderId === currentUser.id ? message.receiver : message.sender;
    const existing = peersMap.get(other.id);
    const payload = {
      name: other.name,
      college: other.college,
      avatarUrl: other.avatarUrl,
      lastMessage: message.content,
      updatedAt: message.createdAt.toISOString(),
    };
    if (!existing || payload.updatedAt > existing.updatedAt) {
      peersMap.set(other.id, payload);
    }
  });

  const peers = Array.from(peersMap.entries()).map(([userId, data]) => ({ userId, ...data }));

  return <MessagesPanel peers={peers} currentUserId={currentUser.id} />;
}
