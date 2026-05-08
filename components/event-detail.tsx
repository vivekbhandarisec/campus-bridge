'use client';

import { useState } from 'react';
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
    prize: string | null;
    teamSize: string | null;
    tags: string[];
    link: string | null;
    college: { name: string };
    registrationDeadline: string | null;
  };
  initialRegistered: boolean;
  initialLookingForTeam: boolean;
  participants: Participant[];
}

export function EventDetail({ event, initialRegistered, initialLookingForTeam, participants }: EventDetailProps) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [lookingForTeam, setLookingForTeam] = useState(initialLookingForTeam);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    const response = await fetch(`/api/events/${event.id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lookingForTeam }),
    });
    if (!response.ok) {
      setMessage('Action failed.');
      return;
    }
    setRegistered(true);
    setMessage('Registration updated. Refresh to see exact participant list.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-700">{event.type}</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{event.title}</h1>
            <p className="mt-3 text-sm text-slate-600">Hosted by {event.college.name} · {formatDate(event.startDate)}</p>
          </div>
          <div className="space-y-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
            <div>Prize: {event.prize || 'None'}</div>
            <div>Team size: {event.teamSize || 'Flexible'}</div>
            <div>Starts: {formatDate(event.startDate)}</div>
            <div>Register by: {event.registrationDeadline ? formatDate(event.registrationDeadline) : 'Open'}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl bg-slate-50 p-6 text-slate-700">
            <h2 className="font-semibold text-slate-900">About the event</h2>
            <p className="mt-3 text-sm leading-7">{event.description}</p>
          </article>
          <article className="rounded-3xl bg-slate-50 p-6 text-slate-700">
            <h2 className="font-semibold text-slate-900">Details</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {event.link ? (
                <li>
                  Link: <a target="_blank" rel="noreferrer" className="text-brand-600 hover:underline" href={event.link}>{event.link}</a>
                </li>
              ) : null}
              <li>Tags: {event.tags.join(', ')}</li>
            </ul>
          </article>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={submit}>{registered ? 'Update registration' : 'Register'}</Button>
            {event.type === 'HACKATHON' ? (
              <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={lookingForTeam} onChange={() => setLookingForTeam((value) => !value)} />
                Looking for teammates
              </label>
            ) : null}
          </div>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Team Finder</h2>
          <p className="text-sm text-slate-500">Students looking for teammates</p>
        </div>
        <div className="mt-6 space-y-4">
          {participants.length > 0 ? (
            participants.map((participant) => (
              <div key={participant.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
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
