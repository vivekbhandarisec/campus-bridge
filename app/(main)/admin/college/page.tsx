import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export default async function CollegeAdminPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (!currentUser) redirect('/onboarding');

  const college = await prisma.college.findUnique({
    where: { adminClerkId: userId },
    include: {
      events: { include: { registrations: true }, orderBy: { startDate: 'asc' } },
    },
  });

  if (currentUser.role !== 'COLLEGE_ADMIN' || !college) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-700">
        You do not have college admin access.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-navy p-8 text-white shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">College admin</p>
            <h1 className="page-title text-white">{college.name} dashboard</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white">
            Total registrations: {college.events.reduce((sum, event) => sum + event.registrations.length, 0)}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {college.events.map((event) => (
          <div key={event.id} className="app-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{event.title}</h2>
                <p className="text-sm text-slate-500">{event.type} · {formatDate(event.startDate)}</p>
              </div>
              <div className="space-y-2 text-right text-sm text-slate-600">
                <div>Registrations: {event.registrations.length}</div>
                <div>Team seekers: {event.registrations.filter((item) => item.lookingForTeam).length}</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
