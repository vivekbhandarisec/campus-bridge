import Link from 'next/link';
import { Badge } from './ui/badge';
import { formatDate } from '@/lib/utils';
import type { Event } from '@prisma/client';

interface EventCardProps {
  event: Event & { college: { name: string } };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
          <p className="text-sm text-slate-500">{event.college.name}</p>
        </div>
        <Badge className="bg-brand-100 text-brand-700">{event.type}</Badge>
      </div>
      <p className="mt-4 text-sm text-slate-600 line-clamp-2">{event.description}</p>
      <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>{formatDate(event.startDate)}</div>
        <div>{event.prize ?? 'No prize listed'}</div>
        <div>{event.teamSize ?? 'Flexible team size'}</div>
        <div>{event.tags.join(', ')}</div>
      </div>
      <Link href={`/events/${event.id}`} className="mt-5 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        View event
      </Link>
    </div>
  );
}
