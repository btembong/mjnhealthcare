'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CircleNotch, MagnifyingGlass, ClipboardText, FunnelSimple, X,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const ACTION_STYLES: Record<string, string> = {
  document_verified:          'bg-emerald-100 text-emerald-700',
  document_rejected:          'bg-rose-100 text-rose-700',
  list_documents:             'bg-blue-100 text-blue-700',
  engagement_letter_signed:   'bg-violet-100 text-violet-700',
  engagement_signed:          'bg-violet-100 text-violet-700',
  payment_completed:          'bg-emerald-100 text-emerald-700',
  login:                      'bg-slate-100 text-slate-700',
};

const RESOURCE_TYPES = ['', 'document', 'person', 'engagement', 'Engagement', 'order'];

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandId, setExpandId] = useState<string | null>(null);

  useEffect(() => { load(); }, [filterType]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAuditLog(filterType ? { resourceType: filterType } : undefined);
      setLogs(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.actorId?.toLowerCase().includes(q) ||
      log.resourceId?.toLowerCase().includes(q) ||
      log.resourceType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="All system actions are recorded here for compliance and security review."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, IDs…"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FunnelSimple className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="">All resource types</option>
            {RESOURCE_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {loading ? '—' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Log table */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/50 p-5">
              <ClipboardText className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No events found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || filterType ? 'Try adjusting your filters.' : 'Audit events will appear here as actions are taken.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log) => {
              const isExpanded = expandId === log.id;
              const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
              return (
                <div key={log.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Action badge */}
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${ACTION_STYLES[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                      {formatAction(log.action)}
                    </span>

                    {/* Resource */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-xs">
                          {log.resourceType}
                        </span>
                        <span className="font-mono text-xs truncate max-w-[180px]" title={log.resourceId}>
                          {log.resourceId}
                        </span>
                      </div>
                    </div>

                    {/* Actor */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[140px]" title={log.actorId}>
                        by {log.actorId?.slice(0, 16)}…
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</p>
                    </div>

                    {/* Expand metadata */}
                    {hasMetadata && (
                      <button
                        onClick={() => setExpandId(isExpanded ? null : log.id)}
                        className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        {isExpanded ? 'Less' : 'Details'}
                      </button>
                    )}
                  </div>

                  {/* Expanded metadata */}
                  {isExpanded && hasMetadata && (
                    <div className="mt-3 rounded-xl bg-muted/30 border border-border p-3">
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Last updated note */}
      {!loading && logs.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing last {logs.length} events · <button onClick={load} className="text-primary hover:underline">Refresh</button>
        </p>
      )}
    </div>
  );
}
