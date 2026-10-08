'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  DateTimePicker, TimePicker, localTimezoneLabel, Switch,
  Check, CircleNotch, Users, FileArrowUp, PaperPlaneTilt, CalendarBlank, ArrowsClockwise,
  Pencil, Warning, CheckCircle, ArrowLeft, ArrowRight, Envelope,
} from '@mjn/ui';
import { api, CampaignRecurrence } from '../../../lib/api';
import {
  SavedList, Frequency, SEGMENTS, TIMEZONES, WEEKDAY_CHIPS, DEFAULT_TIMEZONE,
  describeRecurrence, formatInTimezone, formatDateTime, audienceLabel,
  isValidEmail,
} from './shared';

type Mode = 'manual' | 'once' | 'recurring';
type EndMode = 'never' | 'date' | 'count';

type Form = {
  name: string; subject: string; body: string; useBrandTemplate: boolean;
  audienceType: 'segment' | 'list'; segment: string; listId: string;
  mode: Mode; scheduledAt: Date | null;
  frequency: Frequency; daysOfWeek: number[]; dayOfMonth: number; timeOfDay: string; timezone: string;
  endMode: EndMode; endsAt: Date | null; maxRuns: number;
};

const EMPTY: Form = {
  name: '', subject: '', body: '', useBrandTemplate: true,
  audienceType: 'segment', segment: 'leads', listId: '',
  mode: 'manual', scheduledAt: null,
  frequency: 'WEEKLY', daysOfWeek: [1], dayOfMonth: 1, timeOfDay: '09:00', timezone: DEFAULT_TIMEZONE,
  endMode: 'never', endsAt: null, maxRuns: 4,
};

const STEPS = ['Details', 'Content', 'Audience', 'Schedule', 'Review'] as const;

function formFromCampaign(c: any): Form {
  const af = c.audienceFilter as any;
  const isList = af?.type === 'contact_list' || af?.type === 'custom_list';
  return {
    ...EMPTY,
    name: c.name ?? '', subject: c.subject ?? '', body: c.body ?? '',
    useBrandTemplate: c.useBrandTemplate ?? true,
    audienceType: isList ? 'list' : 'segment',
    segment: af?.type === 'segment' ? af.segment ?? 'leads' : 'leads',
    // Lists embedded by older campaigns have no id; the admin picks a saved list instead.
    listId: af?.type === 'contact_list' ? af.listId ?? '' : '',
    mode: c.frequency ? 'recurring' : c.scheduledAt ? 'once' : 'manual',
    scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : null,
    frequency: c.frequency ?? 'WEEKLY',
    daysOfWeek: c.daysOfWeek?.length ? c.daysOfWeek : [1],
    dayOfMonth: c.dayOfMonth ?? 1,
    timeOfDay: c.timeOfDay ?? '09:00',
    timezone: c.timezone ?? DEFAULT_TIMEZONE,
    endMode: c.maxRuns ? 'count' : c.endsAt ? 'date' : 'never',
    endsAt: c.endsAt ? new Date(c.endsAt) : null,
    maxRuns: c.maxRuns ?? 4,
  };
}

const fieldClass =
  'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';

