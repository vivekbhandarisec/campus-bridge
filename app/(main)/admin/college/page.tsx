import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export default async function CollegeAdminPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const college = await prisma.college.findUnique({
    where: { adminClerkId: userId },
    include: {
      events: { include: { registrations: true }, orderBy: { startDate: 'asc' } },
    },
  });

  if (!college) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-700">
        You do not have college admin access.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-700">College admin</p>
            <h1 className="text-3xl font-semibold text-slate-900">{college.name} dashboard</h1>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Total registrations: {college.events.reduce((sum, event) => sum + event.registrations.length, 0)}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {college.events.map((event) => (
          <div key={event.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
