'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Skeleton, StatCard, ConfirmDialog, DateTimePicker,
  Dialog, DialogContent, DialogTitle, DialogDescription,
  DownloadSimple, Users, Eye, ChartBar, Clock, Trash, CircleNotch, ArrowsClockwise, CaretLeft, CaretRight,
} from '@mjn/ui';
import { api } from '../../../../lib/api';
import { Question, CHOICE_TYPES, answerText, formatDateTime, typeLabel } from '../shared';

type Response = {
  id: string; createdAt: string; name: string | null; email: string | null; locale: string;
  consentAt: string | null; answers: Record<string, unknown>;
};

const PAGE_SIZE = 20;
const pct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

/** One horizontal bar per option. Single series, so one hue and no legend. */
function BarList({ rows, total }: { rows: { id: string; label: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.id} className="group" title={`${row.label}: ${row.count} of ${total} (${pct(row.count, total)}%)`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{row.count}</span> · {pct(row.count, total)}%
            </span>
          </div>
          <div className="h-2.5 rounded-r bg-muted/60">
            <div className="h-full rounded-r bg-primary transition-[width,opacity] duration-300 group-hover:opacity-80"
              style={{ width: `${(row.count / max) * 100}%`, minWidth: row.count > 0 ? 4 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Column per score, with the average as the headline. */
function ScoreChart({ values, min, max }: { values: number[]; min: number; max: number }) {
  const buckets = Array.from({ length: max - min + 1 }, (_, i) => ({ score: min + i, count: values.filter((v) => v === min + i).length }));
  const peak = Math.max(1, ...buckets.map((b) => b.count));
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div>
        <p className="text-4xl font-extrabold tabular-nums leading-none text-foreground">{average === null ? '—' : average.toFixed(1)}</p>
        <p className="mt-1 text-xs text-muted-foreground">average out of {max}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-end gap-0.5" role="img"
        aria-label={`Distribution of scores from ${min} to ${max}: ${buckets.map((b) => `${b.score}: ${b.count}`).join(', ')}`}>
        {buckets.map((b) => (
          <div key={b.score} className="group flex min-w-0 flex-1 flex-col items-center" title={`Score ${b.score}: ${b.count} of ${values.length} (${pct(b.count, values.length)}%)`}>
            <span className="mb-1 h-4 text-xs tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{b.count}</span>
            <div className="flex h-24 w-full items-end">
              <div className="w-full rounded-t bg-primary transition-opacity group-hover:opacity-80"
                style={{ height: `${(b.count / peak) * 100}%`, minHeight: b.count > 0 ? 4 : 0 }} />
            </div>
            <span className="mt-1.5 w-full border-t border-border pt-1 text-center text-xs tabular-nums text-muted-foreground">{b.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SurveyResults({ surveyId, surveyTitle, questions, identified, viewCount }: {
  surveyId: string; surveyTitle: string; questions: Question[]; identified: boolean; viewCount: number;
}) {
  const [responses, setResponses] = useState<Response[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState<Response | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Response | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoadError('');
    return api.getSurveyResults(surveyId)
      .then((res) => setResponses(res.responses))
      .catch((err: any) => setLoadError(err.message ?? 'Could not load results.'));
  }, [surveyId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!responses) return [];
    const end = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1) : null;
    return responses.filter((r) => {
      const at = new Date(r.createdAt);
      return (!from || at >= from) && (!end || at < end);
    });
  }, [responses, from, to]);

  useEffect(() => { setPage(0); }, [from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const filtering = !!from || !!to;

  async function exportAs(format: 'xlsx' | 'csv') {
    if (filtered.length === 0) { toast.error('There are no responses to export.'); return; }
    setExporting(true);
    try {
      const rows = filtered.map((r) => {
        const row: Record<string, string> = { Submitted: formatDateTime(r.createdAt) };
        if (identified) { row.Name = r.name ?? ''; row.Email = r.email ?? ''; }
        row.Language = r.locale === 'fr' ? 'French' : 'English';
        row['Consent given'] = r.consentAt ? formatDateTime(r.consentAt) : '';
        questions.forEach((q, i) => { row[`${i + 1}. ${q.label}`] = answerText(q, r.answers[q.id]); });
        return row;
      });
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.json_to_sheet(rows);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Responses');
      const name = surveyTitle.replace(/[^\w\d]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'survey';
      XLSX.writeFile(book, `${name}-responses.${format}`, { bookType: format });
      api.logSurveyExport(surveyId, format).catch(() => {});
    } catch {
      toast.error('The export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function removeResponse(response: Response) {
    try {
      await api.deleteSurveyResponse(surveyId, response.id);
      setResponses((prev) => prev?.filter((r) => r.id !== response.id) ?? null);
      toast.success('Response deleted.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <button onClick={load} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">Try again</button>
      </div>
    );
  }
  if (!responses) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  const total = responses.length;
  const rate = viewCount > 0 ? Math.min(100, Math.round((total / viewCount) * 100)) : null;
  const latest = responses[0]?.createdAt;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Responses" value={total.toLocaleString()} icon={Users} accent="primary" />
        <StatCard label="Page visits" value={viewCount.toLocaleString()} icon={Eye} accent="teal" />
        <StatCard label="Response rate" value={rate === null ? '—' : `${rate}%`} icon={ChartBar} accent="violet" />
        <StatCard label="Latest response" value={latest ? new Date(latest).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'} icon={Clock} accent="emerald" />
      </div>

      {/* Filters sit in one row above everything they affect */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">From</label>
            <DateTimePicker value={from} onChange={setFrom} withTime={false} placeholder="Any date" />
          </div>
          <div className="w-52">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">To</label>
            <DateTimePicker value={to} onChange={setTo} withTime={false} placeholder="Any date" minDate={from ?? undefined} />
          </div>
          <p className="pb-2.5 text-xs text-muted-foreground">
            {filtering ? `Showing ${filtered.length} of ${total} responses` : `All ${total} responses`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} aria-label="Refresh results"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <ArrowsClockwise className="h-4 w-4" />
          </button>
          <button onClick={() => exportAs('csv')} disabled={exporting}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-50">
            <DownloadSimple className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => exportAs('xlsx')} disabled={exporting}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            {exporting ? <CircleNotch className="h-4 w-4 animate-spin" /> : <DownloadSimple className="h-4 w-4" />} Excel
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <ChartBar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No responses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Results appear here as soon as someone submits the survey.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {questions.map((q, index) => {
              const values = filtered.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== null && v !== '');
              const isChoice = CHOICE_TYPES.includes(q.type) || q.type === 'YES_NO';
              const rows = q.type === 'YES_NO'
                ? [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]
                : (q.options ?? []).map((o) => ({ id: o.id, label: o.label }));
              return (
                <section key={q.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <header className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{index + 1}. {q.label}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {typeLabel(q.type)} · {values.length} answered
                      {q.type === 'MULTI_CHOICE' && ' · percentages are of people who answered'}
                    </p>
                  </header>
                  {values.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No answers in this period.</p>
                  ) : isChoice ? (
                    <BarList total={values.length}
                      rows={rows.map((row) => ({ ...row, count: values.filter((v) => (Array.isArray(v) ? v.includes(row.id) : v === row.id)).length }))} />
                  ) : q.type === 'RATING' || q.type === 'SCALE' ? (
                    <ScoreChart values={values.filter((v): v is number => typeof v === 'number')} min={q.type === 'RATING' ? 1 : 0} max={q.type === 'RATING' ? 5 : 10} />
                  ) : (
                    <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {values.slice(0, 50).map((v, i) => (
                        <li key={i} className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground">{String(v)}</li>
                      ))}
                      {values.length > 50 && <li className="px-1 text-xs text-muted-foreground">Showing the latest 50. Export to see all {values.length}.</li>}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <header className="border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-foreground">Individual responses</h3>
            </header>
            {filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No responses in this period.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/20 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Submitted</th>
                        {identified && <th className="px-5 py-3 font-semibold">Respondent</th>}
                        <th className="px-5 py-3 font-semibold">Language</th>
                        <th className="px-5 py-3 text-right font-semibold">Answered</th>
                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pageRows.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-muted/10">
                          <td className="whitespace-nowrap px-5 py-3 text-foreground">{formatDateTime(r.createdAt)}</td>
                          {identified && (
                            <td className="px-5 py-3">
                              <p className="font-medium text-foreground">{r.name ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">{r.email ?? ''}</p>
                            </td>
                          )}
                          <td className="px-5 py-3 text-muted-foreground">{r.locale === 'fr' ? 'French' : 'English'}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{Object.keys(r.answers).length} of {questions.length}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setViewing(r)}
                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40">View</button>
                              <button onClick={() => setDeleteTarget(r)} aria-label="Delete response"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600">
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer className="flex items-center justify-between border-t border-border px-5 py-3">
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40">
                      <CaretLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {pageCount}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount - 1} aria-label="Next page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40">
                      <CaretRight className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-xl">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">{viewing?.name ?? 'Anonymous response'}</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              {viewing?.email ? `${viewing.email} · ` : ''}{viewing ? formatDateTime(viewing.createdAt) : ''}
              {viewing?.consentAt ? ' · consent given' : ''}
            </DialogDescription>
          </div>
          <dl className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {questions.map((q, i) => {
              const text = viewing ? answerText(q, viewing.answers[q.id]) : '';
              return (
                <div key={q.id}>
                  <dt className="text-xs font-semibold text-muted-foreground">{i + 1}. {q.label}</dt>
                  <dd className={`mt-0.5 whitespace-pre-line text-sm ${text ? 'text-foreground' : 'text-muted-foreground'}`}>{text || 'Not answered'}</dd>
                </div>
              );
            })}
          </dl>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete this response?"
        description={`The response${deleteTarget?.name ? ` from ${deleteTarget.name}` : ''} will be permanently erased. This is recorded in the audit log and cannot be undone.`}
        confirmLabel="Delete response"
        cancelLabel="Keep it"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) removeResponse(deleteTarget); }}
      />
    </div>
  );
}
