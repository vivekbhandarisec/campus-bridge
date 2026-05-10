'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Filter, Users, GraduationCap, Briefcase, CalendarDays } from 'lucide-react';
import { SearchProfileCard } from '@/components/search-profile-card';
import { EventCard } from '@/components/event-card';
import { skillsOptions } from '@/lib/profile-options';

interface SearchResult {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string | null;
  role?: string;
  domain: string | null;
  skills: string[];
  bio: string | null;
  campusCred: number;
  college: string;
  headline?: string;
  canMessage?: boolean;
  sameCollege?: boolean;
  messageRestriction?: string | null;
  _count?: { orbitTo: number; posts: number };
}

interface EventResult {
  id: string;
  title: string;
  description: string;
  type: 'HACKATHON' | 'CTF' | 'INTERNSHIP' | 'WORKSHOP';
  collegeId: string;
  college: { name: string };
  startDate: Date | string;
  endDate: Date | string | null;
  registrationDeadline: Date | string | null;
  prize: string | null;
  teamSize: string | null;
  tags: string[];
  link: string | null;
  createdAt: Date | string;
}

type SearchType = 'all' | 'people' | 'events';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('all');
  const [role, setRole] = useState<string>('');
  const [college, setCollege] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [users, setUsers] = useState<SearchResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedQuery = useDebounce(query, 300);
  const peopleFiltersActive = Boolean(role || skills.length > 0 || industry);
  const eventSearchDisabled = peopleFiltersActive && type !== 'events';

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        ...(debouncedQuery && { q: debouncedQuery }),
        ...(role && { role }),
        ...(college && { college }),
        ...(skills.length > 0 && { skills: skills.join(',') }),
        ...(industry && { industry }),
        page: page.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        const nextUsers = data.users ?? [];
        const nextEvents = data.events ?? [];

        if (page === 1) {
          setUsers(nextUsers);
          setEvents(nextEvents);
        } else {
          setUsers((prev) => [...prev, ...nextUsers]);
          setEvents((prev) => [...prev, ...nextEvents]);
        }

        setHasMore(nextUsers.length === 20 || nextEvents.length === 20);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [college, debouncedQuery, industry, page, role, skills, type]);

  useEffect(() => {
    setPage(1);
  }, [college, debouncedQuery, industry, role, skills, type]);

  useEffect(() => {
    if (debouncedQuery || role || college || skills.length > 0 || industry || type !== 'all') {
      runSearch();
    } else {
      setUsers([]);
      setEvents([]);
      setHasMore(false);
    }
  }, [debouncedQuery, role, college, skills, industry, type, page, runSearch]);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills((prev) => [...prev, trimmedSkill]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const totalResults = users.length + events.length;

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-display mb-2">Search CampusBridge</h1>
        <p className="text-muted-foreground">Find students, alumni, organizers, usernames, hackathons, workshops, internships, and campus programs.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search usernames, people, skills, events, hackathons..."
          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h2 className="font-semibold">Filters</h2>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Search type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'people', label: 'People' },
                  { value: 'events', label: 'Events' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value as SearchType)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${type === option.value ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-border bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium">Role</label>
              <div className="space-y-2">
                {[
                  { value: '', label: 'All people', icon: Users },
                  { value: 'ALUMNI', label: 'Alumni', icon: Briefcase },
                  { value: 'STUDENT', label: 'Students', icon: GraduationCap },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={role === option.value}
                        onChange={(event) => setRole(event.target.value)}
                        disabled={type === 'events'}
                        className="text-sky-500 disabled:opacity-40"
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium">College</label>
              <input
                type="text"
                value={college}
                onChange={(event) => setCollege(event.target.value)}
                placeholder="College name..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium">Skills</label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-1 text-xs text-sky-700">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-1 text-sky-500 hover:text-sky-700" type="button">
                      x
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                list="search-skill-options"
                placeholder="Add skill and press Enter..."
                disabled={type === 'events'}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addSkill((event.target as HTMLInputElement).value);
                    (event.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <datalist id="search-skill-options">
                {skillsOptions.map((skill) => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium">Industry</label>
              <select
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                disabled={type === 'events'}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Consulting">Consulting</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {eventSearchDisabled ? (
              <p className="mt-4 text-xs leading-5 text-slate-500">Role, skill, and industry filters apply to people. Clear them or switch to Events to search programs only.</p>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {totalResults > 0 ? `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}` : loading ? 'Searching...' : ''}
            </p>
          </div>

          {events.length > 0 ? (
            <section className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-500" />
                <h2 className="font-semibold text-foreground">Events and programs</h2>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {events.map((event) => (
                  <EventCard key={event.id} event={event as any} />
                ))}
              </div>
            </section>
          ) : null}

          {users.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                <h2 className="font-semibold text-foreground">People</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {users.map((user) => (
                  <SearchProfileCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          ) : null}

          {totalResults === 0 && !loading && (query || role || college || skills.length > 0 || industry || type !== 'all') ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No results found. Try a username, event title, college name, skill, or broader filter.</p>
            </div>
          ) : null}

          {totalResults === 0 && !query && !role && !college && skills.length === 0 && !industry && type === 'all' ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Enter a search query or apply filters to find people and events.</p>
            </div>
          ) : null}

          {hasMore && totalResults > 0 ? (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={loading}
                className="rounded-lg bg-sky-500 px-6 py-2 text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
