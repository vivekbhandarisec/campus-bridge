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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.24em] text-brand-700">Matched using AI</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Your top alumni mentors</h1>
          <p className="mt-2 text-sm text-slate-500">Based on your skills, domain, and career goals.</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          AI score uses profile embeddings to match you with available alumni mentors.
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600">No matches available yet. Complete your profile and check again.</div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <MatchCard key={match.id} user={match} onMessage={handleMessage} />
          ))}
        </div>
      )}
    </div>
  );
}
