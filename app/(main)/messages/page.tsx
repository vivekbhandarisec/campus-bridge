import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MessagesPanel } from '@/components/messages-panel';

interface MessagesPageProps {
  searchParams?: { user?: string };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');
  const selectedUserId = searchParams?.user;

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) redirect('/onboarding');

  const conversations = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, college: true, avatarUrl: true, role: true } },
      receiver: { select: { id: true, name: true, college: true, avatarUrl: true, role: true } },
    },
    take: 20,
  });

  const peersMap = new Map<string, { name: string; college: string; avatarUrl: string | null; role: string; lastMessage: string; updatedAt: string }>();
  conversations.forEach((message) => {
    const other = message.senderId === currentUser.id ? message.receiver : message.sender;
    const existing = peersMap.get(other.id);
    const payload = {
      name: other.name,
      college: other.college,
      avatarUrl: other.avatarUrl,
      role: other.role,
      lastMessage: message.content,
      updatedAt: message.createdAt.toISOString(),
    };
    if (!existing || payload.updatedAt > existing.updatedAt) {
      peersMap.set(other.id, payload);
    }
  });

  if (selectedUserId && selectedUserId !== currentUser.id && !peersMap.has(selectedUserId)) {
    const selectedPeer = await prisma.user.findUnique({
      where: { id: selectedUserId },
      select: { id: true, name: true, college: true, avatarUrl: true, role: true },
    });

    if (selectedPeer) {
      peersMap.set(selectedPeer.id, {
        name: selectedPeer.name,
        college: selectedPeer.college,
        avatarUrl: selectedPeer.avatarUrl,
        role: selectedPeer.role,
        lastMessage: 'Start a new conversation',
        updatedAt: new Date(0).toISOString(),
      });
    }
  }

  const peers = Array.from(peersMap.entries()).map(([userId, data]) => ({ userId, ...data }));
  const initialMessages = selectedUserId
    ? await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: selectedUserId },
            { senderId: selectedUserId, receiverId: currentUser.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  return (
    <MessagesPanel
      peers={peers}
      currentUserId={currentUser.id}
      currentClerkId={userId}
      initialSelectedUserId={selectedUserId ?? ''}
      initialMessages={initialMessages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      }))}
    />
  );
}
