import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CalendarDays, CheckCircle2, MessageSquare, Sparkles, Trophy, Users } from 'lucide-react';

async function getSummary() {
  if (!process.env.DATABASE_URL || !prisma) {
    return { users: 150, events: 8 };
  }

  try {
    const [users, events] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
    ]);
    return { users, events };
  } catch (error) {
    console.warn('Database query failed, using demo data:', error);
    return { users: 150, events: 8 };
  }
}

export default async function HomePage() {
  const { users, events } = await getSummary();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 font-heading text-lg font-bold tracking-[-0.02em] text-navy">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-navy text-sm text-white">CB</span>
            CampusBridge
          </a>
          <div className="flex items-center gap-3">
            <a href="/sign-in" className="hidden text-sm font-semibold text-slate-600 transition hover:text-sky-500 sm:inline">Sign in</a>
            <a href="/sign-in" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-sky-500 px-4 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400">
              Start now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge className="border-sky-500/20 bg-sky-50 text-sky-500">AI campus network for engineering colleges</Badge>
            <h1 className="mt-6 max-w-3xl font-heading text-[42px] font-extrabold leading-[1.08] tracking-[-0.035em] text-navy sm:text-[48px]">
              Mentorship, events, and peer discovery in one campus workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-[1.7] text-slate-600">
              CampusBridge helps students find alumni mentors, join live opportunities, build teams, and stay connected with verified college communities.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/sign-in" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-sky-500 px-5 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400">
                Join as student
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/sign-in" className="inline-flex h-11 items-center justify-center rounded-[10px] border border-teal-600/25 bg-teal-50 px-5 text-sm font-semibold text-teal-600 transition hover:bg-white">
                Join as alumni
              </a>
              <a href="/sign-in" className="inline-flex h-11 items-center justify-center rounded-[10px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-500/40 hover:text-sky-500">
                Register college
              </a>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-4">
              <div className="app-card p-4">
                <p className="font-mono text-2xl font-medium text-reward-500">{users}+</p>
                <p className="mt-1 text-sm text-slate-600">students and alumni</p>
              </div>
              <div className="app-card p-4">
                <p className="font-mono text-2xl font-medium text-reward-500">{events}+</p>
                <p className="mt-1 text-sm text-slate-600">active opportunities</p>
              </div>
            </div>
          </div>

          <div className="app-card overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div>
                <p className="section-label">Live workspace</p>
                <h2 className="section-title mt-1">Student dashboard</h2>
              </div>
              <div className="flex -space-x-2">
                {['AS', 'RK', 'NV'].map((name) => (
                  <span key={name} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-sky-500 to-teal-600 text-xs font-semibold text-white">{name}</span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[17px] font-semibold text-navy">AI mentor match</p>
                      <p className="mt-1 text-sm text-slate-600">Priya Sharma · Security Engineer</p>
                    </div>
                    <span className="rounded-full border border-teal-600/20 bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal-600">Available</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-sky-500 to-teal-600" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <CalendarDays className="h-5 w-5 text-sky-500" />
                    <p className="mt-3 font-semibold text-navy">Hackathon board</p>
                    <p className="mt-1 text-sm text-slate-600">Find teams and register faster.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <MessageSquare className="h-5 w-5 text-teal-600" />
                    <p className="mt-3 font-semibold text-navy">Mentor chat</p>
                    <p className="mt-1 text-sm text-slate-600">Turn matches into conversations.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-navy p-5 text-white">
                <Trophy className="h-5 w-5 text-reward-500" />
                <p className="mt-4 text-sm text-slate-300">CampusCred</p>
                <p className="mt-1 font-mono text-4xl font-medium text-reward-500">720</p>
                <div className="mt-5 space-y-3 text-sm">
                  {['Answered 8 student questions', 'Hosted interview prep', 'Posted 2 opportunities'].map((item) => (
                    <div key={item} className="flex gap-2 text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-3">
          {[
            { label: 'Students', icon: Sparkles, title: 'Discover mentors and opportunities', copy: 'AI matching, event discovery, team finder, and community posts built around your profile.' },
            { label: 'Alumni', icon: Users, title: 'Mentor without friction', copy: 'Stay available, message students, share opportunities, and build a visible CampusCred reputation.' },
            { label: 'Colleges', icon: CalendarDays, title: 'Run campus activity in one place', copy: 'Publish verified events, manage registration signals, and understand team-seeker demand.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="app-card p-6">
                <Icon className="h-5 w-5 text-sky-500" />
                <p className="section-label mt-5">{item.label}</p>
                <h2 className="section-title mt-2">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
