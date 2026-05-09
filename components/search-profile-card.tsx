import Link from 'next/link';
import { MessageCircle, User, ExternalLink } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { campusCredBadge } from '@/lib/utils';

interface SearchProfileCardProps {
  user: {
    id: string;
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

export function SearchProfileCard({ user }: SearchProfileCardProps) {
  const tier = campusCredBadge(user.campusCred);
  const roleLabel = user.role ? user.role.replace('_', ' ').toLowerCase() : null;

  return (
    <div className="app-card overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-navy via-sky-500 to-teal-600" />
      <div className="-mt-8 p-4 pt-0">
        <div className="flex items-start justify-between gap-3">
          <Avatar src={user.avatarUrl} name={user.name} className="h-14 w-14 shrink-0 border-4 border-white shadow-soft" />
          <div className="flex gap-2 mt-6">
            <Link
              href={`/messages/${user.id}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-600 shadow-soft transition hover:border-sky-500/30 hover:text-sky-500"
              aria-label={`Send message to ${user.name}`}
              title="Send message"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
            <Link
              href={`/profile/${user.id}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-600 shadow-soft transition hover:border-sky-500/30 hover:text-sky-500"
              aria-label={`View ${user.name}'s full profile`}
              title="View profile"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="break-words font-heading text-lg font-bold leading-tight text-navy">{user.name}</h3>
          {user.username ? (
            <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
          ) : null}
          <p className="mt-1 break-words text-sm font-medium text-slate-600">{user.college}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roleLabel ? (
              <Badge className="border-sky-500/20 bg-sky-50 text-sky-700">{roleLabel}</Badge>
            ) : null}
            {user.domain ? (
              <Badge className="border-teal-600/20 bg-teal-50 text-teal-700">{user.domain}</Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {user.bio ? <p className="leading-6 line-clamp-2">{user.bio}</p> : <p className="text-slate-400">No bio yet.</p>}
          <div className="flex flex-wrap gap-2">
            {user.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} className="border-slate-200 bg-slate-100 text-slate-700 text-xs">{skill}</Badge>
            ))}
            {user.skills.length > 4 && (
              <Badge className="border-slate-200 bg-slate-100 text-slate-700 text-xs">+{user.skills.length - 4} more</Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between rounded-xl border border-reward-500/30 bg-reward-50 px-3 py-2">
          <div>
            <p className="text-xs uppercase text-slate-500">CampusCred</p>
            <p className="font-mono text-lg font-medium text-reward-500">{user.campusCred}</p>
          </div>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tier.className}`}>
            {tier.label}
          </span>
        </div>
      </div>
    </div>
  );
}
