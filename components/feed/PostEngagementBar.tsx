'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
    role: string;
  };
};

interface PostEngagementBarProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function PostEngagementBar({
  postId,
  likeCount,
  commentCount,
  shareCount,
  isLiked,
  isBookmarked
}: PostEngagementBarProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [shares, setShares] = useState(shareCount);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentTotal, setCommentTotal] = useState(commentCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!commentsOpen || commentsLoaded) return;

    fetch(`/api/posts/${postId}/comments`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load comments');
        return response.json();
      })
      .then((data) => {
        setComments(data.comments ?? []);
        setCommentsLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [commentsLoaded, commentsOpen, postId]);

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((count) => count + (nextLiked ? 1 : -1));

    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: nextLiked ? 'POST' : 'DELETE' });
      
      if (!response.ok) {
        setLiked(!nextLiked);
        setLikes((count) => count + (nextLiked ? -1 : 1));
      }
    } catch (error) {
      setLiked(!nextLiked);
      setLikes((count) => count + (nextLiked ? -1 : 1));
    }
  };

  const handleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, { method: nextBookmarked ? 'POST' : 'DELETE' });
      
      if (!response.ok) {
        setBookmarked(!nextBookmarked);
      }
    } catch (error) {
      setBookmarked(!nextBookmarked);
    }
  };

  const handleShare = async () => {
    const response = await fetch(`/api/posts/${postId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (response.ok) setShares((count) => count + 1);
  };

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = commentText.trim();
    if (!body || busy) return;

    setBusy(true);
    setError('');
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusy(false);

    if (!response.ok) {
      setError('Could not add comment');
      return;
    }

    const comment = await response.json();
    setComments((items) => [comment, ...items]);
    setCommentTotal((count) => count + 1);
    setCommentText('');
    setCommentsOpen(true);
    setCommentsLoaded(true);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={handleLike}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
            liked
              ? 'bg-red-50 text-red-500'
              : 'text-muted-foreground hover:bg-red-50 hover:text-red-500'
          }`}
          type="button"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likes}</span>
        </button>

        <button
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-sky-50 hover:text-sky-500"
          onClick={() => setCommentsOpen((value) => !value)}
          type="button"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{commentTotal}</span>
        </button>

        <button
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-500"
          onClick={handleShare}
          type="button"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm font-medium">{shares}</span>
        </button>

        <div className="ml-auto shrink-0">
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              bookmarked
                ? 'bg-amber-50 text-amber-500'
                : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-500'
            }`}
            type="button"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {commentsOpen ? (
        <div className="mt-3 min-w-0 space-y-3 rounded-xl bg-slate-50 p-3">
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment"
              className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={busy || !commentText.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          <div className="space-y-2">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="min-w-0 rounded-lg border border-border bg-white p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="min-w-0 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{comment.author.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{comment.body}</p>
              </div>
            )) : (
              <p className="py-2 text-sm text-muted-foreground">No comments yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
