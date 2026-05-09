'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Flag } from 'lucide-react';
import { Button } from './ui/button';
import { ReportModal } from './report-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface PostActionsProps {
  postId: string;
  isAuthor: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export function PostActions({ postId, isAuthor, onEdit, onDelete, onReport }: PostActionsProps) {
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
    onReport?.();
    setShowReportModal(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 bg-transparent border-0 shadow-none hover:bg-slate-100"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {isAuthor ? (
            <>
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
                aria-disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete post'}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={handleReport} className="cursor-pointer">
              <Flag className="mr-2 h-4 w-4" />
              Report post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