function OptionCard({
  selected, onClick, icon: Icon, title, desc,
}: { selected: boolean; onClick: () => void; icon: React.ElementType; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-white hover:border-primary/30'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label className="text-xs font-semibold text-foreground">{children}</label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Campaign being edited; null for a new one. Without an id it only pre-fills a new campaign. */
  campaign: any | null;
  lists: SavedList[];
  onImportList: () => void;
  onSaved: (campaign: any, sendNow: boolean) => void;
};

export function CampaignComposer({ open, onOpenChange, campaign, lists, onImportList, onSaved }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState<null | 'save' | 'send'>(null);
  const [audience, setAudience] = useState<{ total: number; unsubscribed: number; deliverable: number } | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [schedule, setSchedule] = useState<{ nextRunAt: string; cronExpression: string } | null>(null);
  const [scheduleError, setScheduleError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(campaign ? formFromCampaign(campaign) : EMPTY);
    setStep(0);
    setAudience(null);
    setSchedule(null);
    setScheduleError('');
    setPreview(null);
  }, [open, campaign]);

  // The API renders the preview, so it is exactly the email that gets sent.
  useEffect(() => {
    if (!open || !form.body.trim()) { setPreview(null); return; }
    let stale = false;
    const timer = setTimeout(() => {
      api.previewCampaignEmail({ subject: form.subject, body: form.body, useBrandTemplate: form.useBrandTemplate })
        .then((res) => { if (!stale) setPreview(res); })
        .catch(() => {});
    }, 350);
    return () => { stale = true; clearTimeout(timer); };
  }, [open, form.subject, form.body, form.useBrandTemplate]);

  const selectedList = lists.find((l) => l.id === form.listId);

  const audienceFilter = useMemo<Record<string, any> | null>(() => {
    if (form.audienceType === 'segment') return { type: 'segment', segment: form.segment };
    if (!selectedList) return null;
    return { type: 'contact_list', listId: selectedList.id, listName: selectedList.name, contactCount: selectedList.contactCount };
  }, [form.audienceType, form.segment, selectedList]);

  // Live recipient count for the chosen audience.
  useEffect(() => {
    if (!open || !audienceFilter) { setAudience(null); return; }
    let stale = false;
    setAudienceLoading(true);
    api.countCampaignAudience(audienceFilter)
      .then((res) => { if (!stale) setAudience(res); })
      .catch(() => { if (!stale) setAudience(null); })
      .finally(() => { if (!stale) setAudienceLoading(false); });
    return () => { stale = true; };
  }, [open, audienceFilter]);

  const recurrence = useMemo<CampaignRecurrence | null>(() => {
    if (form.mode !== 'recurring') return null;
    let endsAt: string | null = null;
    if (form.endMode === 'date' && form.endsAt) {
      const end = new Date(form.endsAt);
      end.setHours(23, 59, 59, 0);
      endsAt = end.toISOString();
    }
    return {
      frequency: form.frequency,
      daysOfWeek: form.frequency === 'WEEKLY' ? form.daysOfWeek : undefined,
      dayOfMonth: form.frequency === 'MONTHLY' ? form.dayOfMonth : undefined,
      timeOfDay: form.timeOfDay,
      timezone: form.timezone,
      endsAt,
      maxRuns: form.endMode === 'count' ? form.maxRuns : null,
    };
  }, [form.mode, form.frequency, form.daysOfWeek, form.dayOfMonth, form.timeOfDay, form.timezone, form.endMode, form.endsAt, form.maxRuns]);

  // The API validates the schedule and says when it would first send.
  useEffect(() => {
    if (!open || !recurrence) { setSchedule(null); setScheduleError(''); return; }
    if (recurrence.frequency === 'WEEKLY' && !recurrence.daysOfWeek?.length) {
      setSchedule(null); setScheduleError('Pick at least one day of the week.'); return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      api.previewCampaignSchedule(recurrence)
        .then((res) => { if (!stale) { setSchedule(res); setScheduleError(''); } })
        .catch((err: any) => { if (!stale) { setSchedule(null); setScheduleError(err.message ?? 'This schedule is not valid.'); } });
    }, 250);
    return () => { stale = true; clearTimeout(timer); };
  }, [open, recurrence]);

  function stepError(index: number): string {
    if (index === 0) {
      if (!form.name.trim()) return 'Give the campaign a name.';
      if (!form.subject.trim()) return 'Add an email subject.';
    }
    if (index === 1 && !form.body.trim()) return 'Write the email content.';
    if (index === 2) {
      if (!audienceFilter) return 'Choose a saved list, or import one.';
    }
    if (index === 3) {
      if (form.mode === 'once') {
        if (!form.scheduledAt) return 'Pick a date and time.';
        if (form.scheduledAt.getTime() <= Date.now()) return 'Pick a time in the future.';
      }
      if (form.mode === 'recurring') {
        if (scheduleError) return scheduleError;
        if (form.endMode === 'date' && !form.endsAt) return 'Pick an end date, or choose "Never".';
        if (form.endMode === 'count' && (!form.maxRuns || form.maxRuns < 1)) return 'Enter how many times to send.';
      }
    }
    return '';
  }

  const firstInvalidStep = [0, 1, 2, 3].find((i) => stepError(i));

  function goNext() {
    const error = stepError(step);
    if (error) { toast.error(error); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function insertNameTag() {
    const el = bodyRef.current;
    const tag = '{{name}}';
    if (!el) { set('body', form.body + tag); return; }
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? form.body.length;
    set('body', form.body.slice(0, start) + tag + form.body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  }

  async function sendTest() {
    if (!isValidEmail(testEmail.trim())) { toast.error('Enter a valid email address for the test.'); return; }
    if (!form.subject.trim() || !form.body.trim()) { toast.error('Add a subject and content first.'); return; }
    setTesting(true);
    try {
      const res = await api.sendCampaignTestContent({
        subject: form.subject, body: form.body, useBrandTemplate: form.useBrandTemplate, email: testEmail.trim(),
      });
      toast.success(`Test sent to ${res.sentTo}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  }

  async function save(sendNow: boolean) {
    if (firstInvalidStep !== undefined) {
      setStep(firstInvalidStep);
      toast.error(stepError(firstInvalidStep));
      return;
    }
    setSaving(sendNow ? 'send' : 'save');
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body,
        useBrandTemplate: form.useBrandTemplate,
        audienceFilter: audienceFilter!,
        scheduledAt: form.mode === 'once' && form.scheduledAt ? form.scheduledAt.toISOString() : null,
        recurrence: form.mode === 'recurring' ? recurrence : null,
      };
      const saved = campaign?.id
        ? await api.updateCampaign(campaign.id, payload)
        : await api.createCampaign(payload);
      onSaved(saved, sendNow);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  const scheduleSummary =
    form.mode === 'manual' ? 'Saved as a draft. Send it yourself when ready.'
    : form.mode === 'once' ? (form.scheduledAt ? `Once, on ${formatDateTime(form.scheduledAt)} (${localTimezoneLabel()})` : 'Once — no time picked yet')
    : describeRecurrence(form);

  const saveLabel =
    form.mode === 'manual' ? 'Save draft'
    : form.mode === 'once' ? 'Schedule campaign'
    : campaign?.status === 'PAUSED' ? 'Save schedule' : 'Start recurring campaign';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-5xl">
        {/* Header + stepper */}
        <div className="border-b border-border px-6 pb-4 pt-5">
          <SheetTitle className="text-lg font-bold">{campaign?.id ? 'Edit campaign' : 'New campaign'}</SheetTitle>
          <SheetDescription className="sr-only">Compose, target and schedule an email campaign.</SheetDescription>
          <ol className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
            {STEPS.map((label, i) => {
              const done = i < step && !stepError(i);
              const current = i === step;
              return (
                <li key={label} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={current ? 'step' : undefined}
                    className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition-colors ${
                      current ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      current ? 'bg-primary text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {label}
                  </button>
                  {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Step content */}
          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
            {step === 0 && (
              <div className="max-w-xl space-y-5">
                <div>
                  <FieldLabel hint="Only your team sees this">Campaign name</FieldLabel>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus
                    placeholder="e.g. UAE Nurses — October intake" className={fieldClass} />
                </div>
                <div>
                  <FieldLabel hint="Shown in the recipient's inbox">Email subject</FieldLabel>
                  <input value={form.subject} onChange={(e) => set('subject', e.target.value)}
                    placeholder="e.g. Your DHA licence in 5 steps" className={fieldClass} />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Tip: write <code className="rounded bg-muted px-1 py-0.5 font-mono">{'{{name}}'}</code> to greet each person by name.
                  </p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-foreground">Email content</label>
                  <button type="button" onClick={insertNameTag}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5">
                    Insert recipient name
                  </button>
                </div>
                <textarea ref={bodyRef} value={form.body} onChange={(e) => set('body', e.target.value)} rows={18}
                  placeholder={'Hi {{name}},\n\nWrite your message here. Plain text or HTML both work.'}
                  className={`${fieldClass} resize-y font-mono leading-relaxed`} />
                <p className="text-xs text-muted-foreground">
                  Leave a blank line between paragraphs. An unsubscribe link is added to every email automatically.
                </p>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-4 py-3">
                  <Switch checked={form.useBrandTemplate} onCheckedChange={(v) => set('useBrandTemplate', v)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Use MJN branded template</span>
                    <span className="block text-xs text-muted-foreground">
                      Adds the logo header and company footer, like your other emails. Turn off for an email that already has its own design.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-2xl space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <OptionCard selected={form.audienceType === 'segment'} onClick={() => set('audienceType', 'segment')}
                    icon={Users} title="A group from the system" desc="Leads or clients, picked up fresh at every send" />
                  <OptionCard selected={form.audienceType === 'list'} onClick={() => set('audienceType', 'list')}
                    icon={FileArrowUp} title="An imported list" desc="Contacts you uploaded from Excel or CSV" />
                </div>

                {form.audienceType === 'segment' && (
                  <div className="space-y-2" role="radiogroup" aria-label="Group">
                    {SEGMENTS.map((s) => {
                      const selected = form.segment === s.value;
                      return (
                        <button key={s.value} type="button" role="radio" aria-checked={selected}
                          onClick={() => set('segment', s.value)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            selected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/30'
                          }`}>
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-muted-foreground/40'}`}>
                            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{s.label}</span>
                          <span className="text-xs text-muted-foreground">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {form.audienceType === 'list' && (
                  <div className="space-y-2">
                    {lists.length === 0 && (
                      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                        You have no saved lists yet.
                      </p>
                    )}
                    {lists.map((l) => {
                      const selected = form.listId === l.id;
                      return (
                        <button key={l.id} type="button" aria-pressed={selected} onClick={() => set('listId', l.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            selected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/30'
                          }`}>
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-muted-foreground/40'}`}>
                            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{l.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{l.contactCount} contacts</span>
                        </button>
                      );
                    })}
                    <button type="button" onClick={onImportList}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40">
                      <FileArrowUp className="h-3.5 w-3.5 text-primary" /> Import a new list
                    </button>
                  </div>
                )}

                <AudienceCount audience={audience} loading={audienceLoading} hasAudience={!!audienceFilter} />
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <OptionCard selected={form.mode === 'manual'} onClick={() => set('mode', 'manual')}
                    icon={Pencil} title="Save as draft" desc="Send it yourself later" />
                  <OptionCard selected={form.mode === 'once'} onClick={() => set('mode', 'once')}
                    icon={CalendarBlank} title="Send once" desc="At a date and time" />
                  <OptionCard selected={form.mode === 'recurring'} onClick={() => set('mode', 'recurring')}
                    icon={ArrowsClockwise} title="Recurring" desc="Repeats on a schedule" />
                </div>

                {form.mode === 'once' && (
                  <div className="max-w-sm">
                    <FieldLabel hint={`Your time (${localTimezoneLabel()})`}>Send on</FieldLabel>
                    <DateTimePicker value={form.scheduledAt} onChange={(d) => set('scheduledAt', d)}
                      minDate={new Date()} quickPicks placeholder="Pick a date and time" />
                  </div>
                )}

                {form.mode === 'recurring' && (
                  <div className="space-y-5 rounded-2xl border border-border bg-white p-5">
                    <div>
                      <FieldLabel>Repeat</FieldLabel>
                      <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1" role="radiogroup" aria-label="Frequency">
                        {(['DAILY', 'WEEKLY', 'MONTHLY'] as Frequency[]).map((f) => (
                          <button key={f} type="button" role="radio" aria-checked={form.frequency === f}
                            onClick={() => set('frequency', f)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                              form.frequency === f ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {f === 'DAILY' ? 'Daily' : f === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.frequency === 'WEEKLY' && (
                      <div>
                        <FieldLabel hint="Pick one or more">On these days</FieldLabel>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAY_CHIPS.map((d) => {
                            const on = form.daysOfWeek.includes(d.value);
                            return (
                              <button key={d.value} type="button" aria-pressed={on}
                                onClick={() => set('daysOfWeek', on ? form.daysOfWeek.filter((x) => x !== d.value) : [...form.daysOfWeek, d.value])}
                                className={`h-10 w-12 rounded-xl border text-sm font-semibold transition-colors ${
                                  on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40'
                                }`}>
                                {d.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {form.frequency === 'MONTHLY' && (
                      <div className="max-w-[12rem]">
                        <FieldLabel>Day of the month</FieldLabel>
                        <Select value={String(form.dayOfMonth)} onValueChange={(v) => set('dayOfMonth', Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-64">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.dayOfMonth > 28 && (
                          <p className="mt-1.5 text-xs text-muted-foreground">Shorter months send on their last day.</p>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>At</FieldLabel>
                        <TimePicker value={form.timeOfDay} onChange={(t) => set('timeOfDay', t)} />
                      </div>
                      <div>
                        <FieldLabel>Timezone</FieldLabel>
                        <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                            {!TIMEZONES.some((tz) => tz.value === form.timezone) && (
                              <SelectItem value={form.timezone}>{form.timezone}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Ends</FieldLabel>
                      <div className="flex flex-wrap items-center gap-2">
                        {([['never', 'Never'], ['date', 'On a date'], ['count', 'After a number of sends']] as [EndMode, string][]).map(([value, label]) => (
                          <button key={value} type="button" aria-pressed={form.endMode === value} onClick={() => set('endMode', value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              form.endMode === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {form.endMode === 'date' && (
                        <div className="mt-3 max-w-xs">
                          <DateTimePicker value={form.endsAt} onChange={(d) => set('endsAt', d)} withTime={false}
                            minDate={new Date()} placeholder="Pick the last day" />
                        </div>
                      )}
                      {form.endMode === 'count' && (
                        <div className="mt-3 flex items-center gap-2">
                          <input type="number" min={1} max={999} value={form.maxRuns}
                            onChange={(e) => set('maxRuns', Math.max(1, Number(e.target.value) || 1))}
                            className={`${fieldClass} w-24 tabular-nums`} aria-label="Number of sends" />
                          <span className="text-sm text-muted-foreground">sends, then stop</span>
                        </div>
                      )}
                    </div>

                    <div className={`rounded-xl border px-4 py-3 ${scheduleError ? 'border-rose-200 bg-rose-50' : 'border-primary/20 bg-primary/5'}`}>
                      {scheduleError ? (
                        <p className="flex items-center gap-2 text-sm font-medium text-rose-700">
                          <Warning className="h-4 w-4 shrink-0" /> {scheduleError}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">{describeRecurrence(form)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {schedule ? `Next send: ${formatInTimezone(schedule.nextRunAt, form.timezone)}` : 'Working out the next send…'}
                          </p>
                          {schedule && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Cron: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-foreground">{schedule.cronExpression}</code>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="max-w-2xl space-y-4">
                {firstInvalidStep !== undefined && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Warning className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{stepError(firstInvalidStep)} <button type="button" className="font-semibold underline" onClick={() => setStep(firstInvalidStep)}>Fix it</button></span>
                  </div>
                )}
                <dl className="divide-y divide-border rounded-2xl border border-border bg-white">
                  {[
                    { label: 'Campaign', value: form.name || '—', step: 0 },
                    { label: 'Subject', value: form.subject || '—', step: 0 },
                    { label: 'Content', value: form.body.trim() ? `${form.body.trim().length.toLocaleString()} characters` : '—', step: 1 },
                    {
                      label: 'Audience',
                      value: audienceFilter
                        ? `${audienceLabel(audienceFilter)}${audience ? ` · ${audience.deliverable.toLocaleString()} recipients` : ''}`
                        : '—',
                      step: 2,
                    },
                    { label: 'Schedule', value: scheduleSummary, step: 3 },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-4 px-5 py-3.5">
                      <dt className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</dt>
                      <dd className="min-w-0 flex-1 truncate text-sm text-foreground">{row.value}</dd>
                      <button type="button" onClick={() => setStep(row.step)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
                    </div>
                  ))}
                </dl>
                {form.mode === 'recurring' && schedule && !scheduleError && (
                  <p className="text-xs text-muted-foreground">
                    First send: {formatInTimezone(schedule.nextRunAt, form.timezone)}. The audience is re-read at every send.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Live preview */}
          <aside className="hidden w-[28rem] shrink-0 flex-col border-l border-border bg-muted/20 lg:flex">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <Envelope className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Preview</p>
              <span className="text-xs text-muted-foreground">as “Amina” sees it</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">From MJN Healthcare</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {preview?.subject || form.subject.trim() || 'Your subject line'}
                  </p>
                </div>
                {form.body.trim() && preview ? (
                  <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="min-h-0 w-full flex-1" />
                ) : form.body.trim() ? (
                  <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">Loading preview…</div>
                ) : (
                  <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-muted-foreground">
                    Your email will appear here as you write it.
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Send a test</label>
                <div className="flex gap-2">
                  <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@example.com" className={`${fieldClass} py-2`} />
                  <button type="button" onClick={sendTest} disabled={testing}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-50">
                    {testing ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5 text-primary" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-6 py-4">
          <button type="button" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40">
            {step > 0 && <ArrowLeft className="h-3.5 w-3.5" />}
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {form.mode === 'manual' && (
                <button type="button" onClick={() => save(true)} disabled={!!saving}
                  className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50">
                  {saving === 'send' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5" />}
                  Save and send now
                </button>
              )}
              <button type="button" onClick={() => save(false)} disabled={!!saving}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                {saving === 'save' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                {saveLabel}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AudienceCount({
  audience, loading, hasAudience,
}: { audience: { total: number; unsubscribed: number; deliverable: number } | null; loading: boolean; hasAudience: boolean }) {
  if (!hasAudience) return null;
  if (loading && !audience) {
    return <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">Counting recipients…</p>;
  }
  if (!audience) return null;
  const empty = audience.deliverable === 0;
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${empty ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      {empty ? <Warning className="h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
      <p className={`text-sm ${empty ? 'text-amber-800' : 'text-emerald-800'}`}>
        <span className="font-bold tabular-nums">{audience.deliverable.toLocaleString()}</span>{' '}
        {audience.deliverable === 1 ? 'person' : 'people'} will receive this
        {audience.unsubscribed > 0 && (
          <span className="text-xs opacity-80"> · {audience.unsubscribed.toLocaleString()} unsubscribed and left out</span>
        )}
      </p>
    </div>
  );
}
