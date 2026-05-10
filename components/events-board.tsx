'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from './EmptyState';
import { EventCard } from './event-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import type { Event } from '@prisma/client';

interface EventsBoardProps {
  events: Array<Event & { college: { name: string } }>;
  canOrganize: boolean;
  filters?: {
    type?: string;
    college?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

export function EventsBoard({ events, canOrganize, filters }: EventsBoardProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState(filters?.type || 'ALL');
  const [statusFilter, setStatusFilter] = useState('UPCOMING');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    fullName: '',
    collegeEmail: '',
    organization: '',
    roleTitle: '',
    reason: '',
    contactLink: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'HACKATHON',
    collegeId: '',
    prize: '',
    teamSize: '1-3',
    tags: 'Product,Build',
    startDate: '',
    registrationDeadline: '',
    link: '',
  });

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((event) => event.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [events]);

  const filtered = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      if (typeFilter !== 'ALL' && event.type !== typeFilter) return false;
      if (statusFilter === 'UPCOMING' && new Date(event.startDate) < startOfToday) return false;
      if (statusFilter === 'PAST' && new Date(event.startDate) >= startOfToday) return false;
      if (tagFilter !== 'ALL' && !event.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [events, typeFilter, statusFilter, tagFilter]);

  const register = async (eventId: string, type: string) => {
    setMessage('');
    const lookingForTeam = type === 'HACKATHON';
    const response = await fetch(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lookingForTeam }),
    });
    if (!response.ok) {
      setMessage('Could not register.');
      return;
    }
    setMessage('Registration updated.');
    router.refresh();
  };

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: formData.startDate,
        registrationDeadline: formData.registrationDeadline,
        prize: formData.prize,
        teamSize: formData.teamSize,
        tags: formData.tags.split(',').map((tag) => tag.trim()),
        link: formData.link,
      }),
    });
    if (!response.ok) {
      setMessage('Unable to post event.');
      return;
    }
    setMessage('Event created.');
    setShowCreate(false);
    router.refresh();
  };

  const submitVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setVerificationLoading(true);

    try {
      const response = await fetch('/api/organizer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || 'Could not verify organizer details.');
        return;
      }

      setMessage('Organizer verification complete. You can host events now.');
      setShowVerification(false);
      setShowCreate(true);
      router.refresh();
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleHostEvent = () => {
    setMessage('');
    if (canOrganize) {
      setShowCreate((value) => !value);
      setShowVerification(false);
      return;
    }

    setShowVerification((value) => !value);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="app-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Campus opportunities</p>
            <h1 className="page-title mt-2">Events board</h1>
            <p className="mt-2 text-sm text-slate-500">Browse hackathons, CTFs, internships and workshops in your campus network.</p>
          </div>
          <Button type="button" onClick={handleHostEvent} className="bg-teal-600 shadow-none hover:bg-teal-600/90 hover:shadow-lift">
            {canOrganize ? (showCreate ? 'Hide form' : 'Host Event') : (showVerification ? 'Hide verification' : 'Host Event')}
          </Button>
        </div>
        {!canOrganize && showVerification && (
          <form onSubmit={submitVerification} className="mt-6 space-y-4 rounded-2xl border border-sky-500/20 bg-sky-50 p-5">
            <div>
              <h2 className="section-title">Verify organizer access</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Students and alumni can host events after a short trust check. Use authentic college, club, community, or professional details.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Full name"
                value={verificationData.fullName}
                onChange={(event) => setVerificationData({ ...verificationData, fullName: event.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="College or organization email (optional)"
                value={verificationData.collegeEmail}
                onChange={(event) => setVerificationData({ ...verificationData, collegeEmail: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Club, community, college, or organization"
                value={verificationData.organization}
                onChange={(event) => setVerificationData({ ...verificationData, organization: event.target.value })}
                required
              />
              <Input
                placeholder="Your role/title"
                value={verificationData.roleTitle}
                onChange={(event) => setVerificationData({ ...verificationData, roleTitle: event.target.value })}
                required
              />
            </div>
            <Textarea
              placeholder="What kind of event do you want to host, and how are you connected to it?"
              value={verificationData.reason}
              onChange={(event) => setVerificationData({ ...verificationData, reason: event.target.value })}
              rows={4}
              required
            />
            <Input
              type="url"
              placeholder="Proof or contact link (optional)"
              value={verificationData.contactLink}
              onChange={(event) => setVerificationData({ ...verificationData, contactLink: event.target.value })}
            />
            <Button type="submit" disabled={verificationLoading} className="bg-teal-600 shadow-none hover:bg-teal-600/90 hover:shadow-lift">
              {verificationLoading ? 'Verifying...' : 'Verify and unlock hosting'}
            </Button>
          </form>
        )}
        {showCreate && (
          <form onSubmit={createEvent} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Event title" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required />
              <Select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })}>
                <option value="HACKATHON">Hackathon</option>
                <option value="CTF">CTF</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="WORKSHOP">Workshop</option>
              </Select>
            </div>
            <Textarea placeholder="Description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="datetime-local" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} required />
              <Input type="datetime-local" value={formData.registrationDeadline} onChange={(event) => setFormData({ ...formData, registrationDeadline: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Prize" value={formData.prize} onChange={(event) => setFormData({ ...formData, prize: event.target.value })} />
              <Input placeholder="Team size (e.g. 1-3)" value={formData.teamSize} onChange={(event) => setFormData({ ...formData, teamSize: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Tags, comma separated" value={formData.tags} onChange={(event) => setFormData({ ...formData, tags: event.target.value })} />
              <Input placeholder="Event link" value={formData.link} onChange={(event) => setFormData({ ...formData, link: event.target.value })} />
            </div>
            <Button type="submit" className="bg-teal-600 shadow-none hover:bg-teal-600/90 hover:shadow-lift">Create event</Button>
          </form>
        )}
      </div>

      <div className="app-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All types</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="CTF">CTF</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="WORKSHOP">Workshop</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Past</option>
            <option value="ALL">All</option>
          </Select>
          <Select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="ALL">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </Select>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.length > 0 ? filtered.map((event) => (
          <div key={event.id}>
            <EventCard event={event} />
            <div className="mt-3 flex justify-end">
              <Button type="button" onClick={() => register(event.id, event.type)}>
                Register
              </Button>
            </div>
          </div>
        )) : (
          <EmptyState title="No events match your filters" description="Try a different type, status, or tag to find more opportunities." />
        )}
      </div>
    </div>
  );
}
