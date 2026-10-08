'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  PageHeader, Skeleton, StatCard, ConfirmDialog,
  Dialog, DialogContent, DialogTitle, DialogDescription,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  MegaphoneSimple, Plus, CircleNotch, PaperPlaneTilt, Pencil, FileArrowUp, Users, Trash,
  MagnifyingGlass, DotsThreeVertical, Pause, Play, Stop, ClockCounterClockwise, Copy,
  CalendarBlank, ArrowsClockwise, Envelope, CheckCircle,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { CampaignComposer } from './composer';
import { ImportModal } from './import-modal';
import {
  SavedList, STATUS_STYLES, TIMEZONES, audienceLabel, describeRecurrence, formatDateTime,
  formatInTimezone, formatLabel, isRecurring, isValidEmail,
} from './shared';

type TabKey = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'RECURRING' | 'SENT' | 'CANCELLED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'RECURRING', label: 'Recurring' },
  { key: 'SENT', label: 'Sent' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const LIVE_STATUSES = ['SCHEDULED', 'PAUSED', 'SENDING'];

function inTab(c: any, tab: TabKey) {
  if (tab === 'ALL') return true;
  if (tab === 'SCHEDULED') return !isRecurring(c) && LIVE_STATUSES.includes(c.status);
  if (tab === 'RECURRING') return isRecurring(c) && LIVE_STATUSES.includes(c.status);
  return c.status === tab;
}

function timezoneName(tz: string) {
  return TIMEZONES.find((t) => t.value === tz)?.label ?? tz;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [composer, setComposer] = useState<{ open: boolean; campaign: any | null }>({ open: false, campaign: null });
  const [importOpen, setImportOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);

  const [sendTarget, setSendTarget] = useState<{ campaign: any; count: number | null } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [deleteListTarget, setDeleteListTarget] = useState<SavedList | null>(null);
  const [testTarget, setTestTarget] = useState<any | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState<{ campaign: any; runs: any[] | null } | null>(null);

  const reload = useCallback(() => api.getCampaigns().then(setCampaigns), []);

  useEffect(() => {
    reload()
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
    api.getContactLists().then(setLists).catch((err: any) => toast.error(err.message));
  }, [reload]);

  // Sends run in the background on the server; refresh until they finish.
  const anySending = campaigns.some((c) => c.status === 'SENDING');
  useEffect(() => {
    if (!anySending) return;
    const timer = setInterval(() => { reload().catch(() => {}); }, 5000);
    return () => clearInterval(timer);
  }, [anySending, reload]);

  const counts = useMemo(() => {
    const m = {} as Record<TabKey, number>;
    for (const t of TABS) m[t.key] = campaigns.filter((c) => inTab(c, t.key)).length;
    return m;
  }, [campaigns]);

  const sentThisMonth = useMemo(() => {
    const now = new Date();
    return campaigns.filter((c) => {
      const last = c.lastRunAt ?? c.sentAt;
      if (!last) return false;
      const d = new Date(last);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [campaigns]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) =>
      inTab(c, tab) && (!q || c.name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q)),
    );
  }, [campaigns, tab, search]);

  function patch(updated: any) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  async function run(id: string, action: () => Promise<any>, success: string) {
    setBusyId(id);
    try {
      patch(await action());
      toast.success(success);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function askSend(campaign: any) {
    setSendTarget({ campaign, count: null });
    const af = campaign.audienceFilter;
    if (!af?.type) return;
    api.countCampaignAudience(af)
      .then((res) => setSendTarget((cur) => (cur?.campaign.id === campaign.id ? { campaign, count: res.deliverable } : cur)))
      .catch(() => {});
  }

  function duplicate(c: any) {
    // No id, so the composer treats it as a new campaign.
    setComposer({ open: true, campaign: { ...c, id: undefined, name: `${c.name} (copy)`, status: 'DRAFT' } });
  }

  async function openHistory(campaign: any) {
    setHistory({ campaign, runs: null });
    try {
      const runs = await api.getCampaignRuns(campaign.id);
      setHistory((cur) => (cur?.campaign.id === campaign.id ? { campaign, runs } : cur));
    } catch (err: any) {
      toast.error(err.message);
      setHistory(null);
    }
  }

  async function sendTest() {
    if (!testTarget) return;
    if (!isValidEmail(testEmail.trim())) { toast.error('Enter a valid email address.'); return; }
    setTesting(true);
    try {
      const res = await api.sendCampaignTest(testTarget.id, testEmail.trim());
      toast.success(`Test sent to ${res.sentTo}.`);
      setTestTarget(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  }

  async function deleteList(list: SavedList) {
    try {
      await api.deleteContactList(list.id);
      setLists((prev) => prev.filter((l) => l.id !== list.id));
      toast.success('List deleted.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const sendDescription = (() => {
    if (!sendTarget) return '';
    const { campaign, count } = sendTarget;
    const audience = audienceLabel(campaign.audienceFilter);
    const who = count === null ? `everyone in ${audience}` : `${count.toLocaleString()} ${count === 1 ? 'person' : 'people'} in ${audience}`;
    return isRecurring(campaign)
      ? `This sends one extra email to ${who} right now. The regular schedule carries on as normal.`
      : `This sends "${campaign.name}" to ${who} right now. It cannot be undone.`;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        subtitle="Email your leads and clients, once or on a repeating schedule"
        actions={
          <>
            <button onClick={() => setListsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40">
              <Users className="h-4 w-4 text-primary" /> Contact lists
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">{lists.length}</span>
            </button>
            <button onClick={() => setComposer({ open: true, campaign: null })}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New campaign
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Drafts" value={counts.DRAFT ?? 0} icon={Pencil} accent="primary" />
        <StatCard label="Scheduled" value={counts.SCHEDULED ?? 0} icon={CalendarBlank} accent="teal" />
        <StatCard label="Recurring" value={counts.RECURRING ?? 0} icon={ArrowsClockwise} accent="violet" />
        <StatCard label="Sent this month" value={sentThisMonth} icon={Envelope} accent="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-white p-1 shadow-sm" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}>
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                tab === t.key ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns" aria-label="Search campaigns"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <MegaphoneSimple className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">
            {campaigns.length === 0 ? 'No campaigns yet' : search.trim() ? 'No campaigns match your search' : 'Nothing in this tab'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaigns.length === 0 ? 'Create your first campaign to email your leads or clients.' : 'Try another tab or clear the search.'}
          </p>
          {campaigns.length === 0 && (
            <button onClick={() => setComposer({ open: true, campaign: null })}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New campaign
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/20 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-5 py-3 font-semibold">Audience</th>
                  <th className="px-5 py-3 font-semibold">Schedule</th>
                  <th className="px-5 py-3 font-semibold">Next send</th>
                  <th className="px-5 py-3 font-semibold">Last send</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((c) => {
                  const recurring = isRecurring(c);
                  const lastRun = c.runs?.[0];
                  const busy = busyId === c.id;
                  const editable = ['DRAFT', 'SCHEDULED', 'PAUSED'].includes(c.status);
                  // Campaigns scheduled before the built-in scheduler are sent by Brevo itself.
                  const viaBrevo = c.status === 'SCHEDULED' && !c.nextRunAt && !!c.brevoId;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/10">
                      <td className="max-w-[16rem] px-5 py-3.5">
                        <p className="truncate font-semibold text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <Users className="h-3 w-3" /> {audienceLabel(c.audienceFilter)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {recurring ? (
                          <>
                            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <ArrowsClockwise className="h-3.5 w-3.5 shrink-0 text-violet-600" /> {describeRecurrence(c)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {timezoneName(c.timezone)}
                              {c.maxRuns ? ` · ${c.runCount}/${c.maxRuns} sent` : c.endsAt ? ` · until ${new Date(c.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                            </p>
                          </>
                        ) : c.scheduledAt ? (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <CalendarBlank className="h-3.5 w-3.5 shrink-0 text-teal-600" /> Once
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-foreground">
                        {c.status === 'SCHEDULED' && c.nextRunAt
                          ? (recurring ? formatInTimezone(c.nextRunAt, c.timezone) : formatDateTime(c.nextRunAt))
                          : viaBrevo && c.scheduledAt
                            ? <>{formatDateTime(c.scheduledAt)}<span className="block text-muted-foreground">sent by Brevo</span></>
                            : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        {lastRun ? (
                          <>
                            <p className="font-medium tabular-nums text-foreground">
                              {lastRun.sentCount.toLocaleString()} sent
                              {lastRun.failedCount > 0 && <span className="ml-1.5 text-rose-600">{lastRun.failedCount} failed</span>}
                            </p>
                            <p className="text-muted-foreground">{formatDateTime(lastRun.startedAt)}</p>
                          </>
                        ) : c.sentAt ? (
                          <p className="text-muted-foreground">{formatDateTime(c.sentAt)}</p>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {c.status === 'SENDING' && <CircleNotch className="h-3 w-3 animate-spin" />}
                          {formatLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {busy && <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {c.status === 'DRAFT' && (
                            <button onClick={() => askSend(c)} disabled={busy}
                              className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                              <PaperPlaneTilt className="h-3 w-3" /> Send now
                            </button>
                          )}
                          {c.status === 'SCHEDULED' && !viaBrevo && (
                            <button onClick={() => run(c.id, () => api.pauseCampaign(c.id), 'Campaign paused.')} disabled={busy}
                              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-50">
                              <Pause className="h-3 w-3" /> Pause
                            </button>
                          )}
                          {c.status === 'PAUSED' && (
                            <button onClick={() => run(c.id, () => api.resumeCampaign(c.id), 'Campaign resumed.')} disabled={busy}
                              className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                              <Play className="h-3 w-3" /> Resume
                            </button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button aria-label={`More actions for ${c.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                                <DotsThreeVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {editable && (
                                <DropdownMenuItem onSelect={() => setComposer({ open: true, campaign: c })}>
                                  <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
                                </DropdownMenuItem>
                              )}
                              {c.status === 'SCHEDULED' && !viaBrevo && (
                                <DropdownMenuItem onSelect={() => askSend(c)}>
                                  <PaperPlaneTilt className="h-4 w-4 text-muted-foreground" /> {recurring ? 'Send an extra one now' : 'Send now instead'}
                                </DropdownMenuItem>
                              )}
                              {c.status !== 'CANCELLED' && (
                                <DropdownMenuItem onSelect={() => { setTestEmail(''); setTestTarget(c); }}>
                                  <Envelope className="h-4 w-4 text-muted-foreground" /> Send a test
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => openHistory(c)}>
                                <ClockCounterClockwise className="h-4 w-4 text-muted-foreground" /> Send history
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => duplicate(c)}>
                                <Copy className="h-4 w-4 text-muted-foreground" /> Duplicate
                              </DropdownMenuItem>
                              {['DRAFT', 'SCHEDULED', 'PAUSED', 'SENDING'].includes(c.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => setCancelTarget(c)} className="text-rose-600 focus:bg-rose-50">
                                    <Stop className="h-4 w-4" /> {c.status === 'SENDING' ? 'Stop sending' : 'Cancel campaign'}
                                  </DropdownMenuItem>
                                </>
                              )}
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
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">{visible.length} campaign{visible.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Composer */}
      <CampaignComposer
        open={composer.open}
        onOpenChange={(open) => setComposer((s) => ({ ...s, open }))}
        campaign={composer.campaign}
        lists={lists}
        onImportList={() => setImportOpen(true)}
        onSaved={(saved, sendNow) => {
          setCampaigns((prev) => (prev.some((c) => c.id === saved.id)
            ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
            : [saved, ...prev]));
          toast.success(
            saved.status === 'SCHEDULED' ? (isRecurring(saved) ? 'Recurring campaign is live.' : 'Campaign scheduled.')
            : 'Campaign saved.',
          );
          if (sendNow) askSend(saved);
        }}
      />

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSave={async (list) => {
          try {
            const saved = await api.createContactList(list);
            setLists((prev) => [saved, ...prev]);
            toast.success(`"${saved.name}" saved with ${saved.contactCount} contacts.`);
            return true;
          } catch (err: any) {
            toast.error(err.message);
            return false;
          }
        }}
      />

      {/* Contact lists */}
      <Dialog open={listsOpen} onOpenChange={setListsOpen}>
        <DialogContent className="max-w-lg">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Contact lists</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              Lists you imported from Excel or CSV. Use them as the audience of any campaign.
            </DialogDescription>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {lists.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No lists yet. Import one to get started.
              </p>
            ) : lists.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{l.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{l.contactCount.toLocaleString()} contacts</p>
                </div>
                <button onClick={() => setDeleteListTarget(l)} aria-label={`Delete ${l.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600">
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setImportOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            <FileArrowUp className="h-4 w-4" /> Import a list
          </button>
        </DialogContent>
      </Dialog>

      {/* Send history */}
      <Dialog open={!!history} onOpenChange={(open) => { if (!open) setHistory(null); }}>
        <DialogContent className="max-w-2xl">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Send history</DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-xs text-muted-foreground">{history?.campaign.name}</DialogDescription>
          </div>
          {!history?.runs ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : history.runs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              This campaign has not been sent yet.
            </p>
          ) : (
            <div className="max-h-[55vh] overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">When</th>
                    <th className="px-3 py-2 font-semibold">Started by</th>
                    <th className="px-3 py-2 text-right font-semibold">Recipients</th>
                    <th className="px-3 py-2 text-right font-semibold">Sent</th>
                    <th className="px-3 py-2 text-right font-semibold">Failed</th>
                    <th className="px-3 py-2 text-right font-semibold">Unsubscribed</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.runs.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground">{formatDateTime(r.startedAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.trigger === 'schedule' ? 'Schedule' : 'Manual send'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.recipientCount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{r.sentCount.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${r.failedCount ? 'font-semibold text-rose-600' : 'text-muted-foreground'}`}>{r.failedCount}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.skippedCount}</td>
                      <td className="px-3 py-2">
                        {r.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Completed</span>
                        ) : r.status === 'RUNNING' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700"><CircleNotch className="h-3.5 w-3.5 animate-spin" /> Sending</span>
                        ) : (
                          <span className="text-rose-600">Stopped early</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test send */}
      <Dialog open={!!testTarget} onOpenChange={(open) => { if (!open) setTestTarget(null); }}>
        <DialogContent className="max-w-md">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Send a test</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              Sends one copy of “{testTarget?.name}” marked [TEST]. Nobody in the audience receives it.
            </DialogDescription>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendTest(); }} className="space-y-4">
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} autoFocus
              placeholder="you@example.com" aria-label="Test email address"
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTestTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40">Cancel</button>
              <button type="submit" disabled={testing}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                {testing ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5" />} Send test
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!sendTarget}
        onOpenChange={(open) => { if (!open) setSendTarget(null); }}
        title={sendTarget && isRecurring(sendTarget.campaign) ? 'Send an extra email now?' : 'Send this campaign now?'}
        description={sendDescription}
        confirmLabel={sendTarget?.count != null ? `Send to ${sendTarget.count.toLocaleString()}` : 'Send now'}
        onConfirm={() => {
          const c = sendTarget?.campaign;
          if (c) run(c.id, () => api.sendCampaignNow(c.id), 'Sending started.');
        }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title={cancelTarget?.status === 'SENDING' ? 'Stop sending?' : 'Cancel this campaign?'}
        description={
          cancelTarget?.status === 'SENDING'
            ? 'Sending stops within a few emails. People who already received it are not affected.'
            : `"${cancelTarget?.name}" will not send again. You can duplicate it later to reuse the content.`
        }
        confirmLabel={cancelTarget?.status === 'SENDING' ? 'Stop sending' : 'Cancel campaign'}
        cancelLabel="Keep it"
        variant="destructive"
        onConfirm={() => {
          const c = cancelTarget;
          if (c) run(c.id, () => api.cancelCampaign(c.id), c.status === 'SENDING' ? 'Sending stopped.' : 'Campaign cancelled.');
        }}
      />

      <ConfirmDialog
        open={!!deleteListTarget}
        onOpenChange={(open) => { if (!open) setDeleteListTarget(null); }}
        title="Delete this list?"
        description={`"${deleteListTarget?.name}" and its ${deleteListTarget?.contactCount ?? 0} contacts will be removed. This cannot be undone.`}
        confirmLabel="Delete list"
        cancelLabel="Keep it"
        variant="destructive"
        onConfirm={() => { if (deleteListTarget) deleteList(deleteListTarget); }}
      />
    </div>
  );
}
