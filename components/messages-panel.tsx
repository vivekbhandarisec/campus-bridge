'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Ban, Check, Flag, X } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { ReportModal } from './report-modal';
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
  sameCollege?: boolean;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  pending?: boolean;
}

interface MessageRequestItem {
  id: string;
  initialMessage: string;
  createdAt: string;
  sameCollege: boolean;
  user: {
    id: string;
    name: string;
    college: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface MessagesPanelProps {
  peers: Peer[];
  currentUser: {
    id: string;
    name: string;
    college: string;
    avatarUrl: string | null;
    role: string;
  };
  currentClerkId: string;
  initialSelectedUserId?: string;
  initialMessages?: MessageItem[];
  initialRequests?: {
    incoming: MessageRequestItem[];
    outgoing: MessageRequestItem[];
  };
}

function appendMessageOnce(messages: MessageItem[], message: MessageItem) {
  if (messages.some((item) => item.id === message.id)) return messages;
  return [...messages, message];
}

export function MessagesPanel({
  peers,
  currentUser,
  currentClerkId,
  initialSelectedUserId = '',
  initialMessages = [],
  initialRequests = { incoming: [], outgoing: [] },
}: MessagesPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedUser = searchParams.get('user') || peers?.[0]?.userId || '';
  const selectedPeer = peers.find((peer) => peer.userId === selectedUser);
  const peopleById = useMemo(() => {
    const people = new Map<string, Pick<Peer, 'name' | 'avatarUrl' | 'role'>>();
    people.set(currentUser.id, currentUser);
    peers.forEach((peer) => people.set(peer.userId, peer));
    return people;
  }, [currentUser, peers]);
  const [messages, setMessages] = useState<MessageItem[]>(() => (
    selectedUser && selectedUser === initialSelectedUserId ? initialMessages : []
  ));
  const [requests, setRequests] = useState(initialRequests);
  const [canMessage, setCanMessage] = useState(() => initialMessages.length > 0);
  const [requestNotice, setRequestNotice] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedUser) return;
    if (selectedUser === initialSelectedUserId) {
      setMessages(initialMessages);
      setCanMessage(initialMessages.length > 0);
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
        setMessages(data.messages ?? []);
        setCanMessage(Boolean(data.canMessage));
        setBlocked(data.blocked ?? null);
        setRequestNotice(data.request?.status === 'PENDING'
          ? data.request.requesterId === currentUser.id
            ? 'Your message request is waiting for approval.'
            : 'Accept this message request before chatting.'
          : data.reason ?? '');
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentUser.id, initialMessages, initialSelectedUserId, selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`user_${currentClerkId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, (payload) => {
        const newMessage = payload.new as MessageItem;
        if (
          (newMessage.senderId === currentUser.id && newMessage.receiverId === selectedUser) ||
          (newMessage.senderId === selectedUser && newMessage.receiverId === currentUser.id)
        ) {
          setMessages((prev) => appendMessageOnce(prev, newMessage));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClerkId, currentUser.id, selectedUser]);

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
      senderId: currentUser.id,
      receiverId: selectedUser,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setText('');
    if (canMessage) {
      setMessages((prev) => appendMessageOnce(prev, optimisticMessage));
    } else if (selectedPeer) {
      setRequestNotice('Sending message request...');
    }

    try {
      const response = await fetch(`/api/messages/${selectedUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (response.status === 202) {
        const data = await response.json().catch(() => ({}));
        setRequestNotice(data.message || 'Message request sent.');
        setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
        if (selectedPeer && data.request) {
          const requestItem: MessageRequestItem = {
            id: data.request.id,
            initialMessage: data.request.initialMessage ?? content,
            createdAt: data.request.createdAt ?? new Date().toISOString(),
            sameCollege: Boolean(selectedPeer.sameCollege),
            user: {
              id: selectedPeer.userId,
              name: selectedPeer.name,
              college: selectedPeer.college,
              avatarUrl: selectedPeer.avatarUrl,
              role: selectedPeer.role,
            },
          };
          setRequests((current) => ({
            incoming: current.incoming,
            outgoing: current.outgoing.some((request) => request.id === requestItem.id)
              ? current.outgoing
              : [requestItem, ...current.outgoing],
          }));
        }
        return;
      }
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

  const respondToRequest = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    setError('');
    const request = requests.incoming.find((item) => item.id === requestId);
    const response = await fetch(`/api/message-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || 'Could not update request');
      return;
    }
    const data = await response.json().catch(() => ({}));

    setRequests((current) => ({
      ...current,
      incoming: current.incoming.filter((request) => request.id !== requestId),
    }));
    if (action === 'ACCEPT' && data.message) {
      if (request?.user.id === selectedUser) {
        setCanMessage(true);
        setRequestNotice('');
        setMessages((current) => appendMessageOnce(current, {
          ...data.message,
          createdAt: data.message.createdAt ?? new Date().toISOString(),
        }));
      }
    }
  };

  const blockSelectedUser = async () => {
    if (!selectedUser || !selectedPeer) return;
    const confirmed = window.confirm(`Block ${selectedPeer.name}? They will not be able to message you.`);
    if (!confirmed) return;

    const response = await fetch(`/api/users/${selectedUser}/block`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || 'Could not block user');
      return;
    }
    setBlocked('OUTGOING');
    setCanMessage(false);
    setRequestNotice('User blocked.');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="app-card p-4">
        <p className="section-label">Inbox</p>
        <h2 className="section-title mt-1">Conversations</h2>
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {requests.incoming.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Message Requests</p>
              <div className="mt-3 space-y-3">
                {requests.incoming.map((request) => (
                  <div key={request.id} className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Avatar src={request.user.avatarUrl} name={request.user.name} className="h-8 w-8 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{request.user.name}</p>
                        <p className="truncate text-xs text-slate-500">{request.user.college}</p>
                      </div>
                      {request.sameCollege ? <Badge className="border-teal-600/20 bg-teal-50 text-[10px] text-teal-700">Same College</Badge> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{request.initialMessage}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => respondToRequest(request.id, 'ACCEPT')} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-teal-600 text-xs font-semibold text-white">
                        <Check className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button type="button" onClick={() => respondToRequest(request.id, 'DECLINE')} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                        <X className="h-3.5 w-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {requests.outgoing.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sent Requests</p>
              <div className="mt-2 space-y-2">
                {requests.outgoing.map((request) => (
                  <div key={request.id} className="rounded-lg bg-white p-2 text-xs text-slate-600">
                    Waiting for <span className="font-semibold text-slate-900">{request.user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
                    <div className="flex shrink-0 gap-1">
                      {peer.sameCollege ? <Badge className="border-teal-600/20 bg-teal-50 text-[10px] text-teal-700">Same College</Badge> : null}
                      <Badge className={cn('text-[10px] uppercase tracking-wide', roleIdentity(peer.role).badge)}>{roleIdentity(peer.role).label}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{peer.lastMessage}</p>
                </div>
              </div>
            </button>
          )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </aside>

      <section className="app-card min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="section-title shrink-0">Chat</h2>
          {selectedPeer ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <Avatar src={selectedPeer.avatarUrl} name={selectedPeer.name} className="h-9 w-9 shrink-0" />
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold text-slate-900">{selectedPeer.name}</p>
                <div className="mt-1 flex flex-wrap justify-end gap-1">
                  {selectedPeer.sameCollege ? <Badge className="border-teal-600/20 bg-teal-50 text-[10px] text-teal-700">Same College</Badge> : null}
                  <Badge className={cn('uppercase tracking-wide', roleIdentity(selectedPeer.role).badge)}>{roleIdentity(selectedPeer.role).label}</Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setShowReportModal(true)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Report user">
                  <Flag className="h-4 w-4" />
                </button>
                <button type="button" onClick={blockSelectedUser} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50" aria-label="Block user">
                  <Ban className="h-4 w-4" />
                </button>
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
            messages.map((message) => {
              const isMine = message.senderId === currentUser.id;
              const sender = peopleById.get(message.senderId) ?? (isMine ? currentUser : selectedPeer);

              return (
                <div key={message.id} className={cn('flex items-end gap-2', isMine && 'justify-end')}>
                  {!isMine ? <Avatar src={sender?.avatarUrl ?? null} name={sender?.name ?? 'User'} className="h-8 w-8 shrink-0" /> : null}
                  <div className={cn('min-w-0 max-w-[82%] rounded-2xl px-4 py-3 shadow-sm transition', isMine ? 'rounded-br-md bg-sky-500 text-white' : `rounded-bl-md border bg-white text-slate-700 ${selectedPeer ? roleIdentity(selectedPeer.role).border : 'border-slate-200'} border-l-4`, message.pending && 'opacity-70')}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className={cn('truncate text-xs font-semibold', isMine ? 'text-sky-50' : 'text-slate-700')}>{sender?.name ?? 'User'}</p>
                      <p className={cn('shrink-0 text-[11px]', isMine ? 'text-sky-100' : 'text-slate-500')}>
                        {message.pending ? 'Sending...' : new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="break-words text-sm leading-6">{message.content}</p>
                  </div>
                  {isMine ? <Avatar src={currentUser.avatarUrl} name={currentUser.name} className="h-8 w-8 shrink-0" /> : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              title={selectedPeer ? canMessage ? `Start a conversation with ${selectedPeer.name}` : 'Send a message request' : 'No messages yet'}
              description={selectedPeer ? requestNotice || 'Your first message becomes a request. Chat opens after they accept.' : 'Select a peer and send the first message when you are ready.'}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row">
          <Input
            className="min-w-0 flex-1"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            disabled={!selectedUser || sending || blocked === 'INCOMING' || blocked === 'OUTGOING'}
            placeholder={selectedPeer ? canMessage ? `Message ${selectedPeer.name}` : `Request to message ${selectedPeer.name}` : 'Select a conversation'}
          />
          <Button type="button" onClick={sendMessage} disabled={!text.trim() || !selectedUser || sending || blocked === 'INCOMING' || blocked === 'OUTGOING'} className="w-full shrink-0 sm:w-auto">
            {sending ? 'Sending...' : canMessage ? 'Send' : 'Send Request'}
          </Button>
        </div>
        {requestNotice ? <p className="px-5 pb-2 text-sm text-slate-500">{requestNotice}</p> : null}
        {error ? <p className="px-5 pb-4 text-sm text-danger-600">{error}</p> : null}
      </section>
      {selectedPeer ? (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemType="USER"
          itemId={selectedPeer.userId}
          itemName={selectedPeer.name}
        />
      ) : null}
    </div>
  );
}
