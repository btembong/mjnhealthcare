'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { PaperPlaneTilt, ChatCircle } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';

export default function MessagesPage() {
  const { engagement, me } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const engagementId = engagement?.id;

  useEffect(() => {
    if (!engagementId) { setLoading(false); return; }
    api.getMessages(engagementId)
      .then((msgs) => { setMessages(msgs); api.markMessagesRead(engagementId).catch(() => {}); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [engagementId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !engagementId) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(engagementId, content.trim());
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col space-y-0">
      <div className="px-0 pb-4">
        <PageHeader title="Messages" subtitle="Direct thread with your assigned consultant" />
      </div>

      {loading ? (
        <div className="space-y-3 px-1">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : !engagementId ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
          <ChatCircle className="mb-3 h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-foreground">No active engagement</p>
          <p className="mt-1 text-sm text-muted-foreground">Messages are available once your engagement is active.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <ChatCircle className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">No messages yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Send a message to start the conversation with your consultant.</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === me?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {msg.sender?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? 'C'}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMe ? 'bg-primary text-white' : 'bg-muted/50 text-foreground'}`}>
                    {!isMe && (
                      <p className="mb-1 text-xs font-semibold text-primary">{msg.sender?.name ?? 'Consultant'}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`mt-1.5 text-right text-[10px] ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {formatTime(msg.createdAt)}
                      {isMe && msg.readAt && <span className="ml-1">· Read</span>}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <form onSubmit={handleSend} className="border-t border-border p-4 flex gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <PaperPlaneTilt className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
