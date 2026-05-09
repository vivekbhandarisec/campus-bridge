'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Peer {
  userId: string;
  name: string;
  college: string;
  avatarUrl: string | null;
  lastMessage: string;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface MessagesPanelProps {
  peers: Peer[];
  currentUserId: string;
  currentClerkId: string;
}

export function MessagesPanel({ peers, currentUserId, currentClerkId }: MessagesPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedUser = searchParams.get('user') || peers?.[0]?.userId || '';
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    fetch(`/api/messages/${selectedUser}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load conversation');
        const data = await res.json();
        setMessages(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const channel = supabase
      .channel(`user_${currentClerkId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, (payload) => {
        const newMessage = payload.new as MessageItem;
        if (
          (newMessage.senderId === currentUserId && newMessage.receiverId === selectedUser) ||
          (newMessage.senderId === selectedUser && newMessage.receiverId === currentUserId)
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClerkId, currentUserId, selectedUser]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    setError('');
    const response = await fetch(`/api/messages/${selectedUser}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    if (!response.ok) {
      setError('Failed to send');
      return;
    }
    setText('');
    const message = await response.json();
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="app-card p-4">
        <p className="section-label">Inbox</p>
        <h2 className="section-title mt-1">Conversations</h2>
        <div className="mt-4 space-y-3">
          {peers.length > 0 ? peers.map((peer) => (
            <button
              type="button"
              key={peer.userId}
              onClick={() => router.push(`/messages?user=${peer.userId}`)}
              className={`w-full rounded-xl border p-3 text-left transition ${peer.userId === selectedUser ? 'border-sky-500/20 bg-sky-50 text-sky-500' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <p className="font-semibold">{peer.name}</p>
              <p className="mt-1 text-sm text-slate-500">{peer.lastMessage}</p>
            </button>
          )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </aside>

      <section className="app-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="section-title">Chat</h2>
          <p className="text-sm text-slate-500">Select a peer to start messaging.</p>
        </div>

        <div className="min-h-[360px] space-y-4 bg-slate-50/70 p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 max-w-[70%]" />
              <Skeleton className="ml-auto h-14 max-w-[70%]" />
              <Skeleton className="h-14 max-w-[55%]" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={`max-w-[80%] rounded-2xl p-4 ${message.senderId === currentUserId ? 'ml-auto bg-sky-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                <p className="text-sm leading-7">{message.content}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))
          ) : (
            <EmptyState title="No messages yet" description="Select a peer and send the first message when you are ready." />
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-white p-5">
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message..." />
          <Button type="button" onClick={sendMessage}>Send</Button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger-600">{error}</p> : null}
      </section>
    </div>
  );
}
