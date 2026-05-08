'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchCard } from './match-card';
import { Button } from './ui/button';

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

  return (
    <div className="space-y-6">
      <div className="app-card p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
          <p className="section-label">Matched using AI</p>
          <h1 className="page-title mt-2">Your top alumni mentors</h1>
          <p className="mt-2 text-sm text-slate-500">Based on your skills, domain, and career goals.</p>
          </div>
          <div className="rounded-xl border border-teal-600/10 bg-teal-50 px-4 py-3 text-sm text-slate-600">
            Profile embeddings rank available alumni by fit.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-sm text-danger-600">{error}</div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No matches available yet. Complete your profile and check again.</div>
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
