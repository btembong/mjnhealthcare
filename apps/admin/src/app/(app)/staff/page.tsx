'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Button } from '@mjn/ui';
import {
  CircleNotch, User, Plus, X, WarningCircle, CaretDown,
  CheckCircle, XCircle,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const ROLES = ['ADMIN', 'CONSULTANT', 'COMPLIANCE'] as const;

const ROLE_STYLES: Record<string, string> = {
  CONSULTANT: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-rose-100 text-rose-700',
  COMPLIANCE: 'bg-amber-100 text-amber-700',
};

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CONSULTANT' | 'ADMIN' | 'COMPLIANCE'>('CONSULTANT');

  const [loadError, setLoadError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      // Use getPersons (no role guard) and filter staff roles client-side
      const all = await api.getPersons();
      setStaff(all.filter((p: any) => ['ADMIN', 'CONSULTANT', 'COMPLIANCE'].includes(p.role?.toUpperCase())));
    } catch (err: any) {
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.registerStaff({ name, email, password, role });
      setStaff((prev) => [...prev, created]);
      setShowModal(false);
      setName(''); setEmail(''); setPassword(''); setRole('CONSULTANT');
      toast.success('Staff member created.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    setActionId(id + '_role');
    try {
      await api.updateStaffRole(id, newRole);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, role: newRole } : p));
      toast.success('Role updated.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    setActionId(id + '_active');
    try {
      await api.setStaffActive(id, !current);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, isActive: !current } : p));
      toast.success(!current ? 'Staff member reactivated.' : 'Staff member deactivated.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Staff" subtitle={`${staff.length} member${staff.length !== 1 ? 's' : ''}`} />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <strong>Error loading staff:</strong> {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <CircleNotch className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">No staff yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first consultant or admin above.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {staff.map((person: any) => {
                const isActive = person.isActive !== false;
                return (
                  <div
                    key={person.id}
                    className={`flex flex-wrap items-center gap-4 px-6 py-4 transition-colors ${!isActive ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/20'}`}
                  >
                    {/* Avatar + name/email */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {person.name?.slice(0, 2).toUpperCase() ?? '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{person.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.email ?? '—'}</p>
                      </div>
                    </div>

                    {/* Joined date */}
                    <span className="hidden sm:block shrink-0 text-xs text-muted-foreground">
                      Joined {person.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </span>

                    {/* Role selector */}
                    <div className="relative shrink-0">
                      {actionId === person.id + '_role' ? (
                        <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <>
                          <select
                            value={person.role}
                            onChange={(e) => handleRoleChange(person.id, e.target.value)}
                            disabled={!!actionId}
                            className={`h-8 appearance-none rounded-full pl-2.5 pr-6 text-xs font-bold outline-none cursor-pointer disabled:opacity-40 ${ROLE_STYLES[person.role] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                        </>
                      )}
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(person.id, isActive)}
                      disabled={!!actionId}
                      className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                        isActive
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {actionId === person.id + '_active'
                        ? <CircleNotch className="h-3 w-3 animate-spin" />
                        : isActive
                          ? <><XCircle className="h-3 w-3" /> Deactivate</>
                          : <><CheckCircle className="h-3 w-3" /> Reactivate</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Staff Member</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Full name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="CONSULTANT">Consultant</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
                  <WarningCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Creating…' : 'Create staff member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setError(''); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
