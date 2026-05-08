import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { PostCard } from '@/components/post-card';
import { EventCard } from '@/components/event-card';
import { PostForm } from '@/components/post-form';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Sparkles, Trophy } from 'lucide-react';

async function getData(userId: string) {
  const [currentUser, posts, events, alumniMatches] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: userId } }),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: true },
    }),
    prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: { college: true },
    }),
    prisma.user.findMany({
      where: { role: 'ALUMNI', isAvailable: true },
      orderBy: { campusCred: 'desc' },
      take: 3,
    }),
  ]);

  return { currentUser, posts, events, alumniMatches };
}

export default async function FeedPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const { currentUser, posts, events, alumniMatches } = await getData(userId);
  if (!currentUser) redirect('/onboarding');
  if (!currentUser.domain || currentUser.skills.length === 0) redirect('/onboarding');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Community feed</p>
          <h1 className="page-title mt-2">Good to see you, {currentUser.name.split(' ')[0]}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Share updates, track your CampusCred, and keep an eye on mentors and events from your college network.</p>
        </div>
        <Badge className="border-emerald-500/20 bg-emerald-50 text-emerald-600">Live network</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,_1fr)] xl:grid-cols-[240px_minmax(0,_1fr)_280px]">
      <aside className="space-y-6">
        <ProfileCard user={currentUser} />
        <div className="app-card p-4">
          <h2 className="section-title">Quick stats</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-xl border border-reward-500/20 bg-reward-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-reward-500" /> CampusCred</span>
              <strong className="font-mono font-medium text-reward-500">{currentUser.campusCred}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-500" /> Matches</span>
              <strong>{alumniMatches.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-600" /> Events</span>
              <strong>{events.length}</strong>
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <PostForm />
        <div className="app-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Feed</p>
              <h2 className="section-title mt-1">Latest community posts</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {posts.length > 0 ? posts.map((post) => <PostCard key={post.id} post={post} />) : <p className="text-sm text-slate-500">No posts yet. Create the first update.</p>}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="app-card p-4">
          <h2 className="section-title">Upcoming events</h2>
          <div className="mt-4 space-y-4">
            {events.length > 0 ? events.map((event) => <EventCard key={event.id} event={event} />) : <p className="text-sm text-slate-500">No upcoming events yet.</p>}
          </div>
        </div>
        <div className="app-card p-4">
          <h2 className="section-title">Your matches</h2>
          <div className="mt-4 space-y-4">
            {alumniMatches.length > 0 ? (
              alumniMatches.map((alumni) => (
                <div key={alumni.id} className="rounded-xl border border-teal-600/15 bg-teal-50 p-3">
                  <p className="font-semibold text-slate-900">{alumni.name}</p>
                  <p className="text-sm text-slate-600">{alumni.currentCompany || 'Mentor'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No matches found yet.</p>
            )}
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
