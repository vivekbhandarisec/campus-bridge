'use client';

import { useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
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
          <p className="section-label">Reputation</p>
          <h1 className="page-title mt-2">Student CampusCred leaderboard</h1>
          <p className="mt-2 text-sm text-slate-500">Top students ranked by CampusCred score and campus engagement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">Filter by domain:</label>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="rounded-[10px] border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-[3px] focus:ring-sky-500/10">
            <option value="ALL">All</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="app-card overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]">Rank</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]">Name</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]">Username</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]">College</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => (
              <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-medium text-reward-500">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{entry.name}</div>
                  <div className="text-xs text-slate-500">{entry.domain || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{entry.username ? `@${entry.username}` : '—'}</td>
                <td className="px-6 py-4 text-slate-600">{entry.college}</td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                    <span className="font-mono font-medium text-reward-500">{entry.campusCred}</span>
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
