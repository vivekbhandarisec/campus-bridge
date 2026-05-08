import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

async function getSummary() {
  if (!process.env.DATABASE_URL || !prisma) {
    return { users: 150, events: 8 };  // Demo data
  }

  try {
    const [users, events] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
    ]);
    return { users, events };
  } catch (error) {
    console.warn('Database query failed, using demo data:', error);
    return { users: 150, events: 8 };  // Demo fallback
  }
}

export default async function HomePage() {
  const { users, events } = await getSummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 shadow-soft">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="bg-brand-100 text-brand-700">CAMPUSBRIDGE DEMO</Badge>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                Connect with your seniors. Find your team. Never miss an opportunity.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CampusBridge brings engineering students, mentors, and colleges together with AI-powered matching, live events, and career-focused communities.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/sign-in" className="rounded-3xl bg-brand-600 px-6 py-4 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
                Join as Student
              </Link>
              <Link href="/sign-in" className="rounded-3xl border border-slate-200 px-6 py-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Join as Alumni
              </Link>
              <Link href="/sign-in" className="rounded-3xl border border-slate-200 px-6 py-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Register your College
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Students</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Explore mentors, careers, and events</h2>
              <p className="mt-3 text-sm text-slate-600">Find senior alumni, join hackathons, and build your network from day one.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alumni</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Give back to talent and grow your legacy</h2>
              <p className="mt-3 text-sm text-slate-600">Mentor rising engineers, post opportunities, and engage with college communities.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Colleges</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Launch events, recruit top students, and verify college presence</h2>
              <p className="mt-3 text-sm text-slate-600">Create verified event listings and manage registrations from a unified dashboard.</p>
            </div>
          </div>

          <div className="mt-12 grid gap-6 rounded-3xl bg-slate-950 px-8 py-10 text-white sm:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Live community</p>
              <p className="mt-3 text-3xl font-semibold">{users}+ students & alumni</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hackathon pulse</p>
              <p className="mt-3 text-3xl font-semibold">{events}+ events available now</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-brand-600 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-100">Demo flow</p>
              <p className="mt-2 text-base leading-7 text-white/90">Sign in, complete onboarding, view AI mentor matches, join a hackathon, and connect with recruiters.</p>
            </div>
            <Link href="/sign-in" className="inline-flex rounded-3xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm hover:bg-slate-100">
              Start demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
