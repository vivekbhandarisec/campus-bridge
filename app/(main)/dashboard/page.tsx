import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  Users, 
  CalendarDays, 
  Trophy, 
  MessageSquare, 
  Star,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Video,
  Inbox,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { CampusCredProgress } from '@/components/campus-cred-progress';

async function getDashboardData(userId: string, userRole: string) {
  const baseData = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      role: true,
      college: true,
      campusCred: true,
      skills: true,
      isAvailable: true,
    }
  });

  if (!baseData) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentlyPublished = new Date(today);
  recentlyPublished.setDate(recentlyPublished.getDate() - 30);

  // Common data
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { startDate: { gte: today } },
        { createdAt: { gte: recentlyPublished } },
      ],
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    take: 5,
    include: {
      college: { select: { name: true } }
    }
  });

  const recentPosts = await prisma.post.findMany({
    where: {
      authorId: baseData.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      type: true,
      createdAt: true,
      linkUrl: true,
      imageUrls: true,
      author: {
        select: {
          name: true,
          avatarUrl: true,
          college: true
        }
      },
      _count: {
        select: { likes: true, comments: true, shares: true },
      },
    },
  });

  // Role-specific data
  let roleSpecificData = {};

  if (userRole === 'STUDENT') {
    // AI mentor matches (simplified for now)
    const alumniMatches = await prisma.user.findMany({
      where: {
        role: 'ALUMNI',
        isAvailable: true,
        // TODO: Add AI matching logic
      },
      orderBy: { campusCred: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        currentCompany: true,
        avatarUrl: true,
        skills: true,
        campusCred: true
      }
    });

    roleSpecificData = { alumniMatches };
  } else if (userRole === 'ALUMNI') {
    const [
      mentorRequests,
      activeMentees,
      completedMentorships,
      receivedMessages,
      unreadMessages,
      sentMessages,
      recentMentorships,
      recentMessages,
    ] = await Promise.all([
      prisma.mentorRelation.count({ where: { mentorId: baseData.id, status: 'PENDING' } }),
      prisma.mentorRelation.count({ where: { mentorId: baseData.id, status: 'ACTIVE' } }),
      prisma.mentorRelation.count({ where: { mentorId: baseData.id, status: 'ENDED' } }),
      prisma.message.count({ where: { receiverId: baseData.id } }),
      prisma.message.count({ where: { receiverId: baseData.id, read: false } }),
      prisma.message.count({ where: { senderId: baseData.id } }),
      prisma.mentorRelation.findMany({
        where: { mentorId: baseData.id },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          mentee: { select: { id: true, name: true, headline: true, domain: true, avatarUrl: true } },
        },
      }),
      prisma.message.findMany({
        where: { receiverId: baseData.id },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
      }),
    ]);
    
    roleSpecificData = { 
      mentorRequests,
      activeMentees,
      totalMentored: activeMentees + completedMentorships,
      completedMentorships,
      receivedMessages,
      unreadMessages,
      sentMessages,
      recentMentorships,
      recentMessages,
    };
  }

  return {
    user: baseData,
    events,
    recentPosts,
    ...roleSpecificData
  };
}

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });

  if (!currentUser) redirect('/onboarding');

  const dashboardData = await getDashboardData(userId, currentUser.role);
  if (!dashboardData) redirect('/onboarding');

  const { user, events, recentPosts } = dashboardData;
  const alumniMatches = (dashboardData as any).alumniMatches || [];
  const mentorRequests = (dashboardData as any).mentorRequests || 0;
  const activeMentees = (dashboardData as any).activeMentees || 0;
  const totalMentored = (dashboardData as any).totalMentored || 0;
  const completedMentorships = (dashboardData as any).completedMentorships || 0;
  const receivedMessages = (dashboardData as any).receivedMessages || 0;
  const unreadMessages = (dashboardData as any).unreadMessages || 0;
  const sentMessages = (dashboardData as any).sentMessages || 0;
  const recentMentorships = (dashboardData as any).recentMentorships || [];
  const recentMessages = (dashboardData as any).recentMessages || [];

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-display mb-2">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          {user.role === 'STUDENT' 
            ? 'Track your mentor matches, upcoming events, and campus activity.'
            : user.role === 'ALUMNI'
            ? 'Track mentorship requests, student DMs, video-session readiness, and your campus impact.'
            : 'Manage your college presence and track engagement metrics.'
          }
        </p>
      </div>

      {/* CampusCred Progress */}
      <CampusCredProgress points={user.campusCred} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Role-specific content */}
        {user.role === 'STUDENT' && (
          <>
            {/* AI Mentor Matches */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-sky-500" />
                <h2 className="font-semibold text-foreground">AI Mentor Matches</h2>
              </div>
              <div className="space-y-3">
                {alumniMatches && alumniMatches.length > 0 ? (
                  alumniMatches.map((alumni: any) => (
                    <div key={alumni.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {alumni.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{alumni.name}</p>
                          <p className="text-sm text-muted-foreground">{alumni.currentCompany || 'Alumni'}</p>
                        </div>
                      </div>
                      <Badge className="border-emerald-500/20 bg-emerald-50 text-emerald-600">
                        Available
                      </Badge>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="No matches yet" 
                    description="Complete your profile to get AI-powered mentor matches." 
                  />
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <h2 className="font-semibold text-foreground">Your Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm text-foreground line-clamp-2">
                        {post.type.toLowerCase()} post
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>
          </>
        )}

        {user.role === 'ALUMNI' && (
          <>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-500" />
                  <h2 className="font-semibold text-foreground">Alumni Mentorship Hub</h2>
                </div>
                <Badge className={user.isAvailable ? 'border-emerald-500/20 bg-emerald-50 text-emerald-600' : 'border-amber-500/20 bg-amber-50 text-amber-600'}>
                  {user.isAvailable ? 'Available for mentorship' : 'Mentorship paused'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <Clock className="mb-3 h-5 w-5 text-amber-500" />
                  <p className="text-2xl font-bold text-foreground">{mentorRequests}</p>
                  <p className="text-sm text-muted-foreground">Pending requests</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <Users className="mb-3 h-5 w-5 text-teal-600" />
                  <p className="text-2xl font-bold text-foreground">{activeMentees}</p>
                  <p className="text-sm text-muted-foreground">Active mentees</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <Inbox className="mb-3 h-5 w-5 text-sky-500" />
                  <p className="text-2xl font-bold text-foreground">{unreadMessages}</p>
                  <p className="text-sm text-muted-foreground">Unread student DMs</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <Video className="mb-3 h-5 w-5 text-violet-600" />
                  <p className="text-2xl font-bold text-foreground">{activeMentees}</p>
                  <p className="text-sm text-muted-foreground">Video sessions ready</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <h2 className="font-semibold text-foreground">DM Stats</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{receivedMessages}</p>
                  <p className="text-xs text-muted-foreground">Received</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{sentMessages}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{unreadMessages}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {recentMessages.length > 0 ? (
                  recentMessages.map((message: any) => (
                    <div key={message.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{message.sender.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{message.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No student DMs yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-sky-500" />
                <h2 className="font-semibold text-foreground">Mentorship Pipeline</h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{mentorRequests}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{activeMentees}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{completedMentorships}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
                {recentMentorships.length > 0 ? (
                  recentMentorships.map((relation: any) => (
                    <div key={relation.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium text-foreground">{relation.mentee.name}</p>
                        <p className="text-sm text-muted-foreground">{relation.mentee.domain || relation.mentee.headline || 'Student mentee'}</p>
                      </div>
                      <Badge className="border-sky-500/20 bg-sky-50 text-sky-600">
                        {relation.status.toLowerCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No mentorship requests yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5 text-violet-600" />
                <h2 className="font-semibold text-foreground">Video Mentorship Readiness</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Ready sessions</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{activeMentees}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Active mentees who can be scheduled now.</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Queue pressure</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{mentorRequests > 0 ? 'Open' : 'Clear'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Based on pending mentorship requests.</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Impact total</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{totalMentored}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Active and completed mentee relationships.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {user.role === 'COLLEGE_ADMIN' && (
          <>
            {/* College Stats */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-sky-500" />
                <h2 className="font-semibold text-foreground">College Overview</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{events.length}</p>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Verified Alumni</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Events - Common for all roles */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-teal-600" />
          <h2 className="font-semibold text-foreground">Recent Events</h2>
        </div>
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.college.name}</p>
                </div>
                <Badge className="border-sky-500/20 bg-sky-50 text-sky-600">
                  {event.type.toLowerCase()}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState 
              title="No recent events" 
              description="Organizer events will appear here after they are published." 
            />
          )}
        </div>
      </div>
    </div>
  );
}
