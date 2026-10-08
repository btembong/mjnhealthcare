'use client';

import * as React from 'react';
import { DateTimePicker, MonthPicker } from './date-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, ArrowRight, Check, CheckCircle, CircleNotch, Star, Warning } from '../icons';
import { cn } from '../lib/utils';

export type SurveyLocale = 'en' | 'fr';

export type SurveyQuestionType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'DROPDOWN'
  | 'RATING' | 'SCALE' | 'YES_NO' | 'DATE' | 'MONTH_YEAR' | 'EMAIL' | 'PHONE';

export type SurveyAnswer = string | number | string[];

export interface SurveyFormQuestion {
  id: string;
  type: SurveyQuestionType;
  label: string;
  labelFr?: string | null;
  helpText?: string | null;
  helpTextFr?: string | null;
  required?: boolean;
  options?: { id: string; label: string; labelFr?: string | null }[] | null;
  showIf?: { questionId: string; operator: 'equals' | 'not_equals'; value: string } | null;
}

export interface SurveyFormData {
  title: string;
  titleFr?: string | null;
  description?: string | null;
  descriptionFr?: string | null;
  layout?: string;
  identified?: boolean;
  consentText?: string | null;
  consentTextFr?: string | null;
  thankYouTitle?: string | null;
  thankYouTitleFr?: string | null;
  thankYouMessage?: string | null;
  thankYouMessageFr?: string | null;
  ctaLabel?: string | null;
  ctaLabelFr?: string | null;
  ctaUrl?: string | null;
  questions: SurveyFormQuestion[];
}

export interface SurveySubmission {
  answers: Record<string, SurveyAnswer>;
  name?: string;
  email?: string;
  locale: SurveyLocale;
  consent: boolean;
  website: string;
}

