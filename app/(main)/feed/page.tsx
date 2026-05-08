import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { PostCard } from '@/components/post-card';
import { EventCard } from '@/components/event-card';
import { PostForm } from '@/components/post-form';
import { Badge } from '@/components/ui/badge';

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
    <div className="grid gap-8 xl:grid-cols-[320px_minmax(640px,_1fr)_320px]">
      <aside className="space-y-6">
        <ProfileCard user={currentUser} />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick stats</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
              <span>CampusCred</span>
              <strong>{currentUser.campusCred}</strong>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
              <span>Matches available</span>
              <strong>{alumniMatches.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
              <span>Events live</span>
              <strong>{events.length}</strong>
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <PostForm />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Feed</p>
              <h2 className="text-2xl font-semibold text-slate-900">Latest community posts</h2>
            </div>
            <Badge className="bg-brand-100 text-brand-700">Live updates</Badge>
          </div>
          <div className="mt-6 space-y-4">
            {posts.length > 0 ? posts.map((post) => <PostCard key={post.id} post={post} />) : <p className="text-sm text-slate-500">No posts yet. Create the first update.</p>}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming events</h2>
          <div className="mt-4 space-y-4">
            {events.length > 0 ? events.map((event) => <EventCard key={event.id} event={event} />) : <p className="text-sm text-slate-500">No upcoming events yet.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your matches</h2>
          <div className="mt-4 space-y-4">
            {alumniMatches.length > 0 ? (
              alumniMatches.map((alumni) => (
                <div key={alumni.id} className="rounded-3xl bg-slate-50 p-4">
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
  );
}
