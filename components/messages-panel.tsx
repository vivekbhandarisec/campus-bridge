'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { cn } from '@/lib/utils';
import { roleIdentity } from '@/lib/role-identity';

interface Peer {
  userId: string;
  name: string;
  college: string;
  avatarUrl: string | null;
  role: string;
  lastMessage: string;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  pending?: boolean;
}

interface MessagesPanelProps {
  peers: Peer[];
  currentUserId: string;
  currentClerkId: string;
  initialSelectedUserId?: string;
  initialMessages?: MessageItem[];
}

function appendMessageOnce(messages: MessageItem[], message: MessageItem) {
  if (messages.some((item) => item.id === message.id)) return messages;
  return [...messages, message];
}

export function MessagesPanel({
  peers,
  currentUserId,
  currentClerkId,
  initialSelectedUserId = '',
  initialMessages = [],
}: MessagesPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedUser = searchParams.get('user') || peers?.[0]?.userId || '';
  const selectedPeer = peers.find((peer) => peer.userId === selectedUser);
  const [messages, setMessages] = useState<MessageItem[]>(() => (
    selectedUser && selectedUser === initialSelectedUserId ? initialMessages : []
  ));
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedUser) return;
    if (selectedUser === initialSelectedUserId) {
      setMessages(initialMessages);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setError('');
    setLoading(true);
    fetch(`/api/messages/${selectedUser}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load conversation');
        const data = await res.json();
        setMessages(data);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [initialMessages, initialSelectedUserId, selectedUser]);

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
          setMessages((prev) => appendMessageOnce(prev, newMessage));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClerkId, currentUserId, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !selectedUser || sending) return;
    setError('');
    setSending(true);
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMessage: MessageItem = {
      id: optimisticId,
      senderId: currentUserId,
      receiverId: selectedUser,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setText('');
    setMessages((prev) => appendMessageOnce(prev, optimisticMessage));

    try {
      const response = await fetch(`/api/messages/${selectedUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send');
      }
      const message = await response.json();
      setMessages((prev) => appendMessageOnce(prev.filter((item) => item.id !== optimisticId), message));
    } catch (err) {
      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      setText(content);
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
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
              className={cn('w-full rounded-xl border border-l-4 p-3 text-left transition', roleIdentity(peer.role).border, peer.userId === selectedUser ? roleIdentity(peer.role).panel : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            >
              <div className="flex items-center gap-3">
                <Avatar src={peer.avatarUrl} name={peer.name} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold">{peer.name}</p>
                    <Badge className={cn('shrink-0 text-[10px] uppercase tracking-wide', roleIdentity(peer.role).badge)}>{roleIdentity(peer.role).label}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{peer.lastMessage}</p>
                </div>
              </div>
            </button>
          )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </aside>

      <section className="app-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="section-title">Chat</h2>
          {selectedPeer ? (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar src={selectedPeer.avatarUrl} name={selectedPeer.name} className="h-9 w-9 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{selectedPeer.name}</p>
                <Badge className={cn('mt-1 uppercase tracking-wide', roleIdentity(selectedPeer.role).badge)}>{roleIdentity(selectedPeer.role).label}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a peer to start messaging.</p>
          )}
        </div>

        <div className="max-h-[60vh] min-h-[360px] space-y-4 overflow-y-auto bg-slate-50/70 p-5 scroll-smooth">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 max-w-[70%]" />
              <Skeleton className="ml-auto h-14 max-w-[70%]" />
              <Skeleton className="h-14 max-w-[55%]" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={cn('max-w-[80%] rounded-2xl p-4 transition', message.senderId === currentUserId ? 'ml-auto bg-sky-500 text-white' : `border bg-white text-slate-700 ${selectedPeer ? roleIdentity(selectedPeer.role).border : 'border-slate-200'} border-l-4`, message.pending && 'opacity-70')}>
                <p className="text-sm leading-7">{message.content}</p>
                <p className={cn('mt-2 text-xs', message.senderId === currentUserId ? 'text-sky-100' : 'text-slate-500')}>
                  {message.pending ? 'Sending...' : new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title={selectedPeer ? `Start a conversation with ${selectedPeer.name}` : 'No messages yet'}
              description={selectedPeer ? 'Send a concise intro, mention the match context, and ask one focused question.' : 'Select a peer and send the first message when you are ready.'}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            disabled={!selectedUser || sending}
            placeholder={selectedPeer ? `Message ${selectedPeer.name}` : 'Select a conversation'}
          />
          <Button type="button" onClick={sendMessage} disabled={!text.trim() || !selectedUser || sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
        {error ? <p className="px-5 pb-4 text-sm text-danger-600">{error}</p> : null}
      </section>
    </div>
  );
}
