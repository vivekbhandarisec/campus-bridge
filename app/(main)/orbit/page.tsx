import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { PostCard } from '@/components/post-card';
import { EmptyState } from '@/components/EmptyState';

async function getOrbitFeed(userId: string) {
  // Get users that current user is orbiting
  const orbitedUsers = await prisma.user.findMany({
    where: {
      orbitTo: {
        some: {
          fromUserId: userId
        }
      }
    },
    select: { id: true }
  });

  const orbitedUserIds = orbitedUsers.map(user => user.id);

  // Get posts from orbited users
  const posts = await prisma.post.findMany({
    where: {
      authorId: {
        in: [...orbitedUserIds, userId] // Include user's own posts
      },
      visibility: 'PUBLIC' // Will be updated when schema is available
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          college: true,
          role: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  return { posts };
}

export default async function OrbitPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, name: true }
  });

  if (!currentUser) redirect('/onboarding');

  const { posts } = await getOrbitFeed(currentUser.id);

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-display mb-2">Your Orbit</h1>
        <p className="text-muted-foreground">Posts from people you have added to your orbit</p>
      </div>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post as any} />
          ))
        ) : (
          <EmptyState 
            title="No posts in your orbit yet" 
            description="Start by adding alumni and peers to your orbit to see their updates here." 
          />
        )}
      </div>
    </div>
  );
}