/** Thrown by `onSubmit` to point at what needs fixing. */
export class SurveySubmitError extends Error {
  constructor(message: string, public errors?: Record<string, string>, public field?: string) {
    super(message);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;

const STRINGS = {
  en: {
    start: 'Start', next: 'Next', back: 'Back', submit: 'Submit', sending: 'Sending…',
    name: 'Your name', email: 'Your email', optional: 'Optional', required: 'Required',
    yes: 'Yes', no: 'No', choose: 'Choose an option', pickDate: 'Pick a date', pickMonth: 'Pick a month',
    selectAll: 'Select all that apply', progress: (a: number, b: number) => `Question ${a} of ${b}`,
    errRequired: 'Please answer this question.', errEmail: 'Enter a valid email address.',
    errPhone: 'Enter a valid phone number.', errInvalid: 'This answer is not valid.',
    errName: 'Please enter your name.', errConsent: 'Please tick the box to continue.',
    thanksTitle: 'Thank you!', thanksMessage: 'Your answers have been recorded.',
    preview: 'Preview — answers are not saved.', notLikely: 'Not at all', veryLikely: 'Extremely',
    fixErrors: 'Some answers need your attention.',
  },
  fr: {
    start: 'Commencer', next: 'Suivant', back: 'Retour', submit: 'Envoyer', sending: 'Envoi…',
    name: 'Votre nom', email: 'Votre e-mail', optional: 'Facultatif', required: 'Obligatoire',
    yes: 'Oui', no: 'Non', choose: 'Choisissez une option', pickDate: 'Choisissez une date', pickMonth: 'Choisissez un mois',
    selectAll: 'Sélectionnez toutes les réponses applicables', progress: (a: number, b: number) => `Question ${a} sur ${b}`,
    errRequired: 'Veuillez répondre à cette question.', errEmail: 'Saisissez une adresse e-mail valide.',
    errPhone: 'Saisissez un numéro de téléphone valide.', errInvalid: 'Cette réponse n’est pas valide.',
    errName: 'Veuillez saisir votre nom.', errConsent: 'Veuillez cocher la case pour continuer.',
    thanksTitle: 'Merci !', thanksMessage: 'Vos réponses ont bien été enregistrées.',
    preview: 'Aperçu — les réponses ne sont pas enregistrées.', notLikely: 'Pas du tout', veryLikely: 'Tout à fait',
    fixErrors: 'Certaines réponses nécessitent votre attention.',
  },
};

/** True when any French text has been provided, so a language switch is worth showing. */
export function surveyHasFrench(survey: SurveyFormData): boolean {
  return !!(survey.titleFr || survey.descriptionFr || survey.questions.some((q) => q.labelFr));
}

function isEmpty(value: SurveyAnswer | undefined): boolean {
  return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

/** Questions currently shown, applying skip logic in order (mirrors the API). */
function visibleQuestions(questions: SurveyFormQuestion[], answers: Record<string, SurveyAnswer>) {
  const kept: Record<string, SurveyAnswer> = {};
  const visible: SurveyFormQuestion[] = [];
  for (const q of questions) {
    const rule = q.showIf;
    if (rule?.questionId) {
      const given = kept[rule.questionId];
      if (given === undefined) continue;
      const matches = Array.isArray(given) ? given.includes(rule.value) : String(given) === String(rule.value);
      if (rule.operator === 'not_equals' ? matches : !matches) continue;
    }
    visible.push(q);
    if (!isEmpty(answers[q.id])) kept[q.id] = answers[q.id];
  }
  return { visible, kept };
}

const inputClass =
  'w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';

const choiceClass = (selected: boolean) => cn(
  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors',
  selected ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-white text-foreground hover:border-primary/40',
);

type FieldProps = {
  question: SurveyFormQuestion;
  value: SurveyAnswer | undefined;
  onChange: (value: SurveyAnswer | undefined) => void;
  locale: SurveyLocale;
  onEnter?: () => void;
  invalid: boolean;
};

function QuestionField({ question, value, onChange, locale, onEnter, invalid }: FieldProps) {
  const s = STRINGS[locale];
  const text = (en?: string | null, fr?: string | null) => (locale === 'fr' && fr ? fr : en ?? '');
  const options = question.options ?? [];
  const describedBy = invalid ? `${question.id}-error` : undefined;
  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } };

  switch (question.type) {
    case 'SHORT_TEXT':
    case 'EMAIL':
    case 'PHONE':
      return (
        <input
          type={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : 'text'}
          inputMode={question.type === 'PHONE' ? 'tel' : undefined}
          autoComplete={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : 'off'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={invalid} aria-describedby={describedBy} aria-labelledby={`${question.id}-label`}
          className={inputClass}
        />
      );
    case 'LONG_TEXT':
      return (
        <textarea
          rows={5}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid} aria-describedby={describedBy} aria-labelledby={`${question.id}-label`}
          className={cn(inputClass, 'resize-y')}
        />
      );
    case 'DROPDOWN':
      return (
        <Select value={typeof value === 'string' ? value : ''} onValueChange={(v) => onChange(v || undefined)}>
          <SelectTrigger aria-invalid={invalid} aria-describedby={describedBy} aria-labelledby={`${question.id}-label`}
            className={cn('h-12 rounded-xl border-border px-4 text-base data-[placeholder]:text-muted-foreground', invalid && 'border-rose-400')}>
            <SelectValue placeholder={s.choose} />
          </SelectTrigger>
          <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id} className="py-2.5 text-base">{text(o.label, o.labelFr)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'SINGLE_CHOICE':
      return (
        <div className="space-y-2" role="radiogroup" aria-labelledby={`${question.id}-label`}>
          {options.map((o) => {
            const selected = value === o.id;
            return (
              <button key={o.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(o.id)} className={choiceClass(selected)}>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-primary' : 'border-muted-foreground/40')}>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                {text(o.label, o.labelFr)}
              </button>
            );
          })}
        </div>
      );
    case 'MULTI_CHOICE': {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2" role="group" aria-labelledby={`${question.id}-label`}>
          <p className="text-sm text-muted-foreground">{s.selectAll}</p>
          {options.map((o) => {
            const selected = picked.includes(o.id);
            return (
              <button key={o.id} type="button" role="checkbox" aria-checked={selected}
                onClick={() => onChange(selected ? picked.filter((x) => x !== o.id) : [...picked, o.id])}
                className={choiceClass(selected)}>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', selected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40')}>
                  {selected && <Check className="h-3 w-3" />}
                </span>
                {text(o.label, o.labelFr)}
              </button>
            );
          })}
        </div>
      );
    }
    case 'YES_NO':
      return (
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby={`${question.id}-label`}>
          {(['yes', 'no'] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
              className={cn(choiceClass(value === v), 'justify-center font-semibold')}>
              {v === 'yes' ? s.yes : s.no}
            </button>
          ))}
        </div>
      );
    case 'RATING': {
      const current = typeof value === 'number' ? value : 0;
      return (
        <div className="flex gap-1.5" role="radiogroup" aria-labelledby={`${question.id}-label`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={current === n} aria-label={`${n} / 5`} onClick={() => onChange(n)}
              className={cn('flex h-12 w-12 items-center justify-center rounded-xl border transition-colors',
                n <= current ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-border bg-white text-muted-foreground/40 hover:border-amber-200 hover:text-amber-300')}>
              <Star className="h-6 w-6" />
            </button>
          ))}
        </div>
      );
    }
    case 'SCALE':
      return (
        <div role="radiogroup" aria-labelledby={`${question.id}-label`}>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
                className={cn('h-11 rounded-xl border text-sm font-semibold tabular-nums transition-colors',
                  value === n ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40')}>
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>0 · {s.notLikely}</span><span>10 · {s.veryLikely}</span>
          </div>
        </div>
      );
    case 'DATE': {
      const date = typeof value === 'string' && value ? new Date(`${value}T00:00:00`) : null;
      const pad = (n: number) => String(n).padStart(2, '0');
      return (
        <DateTimePicker
          value={date} withTime={false} placeholder={s.pickDate}
          onChange={(d) => onChange(d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined)}
          className="max-w-xs"
        />
      );
    }
    case 'MONTH_YEAR':
      return (
        <MonthPicker
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          maxDate={new Date()}
          locale={locale === 'fr' ? 'fr-FR' : 'en-GB'}
          placeholder={s.pickMonth}
          invalid={invalid}
          labelledBy={`${question.id}-label`}
          className="max-w-xs"
        />
      );
    default:
      return null;
  }
}

