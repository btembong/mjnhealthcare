'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, CalendarBlank, Clock, Users, VideoCamera, Copy, ArrowSquareOut, PencilSimple, Prohibit,
  DownloadSimple, MagnifyingGlass, Play, CircleNotch, ArrowClockwise, Question, CheckCircle, Stop,
  Star, Sparkle, ChartBar, Phone, EnvelopeSimple, Flame, ImageSquare, UploadSimple,
} from '@mjn/ui';
import { api } from '../../../../lib/api';
import { useAdmin } from '../../../../contexts/admin-context';
import {
  LangPill, Modal, StatusPill, WebinarForm, btnOutline, btnPrimary, card, field, heading, stage, toCover, whenLabel, type Webinar,
} from '../../../../components/webinar-kit';

type Registration = {
  id: string; name: string; email: string; phone: string | null; profession: string | null; destination: string | null;
  question: string | null; marketingConsent: boolean; status: string; createdAt: string; attended: boolean; minutesWatched: number;
  leadId: string | null; personId: string | null; source: string | null;
  questionsAsked: number; offerClicked: boolean; surveyRating: number | null; surveyWantsContact: boolean | null; surveyComment: string | null;
  interest: 'hot' | 'warm' | null;
};
type Detail = Webinar & {
  publicUrl: string;
  stats: { registered: number; attended: number; showRate: number; averageMinutes: number; cancelled: number; newLeads: number };
  registrations: Registration[];
  engagement: { questions: number; answered: number; pollAnswers: number; offerClicks: number; surveyResponses: number; averageRating: number | null; hot: number; warm: number };
  polls: { id: string; question: string; options: string[]; counts: number[]; total: number }[];
};

