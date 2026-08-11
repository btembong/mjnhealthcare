'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bell, FileText, Robot, VideoCamera, UserCircle, CheckCircle,
  Warning, CircleNotch, X,
} from '@phosphor-icons/react';
import { api } from '../lib/api';
import { useAdmin } from '../contexts/admin-context';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  type: 'doc_pending' | 'draft_pending' | 'session_upcoming' | 'escalation' | 'doc_expiring';
  title: string;
  body: string;
  href?: string;
  at: Date;
  read: boolean;
};

const TYPE_ICON: Record<Notification['type'], React.ElementType> = {
  doc_pending:      FileText,
  draft_pending:    Robot,
  session_upcoming: VideoCamera,
  escalation:       Warning,
  doc_expiring:     Warning,
};

const TYPE_COLOR: Record<Notification['type'], string> = {
  doc_pending:      'bg-amber-100 text-amber-600',
  draft_pending:    'bg-violet-100 text-violet-600',
  session_upcoming: 'bg-primary/10 text-primary',
  escalation:       'bg-rose-100 text-rose-600',
  doc_expiring:     'bg-orange-100 text-orange-600',
};

function buildNotifications(
  docs: any[],
  drafts: any[],
  sessions: any[],
  isConsultant: boolean,
  myEmail: string | null,
): Notification[] {
  const notes: Notification[] = [];

  // Pending docs
  for (const d of docs) {
    if (d.status !== 'PENDING') continue;
    notes.push({
      id: `doc-${d.id}`,
      type: 'doc_pending',
      title: 'Document pending review',
      body: `${d.type?.replace(/_/g, ' ') ?? 'Document'} from ${d.person?.name ?? 'a client'}`,
      href: '/documents',
      at: new Date(d.uploadedAt ?? d.createdAt),
      read: false,
    });
  }

  // Expiring docs (within 14 days)
  for (const d of docs) {
    if (!d.expiryDate) continue;
    const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86_400_000);
    if (daysLeft > 14 || daysLeft < 0) continue;
    notes.push({
      id: `exp-${d.id}`,
      type: 'doc_expiring',
      title: 'Document expiring soon',
      body: `${d.type?.replace(/_/g, ' ') ?? 'Document'} for ${d.person?.name ?? 'a client'} — ${daysLeft}d left`,
      href: '/documents',
      at: new Date(),
      read: false,
    });
  }

  // Pending AI drafts
  for (const dr of drafts) {
    notes.push({
      id: `draft-${dr.id}`,
      type: 'draft_pending',
      title: 'AI draft awaiting approval',
      body: dr.subject ?? `Draft for ${dr.engagementId ?? 'a case'}`,
      href: '/drafts',
      at: new Date(dr.createdAt ?? Date.now()),
      read: false,
    });
  }

  // Upcoming sessions (next 24h)
  const now = Date.now();
  for (const s of sessions) {
    if (s.status !== 'CONFIRMED' || !s.slot?.startAt) continue;
    const diff = new Date(s.slot.startAt).getTime() - now;
    if (diff < 0 || diff > 86_400_000) continue;
    notes.push({
      id: `sess-${s.id}`,
      type: 'session_upcoming',
      title: 'Session in less than 24 hours',
      body: `With ${s.clientName} — ${new Date(s.slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      href: '/sessions',
      at: new Date(s.slot.startAt),
      read: false,
    });
  }

  // Sort newest first, cap at 20
  return notes
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 20);
}

export function NotificationBell() {
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [docs, drafts, sessions] = await Promise.all([
        api.getAllDocuments().catch(() => []),
        api.getPendingDrafts().catch(() => []),
        api.getSessions().catch(() => []) as Promise<any[]>,
      ]);
      const notes = buildNotifications(docs, drafts, sessions as any[], isConsultant, me?.email ?? null);
      setNotifications(notes);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [me?.email]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  function handleOpen() {
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground mt-0.5">No pending items right now</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type];
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setReadIds((prev) => new Set([...prev, n.id]));
                      setOpen(false);
                      if (n.href) window.location.href = n.href;
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${isRead ? 'opacity-60' : ''}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[n.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-semibold text-foreground leading-tight ${!isRead ? '' : 'font-normal'}`}>
                          {n.title}
                        </p>
                        {!isRead && <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(n.at, { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <span className="text-[11px] text-muted-foreground">
                Refreshes every 30s · {notifications.length} item{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
