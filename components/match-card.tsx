import { Info, MessageCircle } from 'lucide-react';
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
  return (
    <div className="app-card min-w-0 overflow-hidden p-5 transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar src={user.avatarUrl} name={user.name} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-[17px] font-semibold text-navy [overflow-wrap:anywhere]">{user.name}</p>
            <Badge className="border-sky-500/20 bg-sky-50 text-sky-600">Alumni mentor</Badge>
            <Badge className={user.isAvailable === false ? 'border-amber-500/20 bg-amber-50 text-amber-600' : 'border-emerald-500/20 bg-emerald-50 text-emerald-600'}>
              {user.isAvailable === false ? 'Limited' : 'Available'}
            </Badge>
          </div>
          <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">{user.currentCompany || 'Experienced mentor'}</p>
        </div>
        <Badge className="w-fit shrink-0 border-teal-600/20 bg-teal-50 text-teal-700">Relevant</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {user.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} className="max-w-full break-words border-slate-200 bg-slate-100 text-slate-700 [overflow-wrap:anywhere]">{skill}</Badge>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button onClick={() => onMessage(user.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-sky-500 px-4 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400 hover:shadow-actionHover">
          <MessageCircle className="h-4 w-4" />
          Message
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-sky-500/40 bg-sky-50 px-4 text-sm font-semibold text-sky-500 hover:bg-white">
          <Info className="h-4 w-4" />
          Why this match?
        </button>
      </div>
    </div>
  );
}
