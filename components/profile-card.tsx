import Link from 'next/link';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { campusCredBadge } from '@/lib/utils';

interface ProfileCardProps {
  user: {
    name: string;
    college: string;
    domain: string | null;
    skills: string[];
    bio: string | null;
    campusCred: number;
    avatarUrl: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const tier = campusCredBadge(user.campusCred);

  return (
    <div className="app-card overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-navy via-sky-500 to-teal-600" />
      <div className="-mt-7 p-4 pt-0">
      <div className="flex items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.name} className="h-14 w-14 border-4 border-white" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-navy">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.college}</p>
        </div>
        <Link href="/settings/profile" className="rounded-[10px] border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
          Edit
        </Link>
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-600">
        {user.bio ? <p>{user.bio}</p> : <p className="text-slate-400">No bio yet.</p>}
        <div className="flex flex-wrap gap-2">
          {user.skills.map((skill) => (
            <Badge key={skill} className="border-slate-200 bg-slate-100 text-slate-700">{skill}</Badge>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-reward-500/30 bg-reward-50 px-4 py-3">
        <div>
          <p className="text-xs uppercase text-slate-500">CampusCred</p>
          <p className="font-mono text-2xl font-medium text-reward-500">{user.campusCred}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tier.className}`}>
          {tier.label}
        </span>
      </div>
      </div>
    </div>
  );
}
