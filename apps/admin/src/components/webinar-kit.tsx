'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CircleNotch, X, MagnifyingGlass, Check } from '@mjn/ui';
import { api } from '../lib/api';

export type Webinar = {
  id: string; slug: string; title: string; description: string; language: 'en' | 'fr'; topic: string | null;
  startAt: string; durationMinutes: number; capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  startedAt: string | null; endedAt: string | null; cancelReason: string | null;
  recordingStatus: string | null; replayReadyAt: string | null;
  registered: number; attended?: number; hosts: { id: string; name: string }[]; createdById: string;
  over: boolean; hostOpen: boolean;
};

// ── Styles shared by the webinar screens ──────────────────────────────────────
export const card = 'rounded-2xl border border-border bg-white shadow-sm';
export const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
export const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md disabled:translate-y-0 disabled:opacity-40';
export const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
export const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10';

/** Where a webinar stands, as staff see it. A published webinar whose time has passed reads as over. */
export function stage(w: Webinar): { key: 'draft' | 'scheduled' | 'live' | 'over' | 'cancelled'; label: string; tone: string } {
  if (w.status === 'CANCELLED') return { key: 'cancelled', label: 'Cancelled', tone: 'bg-muted text-muted-foreground' };
  if (w.status === 'DRAFT') return { key: 'draft', label: 'Draft', tone: 'bg-muted text-foreground' };
  if (w.status === 'LIVE' && !w.over) return { key: 'live', label: 'Live', tone: 'bg-primary text-white' };
  if (w.status === 'ENDED' || w.over) return { key: 'over', label: 'Ended', tone: 'bg-secondary/12 text-secondary' };
  return { key: 'scheduled', label: 'Scheduled', tone: 'bg-primary/10 text-primary' };
}

export function StatusPill({ w }: { w: Webinar }) {
  const s = stage(w);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.tone}`}>
      {s.key === 'live' && <span className="live-dot text-white" />}{s.label}
    </span>
  );
}

export function LangPill({ lang }: { lang: 'en' | 'fr' }) {
  return <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-bold text-foreground">{lang === 'fr' ? 'FR' : 'EN'}</span>;
}

// ── Douala time ───────────────────────────────────────────────────────────────

/** Cameroon is UTC+1 all year. */
export function doualaParts(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-CA', { timeZone: 'Africa/Douala' }),
    time: d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}
export const fromDouala = (date: string, time: string) => new Date(`${date}T${time}:00+01:00`).toISOString();
export function whenLabel(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Douala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function Modal({ title, sub, onClose, children, wide = false }: { title: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fade fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`pop max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold text-foreground">{title}</h2>{sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}</div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Create / edit ─────────────────────────────────────────────────────────────

const DURATIONS = [30, 45, 60, 75, 90, 120];
const TOPICS = ['UAE licensing', 'NCLEX', 'UK (NMC)', 'Ireland (NMBI)', 'Canada', 'Career & jobs', 'Students', 'Other'];

