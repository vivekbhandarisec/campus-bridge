'use client';

import { useState, useEffect } from 'react';
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
import { useUser } from '@/contexts/UserContext';

interface DashboardData {
  user: {
    id: string;
    name: string;
    role: string;
    college: string | null;
    campusCred: number;
    skills: string[];
    isAvailable: boolean;
  };
  events: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    college: { name: string } | null;
  }>;
  recentPosts: Array<{
    id: string;
    type: string;
    createdAt: string;
    _count: { likes: number; comments: number; shares: number };
  }>;
  alumniMatches?: Array<{
    id: string;
    name: string;
    currentCompany: string | null;
    avatarUrl: string | null;
    campusCred: number;
  }>;
  mentorshipRequests?: Array<{
    id: string;
    mentee: {
      id: string;
      name: string;
      avatarUrl: string | null;
      college: { name: string } | null;
    };
    createdAt: string;
  }>;
}

export default function OptimizedDashboard() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="Error loading dashboard" description="Please try refreshing the page." />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">CampusCred</p>
              <p className="text-2xl font-bold text-slate-900">{data.user.campusCred}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-slate-900">{data.events.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Recent Posts</p>
              <p className="text-2xl font-bold text-slate-900">{data.recentPosts.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Role</p>
              <p className="text-lg font-bold text-slate-900">{data.user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Posts */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Recent Posts</h3>
            {data.recentPosts.length > 0 ? (
              <div className="space-y-3">
                {data.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{post.type}</p>
                      <p className="text-sm text-slate-600">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>❤️ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                      <span>🔄 {post._count.shares}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No posts yet" description="Share your first post to get started!" />
            )}
          </div>
        </div>

        {/* Role-specific content */}
        <div>
          {data.user.role === 'STUDENT' && data.alumniMatches && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommended Mentors</h3>
              <div className="space-y-3">
                {data.alumniMatches.map((alumni) => (
                  <div key={alumni.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{alumni.name}</p>
                      <p className="text-sm text-slate-600">{alumni.currentCompany}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                    {alumni.campusCred} Cred
                  </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.user.role === 'ALUMNI' && data.mentorshipRequests && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Mentorship Requests</h3>
              <div className="space-y-3">
                {data.mentorshipRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{request.mentee.name}</p>
                      <p className="text-sm text-slate-600">{request.mentee.college?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Events</h3>
        {data.events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event) => (
              <div key={event.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h4 className="font-medium text-slate-900 mb-2">{event.title}</h4>
                <p className="text-sm text-slate-600 mb-1">{event.college?.name}</p>
                <p className="text-sm text-slate-600">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming events" description="Check back later for new events!" />
        )}
      </div>
    </div>
  );
}
