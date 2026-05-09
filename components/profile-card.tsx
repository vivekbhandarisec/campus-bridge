import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { badgeVariant, campusCredBadge } from '@/lib/utils';

interface ProfileCardProps {
  user: {
    name: string;
    username?: string;
    college: string;
    role?: string;
    domain: string | null;
    skills: string[];
    bio: string | null;
    campusCred: number;
    avatarUrl: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const tier = campusCredBadge(user.campusCred);
  const roleLabel = user.role ? user.role.replace('_', ' ').toLowerCase() : null;

  return (
    <div className="app-card overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-navy via-sky-500 to-teal-600" />
      <div className="-mt-9 p-4 pt-0">
        <div className="flex items-start justify-between gap-3">
          <Avatar src={user.avatarUrl} name={user.name} className="h-16 w-16 shrink-0 border-4 border-white shadow-soft" />
          <Link
            href="/settings/profile"
            className="mt-9 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 shadow-soft transition hover:border-sky-500/30 hover:text-sky-500"
            aria-label="Edit profile"
            title="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 min-w-0">
          <h2 className="break-words font-heading text-xl font-bold leading-tight text-navy">{user.name}</h2>
          {user.username ? (
            <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
          ) : null}
          <p className="mt-1 break-words text-sm font-medium text-slate-600">{user.college}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roleLabel ? (
              <Badge className={badgeVariant(user.role || '')}>{roleLabel}</Badge>
            ) : null}
            {user.domain ? (
              <Badge className="border-teal-600/20 bg-teal-50 text-teal-700">{user.domain}</Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-600">
          {user.bio ? <p className="leading-6">{user.bio}</p> : <p className="text-slate-400">No bio yet.</p>}
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
