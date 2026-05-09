'use client';

import { Badge } from './ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { PostEngagementBar } from '@/components/feed/PostEngagementBar';
import { PostActionsSimple } from './post-actions-simple';
import type { Post, Visibility } from '@prisma/client';

type FeedPostShape = Omit<
  Post,
  'body' | 'visibility' | 'updatedAt'
> & {
  body?: string;
  visibility?: Visibility;
  updatedAt?: Date;

  author: { id: string; name: string; college: string; avatarUrl: string | null };
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
    }>;
  } | null;

  isLiked?: boolean;
  isBookmarked?: boolean;
};

interface PostCardProps {
  post: FeedPostShape;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const isAuthor = post.authorId === currentUserId;

  const handleEdit = () => {
    // TODO: Open edit modal/modal
    console.log('Edit post:', post.id);
  };

  const handleDelete = () => {
    // This will be handled by PostActions component
    window.location.reload();
  };

  const handleReport = () => {
    // TODO: Open report modal
    console.log('Report post:', post.id);
  };
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-border/80 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link 
          href={`/profile/${post.author.id}`}
          className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 font-semibold text-white">
            {post.author.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground transition-colors group-hover:text-sky-600">{post.author.name}</p>
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
          <div className="space-y-2">
            {post.poll.options.map((option) => (
              <div key={option.id} className="flex flex-col gap-1 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 break-words font-medium text-foreground [overflow-wrap:anywhere]">{option.text}</span>
                <span className="shrink-0 text-muted-foreground">{option._count?.votes ?? 0} votes</span>
              </div>
            ))}
          </div>
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
