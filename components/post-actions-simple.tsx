'use client';

import { useState } from 'react';
import { Edit, Trash2, Flag } from 'lucide-react';
import { Button } from './ui/button';
import { ReportModal } from './report-modal';

interface PostActionsProps {
  postId: string;
  isAuthor: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export function PostActionsSimple({ postId, isAuthor, onEdit, onDelete, onReport }: PostActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.();
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
        <Button
          className="h-8 w-8 border-0 bg-transparent p-0 text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900"
          onClick={() => {
            if (isAuthor) {
              onEdit?.();
            } else {
              handleReport();
            }
          }}
          aria-label={isAuthor ? 'Edit post' : 'Report post'}
        >
          {isAuthor ? <Edit className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
        </Button>

        {isAuthor && (
          <Button
            className="h-8 w-8 border-0 bg-transparent p-0 text-red-600 shadow-none hover:bg-red-100 hover:text-red-900"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        itemType="POST"
        itemId={postId}
        itemName="this post"
      />
    </>
  );
}
