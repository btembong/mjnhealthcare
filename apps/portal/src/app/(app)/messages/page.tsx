'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  PaperPlaneTilt, ChatCircle, ArrowDown, CheckCircle,
  Check, Paperclip, X, ArrowSquareOut,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function initials(name?: string) {
  if (!name) return 'C';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  'What\'s the current status of my case?',
  'I\'ve uploaded the requested documents.',
  'Can we schedule a callback?',
  'I need urgent assistance — please contact me.',
];

// ── Consultant header ─────────────────────────────────────────────────────────

function ConsultantHeader({ engagement }: { engagement: any }) {
  const consultant = engagement?.assignedConsultant ?? engagement?.consultant;
  const stage = engagement?.currentStage ?? engagement?.stage;

  return (
    <div className="flex items-center gap-4 border-b border-border bg-white px-6 py-4 shrink-0">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {consultant?.name ? initials(consultant.name) : 'MJN'}
        </div>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {consultant?.name ?? 'MJN Healthcare Team'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {consultant?.specialty ?? 'Your assigned consultant'}
          </p>
          {stage && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {stage.label ?? stage}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Response time note */}
      <div className="hidden sm:block shrink-0 text-right">
        <p className="text-xs text-emerald-600 font-medium">Active</p>
        <p className="text-xs text-muted-foreground">Replies within 24h</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { engagement, me } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);
  const [quickDismissed, setQuickDismissed] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<any | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string>('');

  const engagementId = engagement?.id;

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    if (!engagementId) { setLoading(false); return; }
    try {
      const msgs = await api.getMessages(engagementId);
      setMessages((prev) => {
        const latestNew = msgs[msgs.length - 1]?.id;
        if (latestNew && latestNew !== latestIdRef.current && prev.length > 0) {
          // New messages arrived
          if (!atBottom) setNewBanner(true);
        }
        latestIdRef.current = latestNew ?? '';
        return msgs;
      });
      if (!silent) api.markMessagesRead(engagementId).catch(() => {});
    } catch (err: any) {
      if (!silent) toast.error(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [engagementId, atBottom]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-poll every 20s
  useEffect(() => {
    if (!engagementId) return;
    pollRef.current = setInterval(() => load(true), 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engagementId, load]);

  // Scroll to bottom on new messages (if already at bottom)
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, atBottom]);

  // ── Scroll tracking ───────────────────────────────────────────────────────

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(isBottom);
    if (isBottom) setNewBanner(false);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewBanner(false);
    setAtBottom(true);
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = content.trim();
    if (!text && !attachedDoc) return;
    if (!engagementId) return;

    setSending(true);
    try {
      const body = attachedDoc
        ? `${text ? text + '\n\n' : ''}📎 Attached document: ${attachedDoc.type?.replace(/_/g, ' ')} — ${attachedDoc.fileUrl}`
        : text;
      const msg = await api.sendMessage(engagementId, body);
      setMessages((prev) => [...prev, msg]);
      setContent('');
      setAttachedDoc(null);
      setQuickDismissed(true);
      latestIdRef.current = msg.id;
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function applyQuickReply(text: string) {
    setContent(text);
    setQuickDismissed(true);
  }

  // ── Message grouping ──────────────────────────────────────────────────────

  type GroupedMessage = {
    msg: any;
    isMe: boolean;
    showAvatar: boolean;
    showName: boolean;
    showDate: boolean;
    isLast: boolean;
  };

  const grouped: GroupedMessage[] = messages.map((msg, i) => {
    const isMe = msg.senderId === me?.id;
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameSenderAsPrev = prev && prev.senderId === msg.senderId;
    const sameSenderAsNext = next && next.senderId === msg.senderId;
    const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt);
    const showAvatar = !isMe && (!sameSenderAsNext || !next || !isSameDay(msg.createdAt, next.createdAt));
    const showName = !isMe && !sameSenderAsPrev;
    const isLast = !sameSenderAsNext || (next && !isSameDay(msg.createdAt, next.createdAt));
    return { msg, isMe, showAvatar, showName, showDate, isLast };
  });

  const showQuickReplies = !quickDismissed && messages.length === 0;
  const charCount = content.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="pb-4 shrink-0">
        <PageHeader title="Messages" subtitle="Direct thread with your assigned consultant" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : !engagementId ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-white shadow-sm p-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <ChatCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No active engagement</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Messages are available once your engagement is signed and active. Contact us at{' '}
            <a href="mailto:hello@mjnhealthcare.com" className="text-primary hover:underline">hello@mjnhealthcare.com</a>.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">

          {/* Consultant header */}
          <ConsultantHeader engagement={engagement} />

          {/* New messages banner */}
          {newBanner && (
            <button
              onClick={scrollToBottom}
              className="absolute left-1/2 top-20 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowDown className="h-3.5 w-3.5" /> New messages
            </button>
          )}

          {/* Message list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-5 py-5 space-y-1"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5">
                  <ChatCircle className="h-7 w-7 text-primary/60" />
                </div>
                <p className="font-semibold text-foreground">Start the conversation</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Your consultant is ready. Ask about your case, documents, or next steps.
                </p>
              </div>
            )}

            {grouped.map(({ msg, isMe, showAvatar, showName, showDate, isLast }, i) => (
              <div key={msg.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {formatDate(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {/* Message row */}
                <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${!isLast ? 'mb-0.5' : 'mb-3'}`}>
                  {/* Consultant avatar placeholder (keeps alignment) */}
                  {!isMe && (
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(msg.sender?.name)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender name (first in group only) */}
                    {showName && !isMe && (
                      <p className="mb-1 pl-1 text-xs font-semibold text-primary">
                        {msg.sender?.name ?? 'Consultant'}
                      </p>
                    )}

                    {/* Bubble */}
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-muted/50 text-foreground rounded-bl-sm'
                    }`}>
                      {/* Attachment link rendering */}
                      {msg.content?.includes('📎 Attached document:') ? (
                        <div>
                          {msg.content.split('\n\n📎')[0] && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                              {msg.content.split('\n\n📎')[0]}
                            </p>
                          )}
                          <a
                            href={msg.content.split('— ')[1]}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                              isMe ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-border bg-white text-foreground hover:bg-muted'
                            }`}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {msg.content.split('📎 Attached document: ')[1]?.split(' — ')[0] ?? 'Attachment'}
                            <ArrowSquareOut className="h-3 w-3 ml-auto" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Timestamp + read receipt */}
                      <div className={`mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                        <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.readAt
                            ? <CheckCircle className="h-3 w-3 text-white/80" weight="fill" />
                            : <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom FAB */}
          {!atBottom && !newBanner && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white shadow-md hover:bg-muted transition-colors"
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Quick replies — shown only when no messages yet */}
          {showQuickReplies && (
            <div className="border-t border-border bg-muted/20 px-5 py-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick start</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    onClick={() => applyQuickReply(text)}
                    className="rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attached doc preview */}
          {attachedDoc && (
            <div className="mx-4 mb-0 mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-xs font-medium text-foreground truncate">
                {attachedDoc.type?.replace(/_/g, ' ')}
              </span>
              <button onClick={() => setAttachedDoc(null)} className="rounded p-0.5 hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Compose bar */}
          <form onSubmit={handleSend} className="border-t border-border bg-white p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send · Shift+Enter for new line)"
                  rows={content.split('\n').length > 2 ? Math.min(content.split('\n').length, 5) : 2}
                  className="w-full resize-none rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                {charCount > 300 && (
                  <span className={`absolute bottom-2 right-3 text-[10px] font-medium ${charCount > 1000 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {charCount}/1000
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={sending || (!content.trim() && !attachedDoc)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {sending
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
