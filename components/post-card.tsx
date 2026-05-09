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
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-border/80">
      <div className="flex items-center justify-between gap-3">
        <Link 
          href={`/profile/${post.author.id}`}
          className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white font-semibold">
            {post.author.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-sky-600 transition-colors">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">{post.author.college}</p>
          </div>
        </Link>
        <span className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</span>
      </div>
      
      <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-foreground">{post.body}</p>
        
        {/* Image attachments */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.imageUrls.map((url, index) => (
              <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
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
          <div className="rounded-lg border border-border p-3">
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sky-500 hover:underline"
            >
              {post.linkUrl}
            </a>
          </div>
        )}

        {post.poll?.options?.length ? (
          <div className="space-y-2">
            {post.poll.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{option.text}</span>
                <span className="text-muted-foreground">{option._count?.votes ?? 0} votes</span>
              </div>
            ))}
          </div>
        ) : null}
        
        {/* Post type badge */}
        <Badge className="w-fit border-border bg-muted text-muted-foreground">
          {post.type.toLowerCase()}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-4">
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
