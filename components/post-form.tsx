'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

const types = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ADVICE', label: 'Advice' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
];

export function PostForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });
      if (!response.ok) throw new Error('Unable to post');
      setContent('');
      setType('GENERAL');
      setMessage('Post published.');
      router.refresh();
    } catch (error) {
      setMessage('Failed to create post.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="app-card p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="section-title">Share a quick update</h2>
          <p className="text-sm text-slate-500">Post a question, opportunity, or insight with the campus network.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="What would you like to share?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            {types.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Posting...' : 'Post update'}
          </Button>
        </div>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </section>
  );
}