type SurveyFormProps = {
  survey: SurveyFormData;
  locale: SurveyLocale;
  onSubmit: (submission: SurveySubmission) => Promise<void>;
  /** Shows the form without saving anything. */
  preview?: boolean;
  /** Pre-filled identity, e.g. for a logged-in client. */
  initial?: { name?: string; email?: string };
  /** localStorage key for saving progress; omit to disable. */
  storageKey?: string;
  className?: string;
};

export function SurveyForm({ survey, locale, onSubmit, preview, initial, storageKey, className }: SurveyFormProps) {
  const s = STRINGS[locale];
  const text = (en?: string | null, fr?: string | null) => (locale === 'fr' && fr ? fr : en ?? '');
  const onePerPage = survey.layout !== 'ALL_ON_ONE';
  const consentText = text(survey.consentText, survey.consentTextFr);

  const [answers, setAnswers] = React.useState<Record<string, SurveyAnswer>>({});
  const [name, setName] = React.useState(initial?.name ?? '');
  const [email, setEmail] = React.useState(initial?.email ?? '');
  const [consent, setConsent] = React.useState(false);
  const [website, setWebsite] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState('');
  const [started, setStarted] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // Keep a respondent's progress on their device so a dropped connection does not lose it.
  const [restored, setRestored] = React.useState(false);
  React.useEffect(() => {
    if (!storageKey || preview) { setRestored(true); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      if (saved && typeof saved === 'object') {
        if (saved.answers) setAnswers(saved.answers);
        if (saved.name && !initial?.name) setName(saved.name);
        if (saved.email && !initial?.email) setEmail(saved.email);
        if (saved.started) { setStarted(true); setIndex(Number(saved.index) || 0); }
      }
    } catch { /* unreadable or blocked storage: start fresh */ }
    setRestored(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!storageKey || preview || !restored) return;
    try {
      if (done) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ answers, name, email, started, index }));
    } catch { /* storage full or blocked */ }
  }, [storageKey, preview, restored, done, answers, name, email, started, index]);

  const { visible, kept } = React.useMemo(() => visibleQuestions(survey.questions, answers), [survey.questions, answers]);
  const current = visible[Math.min(index, Math.max(visible.length - 1, 0))];
  const isLast = index >= visible.length - 1;

  function setAnswer(id: string, value: SurveyAnswer | undefined) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[id]; else next[id] = value;
      return next;
    });
    setErrors((prev) => (prev[id] ? { ...prev, [id]: '' } : prev));
    setFormError('');
  }

  function questionError(q: SurveyFormQuestion): string {
    const value = answers[q.id];
    const blank = isEmpty(typeof value === 'string' ? value.trim() : value);
    if (blank) return q.required ? s.errRequired : '';
    if (q.type === 'EMAIL' && !EMAIL_RE.test(String(value).trim())) return s.errEmail;
    if (q.type === 'PHONE' && !PHONE_RE.test(String(value).trim())) return s.errPhone;
    if (q.type === 'MONTH_YEAR' && !/^\d{4}-\d{2}$/.test(String(value))) return s.errInvalid;
    return '';
  }

  function identityErrors(): Record<string, string> {
    if (!survey.identified) return {};
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = s.errName;
    if (!EMAIL_RE.test(email.trim())) found.email = s.errEmail;
    return found;
  }

  const serverMessage = (code: string) =>
    code === 'required' ? s.errRequired : code === 'invalid_email' ? s.errEmail : code === 'invalid_phone' ? s.errPhone : s.errInvalid;

  function begin() {
    const found = identityErrors();
    setErrors(found);
    if (Object.keys(found).length === 0) { setStarted(true); setIndex(0); }
  }

  function next() {
    if (!current) return;
    const error = questionError(current);
    if (error) { setErrors((prev) => ({ ...prev, [current.id]: error })); return; }
    if (isLast) submit(); else setIndex((i) => i + 1);
  }

  async function submit() {
    const found: Record<string, string> = { ...identityErrors() };
    for (const q of visible) {
      const error = questionError(q);
      if (error) found[q.id] = error;
    }
    if (consentText && !consent) found.consent = s.errConsent;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) {
      const firstBad = visible.findIndex((q) => found[q.id]);
      if (onePerPage && firstBad >= 0) setIndex(firstBad);
      if (!onePerPage) setFormError(s.fixErrors);
      return;
    }
    if (preview) { setDone(true); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        answers: kept, locale, consent, website,
        name: survey.identified ? name.trim() : undefined,
        email: survey.identified ? email.trim() : undefined,
      });
      setDone(true);
    } catch (err: any) {
      const serverErrors: Record<string, string> = {};
      for (const [id, code] of Object.entries((err?.errors ?? {}) as Record<string, string>)) serverErrors[id] = serverMessage(code);
      if (err?.field) serverErrors[err.field] = err.message;
      setErrors(serverErrors);
      setFormError(err?.message ?? s.fixErrors);
      const firstBad = visible.findIndex((q) => serverErrors[q.id]);
      if (onePerPage && firstBad >= 0) setIndex(firstBad);
      if (onePerPage && (serverErrors.name || serverErrors.email)) setStarted(false);
    } finally {
      setSubmitting(false);
    }
  }

  const honeypot = (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
    </div>
  );

  const errorLine = (id: string) => errors[id] ? (
    <p id={`${id}-error`} role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-600">
      <Warning className="h-4 w-4 shrink-0" /> {errors[id]}
    </p>
  ) : null;

  const identityFields = survey.identified ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="survey-name" className="mb-1.5 block text-sm font-semibold text-foreground">{s.name}</label>
        <input id="survey-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
          aria-invalid={!!errors.name} className={inputClass} />
        {errorLine('name')}
      </div>
      <div>
        <label htmlFor="survey-email" className="mb-1.5 block text-sm font-semibold text-foreground">{s.email}</label>
        <input id="survey-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
          aria-invalid={!!errors.email} className={inputClass} />
        {errorLine('email')}
      </div>
    </div>
  ) : null;

  const consentField = consentText ? (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: '' })); }}
          className="mt-1 h-4 w-4 shrink-0 accent-[#0F4C81]" />
        <span className="text-sm leading-relaxed text-muted-foreground">{consentText}</span>
      </label>
      {errorLine('consent')}
    </div>
  ) : null;

  const questionBlock = (q: SurveyFormQuestion, number: number, onEnter?: () => void) => {
    const help = text(q.helpText, q.helpTextFr);
    return (
      <div key={q.id}>
        <p id={`${q.id}-label`} className={cn('font-semibold text-foreground', onePerPage ? 'text-xl leading-snug sm:text-2xl' : 'text-base')}>
          {!onePerPage && <span className="mr-1.5 text-muted-foreground">{number}.</span>}
          {text(q.label, q.labelFr)}
          {q.required && <span className="ml-1 text-rose-500" aria-hidden>*</span>}
        </p>
        {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
        <div className="mt-4">
          <QuestionField question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} locale={locale}
            onEnter={onEnter} invalid={!!errors[q.id]} />
        </div>
        {errorLine(q.id)}
      </div>
    );
  };

  const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60';
  const previewNote = preview ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{s.preview}</p> : null;

  if (done) {
    const ctaLabel = text(survey.ctaLabel, survey.ctaLabelFr);
    return (
      <div className={cn('py-10 text-center', className)}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{text(survey.thankYouTitle, survey.thankYouTitleFr) || s.thanksTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
          {text(survey.thankYouMessage, survey.thankYouMessageFr) || s.thanksMessage}
        </p>
        {ctaLabel && survey.ctaUrl && (
          <a href={preview ? undefined : survey.ctaUrl} className={cn(primaryButton, 'mt-7')}>
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  const heading = (
    <div>
      <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{text(survey.title, survey.titleFr)}</h1>
      {text(survey.description, survey.descriptionFr) && (
        <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{text(survey.description, survey.descriptionFr)}</p>
      )}
    </div>
  );

  if (!onePerPage) {
    return (
      <form className={cn('relative space-y-8', className)} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {previewNote}
        {heading}
        {identityFields}
        <div className="space-y-8">{visible.map((q, i) => questionBlock(q, i + 1))}</div>
        {consentField}
        {formError && <p role="alert" className="text-sm font-medium text-rose-600">{formError}</p>}
        {honeypot}
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? <><CircleNotch className="h-4 w-4 animate-spin" /> {s.sending}</> : s.submit}
        </button>
      </form>
    );
  }

  if (!started) {
    return (
      <div className={cn('relative space-y-7', className)}>
        {previewNote}
        {heading}
        {identityFields}
        {formError && <p role="alert" className="text-sm font-medium text-rose-600">{formError}</p>}
        <button type="button" onClick={begin} className={primaryButton}>
          {s.start} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const progress = visible.length ? Math.round(((index + (isLast ? 1 : 0)) / visible.length) * 100) : 0;
  return (
    <div className={cn('relative', className)}>
      {previewNote}
      <div className="mb-8 mt-1">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{s.progress(Math.min(index + 1, visible.length), visible.length)}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {current && questionBlock(current, index + 1, next)}
      {isLast && <div className="mt-8">{consentField}</div>}
      {formError && <p role="alert" className="mt-4 text-sm font-medium text-rose-600">{formError}</p>}
      {honeypot}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => (index === 0 ? setStarted(false) : setIndex((i) => i - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40">
          <ArrowLeft className="h-4 w-4" /> {s.back}
        </button>
        <button type="button" onClick={next} disabled={submitting} className={primaryButton}>
          {submitting ? <><CircleNotch className="h-4 w-4 animate-spin" /> {s.sending}</>
            : isLast ? s.submit : <>{s.next} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  );
}