export default function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAdmin();
  const isAdmin = (me?.role as string)?.toUpperCase() === 'ADMIN';
  const [d, setD] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [dialog, setDialog] = useState<null | 'edit' | 'cancel' | 'end'>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const [find, setFind] = useState('');
  const [show, setShow] = useState<'all' | 'came' | 'missed' | 'interested'>('all');

  const load = useCallback(async () => {
    try { setD(await api.getWebinar(id)); setFailed(false); } catch { setFailed(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  // Registrations keep arriving before and during a session.
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function run(key: string, work: () => Promise<any>, fallback: string) {
    setBusy(key);
    try {
      const res = await work();
      if (res?.message) toast.success(res.message);
      setDialog(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? fallback);
    } finally {
      setBusy('');
    }
  }

  const regs = useMemo(() => {
    const q = find.trim().toLowerCase();
    return (d?.registrations ?? []).filter((r) => r.status === 'REGISTERED')
      .filter((r) => show === 'all' || (show === 'came' ? r.attended : show === 'missed' ? !r.attended : !!r.interest))
      .sort((a, b) => (show === 'interested' ? Number(b.interest === 'hot') - Number(a.interest === 'hot') : 0))
      .filter((r) => !q || `${r.name} ${r.email} ${r.phone ?? ''} ${r.profession ?? ''}`.toLowerCase().includes(q));
  }, [d, find, show]);
  const questions = useMemo(() => (d?.registrations ?? []).filter((r) => r.status === 'REGISTERED' && r.question), [d]);
  const hot = useMemo(() => (d?.registrations ?? []).filter((r) => r.status === 'REGISTERED' && r.interest === 'hot'), [d]);

  if (failed && !d) return <div className={`${card} p-10 text-center text-sm text-muted-foreground`}>This webinar could not be loaded. <button onClick={load} className="font-bold text-primary hover:underline">Try again</button></div>;
  if (!d) return <div className="space-y-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div>;

  const s = stage(d);
  const canManage = isAdmin || d.createdById === me?.id || d.hosts.some((h) => h.id === me?.id);
  const isHost = isAdmin || d.hosts.some((h) => h.id === me?.id);

  async function exportCsv() {
    try {
      const res = await fetch(api.webinarExportUrl(d!.id), { headers: { Authorization: `Bearer ${localStorage.getItem('mjn_admin_token')}` } });
      if (!res.ok) throw new Error();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await res.blob());
      a.download = `webinar-registrations-${d!.slug}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('The export could not be downloaded.');
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/webinars" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Webinars</Link>

      {/* Header */}
      <section data-tour="page-header" className={`rise relative overflow-hidden ${card} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StatusPill w={d} /><LangPill lang={d.language} />{d.topic && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{d.topic}</span>}</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{d.title}</h1>
            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarBlank className="h-4 w-4" />{whenLabel(d.startAt)} Douala</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{d.durationMinutes} min</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{d.hosts.map((h) => h.name).join(', ')}</span>
            </p>
            {d.cancelReason && <p className="mt-3 text-sm text-muted-foreground">Cancelled: {d.cancelReason}</p>}
          </div>
          <div data-tour="web-actions" className="flex shrink-0 flex-wrap gap-2">
            {(s.key === 'scheduled' || s.key === 'live') && isHost && (
              d.hostOpen
                ? <Link href={`/webinars/${d.id}/host`} className={btnPrimary}><VideoCamera className="h-4 w-4" /> {s.key === 'live' ? 'Back to the room' : 'Enter the room'}</Link>
                : <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground" title="Hosts can enter two hours before the start"><VideoCamera className="h-4 w-4" /> Room opens 2 h before</span>
            )}
            {s.key === 'live' && canManage && <button onClick={() => setDialog('end')} className={btnOutline}><Stop className="h-4 w-4" /> End webinar</button>}
            {d.status === 'DRAFT' && canManage && <button onClick={() => run('publish', () => api.publishWebinar(d.id), 'It could not be published.')} disabled={!!busy} className={btnPrimary}>{busy === 'publish' && <CircleNotch className="h-4 w-4 animate-spin" />} Publish</button>}
            {(d.status === 'DRAFT' || s.key === 'scheduled') && canManage && <button onClick={() => setDialog('edit')} className={btnOutline}><PencilSimple className="h-4 w-4" /> Edit</button>}
            {d.status !== 'DRAFT' && d.status !== 'CANCELLED' && (
              <>
                <button onClick={() => { navigator.clipboard.writeText(d.publicUrl); toast.success('Registration link copied.'); }} className={btnOutline}><Copy className="h-4 w-4" /> Copy link</button>
                <a href={d.publicUrl} target="_blank" rel="noopener noreferrer" className={btnOutline}><ArrowSquareOut className="h-4 w-4" /> Website</a>
              </>
            )}
            {(d.status === 'DRAFT' || s.key === 'scheduled') && canManage && <button onClick={() => { setReason(''); setDialog('cancel'); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"><Prohibit className="h-4 w-4" /> Cancel</button>}
          </div>
        </div>
      </section>

      {/* Numbers */}
      {d.status !== 'DRAFT' && (
        <div data-tour="web-stats" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ['Registered', `${d.stats.registered}`, `of ${d.capacity} seats`],
            ['Attended', s.key === 'over' || s.key === 'live' ? `${d.stats.attended}` : '—', s.key === 'scheduled' ? 'after it starts' : 'joined the room'],
            ['Show-up', s.key === 'over' ? `${d.stats.showRate}%` : '—', 'of registrants'],
            ['Average watch', s.key === 'over' ? `${d.stats.averageMinutes} min` : '—', `of ${d.durationMinutes} min`],
            ['New leads', `${d.stats.newLeads}`, 'added to Leads'],
          ].map(([label, value, sub], i) => (
            <div key={label} className={`rise ${card} p-4`} style={{ animationDelay: `${i * 50}ms` }}>
              <p className={heading}>{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {(s.key === 'over' || s.key === 'live') && d.engagement && (
        <div data-tour="web-engagement" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            [Question, 'Questions', `${d.engagement.questions}`, `${d.engagement.answered} answered`],
            [ChartBar, 'Poll answers', `${d.engagement.pollAnswers}`, `${d.polls.length} ${d.polls.length === 1 ? 'poll' : 'polls'}`],
            [Sparkle, 'Offer clicks', `${d.engagement.offerClicks}`, 'clicked the button'],
            [Star, 'Rating', d.engagement.averageRating !== null ? `${d.engagement.averageRating} / 5` : '—', `${d.engagement.surveyResponses} ${d.engagement.surveyResponses === 1 ? 'response' : 'responses'}`],
            [Flame, 'Hot leads', `${d.engagement.hot}`, 'asked to be contacted'],
            [CheckCircle, 'Warm leads', `${d.engagement.warm}`, 'engaged strongly'],
          ].map(([Icon, label, value, sub]: any, i) => (
            <div key={label} className={`rise ${card} p-4`} style={{ animationDelay: `${i * 40}ms` }}>
              <p className={`${heading} flex items-center gap-1.5`}><Icon className="h-3.5 w-3.5" />{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Registrations */}
        <section data-tour="web-regs" className={`${card} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-foreground">Registrations <span className="font-normal text-muted-foreground">· {regs.length}</span></h2>
            <div className="flex flex-wrap items-center gap-2">
              {s.key === 'over' && (
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  {([['all', 'All'], ['came', 'Came'], ['missed', 'Missed'], ['interested', 'Interested']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setShow(k)} className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${show === k ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{l}</button>
                  ))}
                </div>
              )}
              <div className="relative">
                <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search" aria-label="Search registrations" className={`${field} w-44 py-1.5 pl-8`} />
              </div>
              <button onClick={exportCsv} disabled={d.registrations.length === 0} className={`${btnOutline} py-1.5`}><DownloadSimple className="h-4 w-4" /> Export</button>
            </div>
          </div>
          {regs.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">{d.status === 'DRAFT' ? 'Publish the webinar to open registration.' : d.registrations.length === 0 ? 'No one has registered yet. Share the link to get started.' : 'No one matches.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-5 py-2.5">Person</th><th className="px-3 py-2.5">Profession</th><th className="px-3 py-2.5">Registered</th>{s.key === 'over' && <th className="px-3 py-2.5 text-right">Watched</th>}{s.key === 'over' && <th className="px-3 py-2.5">Interest</th>}<th className="px-5 py-2.5 text-right">Lead</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regs.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{[r.profession, r.destination].filter(Boolean).join(' → ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      {s.key === 'over' && <td className="whitespace-nowrap px-3 py-3 text-right">{r.attended ? <span className="inline-flex items-center gap-1 font-semibold text-foreground"><CheckCircle className="h-4 w-4 text-secondary" weight="fill" />{r.minutesWatched} min</span> : <span className="text-muted-foreground">Missed</span>}</td>}
                      {s.key === 'over' && (
                        <td className="whitespace-nowrap px-3 py-3" title={[r.questionsAsked ? `${r.questionsAsked} question(s)` : '', r.offerClicked ? 'clicked the offer' : '', r.surveyRating ? `rated ${r.surveyRating}/5` : ''].filter(Boolean).join(' · ')}>
                          {r.interest === 'hot' ? <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white"><Flame className="h-3 w-3" /> Hot</span>
                            : r.interest === 'warm' ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Warm</span>
                            : <span className="text-xs text-muted-foreground">—</span>}
                          {r.surveyRating ? <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Star className="h-3 w-3 text-accent" weight="fill" />{r.surveyRating}</span> : null}
                        </td>
                      )}
                      <td className="px-5 py-3 text-right text-xs">
                        {r.personId ? <Link href={`/clients/${r.personId}`} className="font-bold text-primary hover:underline">Client</Link>
                          : r.leadId ? <Link href="/leads" className="font-bold text-primary hover:underline">Lead</Link> : '—'}
                        {r.marketingConsent && <span className="ml-2 text-muted-foreground" title="Agreed to receive news">· news ✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Side */}
        <aside className="space-y-4">
          {hot.length > 0 && (
            <section className={`rise ${card} overflow-hidden`}>
              <div className="border-b border-border bg-primary/[0.04] px-5 py-3">
                <p className={`${heading} flex items-center gap-1.5 text-primary`}><Flame className="h-3.5 w-3.5" /> Asked to be contacted · {hot.length}</p>
              </div>
              <ul className="divide-y divide-border">
                {hot.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <p className="text-sm font-bold text-foreground">{r.name}{r.surveyRating ? <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground"><Star className="h-3 w-3 text-accent" weight="fill" />{r.surveyRating}</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{[r.profession, r.destination].filter(Boolean).join(' → ')}</p>
                    {r.surveyComment && <p className="mt-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-foreground">“{r.surveyComment}”</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><EnvelopeSimple className="h-3.5 w-3.5" /> Email</a>
                      {r.phone && <a href={`https://wa.me/${r.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Phone className="h-3.5 w-3.5" /> WhatsApp</a>}
                      {r.personId ? <Link href={`/clients/${r.personId}`} className="text-primary hover:underline">Client</Link> : r.leadId ? <Link href="/leads" className="text-primary hover:underline">Lead</Link> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {d.polls?.length > 0 && (
            <section className={`${card} p-5`}>
              <p className={`${heading} flex items-center gap-1.5`}><ChartBar className="h-3.5 w-3.5" /> Poll results</p>
              <div className="mt-3 space-y-5">
                {d.polls.map((p) => (
                  <div key={p.id}>
                    <p className="text-sm font-semibold text-foreground">{p.question}</p>
                    <ul className="mt-2 space-y-1.5">
                      {p.options.map((o, i) => {
                        const pct = p.total ? Math.round((p.counts[i] / p.total) * 100) : 0;
                        return (
                          <li key={i} className="text-xs">
                            <div className="flex justify-between gap-2"><span className="text-foreground">{o}</span><span className="tabular-nums text-muted-foreground">{p.counts[i]} · {pct}%</span></div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{p.total} {p.total === 1 ? 'answer' : 'answers'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {s.key === 'over' && (
            <section className={`${card} p-5`}>
              <p className={heading}>Recording</p>
              {d.recordingStatus === 'READY' ? (
                <>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-foreground"><Play className="h-4 w-4 text-secondary" weight="fill" /> Replay is online</p>
                  <p className="mt-1 text-xs text-muted-foreground">Public on the website. Everyone registered was emailed: a thank-you if they came, the replay if they missed it.</p>
                  <a href={d.publicUrl} target="_blank" rel="noopener noreferrer" className={`${btnOutline} mt-3 w-full`}><ArrowSquareOut className="h-4 w-4" /> Watch on the website</a>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-bold text-foreground">{d.recordingStatus === 'NONE' ? 'No recording found' : 'Waiting for the recording'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.recordingStatus === 'NONE' ? 'Daily did not return a finished recording. Check that recording was on during the session.' : 'Daily usually finishes it a few minutes after the end. It is checked every 10 minutes.'}</p>
                  {canManage && <button onClick={() => run('rec', () => api.checkWebinarRecording(d.id), 'It could not be checked.')} disabled={!!busy} className={`${btnOutline} mt-3 w-full`}>{busy === 'rec' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowClockwise className="h-4 w-4" />} Check now</button>}
                </>
              )}
            </section>
          )}

          <section className={`${card} p-5`}>
            <p className={`${heading} flex items-center gap-1.5`}><Question className="h-3.5 w-3.5" /> Questions sent in advance</p>
            {questions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">None yet. People can add a question when they register.</p>
            ) : (
              <ul className="mt-3 max-h-96 space-y-3 overflow-y-auto">
                {questions.map((r) => (
                  <li key={r.id} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-sm leading-relaxed text-foreground">{r.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.name.split(' ')[0]}{r.profession ? ` · ${r.profession}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <CoverCard d={d} canManage={canManage} onChanged={load} />

          <section className={`${card} p-5`}>
            <p className={heading}>About</p>
            <p className="mt-2 line-clamp-[10] whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{d.description}</p>
          </section>
        </aside>
      </div>

      {dialog === 'edit' && <WebinarForm existing={d} meId={me?.id ?? ''} isAdmin={isAdmin} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load(); }} />}

      {dialog === 'cancel' && (
        <Modal title={d.status === 'DRAFT' ? 'Cancel this draft?' : 'Cancel this webinar?'} sub={d.status === 'DRAFT' ? 'It was never published, so no one is told.' : `${d.stats.registered} registered ${d.stats.registered === 1 ? 'person is' : 'people are'} emailed your reason.`} onClose={() => setDialog(null)}>
          {d.status !== 'DRAFT' && (
            <>
              <label htmlFor="w-reason" className="mb-1.5 block text-sm font-semibold">Reason</label>
              <textarea id="w-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: the speaker is unwell. A new date will be announced." className={field} />
            </>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Keep it</button>
            <button onClick={() => run('cancel', () => api.cancelWebinar(d.id, reason.trim()), 'It could not be cancelled.')} disabled={!!busy || (d.status !== 'DRAFT' && reason.trim().length < 3)} className={btnPrimary}>{busy === 'cancel' && <CircleNotch className="h-4 w-4 animate-spin" />} Cancel webinar</button>
          </div>
        </Modal>
      )}

      {dialog === 'end' && (
        <Modal title="End the webinar?" sub="The room stays open a little longer for anyone finishing up. The replay goes online once Daily has the recording." onClose={() => setDialog(null)}>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Not yet</button>
            <button onClick={() => run('end', () => api.endWebinar(d.id), 'It could not be ended.')} disabled={!!busy} className={btnPrimary}>{busy === 'end' && <CircleNotch className="h-4 w-4 animate-spin" />} End webinar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** The webinar's picture: drawn automatically from its details, or one the team uploads. */
function CoverCard({ d, canManage, onChanged }: { d: Detail; canManage: boolean; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<'' | 'upload' | 'reset'>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const src = preview ?? d.coverUrl;

  async function upload(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast.error('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('That image is larger than 20 MB.'); return; }
    setBusy('upload');
    try {
      const blob = await toCover(file);
      setPreview(URL.createObjectURL(blob));
      const { url, key, contentType } = await api.webinarCoverUploadUrl(d.id, 'cover.jpg');
      const put = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
      if (!put.ok) throw new Error('The image could not be uploaded. Please try again.');
      const res = await api.setWebinarCover(d.id, key);
      toast.success(res.message ?? 'Cover updated.');
      await onChanged();
    } catch (e: any) {
      setPreview(null);
      toast.error(e.message ?? 'The cover could not be changed.');
    } finally {
      setBusy('');
    }
  }
  async function reset() {
    setBusy('reset');
    try {
      const res = await api.setWebinarCover(d.id, null);
      setPreview(null);
      toast.success(res.message ?? 'Back to the automatic cover.');
      await onChanged();
    } catch (e: any) {
      toast.error(e.message ?? 'The cover could not be changed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section data-tour="web-cover" className={`${card} overflow-hidden`}>
      <div className="relative aspect-[1200/630] bg-gradient-to-br from-[#0A2540] via-primary to-[#0E7C8C]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Webinar cover" onLoad={() => setLoaded(true)} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded || preview ? 'opacity-100' : 'opacity-0'}`} />
        {busy === 'upload' && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><CircleNotch className="h-7 w-7 animate-spin text-white" /></div>}
      </div>
      <div className="p-4">
        <p className={`${heading} flex items-center gap-1.5`}><ImageSquare className="h-3.5 w-3.5" /> Cover</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {d.hasOwnCover ? 'Your uploaded image.' : 'Drawn automatically from the title, date and speakers. It updates by itself when they change.'} Used on the website, in the emails, and when the link is shared on WhatsApp or social media.
        </p>
        {canManage && d.status !== 'CANCELLED' && (
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`${btnOutline} cursor-pointer ${busy ? 'pointer-events-none opacity-40' : ''}`}>
              <UploadSimple className="h-4 w-4" /> {d.hasOwnCover ? 'Replace' : 'Upload your own'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(file); }} />
            </label>
            {d.hasOwnCover && <button onClick={reset} disabled={!!busy} className={btnOutline}>{busy === 'reset' && <CircleNotch className="h-4 w-4 animate-spin" />} Use automatic</button>}
          </div>
        )}
        {canManage && <p className="mt-2 text-[11px] text-muted-foreground">Any photo works: it is cropped to the share size (1200 × 630) and made small for slow connections.</p>}
      </div>
    </section>
  );
}
