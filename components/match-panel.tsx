'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchCard } from './match-card';
import { Skeleton } from './Skeleton';

interface MatchUser {
  id: string;
  name: string;
  college: string;
  domain: string | null;
  skills: string[];
  currentCompany: string | null;
  campusCred: number;
  avatarUrl: string | null;
  matchScore: number;
  isAvailable?: boolean;
}

export function MatchPanel() {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch('/api/match')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load matches');
        return res.json();
      })
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMessage = (id: string) => {
    router.push(`/messages?user=${id}`);
  };

  if (!loading && !error && matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="app-card overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="section-label">AI Match</p>
            <h1 className="page-title mt-2">Your top alumni mentors</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Relevant mentors are ranked by domain, skills, and availability.</p>
          </div>
          <div className="rounded-xl border border-teal-600/10 bg-teal-50 px-4 py-3 text-sm leading-6 text-slate-600 md:max-w-xs">
            New accounts can use matching as soon as their profile has enough detail.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-44" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-sm text-danger-600">{error}</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} user={match} onMessage={handleMessage} />
          ))}
        </div>
      )}
    </div>
  );
}
