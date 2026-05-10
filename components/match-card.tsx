import { MessageCircle, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { cn } from '@/lib/utils';

function mentorFitLabel(reasons?: string[]) {
  const text = reasons?.join(' ').toLowerCase() ?? '';
  if (text.includes('common background') || text.includes('you both work')) return 'Strong Match';
  if (text.includes('shared skills')) return 'Shared Career Interests';
  if (text.includes('common professional goals')) return 'Common Professional Goals';
  if (text.includes('mentorship')) return 'Potential Mentor Connection';
  return 'Recommended Connection';
}

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
    isAvailable?: boolean;
    matchReasons?: string[];
  };
  onMessage: (id: string) => void;
}

export function MatchCard({ user, onMessage }: MatchCardProps) {
  const fitLabel = mentorFitLabel(user.matchReasons);

  return (
    <article className="app-card min-w-0 overflow-hidden border-l-4 border-l-teal-500 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar src={user.avatarUrl} name={user.name} className="h-14 w-14 shrink-0 ring-4 ring-teal-50" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-[17px] font-semibold text-navy [overflow-wrap:anywhere]">{user.name}</p>
            <Badge className="border-sky-500/20 bg-sky-50 text-sky-600">Alumni mentor</Badge>
            <Badge className={user.isAvailable === false ? 'border-amber-500/20 bg-amber-50 text-amber-600' : 'border-emerald-500/20 bg-emerald-50 text-emerald-600'}>
              {user.isAvailable === false ? 'Limited availability' : 'Open to mentor'}
            </Badge>
          </div>
          <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
            {user.currentCompany || 'Experienced mentor'} · {user.college}
          </p>
        </div>
        <Badge className="w-fit shrink-0 border-teal-600/20 bg-teal-50 px-3 py-1 text-teal-700">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {fitLabel}
        </Badge>
      </div>
      {user.domain ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          Primary domain: <span className="text-navy">{user.domain}</span>
        </div>
      ) : null}
      {user.matchReasons?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connection insights</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.matchReasons.map((reason) => (
              <Badge key={reason} className="max-w-full break-words border-teal-600/15 bg-teal-50 text-left text-teal-800 [overflow-wrap:anywhere]">
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {user.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} className="max-w-full break-words border-slate-200 bg-slate-100 text-slate-700 [overflow-wrap:anywhere]">{skill}</Badge>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Start with a short intro or ask about their journey.</p>
        <button
          type="button"
          onClick={() => onMessage(user.id)}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-sky-500 px-4 text-sm font-semibold text-white shadow-action transition',
            'hover:-translate-y-px hover:bg-sky-400 hover:shadow-actionHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </button>
      </div>
    </article>
  );
}
