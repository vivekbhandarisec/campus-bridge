import { Badge } from './ui/badge';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { PostEngagementBar } from '@/components/feed/PostEngagementBar';
import type { Post, Visibility } from '@prisma/client';

type FeedPostShape = Omit<
  Post,
  'body' | 'visibility' | 'updatedAt'
> & {
  body?: string;
  visibility?: Visibility;
  updatedAt?: Date;

  author: { name: string; college: string; avatarUrl: string | null };
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
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-border/80">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white font-semibold">
            {post.author.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">{post.author.college}</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</span>
      </div>
      
      <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-foreground">{post.body}</p>
        
        {/* Image attachments */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.imageUrls.map((url, index) => (
              <Image
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                width={400}
                height={192}
                className="w-full h-32 object-cover rounded-lg"
              />
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

      {/* Engagement bar */}
      <PostEngagementBar
        postId={post.id}
        likeCount={post._count?.likes || 0}
        commentCount={post._count?.comments || 0}
        shareCount={post._count?.shares || 0}
        isLiked={post.isLiked || false}
        isBookmarked={post.isBookmarked || false}
      />
    </article>
  );
}
