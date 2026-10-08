'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  SurveyForm, SurveySubmitError, surveyHasFrench,
  type SurveyFormData, type SurveyLocale, type SurveySubmission,
} from '@mjn/ui';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

type PublicSurvey = SurveyFormData & {
  slug: string;
  available: boolean;
  unavailable?: 'not_open' | 'closed' | 'full';
};

const COPY = {
  en: {
    notFoundTitle: 'Survey not found',
    notFoundBody: 'This link may be incorrect, or the survey is no longer available.',
    not_open: 'This survey has not opened yet. Please check back soon.',
    closed: 'This survey is now closed. Thank you for your interest.',
    full: 'This survey has reached its response limit. Thank you for your interest.',
    home: 'Go to mjnhealthcare.com',
    error: 'We could not load this survey. Please check your connection and try again.',
    retry: 'Try again',
  },
  fr: {
    notFoundTitle: 'Enquête introuvable',
    notFoundBody: 'Ce lien est peut-être incorrect, ou l’enquête n’est plus disponible.',
    not_open: 'Cette enquête n’est pas encore ouverte. Revenez bientôt.',
    closed: 'Cette enquête est maintenant terminée. Merci de votre intérêt.',
    full: 'Cette enquête a atteint son nombre maximal de réponses. Merci de votre intérêt.',
    home: 'Aller sur mjnhealthcare.com',
    error: 'Impossible de charger cette enquête. Vérifiez votre connexion et réessayez.',
    retry: 'Réessayer',
  },
};

function SurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const [survey, setSurvey] = React.useState<PublicSurvey | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [locale, setLocale] = React.useState<SurveyLocale>('en');

  const load = React.useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`${API}/public/surveys/${encodeURIComponent(slug)}`);
      if (res.status === 404) { setState('missing'); return; }
      if (!res.ok) throw new Error();
      const data: PublicSurvey = await res.json();
      setSurvey(data);
      const hasFrench = !!data.titleFr || (data.questions ? surveyHasFrench(data) : false);
      const wanted = params.get('lang') ?? (typeof navigator !== 'undefined' ? navigator.language : 'en');
      setLocale(hasFrench && wanted.toLowerCase().startsWith('fr') ? 'fr' : 'en');
      setState('ready');
    } catch {
      setState('error');
    }
  }, [slug, params]);

  React.useEffect(() => { load(); }, [load]);

  async function submit(submission: SurveySubmission) {
    let res: Response;
    try {
      res = await fetch(`${API}/public/surveys/${encodeURIComponent(slug)}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch {
      throw new SurveySubmitError(COPY[locale].error);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = Array.isArray(body.message) ? body.message[0] : body.message;
      throw new SurveySubmitError(message ?? COPY[locale].error, body.errors, body.field);
    }
  }

  const copy = COPY[locale];
  const showLanguageSwitch = !!survey && (!!survey.titleFr || (survey.questions ? surveyHasFrench(survey) : false));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="MJN Healthcare">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mjnlogo.png" alt="" className="h-8 w-auto" />
            <span className="text-base font-extrabold tracking-tight text-primary">MJN <span className="text-secondary">Healthcare</span></span>
          </Link>
          {showLanguageSwitch && (
            <div className="flex rounded-lg border border-border p-0.5 text-xs font-semibold" role="group" aria-label="Language">
              {(['en', 'fr'] as SurveyLocale[]).map((l) => (
                <button key={l} type="button" onClick={() => setLocale(l)} aria-pressed={locale === l}
                  className={`rounded-md px-2.5 py-1 transition-colors ${locale === l ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                  {l === 'en' ? 'English' : 'Français'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10">
          {state === 'loading' && (
            <div className="animate-pulse space-y-4" aria-busy="true">
              <div className="h-8 w-2/3 rounded-lg bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="mt-6 h-12 w-32 rounded-xl bg-slate-200" />
            </div>
          )}

          {state === 'missing' && (
            <div className="py-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">{copy.notFoundTitle}</h1>
              <p className="mt-2 text-muted-foreground">{copy.notFoundBody}</p>
              <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">{copy.home}</Link>
            </div>
          )}

          {state === 'error' && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{copy.error}</p>
              <button type="button" onClick={load}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
                {copy.retry}
              </button>
            </div>
          )}

          {state === 'ready' && survey && !survey.available && (
            <div className="py-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">{locale === 'fr' && survey.titleFr ? survey.titleFr : survey.title}</h1>
              <p className="mt-3 text-muted-foreground">{copy[survey.unavailable ?? 'closed']}</p>
              <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">{copy.home}</Link>
            </div>
          )}

          {state === 'ready' && survey?.available && (
            <SurveyForm
              survey={survey}
              locale={locale}
              onSubmit={submit}
              storageKey={`mjn-survey-${survey.slug}`}
              initial={{ name: params.get('name') ?? undefined, email: params.get('email') ?? undefined }}
            />
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          MJN Health Academy and Professional Services ·{' '}
          <Link href="/privacy" className="hover:underline">{locale === 'fr' ? 'Confidentialité' : 'Privacy'}</Link>
        </p>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SurveyPage />
    </React.Suspense>
  );
}
