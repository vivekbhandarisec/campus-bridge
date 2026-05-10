'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { formatDate } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  college: string;
  skills: string[];
  lookingForTeam: boolean;
}

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string | null;
    organizerId: string | null;
    prize: string | null;
    teamSize: string | null;
    tags: string[];
    link: string | null;
    college: { name: string };
    registrationDeadline: string | null;
  };
  initialRegistered: boolean;
  initialLookingForTeam: boolean;
  currentUserId: string;
  participants: Participant[];
}

export function EventDetail({ event, initialRegistered, initialLookingForTeam, currentUserId, participants }: EventDetailProps) {
  const router = useRouter();
  const [registered, setRegistered] = useState(initialRegistered);
  const [lookingForTeam, setLookingForTeam] = useState(initialLookingForTeam);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const isOrganizer = event.organizerId === currentUserId;

  const submit = async () => {
    if (pending) return;
    setMessage('');
    setPending(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookingForTeam }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || 'Action failed.');
        return;
      }
      setRegistered(true);
      setMessage('Registration updated.');
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const unregister = async () => {
    if (pending) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(`/api/events/${event.id}/register`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.message || 'Could not dismiss registration.');
        return;
      }
      setRegistered(false);
      setLookingForTeam(false);
      setMessage('Registration dismissed.');
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="app-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-label text-sky-500">{event.type}</p>
            <h1 className="page-title mt-3">{event.title}</h1>
            <p className="mt-3 text-sm text-slate-600">Hosted by {event.college.name} · {formatDate(event.startDate)}</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <div>Prize: <span className="font-semibold text-reward-500">{event.prize || 'None'}</span></div>
            <div>Team size: {event.teamSize || 'Flexible'}</div>
            <div>Starts: {formatDate(event.startDate)}</div>
            <div>Register by: {event.registrationDeadline ? formatDate(event.registrationDeadline) : 'Open'}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
            <h2 className="font-semibold text-slate-900">About the event</h2>
            <p className="mt-3 text-sm leading-7">{event.description}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
            <h2 className="font-semibold text-slate-900">Details</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {event.link ? (
                <li>
                  Link: <a target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-400 hover:underline" href={event.link}>{event.link}</a>
                </li>
              ) : null}
              <li>Tags: {event.tags.join(', ')}</li>
            </ul>
          </article>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={submit} disabled={pending || isOrganizer}>{pending ? 'Saving...' : registered ? 'Update registration' : 'Register'}</Button>
            {registered ? (
              <Button onClick={unregister} disabled={pending} className="border border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50 hover:shadow-none">
                Dismiss registration
              </Button>
            ) : null}
            {event.type === 'HACKATHON' ? (
              <label className="inline-flex items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={lookingForTeam} onChange={() => setLookingForTeam((value) => !value)} />
                Looking for teammates
              </label>
            ) : null}
          </div>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </div>

      <div className="app-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Team Finder</h2>
          <p className="text-sm text-slate-500">Students looking for teammates</p>
        </div>
        <div className="mt-6 space-y-4">
          {participants.length > 0 ? (
            participants.map((participant) => (
              <div key={participant.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{participant.name}</p>
                    <p className="text-sm text-slate-600">{participant.college}</p>
                  </div>
                  <div className="text-sm text-slate-500">Skills: {participant.skills.join(', ')}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No team seekers yet. Register and encourage classmates to join.</p>
          )}
        </div>
      </div>
    </div>
  );
}
