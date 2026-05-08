'use client';

import { useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface LeaderboardEntry {
  id: string;
  name: string;
  college: string;
  currentCompany: string | null;
  campusCred: number;
  domain: string | null;
  avatarUrl: string | null;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const [domainFilter, setDomainFilter] = useState('ALL');
  const domains = useMemo(() => Array.from(new Set(entries.map((entry) => entry.domain).filter(Boolean))) as string[], [entries]);

  const filtered = useMemo(
    () => entries.filter((entry) => domainFilter === 'ALL' || entry.domain === domainFilter),
    [entries, domainFilter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CampusCred leaderboard</h1>
          <p className="mt-2 text-sm text-slate-500">Top alumni ranked by reputation and activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">Filter by domain:</label>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
            <option value="ALL">All</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">College</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => (
              <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{entry.name}</div>
                  <div className="text-xs text-slate-500">{entry.domain || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{entry.college}</td>
                <td className="px-6 py-4 text-slate-600">{entry.currentCompany || '—'}</td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                    {entry.campusCred}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
