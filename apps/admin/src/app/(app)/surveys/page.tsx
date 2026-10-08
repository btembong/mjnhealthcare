'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  PageHeader, Skeleton, StatCard, ConfirmDialog,
  Dialog, DialogContent, DialogTitle, DialogDescription,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  ClipboardText, Plus, CircleNotch, MagnifyingGlass, DotsThreeVertical, Copy, Trash, LinkSimple,
  Pencil, ChartBar, Play, Stop, Users, CheckCircle,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { STATUS_LABELS, STATUS_STYLES, formatDate, publicUrl } from './shared';

type TabKey = 'ALL' | 'LIVE' | 'DRAFT' | 'CLOSED';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' }, { key: 'LIVE', label: 'Live' }, { key: 'DRAFT', label: 'Drafts' }, { key: 'CLOSED', label: 'Closed' },
];

export default function SurveysPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  useEffect(() => {
    api.getSurveys()
      .then(setSurveys)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: surveys.length };
    for (const s of surveys) m[s.status] = (m[s.status] ?? 0) + 1;
    return m;
  }, [surveys]);
  const totalResponses = useMemo(() => surveys.reduce((sum, s) => sum + (s.responseCount ?? 0), 0), [surveys]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return surveys.filter((s) => (tab === 'ALL' || s.status === tab) && (!q || s.title.toLowerCase().includes(q)));
  }, [surveys, tab, search]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const survey = await api.createSurvey(title.trim());
      router.push(`/surveys/${survey.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setCreating(false);
    }
  }

  async function setStatus(survey: any, status: string, success: string) {
    setBusyId(survey.id);
    try {
      const updated = await api.updateSurvey(survey.id, { status });
      setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, status: updated.status } : s)));
      toast.success(success);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(survey: any) {
    setBusyId(survey.id);
    try {
      const copy = await api.duplicateSurvey(survey.id);
      router.push(`/surveys/${copy.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setBusyId(null);
    }
  }

  async function remove(survey: any) {
    try {
      await api.deleteSurvey(survey.id);
      setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
      toast.success('Survey deleted.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function copyLink(survey: any) {
    navigator.clipboard.writeText(publicUrl(survey.slug))
      .then(() => toast.success('Link copied.'))
      .catch(() => toast.error('Could not copy the link.'));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        subtitle="Collect feedback from leads, clients and the public"
        actions={
          <button onClick={() => { setTitle(''); setCreateOpen(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New survey
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live" value={counts.LIVE ?? 0} icon={CheckCircle} accent="emerald" />
        <StatCard label="Drafts" value={counts.DRAFT ?? 0} icon={Pencil} accent="primary" />
        <StatCard label="Closed" value={counts.CLOSED ?? 0} icon={Stop} accent="amber" />
        <StatCard label="Total responses" value={totalResponses.toLocaleString()} icon={Users} accent="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-white p-1 shadow-sm" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}>
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${tab === t.key ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search surveys" aria-label="Search surveys"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <ClipboardText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">
            {surveys.length === 0 ? 'No surveys yet' : search.trim() ? 'No surveys match your search' : 'Nothing in this tab'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {surveys.length === 0 ? 'Create a survey, add your questions, then share the link.' : 'Try another tab or clear the search.'}
          </p>
          {surveys.length === 0 && (
            <button onClick={() => { setTitle(''); setCreateOpen(true); }}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New survey
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/20 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Survey</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Questions</th>
                  <th className="px-5 py-3 text-right font-semibold">Responses</th>
                  <th className="px-5 py-3 text-right font-semibold">Response rate</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((s) => {
                  const rate = s.viewCount > 0 ? Math.min(100, Math.round((s.responseCount / s.viewCount) * 100)) : null;
                  const busy = busyId === s.id;
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-muted/10">
                      <td className="max-w-[20rem] px-5 py-3.5">
                        <Link href={`/surveys/${s.id}`} className="block truncate font-semibold text-foreground hover:text-primary">{s.title}</Link>
                        <p className="truncate text-xs text-muted-foreground">/survey/{s.slug}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[s.status]}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-foreground">{s.questionCount}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">{s.responseCount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground" title={rate === null ? undefined : `${s.responseCount} responses from ${s.viewCount} visits`}>
                        {rate === null ? '—' : `${rate}%`}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {busy && <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" />}
                          <Link href={`/surveys/${s.id}${s.responseCount > 0 ? '?tab=results' : ''}`}
                            className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40">
                            {s.responseCount > 0 ? <><ChartBar className="h-3 w-3" /> Results</> : <><Pencil className="h-3 w-3" /> Edit</>}
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button aria-label={`More actions for ${s.title}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                                <DotsThreeVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onSelect={() => router.push(`/surveys/${s.id}`)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
                              </DropdownMenuItem>
                              {s.status !== 'DRAFT' && (
                                <DropdownMenuItem onSelect={() => copyLink(s)}>
                                  <LinkSimple className="h-4 w-4 text-muted-foreground" /> Copy public link
                                </DropdownMenuItem>
                              )}
                              {s.status !== 'LIVE' && (
                                <DropdownMenuItem onSelect={() => setStatus(s, 'LIVE', s.status === 'DRAFT' ? 'Survey published.' : 'Survey reopened.')}>
                                  <Play className="h-4 w-4 text-muted-foreground" /> {s.status === 'DRAFT' ? 'Publish' : 'Reopen'}
                                </DropdownMenuItem>
                              )}
                              {s.status === 'LIVE' && (
                                <DropdownMenuItem onSelect={() => setStatus(s, 'CLOSED', 'Survey closed.')}>
                                  <Stop className="h-4 w-4 text-muted-foreground" /> Close
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => duplicate(s)}>
                                <Copy className="h-4 w-4 text-muted-foreground" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setDeleteTarget(s)} className="text-rose-600 focus:bg-rose-50">
                                <Trash className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">New survey</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              It starts as a draft. Nobody can see it until you publish.
            </DialogDescription>
          </div>
          <form onSubmit={create} className="space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus maxLength={200}
              placeholder="e.g. Consultation feedback" aria-label="Survey title"
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40">Cancel</button>
              <button type="submit" disabled={creating || !title.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                {creating && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Create and add questions
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete this survey?"
        description={
          deleteTarget?.responseCount > 0
            ? `"${deleteTarget?.title}" and its ${deleteTarget?.responseCount} responses will be permanently deleted. Export the results first if you need them.`
            : `"${deleteTarget?.title}" will be permanently deleted.`
        }
        confirmLabel="Delete survey"
        cancelLabel="Keep it"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) remove(deleteTarget); }}
      />
    </div>
  );
}
