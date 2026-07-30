'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Button, Skeleton } from '@mjn/ui';
import {
  WarningCircle, CircleNotch, FloppyDisk,
  User, Envelope, Phone, Globe, Bell, EnvelopeSimple, DeviceMobile,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

const PROFESSIONS = [
  'Nurse', 'Physician', 'Dentist', 'Pharmacist', 'Allied Health', 'Student', 'Other',
];

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const NOTIFICATION_CHANNELS = [
  {
    icon: EnvelopeSimple,
    label: 'Email notifications',
    sub: 'Case updates, payment receipts, document status',
    key: 'email',
  },
  {
    icon: DeviceMobile,
    label: 'SMS notifications',
    sub: 'OTP codes and urgent case alerts',
    key: 'sms',
  },
  {
    icon: Bell,
    label: 'WhatsApp notifications',
    sub: 'Reminders, booking confirmations, consultant messages',
    key: 'whatsapp',
  },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export default function SettingsPage() {
  const { me, loading, refresh } = useUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(me?.name ?? '');
  const [profession, setProfession] = useState(me?.profession ?? '');
  const [locale, setLocale] = useState(me?.locale ?? 'en');

  // Sync form when me loads
  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setProfession(me.profession ?? '');
      setLocale(me.locale ?? 'en');
    }
  }, [me]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.updateMe({ name, profession, locale });
      await refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your profile and preferences." />

      {/* Avatar block */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shrink-0">
          {me?.name?.slice(0, 2).toUpperCase() ?? '??'}
        </div>
        <div>
          <p className="font-semibold text-foreground">{me?.name}</p>
          <p className="text-sm text-muted-foreground">{me?.email ?? me?.phone}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-5 font-semibold text-foreground">Profile Information</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {me?.email && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Email</label>
                <div className="relative">
                  <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={me.email}
                    readOnly
                    className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Contact your consultant to change your email.</p>
              </div>
            )}
            {me?.phone && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={me.phone}
                    readOnly
                    className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Profession</label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select profession</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              <Globe className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Preferred language
            </label>
            <div className="flex gap-3">
              {LOCALES.map((l) => (
                <label
                  key={l.value}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-colors ${
                    locale === l.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="locale"
                    value={l.value}
                    checked={locale === l.value}
                    onChange={() => setLocale(l.value)}
                    className="sr-only"
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <WarningCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
              Profile updated successfully.
            </div>
          )}

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <><CircleNotch className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><FloppyDisk className="h-4 w-4" /> Save changes</>
            )}
          </Button>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <div className="space-y-3">
          {NOTIFICATION_CHANNELS.map(({ icon: Icon, label, sub, key }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Preferences saved to your account. Contact your consultant to unsubscribe from all communications.
          </p>
        </div>
      </div>
    </div>
  );
}
