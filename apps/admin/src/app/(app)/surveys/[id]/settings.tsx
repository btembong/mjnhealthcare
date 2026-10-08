'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch, DateTimePicker, CircleNotch, CheckCircle } from '@mjn/ui';
import { api } from '../../../../lib/api';
import { WEB_URL } from '../shared';

const fieldClass =
  'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';

type Form = {
  title: string; titleFr: string; description: string; descriptionFr: string; slug: string;
  layout: string; identified: boolean; onePerPerson: boolean; captureLead: boolean; showInPortal: boolean;
  opensAt: Date | null; closesAt: Date | null; maxResponses: string;
  consentText: string; consentTextFr: string;
  thankYouTitle: string; thankYouTitleFr: string; thankYouMessage: string; thankYouMessageFr: string;
  ctaLabel: string; ctaLabelFr: string; ctaUrl: string;
};

function toForm(s: any): Form {
  const text = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    title: text(s.title), titleFr: text(s.titleFr), description: text(s.description), descriptionFr: text(s.descriptionFr),
    slug: text(s.slug), layout: s.layout ?? 'ONE_PER_PAGE',
    identified: !!s.identified, onePerPerson: !!s.onePerPerson, captureLead: !!s.captureLead, showInPortal: !!s.showInPortal,
    opensAt: s.opensAt ? new Date(s.opensAt) : null, closesAt: s.closesAt ? new Date(s.closesAt) : null,
    maxResponses: s.maxResponses ? String(s.maxResponses) : '',
    consentText: text(s.consentText), consentTextFr: text(s.consentTextFr),
    thankYouTitle: text(s.thankYouTitle), thankYouTitleFr: text(s.thankYouTitleFr),
    thankYouMessage: text(s.thankYouMessage), thankYouMessageFr: text(s.thankYouMessageFr),
    ctaLabel: text(s.ctaLabel), ctaLabelFr: text(s.ctaLabelFr), ctaUrl: text(s.ctaUrl),
  };
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, title, hint, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; title: string; hint: string; disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="mt-0.5" />
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function SurveySettings({ survey, french, onSaved, onDirtyChange }: {
  survey: any; french: boolean; onSaved: (survey: any) => void; onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<Form>(() => toForm(survey));
  const [saved, setSaved] = useState<Form>(() => toForm(survey));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  async function save() {
    if (!form.title.trim()) { toast.error('Give the survey a title.'); return; }
    const max = form.maxResponses.trim() ? Number(form.maxResponses) : null;
    if (max !== null && (!Number.isInteger(max) || max < 1)) { toast.error('The response limit must be a whole number above zero.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateSurvey(survey.id, {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        onePerPerson: form.identified && form.onePerPerson,
        captureLead: form.identified && form.captureLead,
        opensAt: form.opensAt ? form.opensAt.toISOString() : null,
        closesAt: form.closesAt ? form.closesAt.toISOString() : null,
        maxResponses: max,
      });
      const next = toForm(updated);
      setForm(next);
      setSaved(next);
      onSaved(updated);
      toast.success('Settings saved.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const pair = french ? 'grid gap-3 sm:grid-cols-2' : '';

  return (
    <div className="space-y-4">
      <Section title="Title and introduction" hint="Shown at the top of the survey.">
        <div className={pair}>
          <Field label="Title"><input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={200} className={fieldClass} /></Field>
          {french && <Field label="Title in French"><input value={form.titleFr} onChange={(e) => set('titleFr', e.target.value)} maxLength={200} className={fieldClass} /></Field>}
        </div>
        <div className={pair}>
          <Field label="Introduction">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
              placeholder="Why you are asking, and how long it takes" className={`${fieldClass} resize-y`} />
          </Field>
          {french && (
            <Field label="Introduction in French">
              <textarea value={form.descriptionFr} onChange={(e) => set('descriptionFr', e.target.value)} rows={3} className={`${fieldClass} resize-y`} />
            </Field>
          )}
        </div>
        <Field label="Link name" hint="Changing this breaks links you have already shared.">
          <div className="flex items-center rounded-xl border border-border bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <span className="shrink-0 pl-3 text-sm text-muted-foreground">{WEB_URL.replace(/^https?:\/\//, '')}/survey/</span>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              aria-label="Link name" className="min-w-0 flex-1 rounded-r-xl bg-transparent py-2 pr-3 text-sm text-foreground outline-none" />
          </div>
        </Field>
      </Section>

      <Section title="Layout">
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Layout">
          {[
            { value: 'ONE_PER_PAGE', title: 'One question at a time', hint: 'Best on phones, with a progress bar' },
            { value: 'ALL_ON_ONE', title: 'All on one page', hint: 'Best for short surveys' },
          ].map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={form.layout === o.value} onClick={() => set('layout', o.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${form.layout === o.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30'}`}>
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.hint}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Who answers">
        <Toggle checked={form.identified} onChange={(v) => set('identified', v)}
          title="Ask for name and email" hint="Off means the survey is anonymous." />
        <Toggle checked={form.identified && form.onePerPerson} onChange={(v) => set('onePerPerson', v)} disabled={!form.identified}
          title="One response per person" hint="A second response from the same email is refused. Needs name and email." />
        <Toggle checked={form.identified && form.captureLead} onChange={(v) => set('captureLead', v)} disabled={!form.identified}
          title="Add respondents to Leads" hint="New emails are added to your leads list. Needs name and email." />
        <Toggle checked={form.showInPortal} onChange={(v) => set('showInPortal', v)}
          title="Invite clients in the portal" hint="Shows an invitation on the client dashboard while the survey is live." />
      </Section>

      <Section title="Availability" hint="Leave blank for no limit. The survey must also be published.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Opens"><DateTimePicker value={form.opensAt} onChange={(d) => set('opensAt', d)} placeholder="As soon as published" /></Field>
          <Field label="Closes"><DateTimePicker value={form.closesAt} onChange={(d) => set('closesAt', d)} placeholder="Never" minDate={form.opensAt ?? undefined} /></Field>
          <Field label="Response limit">
            <input type="number" min={1} value={form.maxResponses} onChange={(e) => set('maxResponses', e.target.value)}
              placeholder="No limit" className={`${fieldClass} h-10 tabular-nums`} />
          </Field>
        </div>
      </Section>

      <Section title="Consent" hint="If you write a consent statement, people must tick it before submitting. The time is recorded with their response.">
        <div className={pair}>
          <Field label="Consent statement">
            <textarea value={form.consentText} onChange={(e) => set('consentText', e.target.value)} rows={3}
              placeholder="e.g. I agree that MJN Healthcare may store my answers and contact me about them."
              className={`${fieldClass} resize-y`} />
          </Field>
          {french && (
            <Field label="Consent statement in French">
              <textarea value={form.consentTextFr} onChange={(e) => set('consentTextFr', e.target.value)} rows={3} className={`${fieldClass} resize-y`} />
            </Field>
          )}
        </div>
      </Section>

      <Section title="Thank-you screen" hint="Shown after someone submits. Leave blank for the standard message.">
        <div className={pair}>
          <Field label="Heading"><input value={form.thankYouTitle} onChange={(e) => set('thankYouTitle', e.target.value)} placeholder="Thank you!" className={fieldClass} /></Field>
          {french && <Field label="Heading in French"><input value={form.thankYouTitleFr} onChange={(e) => set('thankYouTitleFr', e.target.value)} placeholder="Merci !" className={fieldClass} /></Field>}
        </div>
        <div className={pair}>
          <Field label="Message"><textarea value={form.thankYouMessage} onChange={(e) => set('thankYouMessage', e.target.value)} rows={2} className={`${fieldClass} resize-y`} /></Field>
          {french && <Field label="Message in French"><textarea value={form.thankYouMessageFr} onChange={(e) => set('thankYouMessageFr', e.target.value)} rows={2} className={`${fieldClass} resize-y`} /></Field>}
        </div>
        <div className={`grid gap-3 ${french ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <Field label="Button text"><input value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="e.g. Book a consultation" className={fieldClass} /></Field>
          {french && <Field label="Button text in French"><input value={form.ctaLabelFr} onChange={(e) => set('ctaLabelFr', e.target.value)} className={fieldClass} /></Field>}
          <Field label="Button link"><input value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} placeholder="https://mjnhealthcare.com/consult" className={fieldClass} /></Field>
        </div>
      </Section>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-border bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
        <p className="text-xs text-muted-foreground">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <button type="button" onClick={save} disabled={saving || !dirty}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
          {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save settings
        </button>
      </div>
    </div>
  );
}
