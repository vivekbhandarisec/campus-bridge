import Link from 'next/link';
import { Badge } from './ui/badge';
import { formatDate } from '@/lib/utils';
import type { Event } from '@prisma/client';

interface EventCardProps {
  event: Event & { college: { name: string } };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-semibold text-navy">{event.title}</h3>
          <p className="text-sm text-slate-500">{event.college.name}</p>
        </div>
        <Badge className="border-sky-500/20 bg-sky-50 text-sky-500">{event.type}</Badge>
      </div>
      <p className="mt-4 text-sm text-slate-600 line-clamp-2">{event.description}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        <div>{formatDate(event.startDate)}</div>
        <div className="font-semibold text-reward-500">{event.prize ?? 'No prize listed'}</div>
        <div>{event.teamSize ?? 'Flexible team size'}</div>
        <div>{event.tags.join(', ')}</div>
      </div>
      <Link href={`/events/${event.id}`} className="mt-5 inline-flex h-9 items-center rounded-[10px] border border-sky-500/30 bg-sky-50 px-3 text-sm font-semibold text-sky-500 transition hover:bg-white">
        View event
      </Link>
    </div>
  );
}
