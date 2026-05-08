import { Badge } from './ui/badge';
import { formatDate } from '@/lib/utils';
import type { Post } from '@prisma/client';

interface PostCardProps {
  post: Post & { author: { name: string; college: string; avatarUrl: string | null } };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
          <p className="text-xs text-slate-500">{post.author.college}</p>
        </div>
        <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
      </div>
      <div className="mt-4 space-y-3">
        <p className="text-sm leading-7 text-slate-700">{post.content}</p>
        <Badge className="bg-slate-100 text-slate-700">{post.type}</Badge>
      </div>
    </article>
  );
}
