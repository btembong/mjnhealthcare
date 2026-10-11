'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  ChatCircle, PaperPlaneRight, CircleNotch, MagnifyingGlass, ArrowLeft, ArrowSquareOut, ArrowDown,
  Paperclip, FileText, X, Check, CheckCircle,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import { MessageBody, CHAT_FILE_ACCEPT, chatFileProblem, uploadChatFile } from '../../../components/message-body';

const STATUS: Record<string, { label: string; dot: string }> = {
  PENDING_SIGNATURE: { label: 'Awaiting signature', dot: 'bg-accent' },
  ACTIVE:            { label: 'Active',             dot: 'bg-secondary' },
  ON_HOLD:           { label: 'On hold',            dot: 'bg-muted-foreground/50' },
  COMPLETED:         { label: 'Completed',          dot: 'bg-primary' },
  TERMINATED:        { label: 'Terminated',         dot: 'bg-rose-500' },
};

function initials(name?: string | null) {
  return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function sameDay(a: string | Date, b: string | Date) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function clock(date: string) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function dayLabel(date: string) {
  if (sameDay(date, new Date())) return 'Today';
  if (sameDay(date, new Date(Date.now() - 86400000))) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
/** Compact time for the list: the hour today, otherwise the date. */
function listTime(date?: string | null) {
  if (!date) return '';
  if (sameDay(date, new Date())) return clock(date);
  if (sameDay(date, new Date(Date.now() - 86400000))) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function title(s?: string | null) {
  return (s ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

export default function MessagesPage() {
  const { me } = useAdmin();
  const meId: string | undefined = me?.id;

  const [conversations, setConversations] = useState<any[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [filter, setFilter] = useState<'reply' | 'all'>('all');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [compose, setCompose] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const seen = useRef(0);
  const bottomState = useRef(true);
  bottomState.current = atBottom;
  const firstLoad = useRef(true);

  const toBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const loadList = useCallback(async () => {
    try {
      const list = (await api.getConversations()) ?? [];
      setConversations(list);
      setListFailed(false);
      if (firstLoad.current) {
        firstLoad.current = false;
        // A link from a notification email opens that conversation directly.
        const wanted = new URLSearchParams(window.location.search).get('case');
        if (wanted && list.some((c) => c.id === wanted)) setSelectedId(wanted);
        if (list.some((c) => c.needsReply)) setFilter('reply');
      }
    } catch {
      setListFailed(true);
    }
  }, []);

  useEffect(() => {
    loadList();
    const timer = setInterval(loadList, 30_000);
    return () => clearInterval(timer);
  }, [loadList]);

  const loadMessages = useCallback(async (quiet = false) => {
    if (!selectedId) return;
    if (!quiet) setLoadingMsgs(true);
    try {
      const list = (await api.getEngagementMessages(selectedId)) ?? [];
      const arrived = list.length > seen.current;
      const fromClient = list.slice(seen.current).some((m: any) => m.senderType === 'CLIENT');
      seen.current = list.length;
      setMessages(list);
      // Opening a conversation, or watching it when the client writes, counts as reading it.
      if (!quiet || (arrived && fromClient)) {
        api.markEngagementMessagesRead(selectedId).then(() => {
          setConversations((prev) => prev?.map((c) => (c.id === selectedId ? { ...c, unread: 0 } : c)) ?? prev);
        }).catch(() => {});
      }
      if (!quiet) setTimeout(toBottom, 100);
      else if (arrived) { if (bottomState.current) setTimeout(toBottom, 50); else setNewBanner(true); }
    } catch {
      if (!quiet) toast.error('This conversation could not be loaded.');
    } finally {
      if (!quiet) setLoadingMsgs(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    seen.current = 0;
    setMessages([]); setCompose(''); setFile(null); setNewBanner(false); setAtBottom(true);
    loadMessages();
    const timer = setInterval(() => loadMessages(true), 20_000);
    return () => clearInterval(timer);
  }, [selectedId, loadMessages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewBanner(false);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const problem = chatFileProblem(picked);
    if (problem) toast.error(problem); else setFile(picked);
  }

  async function send() {
    const content = compose.trim();
    if ((!content && !file) || !selectedId || sending) return;
    setSending(true);
    try {
      const attachment = file ? await uploadChatFile(selectedId, file) : undefined;
      await api.sendEngagementMessage(selectedId, content, attachment);
      // Cleared only once it is sent, so nothing typed is lost if sending fails.
      setCompose(''); setFile(null);
      if (composeRef.current) composeRef.current.style.height = 'auto';
      await loadMessages(true);
      setTimeout(toBottom, 50);
      loadList();
    } catch (e: any) {
      toast.error(e.message ?? 'The message was not sent. Please try again.');
    } finally {
      setSending(false);
      composeRef.current?.focus();
    }
  }

  const list = conversations ?? [];
  const waiting = list.filter((c) => c.needsReply).length;
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((c) => filter === 'all' || c.needsReply)
      .filter((c) => !q || (c.person?.name ?? '').toLowerCase().includes(q) || (c.person?.email ?? '').toLowerCase().includes(q));
  }, [list, filter, search]);
  const selected = list.find((c) => c.id === selectedId) ?? null;
  const closed = selected && (selected.status === 'COMPLETED' || selected.status === 'TERMINATED');

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* ── Conversations ── */}
      <div data-tour="msg-list" className={`w-full shrink-0 flex-col border-r border-border md:flex md:w-80 lg:w-96 ${selectedId ? 'hidden' : 'flex'}`}>
        <div className="border-b border-border px-4 py-3.5">
          <h1 data-tour="page-title" className="text-base font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">
            {conversations === null ? 'Loading…' : waiting > 0 ? `${waiting} client${waiting === 1 ? ' is' : 's are'} waiting for a reply` : 'No client is waiting for a reply'}
          </p>
        </div>

        <div className="space-y-2 border-b border-border px-3 py-2.5">
          <div className="flex gap-1.5">
            {([['reply', 'Needs reply', waiting], ['all', 'All', list.length]] as const).map(([key, label, n]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${filter === key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}
              >
                {label} <span className={filter === key ? 'text-white/70' : 'text-muted-foreground'}>{conversations ? n : ''}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search clients"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients"
              className="h-9 w-full rounded-xl border border-border bg-white pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations === null && !listFailed ? (
            <div className="space-y-2 p-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : listFailed && list.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Conversations could not be loaded. Check your connection and reload the page.</p>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              {filter === 'reply' && !search ? <CheckCircle className="mb-2 h-8 w-8 text-secondary" weight="fill" /> : <ChatCircle className="mb-2 h-8 w-8 text-muted-foreground/30" />}
              <p className="text-sm font-semibold text-foreground">{search ? 'No client matches your search' : filter === 'reply' ? 'Every client has an answer' : 'No conversations yet'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{search ? '' : filter === 'reply' ? 'Choose “All” to open any conversation.' : 'A conversation appears for each case you can see.'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {shown.map((c) => {
                const mine = c.last && !c.last.fromClient;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      aria-current={c.id === selectedId ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${c.id === selectedId ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(c.person?.name)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm text-foreground ${c.needsReply ? 'font-bold' : 'font-semibold'}`}>{c.person?.name ?? 'Client'}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{listTime(c.last?.at)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className={`min-w-0 flex-1 truncate text-xs ${c.needsReply ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {c.last ? `${mine ? (c.last.senderId === meId ? 'You: ' : `${(c.last.senderName ?? 'Team').split(' ')[0]}: `) : ''}${c.last.text || 'Message'}` : 'No messages yet'}
                          </span>
                          {c.needsReply && <Dot className="bg-accent" />}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Conversation ── */}
      <div data-tour="msg-chat" className={`relative min-w-0 flex-1 flex-col md:flex ${selectedId ? 'flex' : 'hidden'}`}>
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <ChatCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-base font-bold text-foreground">Select a conversation</p>
            <p className="text-sm text-muted-foreground">Conversations where the client is waiting are listed first, with an orange dot.</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
              <button onClick={() => setSelectedId(null)} aria-label="Back to conversations" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"><ArrowLeft className="h-4 w-4" /></button>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(selected.person?.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{selected.person?.name ?? 'Client'}</p>
                <p className="flex items-center gap-x-2 truncate text-xs text-muted-foreground">
                  {selected.person?.profession && <span>{title(selected.person.profession)}</span>}
                  <span className="inline-flex items-center gap-1.5"><Dot className={STATUS[selected.status]?.dot ?? 'bg-muted'} /> {STATUS[selected.status]?.label ?? title(selected.status)}</span>
                </p>
              </div>
              <Link href={`/caseload/${selected.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/60">
                Open case <ArrowSquareOut className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto bg-muted/40 px-4 py-4">
              {loadingMsgs ? (
                <div className="flex h-full items-center justify-center"><CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ChatCircle className="mb-3 h-10 w-10 text-muted-foreground/30" weight="fill" />
                  <p className="text-sm font-semibold text-foreground">No messages yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start the conversation with {selected.person?.name ?? 'the client'} below.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    // Everything not written by the client is the team's side of the conversation.
                    const staff = msg.senderType !== 'CLIENT';
                    const last = !next || next.senderId !== msg.senderId || !sameDay(next.createdAt, msg.createdAt);
                    return (
                      <div key={msg.id}>
                        {(!prev || !sameDay(prev.createdAt, msg.createdAt)) && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">{dayLabel(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className={`mb-0.5 flex items-end gap-1.5 ${staff ? 'flex-row-reverse' : ''}`}>
                          <span className="h-7 w-7 shrink-0">
                            {last && <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${staff ? 'bg-primary' : 'bg-secondary'}`}>{initials(staff ? msg.sender?.name ?? 'Team' : selected.person?.name)}</span>}
                          </span>
                          <div className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${staff ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-border/60 bg-white text-foreground'}`}>
                            <MessageBody msg={msg} onDark={staff} />
                            {last && (
                              <p className={`mt-1 flex items-center gap-1 text-[11px] ${staff ? 'justify-end text-white/60' : 'text-muted-foreground'}`}>
                                {staff && msg.senderId !== meId && msg.sender?.name ? `${msg.sender.name} · ` : ''}{clock(msg.createdAt)}
                                {staff && (msg.readAt ? <CheckCircle className="h-3 w-3" weight="fill" /> : <Check className="h-3 w-3" />)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {(newBanner || !atBottom) && messages.length > 0 && (
              <button
                onClick={() => { toBottom(); setNewBanner(false); }}
                aria-label="Go to the latest message"
                className={`absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-lg ${newBanner ? 'bg-primary text-white' : 'border border-border bg-white text-foreground'}`}
              >
                <ArrowDown className="h-3.5 w-3.5" /> {newBanner ? 'New messages' : ''}
              </button>
            )}

            <div className="shrink-0 border-t border-border bg-white">
              {closed && <p className="border-b border-border/70 px-4 py-2 text-xs text-muted-foreground">This case is {STATUS[selected.status].label.toLowerCase()}. The client can read your message but can no longer reply here.</p>}
              {file && (
                <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{file.name}</span>
                  {!sending && <button onClick={() => setFile(null)} aria-label="Remove file" className="rounded-lg p-1 text-muted-foreground hover:bg-muted/60"><X className="h-4 w-4" /></button>}
                </div>
              )}
              <div className="flex items-end gap-2 px-3 pt-3">
                <input ref={fileRef} type="file" accept={CHAT_FILE_ACCEPT} className="hidden" onChange={pickFile} />
                <button onClick={() => fileRef.current?.click()} disabled={sending} aria-label="Send a file" title="Send a file" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
                  <Paperclip className="h-5 w-5" />
                </button>
                <textarea
                  ref={composeRef}
                  aria-label="Message"
                  value={compose}
                  maxLength={5000}
                  onChange={(e) => { setCompose(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Message ${selected.person?.name ?? 'the client'}…`}
                  rows={1}
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={send} disabled={(!compose.trim() && !file) || sending} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40">
                  {sending ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}
                </button>
              </div>
              <p className="px-4 pb-2 pt-1.5 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line · PDF, JPG, PNG or Word, up to 20 MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
