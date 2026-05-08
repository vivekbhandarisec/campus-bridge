import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { badgeVariant, formatDate } from '@/lib/utils';

interface MatchCardProps {
  user: {
    id: string;
    name: string;
    college: string;
    domain: string | null;
    skills: string[];
    currentCompany: string | null;
    campusCred: number;
    avatarUrl: string | null;
    matchScore: number;
  };
  onMessage: (id: string) => void;
}

export function MatchCard({ user, onMessage }: MatchCardProps) {
  const progress = Math.max(0, Math.min(100, user.matchScore));
  const barClass = progress >= 70 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-slate-400';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatarUrl} name={user.name} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-slate-900">{user.name}</p>
            <span className={badgeVariant('ALUMNI')}>ALUMNI</span>
          </div>
          <p className="text-sm text-slate-500">{user.currentCompany || 'Experienced mentor'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-slate-500">Match</p>
          <p className="text-2xl font-bold text-slate-900">{progress}%</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {user.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} className="bg-slate-100 text-slate-700">{skill}</Badge>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => onMessage(user.id)} className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Message
        </button>
        <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Why this match?
        </button>
      </div>
    </div>
  );
}
