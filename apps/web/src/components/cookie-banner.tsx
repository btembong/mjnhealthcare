'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@mjn/ui';
import { X } from '@phosphor-icons/react';

const STORAGE_KEY = 'mjn_cookie_consent';

type ConsentState = {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [prefs, setPrefs] = React.useState({ functional: true, analytics: false, marketing: false });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (SSR or private mode edge case)
    }
  }, []);

  function save(state: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    setVisible(false);
  }

  function acceptAll() {
    save({ functional: true, analytics: true, marketing: true, timestamp: Date.now() });
  }

  function acceptNecessaryOnly() {
    save({ functional: false, analytics: false, marketing: false, timestamp: Date.now() });
  }

  function saveCustom() {
    save({ ...prefs, timestamp: Date.now() });
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-md">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-semibold text-foreground text-sm">We use cookies</p>
          <button
            onClick={acceptNecessaryOnly}
            aria-label="Close and accept necessary only"
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          We use essential cookies to keep the site working and optional cookies for analytics and personalisation.{' '}
          <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
        </p>

        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {[
              { key: 'functional', label: 'Functional', desc: 'Remember your preferences' },
              { key: 'analytics', label: 'Analytics', desc: 'Anonymous usage statistics' },
              { key: 'marketing', label: 'Marketing', desc: 'Campaign measurement' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key as keyof typeof prefs]}
                  onClick={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof prefs] }))}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[key as keyof typeof prefs] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button size="sm" className="flex-1" onClick={acceptAll}>
            Accept All
          </Button>
          {showDetails ? (
            <Button size="sm" variant="outline" className="flex-1" onClick={saveCustom}>
              Save Preferences
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowDetails(true)}>
              Manage
            </Button>
          )}
          <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={acceptNecessaryOnly}>
            Necessary Only
          </Button>
        </div>
      </div>
    </div>
  );
}
