import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { PostCard } from '@/components/post-card';
import { EventCard } from '@/components/event-card';
import { PostComposer } from '@/components/feed/PostComposer';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Sparkles, Trophy } from 'lucide-react';
import { isProfileComplete } from '@/lib/profile-completion';

async function getData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentlyPublished = new Date(today);
  recentlyPublished.setDate(recentlyPublished.getDate() - 30);

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      college: true,
      domain: true,
      skills: true,
      bio: true,
      avatarUrl: true,
      campusCred: true,
    },
  });

  const [posts, events, alumniMatches] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        authorId: true,
        body: true,
        type: true,
        visibility: true,
        createdAt: true,
        imageUrls: true,
        linkUrl: true,
        author: { select: { name: true, college: true, avatarUrl: true } },
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        _count: { select: { likes: true, comments: true, shares: true, bookmarks: true } },
        likes: { where: { user: { clerkId: userId } }, select: { id: true }, take: 1 },
        bookmarks: { where: { user: { clerkId: userId } }, select: { id: true }, take: 1 },
      },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { startDate: { gte: today } },
          { createdAt: { gte: recentlyPublished } },
        ],
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      take: 3,
      include: { college: { select: { name: true } } },
    }),
    currentUser?.role === 'STUDENT'
      ? prisma.user.findMany({
          where: { role: 'ALUMNI', isAvailable: true },
          orderBy: [{ campusCred: 'desc' }, { name: 'asc' }],
          take: 3,
          select: {
            id: true,
            name: true,
            currentCompany: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    currentUser,
    posts: posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      isBookmarked: post.bookmarks.length > 0,
      likes: undefined,
      bookmarks: undefined,
    })),
    events,
    alumniMatches,
  };
}

export default async function FeedPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const { currentUser, posts, events, alumniMatches } = await getData(userId);
  if (!currentUser) redirect('/onboarding');
  if (!isProfileComplete(currentUser)) redirect('/onboarding');
  const isStudent = currentUser.role === 'STUDENT';

  return (
    <div className="space-y-6 py-6">
      {searchParams?.notice === 'student-only' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Match is available to student accounts only.
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Community feed</p>
          <h1 className="page-title mt-2">Good to see you, {currentUser.name.split(' ')[0]}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {isStudent
              ? 'Share updates, track your CampusCred, and keep an eye on mentors and events from your college network.'
              : 'Share updates, track your CampusCred, and keep an eye on college events from your network.'}
          </p>
        </div>
        <Badge className="border-emerald-500/20 bg-emerald-50 text-emerald-600">Live network</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <main className="min-w-0 space-y-6">
        <PostComposer />
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Feed</p>
              <h2 className="section-title mt-1">Latest community posts</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {posts.length > 0 ? posts.map((post) => <PostCard key={post.id} post={post} />) : (
              <EmptyState title="No posts yet" description="Share the first update for your campus community." />
            )}
          </div>
        </div>
      </main>

      <aside className="hidden lg:block space-y-6">
        <ProfileCard user={currentUser} />
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="section-title">Quick stats</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-xl border border-reward-500/20 bg-reward-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-reward-500" /> CampusCred</span>
              <strong className="font-mono font-medium text-reward-500">{currentUser.campusCred}</strong>
            </div>
            {isStudent ? (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-500" /> Matches</span>
                <strong>{alumniMatches.length}</strong>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-600" /> Events</span>
              <strong>{events.length}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="section-title">Recent events</h2>
          <div className="mt-4 space-y-4">
            {events.length > 0 ? events.map((event) => <EventCard key={event.id} event={event} />) : (
              <EmptyState title="No recent events" description="College events will appear here when organizers publish them." />
            )}
          </div>
        </div>
        {isStudent ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="section-title">Your matches</h2>
            <div className="mt-4 space-y-4">
              {alumniMatches.length > 0 ? (
                alumniMatches.map((alumni) => (
                  <div key={alumni.id} className="rounded-xl border border-teal-600/15 bg-teal-50 p-3">
                    <p className="font-semibold text-slate-900">{alumni.name}</p>
                    <p className="text-sm leading-6 text-foreground">{alumni.currentCompany || 'Mentor'}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No matches yet" description="Complete your profile and check back when more alumni are available." />
              )}
            </div>
          </div>
        ) : null}
      </aside>
      </div>
    </div>
  );
}
