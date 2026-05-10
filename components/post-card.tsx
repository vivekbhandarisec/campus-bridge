'use client';

import { useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, formatDate } from '@/lib/utils';
import { roleIdentity } from '@/lib/role-identity';
import { PostEngagementBar } from '@/components/feed/PostEngagementBar';
import { PostActionsSimple } from './post-actions-simple';
import { Avatar } from './ui/avatar';
import type { Post, Visibility } from '@prisma/client';

type FeedPostShape = Omit<
  Post,
  'body' | 'visibility' | 'updatedAt'
> & {
  body?: string;
  visibility?: Visibility;
  updatedAt?: Date;

  author: { id: string; name: string; college: string; avatarUrl: string | null; role?: string | null };
  _count?: {
    likes: number;
    comments: number;
    shares: number;
  };

  imageUrls?: string[];
  linkUrl?: string | null;
  poll?: {
    options: Array<{
      id: string;
      text: string;
      _count?: { votes: number };
      votes?: Array<{ id: string }>;
    }>;
    selectedOptionId?: string | null;
  } | null;

  isLiked?: boolean;
  isBookmarked?: boolean;
};

interface PostCardProps {
  post: FeedPostShape;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter();
  const isAuthor = post.authorId === currentUserId;
  const identity = roleIdentity(post.author.role);

  const handleEdit = () => {
    // TODO: Open edit modal/modal
    console.log('Edit post:', post.id);
  };

  const handleDelete = () => {
    router.refresh();
  };

  const handleReport = () => {
    // TODO: Open report modal
    console.log('Report post:', post.id);
  };
  return (
    <article className={cn('min-w-0 max-w-full overflow-hidden rounded-xl border border-l-4 border-border bg-card p-4 shadow-sm transition hover:border-border/80 sm:p-5', identity.border)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link 
          href={`/profile/${post.author.id}`}
          className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <Avatar src={post.author.avatarUrl} name={post.author.name} className={cn('h-10 w-10 shrink-0 font-semibold', identity.ring)} />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground transition-colors group-hover:text-sky-600">{post.author.name}</p>
              <Badge className={cn('shrink-0 text-[11px] uppercase tracking-wide', identity.badge)}>{identity.label}</Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{post.author.college}</p>
          </div>
        </Link>
        <span className="shrink-0 text-sm text-muted-foreground">{formatDate(post.createdAt)}</span>
      </div>
      
      <div className="mt-4 min-w-0 space-y-3">
        {post.body ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
            {post.body}
          </p>
        ) : null}
        
        {/* Image attachments */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {post.imageUrls.map((url, index) => (
              <div key={index} className="relative h-40 w-full overflow-hidden rounded-lg bg-slate-100 sm:h-32">
                <Image
                  src={url}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Link preview */}
        {post.linkUrl && (
          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-slate-50 p-3">
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-full break-all text-sm leading-6 text-sky-600 hover:underline"
            >
              {post.linkUrl}
            </a>
          </div>
        )}

        {post.poll?.options?.length ? (
          <PollBlock postId={post.id} options={post.poll.options} />
        ) : null}
        
        {/* Post type badge */}
        <Badge className="w-fit border-border bg-muted text-muted-foreground">
          {post.type.toLowerCase()}
        </Badge>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Engagement bar */}
      <PostEngagementBar
        postId={post.id}
        likeCount={post._count?.likes || 0}
        commentCount={post._count?.comments || 0}
        shareCount={post._count?.shares || 0}
        isLiked={post.isLiked || false}
        isBookmarked={post.isBookmarked || false}
        currentUserId={currentUserId}
        postOwnerId={post.authorId}
      />
      
      {/* Post actions */}
      <PostActionsSimple
        postId={post.id}
        isAuthor={isAuthor}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReport={handleReport}
      />
    </div>
    </article>
  );
}

function PollBlock({
  postId,
  options,
}: {
  postId: string;
  options: Array<{ id: string; text: string; _count?: { votes: number }; votes?: Array<{ id: string }> }>;
}) {
  const initialSelected = useMemo(() => options.find((option) => option.votes?.length)?.id ?? null, [options]);
  const [pollOptions, setPollOptions] = useState(() =>
    options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: option._count?.votes ?? 0,
    })),
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelected);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const totalVotes = pollOptions.reduce((sum, option) => sum + option.votes, 0);

  async function vote(optionId: string) {
    if (pendingOptionId || optionId === selectedOptionId) return;

    const previousOptions = pollOptions;
    const previousSelected = selectedOptionId;
    setSelectedOptionId(optionId);
    setPendingOptionId(optionId);
    setPollOptions((items) =>
      items.map((item) => {
        let votes = item.votes;
        if (item.id === previousSelected) votes = Math.max(0, votes - 1);
        if (item.id === optionId) votes += 1;
        return { ...item, votes };
      }),
    );

    try {
      const response = await fetch(`/api/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) throw new Error('Vote failed');
      const data = await response.json();
      setSelectedOptionId(data.selectedOptionId ?? optionId);
      if (Array.isArray(data.options)) {
        setPollOptions(data.options.map((item: { id: string; text: string; votes: number }) => ({
          id: item.id,
          text: item.text,
          votes: item.votes,
        })));
      }
    } catch {
      setPollOptions(previousOptions);
      setSelectedOptionId(previousSelected);
    } finally {
      setPendingOptionId(null);
    }
  }

  return (
    <div className="space-y-2">
      {pollOptions.map((option) => {
        const selected = option.id === selectedOptionId;
        const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => vote(option.id)}
            disabled={Boolean(pendingOptionId)}
            className={cn(
              'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition duration-200 disabled:cursor-wait',
              selected ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm' : 'border-border bg-slate-50 hover:border-sky-300 hover:bg-white',
            )}
          >
            <span
              className={cn('absolute inset-y-0 left-0 bg-sky-200/60 transition-all duration-300', selected ? 'bg-sky-300/60' : '')}
              style={{ width: `${percent}%` }}
            />
            <span className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">{option.text}</span>
              <span className="shrink-0 text-muted-foreground">
                {pendingOptionId === option.id ? 'Saving...' : `${option.votes} vote${option.votes === 1 ? '' : 's'} - ${percent}%`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
