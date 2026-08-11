'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@mjn/ui';
import {
  User, Lock, Bell, GearSix, CircleNotch, CheckCircle,
  XCircle, WarningCircle, X, CaretDown,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'account' | 'staff' | 'notifications' | 'system';

const ROLES = ['ADMIN', 'CONSULTANT', 'COMPLIANCE'] as const;
type StaffRole = typeof ROLES[number];

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-rose-100 text-rose-700',
  CONSULTANT: 'bg-violet-100 text-violet-700',
  COMPLIANCE: 'bg-amber-100 text-amber-700',
};

const NOTIFICATION_EVENTS = [
  { key: 'notify_payment_completed', label: 'Payment received', desc: 'Client completes a payment' },
  { key: 'notify_document_uploaded', label: 'Document uploaded', desc: 'Client uploads a new document' },
  { key: 'notify_document_expiring', label: 'Document expiring', desc: 'A document is expiring within 30 days' },
  { key: 'notify_engagement_signed', label: 'Engagement letter signed', desc: 'Client signs their engagement letter' },
  { key: 'notify_installment_overdue', label: 'Installment overdue', desc: 'Payment installment is past due' },
  { key: 'notify_booking_created', label: 'Session booked', desc: 'A consultation session is booked' },
];

const DEFAULT_SYSTEM_CONFIG: Record<string, string> = {
  engagement_fee_usd: '50',
  dunning_day_reminder: '7',
  dunning_day_warning: '14',
  dunning_day_hold: '21',
  company_name: 'MJN Health Academy and Professional Services Ltd',
  portal_url: 'https://portal.mjnhealthcare.com',
  support_email: 'support@mjnhealthcare.com',
};

// ─── Tab: Account ─────────────────────────────────────────────────────────────

