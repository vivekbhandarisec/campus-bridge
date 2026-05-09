'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function LeaderboardTable({ entries, currentPage, totalPages, totalCount }: LeaderboardTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [domainFilter, setDomainFilter] = useState(searchParams.get('domain') || 'ALL');
  const domains = useMemo(() => Array.from(new Set(entries.map((entry) => entry.domain).filter(Boolean))) as string[], [entries]);

  const filtered = useMemo(
    () => entries.filter((entry) => domainFilter === 'ALL' || entry.domain === domainFilter),
    [entries, domainFilter],
  );

  const handleDomainFilterChange = (newDomain: string) => {
    setDomainFilter(newDomain);
    const params = new URLSearchParams(searchParams);
    if (newDomain === 'ALL') {
      params.delete('domain');
    } else {
      params.set('domain', newDomain);
    }
    params.set('page', '1');
    router.push(`/leaderboard?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (domainFilter !== 'ALL') {
      params.set('domain', domainFilter);
    }
    params.set('page', page.toString());
    router.push(`/leaderboard?${params.toString()}`);
  };

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
          <select value={domainFilter} onChange={(event) => handleDomainFilterChange(event.target.value)} className="rounded-[10px] border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-[3px] focus:ring-sky-500/10">
            <option value="ALL">All</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="app-card overflow-x-auto">
        <table className="w-full min-w-[300px] sm:min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]" scope="col">Rank</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]" scope="col">Name</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]" scope="col">Username</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]" scope="col">College</th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em]" scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => (
              <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-medium text-reward-500" scope="row">{index + 1}</td>
                <td className="px-6 py-4" scope="row">
                  <Link 
                    href={`/profile/${entry.id}`}
                    className="group block hover:text-sky-600 transition-colors"
                    aria-label={`View ${entry.name}'s profile`}
                  >
                    <div className="font-semibold text-slate-900 group-hover:text-sky-600">{entry.name}</div>
                    <div className="text-xs text-slate-500">{entry.domain || 'Unknown'}</div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-600" scope="row">{entry.username ? `@${entry.username}` : '—'}</td>
                <td className="px-6 py-4 text-slate-600" scope="row">{entry.college}</td>
                <td className="px-6 py-4" scope="row">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                    <span className="font-mono font-medium text-reward-500">{entry.campusCred}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing {filtered.length} of {totalCount} students
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
