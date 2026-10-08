'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Skeleton, ConfirmDialog, Switch, SurveyForm, surveyHasFrench,
  ArrowLeft, CircleNotch, CheckCircle, Play, Stop, LinkSimple, ArrowSquareOut, Warning, Copy, MegaphoneSimple,
  type SurveyLocale,
} from '@mjn/ui';
import { api } from '../../../../lib/api';
import { Question, STATUS_LABELS, STATUS_STYLES, publicUrl } from '../shared';
import { QuestionBuilder } from './builder';
import { SurveySettings } from './settings';
import { SurveyResults } from './results';

type TabKey = 'questions' | 'settings' | 'share' | 'results';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'questions', label: 'Questions' },
  { key: 'settings', label: 'Settings' },
  { key: 'share', label: 'Share' },
  { key: 'results', label: 'Results' },
];

function SurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();

  const [survey, setSurvey] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savedQuestions, setSavedQuestions] = useState('[]');
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<TabKey>((params.get('tab') as TabKey) || 'questions');
  const [french, setFrench] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<SurveyLocale>('en');
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const applySurvey = useCallback((data: any) => {
    setSurvey(data);
    setQuestions(data.questions ?? []);
    setSavedQuestions(JSON.stringify(data.questions ?? []));
  }, []);

  useEffect(() => {
    api.getSurvey(id)
      .then((data) => {
        applySurvey(data);
        setFrench(surveyHasFrench(data));
      })
      .catch((err: any) => setLoadError(err.message ?? 'Could not load this survey.'));
  }, [id, applySurvey]);

  const questionsDirty = JSON.stringify(questions) !== savedQuestions;
  const dirty = questionsDirty || settingsDirty;

  // Warn before the browser discards unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const removedWithAnswers = useMemo(() => {
    if (!survey?.responseCount) return 0;
    const keep = new Set(questions.map((q) => q.id));
    return (JSON.parse(savedQuestions) as Question[]).filter((q) => !keep.has(q.id)).length;
  }, [questions, savedQuestions, survey?.responseCount]);

  async function saveQuestions() {
    const unnamed = questions.findIndex((q) => !q.label.trim());
    if (unnamed >= 0) { toast.error(`Question ${unnamed + 1} needs its question text.`); return; }
    setSaving(true);
    try {
      const updated = await api.saveSurveyQuestions(id, questions);
      applySurvey(updated);
      setPreviewKey((k) => k + 1);
      toast.success('Questions saved.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: string, success: string) {
    if (questionsDirty) { toast.error('Save your questions first.'); return; }
    setStatusBusy(true);
    try {
      const updated = await api.updateSurvey(id, { status });
      setSurvey((s: any) => ({ ...s, status: updated.status }));
      toast.success(success);
      if (status === 'LIVE') setTab('share');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStatusBusy(false);
    }
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${what} copied.`))
      .catch(() => toast.error('Could not copy.'));
  }

  function changeTab(next: TabKey) {
    if (tab === 'settings' && settingsDirty && next !== 'settings') {
      toast.error('Save your settings before leaving this tab.');
      return;
    }
    setTab(next);
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
        <p className="font-semibold text-foreground">Survey not available</p>
        <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        <Link href="/surveys" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Back to surveys</Link>
      </div>
    );
  }
  if (!survey) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-10 w-96 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const link = publicUrl(survey.slug);
  const isPublic = survey.status !== 'DRAFT';
  const previewSurvey = { ...survey, questions };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => router.push('/surveys')}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All surveys
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{survey.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[survey.status]}`}>{STATUS_LABELS[survey.status]}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {survey.responseCount.toLocaleString()} response{survey.responseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isPublic && (
            <a href={link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40">
              <ArrowSquareOut className="h-4 w-4 text-primary" /> Open public page
            </a>
          )}
          {survey.status === 'LIVE' ? (
            <button onClick={() => setConfirmClose(true)} disabled={statusBusy}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:opacity-50">
              {statusBusy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Stop className="h-4 w-4" />} Close survey
            </button>
          ) : (
            <button onClick={() => setStatus('LIVE', survey.status === 'DRAFT' ? 'Survey published. It is now live.' : 'Survey reopened.')} disabled={statusBusy}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
              {statusBusy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {survey.status === 'DRAFT' ? 'Publish' : 'Reopen'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-white p-1 shadow-sm" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => changeTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}>
              {t.label}
              {t.key === 'results' && survey.responseCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${tab === t.key ? 'bg-white/25' : 'bg-muted text-muted-foreground'}`}>
                  {survey.responseCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {(tab === 'questions' || tab === 'settings') && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
            <Switch checked={french} onCheckedChange={setFrench} /> French translation
          </label>
        )}
      </div>

      {tab === 'questions' && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-4">
            {survey.status === 'LIVE' && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Warning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>This survey is live. Changes you save appear to people straight away.</span>
              </div>
            )}
            <QuestionBuilder questions={questions} onChange={setQuestions} french={french} />
            <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-border bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
              <p className="text-xs text-muted-foreground">{questionsDirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
              <button type="button" disabled={saving || !questionsDirty}
                onClick={() => (removedWithAnswers > 0 ? setConfirmSave(true) : saveQuestions())}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save questions
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-white shadow-sm xl:sticky xl:top-4">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <p className="text-sm font-semibold text-foreground">Preview</p>
              <div className="flex items-center gap-2">
                {french && (
                  <div className="flex rounded-lg border border-border p-0.5 text-xs font-semibold" role="group" aria-label="Preview language">
                    {(['en', 'fr'] as SurveyLocale[]).map((l) => (
                      <button key={l} type="button" onClick={() => setPreviewLocale(l)} aria-pressed={previewLocale === l}
                        className={`rounded-md px-2 py-0.5 transition-colors ${previewLocale === l ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setPreviewKey((k) => k + 1)} className="text-xs font-semibold text-primary hover:underline">Restart</button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {questions.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Add a question to see the preview.</p>
              ) : (
                <SurveyForm key={previewKey} survey={previewSurvey} locale={french ? previewLocale : 'en'} preview onSubmit={async () => {}} />
              )}
            </div>
          </aside>
        </div>
      )}

      {tab === 'settings' && (
        <div className="max-w-4xl">
          <SurveySettings survey={survey} french={french} onDirtyChange={setSettingsDirty}
            onSaved={(updated) => setSurvey((s: any) => ({ ...s, ...updated, questions: s.questions }))} />
        </div>
      )}

      {tab === 'share' && (
        <div className="max-w-3xl space-y-4">
          {!isPublic && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This survey is a draft. The link below will not work until you publish it.</span>
            </div>
          )}
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Public link</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Anyone with this link can answer. No login is needed.</p>
            {[{ label: 'English', url: link }, ...(surveyHasFrench(survey) ? [{ label: 'French', url: publicUrl(survey.slug, 'fr') }] : [])].map((row) => (
              <div key={row.label} className="mt-3 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <LinkSimple className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{row.url}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{row.label}</span>
                </div>
                <button onClick={() => copy(row.url, 'Link')}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Email it to your audience</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create a campaign to your leads, clients or an imported list, and paste the link into the email.
            </p>
            <Link href="/campaigns"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40">
              <MegaphoneSimple className="h-4 w-4 text-primary" /> Go to Campaigns
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Client portal</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {survey.showInPortal
                ? 'Clients see an invitation on their dashboard while this survey is live, until they answer it.'
                : 'Not shown to clients in the portal. Turn on "Invite clients in the portal" in Settings to show it.'}
            </p>
          </section>
        </div>
      )}

      {tab === 'results' && (
        <SurveyResults surveyId={id} surveyTitle={survey.title} identified={survey.identified} viewCount={survey.viewCount ?? 0}
          questions={JSON.parse(savedQuestions) as Question[]} />
      )}

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Remove questions that have answers?"
        description={`You removed ${removedWithAnswers} question${removedWithAnswers !== 1 ? 's' : ''}. The answers already collected for ${removedWithAnswers !== 1 ? 'them' : 'it'} will be permanently deleted. Export the results first if you need them.`}
        confirmLabel="Save and delete those answers"
        cancelLabel="Go back"
        variant="destructive"
        onConfirm={saveQuestions}
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close this survey?"
        description="People who open the link will see that the survey has closed. Responses already collected are kept, and you can reopen it later."
        confirmLabel="Close survey"
        cancelLabel="Keep it open"
        onConfirm={() => setStatus('CLOSED', 'Survey closed.')}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
      <SurveyEditor />
    </Suspense>
  );
}
