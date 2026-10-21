'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleNotch, Play } from '@mjn/ui';
import { API, type Lang } from '../../../../components/webinar-kit';
import { SurveyCard } from '../../join/[token]/engage';
import { Brand, Screen } from '../../join/[token]/webinar-room';

type Info = { name: string; open: boolean; webinar: { title: string; language: Lang; slug: string } };

/** The survey on its own page, for the link in the replay emails. */
export function FeedbackClient({ token }: { token: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    fetch(`${API}/webinars/attend/${token}/survey`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setInfo).catch(() => setBad(true));
  }, [token]);

  if (bad) {
    return (
      <Screen>
        <div className="rise relative z-10 mx-5 max-w-sm text-center">
          <div className="mx-auto mb-6 w-fit"><Brand /></div>
          <h1 className="text-2xl font-extrabold text-white">This link is not valid</h1>
          <p className="mt-3 text-sm text-white/60">Check the email you received after the webinar.</p>
          <Link href="/resources/webinars" className="mt-8 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0B1220]">See our webinars</Link>
        </div>
      </Screen>
    );
  }
  if (!info) return <Screen><CircleNotch className="relative z-10 h-8 w-8 animate-spin text-white/60" /></Screen>;

  const fr = info.webinar.language === 'fr';
  return (
    <Screen>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 py-12">
        <div className="rise flex justify-center"><Brand /></div>
        <p className="rise mt-10 text-center text-sm font-semibold text-secondary" style={{ animationDelay: '60ms' }}>{fr ? `Merci, ${info.name}` : `Thank you, ${info.name}`}</p>
        <h1 className="rise mt-2 text-center text-2xl font-extrabold tracking-tight text-white" style={{ animationDelay: '100ms' }}>{info.webinar.title}</h1>
        <div className="mt-8">
          {info.open
            ? <SurveyCard token={token} lang={info.webinar.language} />
            : <p className="text-center text-sm text-white/60">{fr ? 'Le questionnaire ouvre une fois le webinaire commencé.' : 'The survey opens once the webinar has started.'}</p>}
        </div>
        <div className="mt-6 text-center">
          <Link href={`/webinars/${info.webinar.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-white/70 transition-colors hover:text-white">
            <Play className="h-4 w-4" weight="fill" /> {fr ? 'Revoir le webinaire' : 'Watch the webinar again'}
          </Link>
        </div>
      </div>
    </Screen>
  );
}
