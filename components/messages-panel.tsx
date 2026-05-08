'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
}

export function MessagesPanel({ peers }: MessagesPanelProps) {
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
      .channel(`messages:${selectedUser}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, (payload) => {
        const newMessage = payload.new as MessageItem;
        if (newMessage.senderId === selectedUser || newMessage.receiverId === selectedUser) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);

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
    setMessages((prev) => [...prev, { id: Date.now().toString(), senderId: 'me', receiverId: selectedUser, content: text, createdAt: new Date().toISOString() }]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
        <div className="mt-4 space-y-3">
          {peers.length > 0 ? peers.map((peer) => (
            <button
              type="button"
              key={peer.userId}
              onClick={() => router.push(`/messages?user=${peer.userId}`)}
              className={`w-full rounded-3xl p-4 text-left ${peer.userId === selectedUser ? 'bg-brand-50 text-brand-900' : 'bg-slate-50 text-slate-700'}`}
            >
              <p className="font-semibold">{peer.name}</p>
              <p className="mt-1 text-sm text-slate-500">{peer.lastMessage}</p>
            </button>
          )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </aside>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Chat</h2>
          <p className="text-sm text-slate-500">Select a peer to start messaging.</p>
        </div>

        <div className="mt-6 min-h-[320px] space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading conversation…</p>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={`rounded-3xl p-4 ${message.senderId === 'me' ? 'bg-brand-600 text-white self-end' : 'bg-slate-100 text-slate-700'}`}>
                <p className="text-sm leading-7">{message.content}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No messages yet. Say hello.</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message..." />
          <Button type="button" onClick={sendMessage}>Send</Button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>
    </div>
  );
}