function AccountTab({ me }: { me: any }) {
  const [name, setName] = useState(me?.name ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateMe({ name, email });
      toast.success('Profile updated.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('New passwords do not match.'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await api.changePassword(currentPw, newPw);
      toast.success('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Profile</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="pt-2 flex items-center gap-2">
            <div className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 text-xs font-semibold text-muted-foreground">
              Role: {me?.role ?? '—'}
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingProfile ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Save profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Change Password</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Confirm new password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingPw ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tab: Staff & Roles ───────────────────────────────────────────────────────

function StaffTab() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // edit credentials modal
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setStaff(await api.getStaff()); }
    catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  function openEdit(person: any) {
    setEditTarget(person);
    setEditName(person.name ?? '');
    setEditEmail(person.email ?? '');
    setEditPassword('');
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const data: { name?: string; email?: string; password?: string } = {};
    if (editName.trim() && editName.trim() !== editTarget.name) data.name = editName.trim();
    if (editEmail.trim() && editEmail.trim() !== editTarget.email) data.email = editEmail.trim();
    if (editPassword) data.password = editPassword;
    if (Object.keys(data).length === 0) { toast.info('No changes to save.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateStaffCredentials(editTarget.id, data);
      setStaff((s) => s.map((p) => p.id === editTarget.id ? { ...p, ...updated } : p));
      toast.success('Staff credentials updated.');
      setEditTarget(null);
    } catch (err: any) { toast.error(err.message ?? 'Failed to update.'); }
    finally { setSaving(false); }
  }

  async function handleRoleChange(id: string, role: string) {
    setActionId(id + '_role');
    try {
      await api.updateStaffRole(id, role);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, role } : p));
      toast.success('Role updated.');
    } catch (err: any) { toast.error(err.message); }
    finally { setActionId(null); }
  }

  async function handleToggleActive(id: string, current: boolean) {
    setActionId(id + '_active');
    try {
      await api.setStaffActive(id, !current);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, isActive: !current } : p));
      toast.success(!current ? 'Staff member reactivated.' : 'Staff member deactivated.');
    } catch (err: any) { toast.error(err.message); }
    finally { setActionId(null); }
  }

  if (loading) return (
    <div className="flex justify-center py-12"><CircleNotch className="h-7 w-7 animate-spin text-primary" /></div>
  );

  return (
    <>
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Staff Members <span className="ml-1 text-sm font-normal text-muted-foreground">({staff.length})</span></h3>
          <a href="/staff" className="text-xs font-semibold text-primary hover:underline">+ Add staff</a>
        </div>
        {staff.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No staff members found.</div>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((person) => (
              <div key={person.id} className={`flex flex-wrap items-center gap-4 px-6 py-4 transition-colors ${person.isActive === false ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/20'}`}>
                {/* Avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {person.name?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{person.email}</p>
                  </div>
                </div>

                {/* Role selector */}
                <div className="relative shrink-0">
                  {actionId === person.id + '_role' ? (
                    <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <select
                        value={person.role}
                        onChange={(e) => handleRoleChange(person.id, e.target.value)}
                        className={`h-8 appearance-none rounded-full pl-2.5 pr-6 text-xs font-bold outline-none cursor-pointer ${ROLE_STYLES[person.role] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                    </>
                  )}
                </div>

                {/* Edit credentials */}
                <button
                  onClick={() => openEdit(person)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Lock className="h-3 w-3" /> Edit
                </button>

                {/* Active/deactivate toggle */}
                <button
                  onClick={() => handleToggleActive(person.id, person.isActive !== false)}
                  disabled={!!actionId}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                    person.isActive === false
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {actionId === person.id + '_active'
                    ? <CircleNotch className="h-3 w-3 animate-spin" />
                    : person.isActive === false
                      ? <><CheckCircle className="h-3 w-3" /> Reactivate</>
                      : <><XCircle className="h-3 w-3" /> Deactivate</>}
                </button>

                {/* Joined date */}
                <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
                  Joined {person.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit credentials modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setEditTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-semibold text-foreground">Edit Staff Credentials</p>
                <p className="text-xs text-muted-foreground mt-0.5">{editTarget.name} · {editTarget.role}</p>
              </div>
              <button onClick={() => setEditTarget(null)} disabled={saving} className="rounded-lg p-1 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Email address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="email@mjnhealthcare.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  New password <span className="font-normal text-muted-foreground">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={8}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} disabled={saving}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? <><CircleNotch className="h-4 w-4 animate-spin" /> Saving…</> : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotificationsTab({ config, onSave }: { config: Record<string, string>; onSave: (c: Record<string, string>) => Promise<void> }) {
  const [local, setLocal] = useState<Record<string, string>>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocal(config); }, [config]);

  function toggle(key: string, channel: 'email' | 'whatsapp') {
    const full = `${key}_${channel}`;
    setLocal((c) => ({ ...c, [full]: c[full] === 'true' ? 'false' : 'true' }));
  }

  async function save() {
    setSaving(true);
    try { await onSave(local); toast.success('Notification preferences saved.'); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Event Notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Control which events trigger email and WhatsApp notifications to staff.</p>
        </div>
        <div className="divide-y divide-border">
          {/* Header row */}
          <div className="flex items-center gap-4 px-6 py-3 bg-muted/30">
            <div className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</div>
            <div className="w-20 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</div>
            <div className="w-20 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</div>
          </div>
          {NOTIFICATION_EVENTS.map((ev) => (
            <div key={ev.key} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{ev.label}</p>
                <p className="text-xs text-muted-foreground">{ev.desc}</p>
              </div>
              {(['email', 'whatsapp'] as const).map((ch) => {
                const key = `${ev.key}_${ch}`;
                const on = local[key] !== 'false';
                return (
                  <div key={ch} className="w-20 flex justify-center">
                    <button
                      onClick={() => toggle(ev.key, ch)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: System ──────────────────────────────────────────────────────────────

function SystemTab({ config, onSave }: { config: Record<string, string>; onSave: (c: Record<string, string>) => Promise<void> }) {
  const [local, setLocal] = useState<Record<string, string>>({ ...DEFAULT_SYSTEM_CONFIG, ...config });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocal({ ...DEFAULT_SYSTEM_CONFIG, ...config }); }, [config]);

  function set(key: string, value: string) {
    setLocal((c) => ({ ...c, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(local); toast.success('System settings saved.'); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={save} className="space-y-6">
        {/* Fees */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Fees</h3>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Engagement fee (USD)</label>
            <input
              type="number"
              min={0}
              value={local.engagement_fee_usd ?? '50'}
              onChange={(e) => set('engagement_fee_usd', e.target.value)}
              className="h-10 w-40 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">Mandatory non-refundable fee added to every order.</p>
          </div>
        </div>

        {/* Dunning */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Installment Dunning</h3>
          <p className="text-xs text-muted-foreground">Days after an installment is due before each action triggers.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { key: 'dunning_day_reminder', label: 'Reminder', color: 'amber' },
              { key: 'dunning_day_warning', label: 'Warning', color: 'orange' },
              { key: 'dunning_day_hold', label: 'Hold case', color: 'rose' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={local[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                    className="h-10 w-20 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Company</h3>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Company name</label>
            <input
              value={local.company_name ?? ''}
              onChange={(e) => set('company_name', e.target.value)}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Support email</label>
            <input
              type="email"
              value={local.support_email ?? ''}
              onChange={(e) => set('support_email', e.target.value)}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Client portal URL</label>
            <input
              value={local.portal_url ?? ''}
              onChange={(e) => set('portal_url', e.target.value)}
              className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <GearSix className="h-4 w-4" />}
          Save settings
        </button>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { me } = useAdmin();
  const [tab, setTab] = useState<Tab>('account');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(true);

  const isAdmin = (me?.role as string)?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) { setConfigLoading(false); return; }
    api.getSystemConfig()
      .then(setConfig)
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, [isAdmin]);

  async function saveConfig(data: Record<string, string>) {
    const updated = await api.updateSystemConfig(data);
    setConfig(updated);
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'account', label: 'My Account', icon: User },
    { id: 'staff', label: 'Staff & Roles', icon: User, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
    { id: 'system', label: 'System', icon: GearSix, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, staff, and system configuration." />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'account' && <AccountTab me={me} />}
      {tab === 'staff' && isAdmin && <StaffTab />}
      {tab === 'notifications' && isAdmin && !configLoading && (
        <NotificationsTab config={config} onSave={saveConfig} />
      )}
      {tab === 'system' && isAdmin && !configLoading && (
        <SystemTab config={config} onSave={saveConfig} />
      )}
    </div>
  );
}
