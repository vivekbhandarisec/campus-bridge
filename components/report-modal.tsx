'use client';

import { useState } from 'react';
import { X, Flag, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'POST' | 'USER' | 'COMMENT';
  itemId: string;
  itemName: string;
}

const reportReasons = {
  POST: [
    'Spam or misleading content',
    'Inappropriate or offensive content',
    'Harassment or bullying',
    'False information',
    'Copyright violation',
    'Other'
  ],
  USER: [
    'Fake profile or impersonation',
    'Inappropriate profile information',
    'Harassment or bullying',
    'Spam or scam',
    'Other'
  ],
  COMMENT: [
    'Harassment or hate speech',
    'Spam or irrelevant',
    'Inappropriate content',
    'False information',
    'Other'
  ]
};

export function ReportModal({ isOpen, onClose, itemType, itemId, itemName }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: itemType,
          itemId,
          reason,
          description: description || null,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose();
          // Reset form
          setReason('');
          setDescription('');
          setIsSubmitted(false);
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Report {itemType.toLowerCase()}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Report Submitted</h3>
            <p className="text-slate-600">
              Thank you for reporting this {itemType.toLowerCase()}. Our team will review it and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                What are you reporting?
              </label>
              <p className="text-sm text-slate-600 mb-2">{itemName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for report *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                required
              >
                <option value="">Select a reason...</option>
                {reportReasons[itemType].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Provide any additional context that might help us review this report..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-200 text-slate-800 hover:bg-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!reason || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
