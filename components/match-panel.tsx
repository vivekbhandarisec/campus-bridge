'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchCard } from './match-card';
import { EmptyState } from './EmptyState';
import { Badge } from './ui/badge';

interface MatchUser {
  id: string;
  name: string;
  college: string;
  domain: string | null;
  skills: string[];
  currentCompany: string | null;
  campusCred: number;
  avatarUrl: string | null;
  isAvailable?: boolean;
  matchReasons?: string[];
}

export function MatchPanel({ initialMatches }: { initialMatches: MatchUser[] }) {
  const [matches] = useState<MatchUser[]>(initialMatches);
  const router = useRouter();

  const handleMessage = (id: string) => {
    router.push(`/messages?user=${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="app-card overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="section-label">Match</p>
            <h1 className="page-title mt-2">Your top alumni mentors</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Mentors are recommended by domain alignment, shared skills, goals, activity, availability, and CampusCred signals.</p>
          </div>
          <div className="rounded-xl border border-teal-600/10 bg-teal-50 px-4 py-3 text-sm leading-6 text-slate-600 md:max-w-sm">
            <Badge className="mb-2 border-teal-600/20 bg-white text-teal-700">Relationship-first matching</Badge>
            <p>Review shared context, then start a focused conversation with alumni who can help.</p>
          </div>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} user={match} onMessage={handleMessage} />
          ))}
        </div>
      ) : (
        <div className="app-card p-6">
          <EmptyState
            title="No mentor recommendations yet"
            description="Add a clearer domain, skills, and goals to your profile so CampusBridge can surface more relevant alumni."
          />
        </div>
      )}
    </div>
  );
}
