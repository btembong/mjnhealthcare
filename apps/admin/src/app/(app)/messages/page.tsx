'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ChatCircle, PaperPlaneRight, CircleNotch, MagnifyingGlass,
  ArrowLeft, User, ArrowSquareOut,
} from '@phosphor-icons/react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

function dateSep(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export default function MessagesPage() {
  const router = useRouter();
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';

  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  // Load consultant's cases
  useEffect(() => {
    api.getAllEngagements()
      .then((engs: any[]) => {
        if (isConsultant && me?.email) {
          setCases(engs.filter((e) => e.consultantEmail?.toLowerCase() === me.email?.toLowerCase()));
        } else {
          setCases(engs);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCases(false));
  }, [isConsultant, me?.email]);

  const loadMessages = useCallback(async (quiet = false) => {
    if (!selectedId) return;
    if (!quiet) setLoadingMsgs(true);
    try {
      const msgs = await api.getEngagementMessages(selectedId);
      setMessages(msgs ?? []);
    } catch { /* silent */ } finally {
      if (!quiet) setLoadingMsgs(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setMessages([]);
    loadMessages();
    pollRef.current = setInterval(() => loadMessages(true), 20_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const content = compose.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    setCompose('');
    try {
      await api.sendEngagementMessage(selectedId, content);
      await loadMessages(true);
    } catch { /* silent */ } finally {
      setSending(false);
      composeRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const selectedCase = cases.find((c) => c.id === selectedId);

  const filteredCases = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      c.person?.name?.toLowerCase().includes(q) ||
      c.person?.email?.toLowerCase().includes(q)
    );
  }, [cases, search]);

  // Group messages by date
  const grouped = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const msgDate = new Date(msg.createdAt);
      const prevDate = prev ? new Date(prev.createdAt) : null;
      const showSep = !prev || format(msgDate, 'yyyy-MM-dd') !== format(prevDate!, 'yyyy-MM-dd');
      const isAdmin = msg.senderType === 'ADMIN';
      const prevSame = prev && prev.senderType === msg.senderType && prev.senderId === msg.senderId;
      return { msg, showSep, dateLabel: showSep ? dateSep(msgDate) : '', isAdmin, prevSame };
    });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">

      {/* ── Left panel: conversation list ── */}
      <div className={`flex w-full flex-col border-r border-border md:w-80 lg:w-96 shrink-0 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div>
            <h1 className="text-base font-bold text-foreground">Messages</h1>
            <p className="text-xs text-muted-foreground">{cases.length} conversation{cases.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="h-8 w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingCases ? (
            <div className="space-y-2 p-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <ChatCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">No conversations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search ? 'No clients match your search.' : 'Assign cases to start messaging clients.'}
              </p>
            </div>
          ) : (
            filteredCases.map((c) => {
              const isSelected = c.id === selectedId;
              const initials = (c.person?.name ?? '??').slice(0, 2).toUpperCase();
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border/50 ${
                    isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initials}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                      c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c.person?.name ?? '—'}</p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'PENDING_SIGNATURE' ? 'bg-amber-100 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {c.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.person?.email ?? '—'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: chat ── */}
      <div className={`flex flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}>
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ChatCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">Select a conversation</p>
            <p className="text-sm text-muted-foreground">Choose a client from the left to view and send messages.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(selectedCase?.person?.name ?? '??').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{selectedCase?.person?.name ?? '—'}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedCase?.person?.email ?? '—'}</p>
              </div>
              <button
                onClick={() => router.push(`/caseload/${selectedId}`)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <ArrowSquareOut className="h-3.5 w-3.5" /> Full case
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <CircleNotch className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <User className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                grouped.map(({ msg, showSep, dateLabel, isAdmin, prevSame }) => (
                  <div key={msg.id}>
                    {showSep && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-xs text-muted-foreground">{dateLabel}</span>
                        <div className="flex-1 border-t border-border" />
                      </div>
                    )}
                    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-0.5' : 'mt-2'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`mt-1 text-[10px] ${isAdmin ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-border px-4 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={composeRef}
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!compose.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40"
                >
                  {sending
                    ? <CircleNotch className="h-4 w-4 animate-spin" />
                    : <PaperPlaneRight className="h-4 w-4" weight="fill" />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
