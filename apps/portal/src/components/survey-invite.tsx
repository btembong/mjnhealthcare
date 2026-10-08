'use client';

import { useEffect, useState } from 'react';
import { ClipboardText, ArrowRight } from '@mjn/ui';
import { api } from '../lib/api';

const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? 'https://mjnhealthcare.com').replace(/\/$/, '');

type Invite = { slug: string; title: string; titleFr?: string | null; description?: string | null; descriptionFr?: string | null };

/** Surveys the client is invited to and has not answered yet. Renders nothing when there are none. */
export function SurveyInvite({ me }: { me: { name?: string | null; email?: string | null; locale?: string | null } | null }) {
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    api.getActiveSurveys().then(setInvites).catch(() => {});
  }, []);

  if (invites.length === 0) return null;
  const french = me?.locale === 'fr';

  return (
    <div className="space-y-3">
      {invites.map((s) => {
        const query = new URLSearchParams();
        if (me?.name) query.set('name', me.name);
        if (me?.email) query.set('email', me.email);
        if (french) query.set('lang', 'fr');
        const description = (french && s.descriptionFr) || s.description;
        return (
          <a key={s.slug} href={`${WEB_URL}/survey/${s.slug}?${query}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardText className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">{french ? 'Votre avis compte' : 'We would value your feedback'}</p>
              <p className="truncate text-sm font-semibold text-foreground">{(french && s.titleFr) || s.title}</p>
              {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              {french ? 'Répondre' : 'Take the survey'} <ArrowRight className="h-4 w-4" />
            </span>
          </a>
        );
      })}
    </div>
  );
}
