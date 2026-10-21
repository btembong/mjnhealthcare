'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CircleNotch, Question, ListChecks, Users, Stop, Broadcast, Check, X } from '@mjn/ui';
import { api } from '../../../../../lib/api';

type Detail = {
  id: string; title: string; status: string; startAt: string; startedAt: string | null; durationMinutes: number; language: 'en' | 'fr';
  stats: { registered: number; attended: number };
  registrations: { id: string; name: string; question: string | null; profession: string | null; status: string }[];
};

const RUN_SHEET = [
  'Check your microphone and camera in the video window.',
  'Recording starts by itself when you join. Mention it to attendees.',
  'Share your slides with the screen-share button in the video window.',
  'Press Go live at the start time. Attendees can enter 15 minutes before.',
  'Answer the questions sent in advance, then take questions from the chat.',
  'Invite people to book a consultation before you close.',
  'Press End webinar when you finish. The replay goes online by itself.',
];

export default function HostRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pass, setPass] = useState<{ roomUrl: string; token: string } | null>(null);
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'questions' | 'sheet' | 'people'>('questions');
  const [done, setDone] = useState<number[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try { setD(await api.getWebinar(id)); } catch { /* the pass request reports problems */ }
  }, [id]);
  useEffect(() => {
    api.webinarHostPass(id).then(setPass).catch((e) => setError(e.message ?? 'The room could not be opened.'));
    load();
  }, [id, load]);
  useEffect(() => {
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const live = d?.status === 'LIVE';
  const elapsed = useElapsed(live ? d?.startedAt ?? null : null);
  const questions = useMemo(() => (d?.registrations ?? []).filter((r) => r.status === 'REGISTERED' && r.question), [d]);

  async function goLive() {
    setBusy(true);
    try { await api.startWebinar(id); toast.success('You are live.'); await load(); } catch (e: any) { toast.error(e.message ?? 'Could not go live.'); } finally { setBusy(false); }
  }
  async function end() {
    setBusy(true);
    try { const res = await api.endWebinar(id); toast.success(res.message ?? 'Webinar ended.'); router.push(`/webinars/${id}`); } catch (e: any) { toast.error(e.message ?? 'Could not end it.'); setBusy(false); }
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1220] p-6 text-center text-white">
        <div className="rise max-w-sm">
          <p className="text-lg font-bold">The room is not open</p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
          <button onClick={() => router.push(`/webinars/${id}`)} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0B1220]">Back to the webinar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1220] text-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-4">
        <button onClick={() => router.push(`/webinars/${id}`)} aria-label="Leave the room" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{d?.title ?? 'Webinar'}</p>
          <p className="text-[11px] text-white/45">Host view · {d?.stats.registered ?? 0} registered</p>
        </div>
        {live ? (
          <span className="flex items-center gap-2 rounded-md bg-[#E5484D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <span className="live-dot text-white" /> Live {elapsed && <span className="font-mono font-semibold normal-case tracking-normal">{elapsed}</span>}
          </span>
        ) : (
          <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">Backstage · not live</span>
        )}
        {d && !live && d.status === 'PUBLISHED' && (
          <button onClick={goLive} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-[#E5484D] px-4 text-sm font-bold shadow-lg shadow-[#E5484D]/30 transition-all hover:-translate-y-px hover:bg-[#d13d42] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Broadcast className="h-4 w-4" />} Go live
          </button>
        )}
        {live && (
          <button onClick={() => setConfirmEnd(true)} className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-bold transition-colors hover:bg-white/20"><Stop className="h-4 w-4" /> End webinar</button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Stage */}
        <main className="relative min-w-0 flex-1 p-2 sm:p-3">
          <div className="relative h-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            {(!pass || !ready) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60"><CircleNotch className="h-8 w-8 animate-spin" /><p className="text-sm">Opening the room</p></div>
            )}
            {pass && (
              <iframe
                title="Webinar room"
                src={`${pass.roomUrl}?t=${encodeURIComponent(pass.token)}`}
                onLoad={() => setReady(true)}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className={`h-full w-full border-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </div>
        </main>

        {/* Host panel */}
        <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-[#0F1729] lg:flex">
          <div className="flex gap-1 border-b border-white/10 p-2">
            {([['questions', 'Questions', Question, questions.length], ['sheet', 'Run sheet', ListChecks, null], ['people', 'People', Users, null]] as const).map(([key, label, Icon, n]) => (
              <button key={key} onClick={() => setTab(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'}`}>
                <Icon className="h-4 w-4" /> {label}{n ? <span className="rounded-full bg-white/15 px-1.5 text-[10px]">{n}</span> : null}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'questions' && (
              questions.length === 0
                ? <p className="mt-6 text-center text-sm text-white/50">No questions were sent in advance. Live questions arrive in the chat inside the video window.</p>
                : <ul className="space-y-2.5">
                    {questions.map((q) => (
                      <li key={q.id} className="fade rounded-xl bg-white/[0.05] p-3">
                        <p className="text-sm leading-relaxed text-white/90">{q.question}</p>
                        <p className="mt-1.5 text-[11px] text-white/45">{q.name.split(' ')[0]}{q.profession ? ` · ${q.profession}` : ''}</p>
                      </li>
                    ))}
                  </ul>
            )}
            {tab === 'sheet' && (
              <ol className="space-y-2">
                {RUN_SHEET.map((step, i) => {
                  const on = done.includes(i);
                  return (
                    <li key={step}>
                      <button onClick={() => setDone((x) => (on ? x.filter((n) => n !== i) : [...x, i]))} className={`flex w-full gap-3 rounded-xl p-3 text-left text-sm transition-colors ${on ? 'bg-secondary/15 text-white/60' : 'bg-white/[0.04] text-white/90 hover:bg-white/[0.07]'}`}>
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${on ? 'border-secondary bg-secondary text-white' : 'border-white/30'}`}>{on ? <Check className="h-3 w-3" /> : i + 1}</span>
                        <span className={on ? 'line-through' : ''}>{step}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {tab === 'people' && d && (
              <div className="space-y-3">
                {[['Registered', d.stats.registered], ['Joined so far', d.stats.attended]].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl bg-white/[0.05] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">{label}</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
                  </div>
                ))}
                <p className="text-xs leading-relaxed text-white/45">Updated every 20 seconds. Attendees appear as "joined" within a minute of entering.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {confirmEnd && (
        <div className="fade fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setConfirmEnd(false)}>
          <div role="dialog" aria-modal="true" className="pop w-full max-w-sm rounded-2xl border border-white/10 bg-[#141D30] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">End the webinar?</h2><button onClick={() => setConfirmEnd(false)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button></div>
            <p className="mt-2 text-sm text-white/65">Attendees see that it has ended. The replay goes online and everyone registered is emailed once Daily has the recording.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmEnd(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10">Keep going</button>
              <button onClick={end} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#E5484D] px-4 py-2.5 text-sm font-bold hover:bg-[#d13d42] disabled:opacity-60">{busy && <CircleNotch className="h-4 w-4 animate-spin" />} End webinar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useElapsed(since: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  if (!since) return null;
  const secs = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s = secs % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}