export function WebinarForm({ existing, meId, isAdmin, onClose, onSaved }: {
  existing?: Webinar; meId: string; isAdmin: boolean; onClose: () => void; onSaved: (w: Webinar) => void;
}) {
  const start = existing ? doualaParts(existing.startAt) : null;
  const locked = existing?.status === 'PUBLISHED';
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [language, setLanguage] = useState<'en' | 'fr'>(existing?.language ?? 'en');
  const [topic, setTopic] = useState(existing?.topic ?? '');
  const [date, setDate] = useState(start?.date ?? '');
  const [time, setTime] = useState(start?.time ?? '15:00');
  const [duration, setDuration] = useState(existing?.durationMinutes ?? 60);
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 100));
  const [hostIds, setHostIds] = useState<string[]>(existing?.hosts.map((h) => h.id) ?? (isAdmin ? [] : [meId]));
  const [hosts, setHosts] = useState<{ id: string; name: string | null; email: string | null; role: string }[]>([]);
  const [find, setFind] = useState('');
  const [busy, setBusy] = useState<'' | 'draft' | 'publish'>('');

  useEffect(() => { api.getWebinarHosts().then(setHosts).catch(() => toast.error('The list of hosts could not be loaded.')); }, []);
  const shownHosts = useMemo(() => hosts.filter((h) => `${h.name ?? ''} ${h.email ?? ''}`.toLowerCase().includes(find.toLowerCase())), [hosts, find]);
  const toggle = (id: string) => setHostIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const ready = title.trim().length >= 5 && description.trim().length >= 20 && !!date && !!time && hostIds.length > 0 && Number(capacity) >= 1;

  async function save(publish: boolean) {
    setBusy(publish ? 'publish' : 'draft');
    try {
      const body = { title: title.trim(), description: description.trim(), language, topic: topic || null, startAt: fromDouala(date, time), durationMinutes: duration, capacity: Number(capacity), hostIds };
      let saved = existing ? await api.updateWebinar(existing.id, body) : await api.createWebinar(body);
      if (publish && saved.status === 'DRAFT') saved = await api.publishWebinar(saved.id);
      toast.success(saved.message ?? (publish ? 'Published.' : 'Saved as a draft.'));
      onSaved(saved);
    } catch (e: any) {
      toast.error(e.message ?? 'It could not be saved.');
    } finally {
      setBusy('');
    }
  }

  return (
    <Modal title={existing ? 'Edit webinar' : 'New webinar'} sub="Times are Douala time. Registrants see their own time on the website." onClose={onClose} wide>
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-title">Title</label>
          <input id="wf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="UAE DataFlow 2026: what to submit" className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-semibold">Language</p>
            <div className={`inline-flex rounded-xl border border-border bg-muted/60 p-1 ${locked ? 'opacity-60' : ''}`}>
              {(['en', 'fr'] as const).map((l) => (
                <button key={l} type="button" disabled={locked} onClick={() => setLanguage(l)} className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${language === l ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}>
                  {l === 'en' ? 'English' : 'Français'}
                </button>
              ))}
            </div>
            {locked && <p className="mt-1 text-xs text-muted-foreground">Fixed once published.</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-topic">Topic</label>
            <select id="wf-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
              <option value="">Choose…</option>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-date">Date</label>
            <input id="wf-date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-time">Start (Douala)</label>
            <input id="wf-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-dur">Length</label>
            <select id="wf-dur" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={field}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <p className="mb-1.5 text-sm font-semibold">Hosts <span className="font-normal text-muted-foreground">· admins and consultants</span></p>
            <div className="rounded-xl border border-border">
              <div className="relative border-b border-border">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a person" aria-label="Find a host" className="w-full rounded-t-xl bg-transparent py-2 pl-9 pr-3 text-sm outline-none" />
              </div>
              <ul className="max-h-40 overflow-y-auto p-1">
                {shownHosts.map((h) => {
                  const on = hostIds.includes(h.id);
                  return (
                    <li key={h.id}>
                      <button type="button" onClick={() => toggle(h.id)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${on ? 'bg-primary/8' : 'hover:bg-muted/60'}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-border'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{h.name ?? h.email}</span>
                        <span className="text-xs text-muted-foreground">{h.role === 'ADMIN' ? 'Admin' : 'Consultant'}</span>
                      </button>
                    </li>
                  );
                })}
                {hosts.length > 0 && shownHosts.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No one matches.</li>}
              </ul>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-cap">Seats</label>
            <input id="wf-cap" type="number" min={1} max={150} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={field} />
            <p className="mt-1 text-xs text-muted-foreground">Up to 150.</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="wf-desc">Description</label>
          <textarea id="wf-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will people learn? Who is it for? Leave a blank line between paragraphs." className={`${field} resize-y`} />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} className={btnOutline}>Cancel</button>
          {(!existing || existing.status === 'DRAFT') && (
            <button onClick={() => save(false)} disabled={!ready || !!busy} className={btnOutline}>{busy === 'draft' && <CircleNotch className="h-4 w-4 animate-spin" />} Save draft</button>
          )}
          <button onClick={() => save(!existing || existing.status === 'DRAFT')} disabled={!ready || !!busy} className={btnPrimary}>
            {busy === 'publish' && <CircleNotch className="h-4 w-4 animate-spin" />}
            {!existing || existing.status === 'DRAFT' ? 'Publish' : 'Save changes'}
          </button>
        </div>
        {locked && <p className="-mt-2 text-right text-xs text-muted-foreground">Changing the date or time emails everyone registered.</p>}
      </div>
    </Modal>
  );
}
