import type { CSSProperties } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';

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
    isAvailable?: boolean;
  };
  onMessage: (id: string) => void;
}

export function MatchCard({ user, onMessage }: MatchCardProps) {
  const progress = Math.max(0, Math.min(100, user.matchScore));
  return (
    <div className="app-card p-5 transition hover:border-slate-300">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatarUrl} name={user.name} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[17px] font-semibold text-navy">{user.name}</p>
            <Badge className="border-sky-500/20 bg-sky-50 text-sky-600">Alumni mentor</Badge>
            <Badge className={user.isAvailable === false ? 'border-amber-500/20 bg-amber-50 text-amber-600' : 'border-emerald-500/20 bg-emerald-50 text-emerald-600'}>
              {user.isAvailable === false ? 'Limited' : 'Available'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{user.currentCompany || 'Experienced mentor'}</p>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(#2563EB_var(--score),#E2E8F0_0)] p-1" style={{ '--score': `${progress}%` } as CSSProperties}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white">
            <div className="text-center">
              <p className="font-mono text-sm font-medium text-reward-500">{progress}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Match</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {user.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} className="border-slate-200 bg-slate-100 text-slate-700">{skill}</Badge>
        ))}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-600" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => onMessage(user.id)} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-sky-500 px-4 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400 hover:shadow-actionHover">
          <MessageCircle className="h-4 w-4" />
          Message
        </button>
        <button className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-sky-500/40 bg-sky-50 px-4 text-sm font-semibold text-sky-500 hover:bg-white">
          <Sparkles className="h-4 w-4" />
          Why this match?
        </button>
      </div>
    </div>
  );
}
