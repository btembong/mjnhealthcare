'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import {
  User, UsersThree, CheckCircle, Warning, Power, X, CaretDown,
  Plus, PencilSimple, Trash, LockKey,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

// ── tiny reusable field ───────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

export default function OfficersPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  // ── Create officer modal ──────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  // ── Edit officer modal ────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState<{ officer: any } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // ── Assign modal ──────────────────────────────────────────────────────────
  const [showAssign, setShowAssign] = useState(false);
  const [assignEngagementId, setAssignEngagementId] = useState('');
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  // ── Availability modal ────────────────────────────────────────────────────
  const [availModal, setAvailModal] = useState<{ officer: any } | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [availSaving, setAvailSaving] = useState(false);

  const load = () =>
    Promise.all([api.listOfficers(), api.getAllEngagements()])
      .then(([o, e]) => { setOfficers(o ?? []); setEngagements(e ?? []); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSaving(true);
    try {
      await api.createOfficer({ name: createName.trim(), email: createEmail.trim(), password: createPassword });
      toast.success('Officer account created');
      setShowCreate(false);
      setCreateName(''); setCreateEmail(''); setCreatePassword('');
      load();
    } catch {
      toast.error('Failed to create officer');
    } finally {
      setCreateSaving(false);
    }
  }

  function openEdit(officer: any) {
    setEditModal({ officer });
    setEditName(officer.name ?? '');
    setEditEmail(officer.email ?? '');
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    setEditSaving(true);
    try {
      await api.updateOfficer(editModal.officer.id, { name: editName.trim(), email: editEmail.trim() });
      toast.success('Profile updated');
      setEditModal(null);
      load();
    } catch {
      toast.error('Failed to update');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeactivate(officer: any) {
    if (!confirm(`Deactivate ${officer.name}? Their ${officer.officerEngagements?.filter((e: any) => ['ACTIVE','PENDING_SIGNATURE'].includes(e.status)).length ?? 0} active case(s) will be unassigned.`)) return;
    try {
      await api.deactivateOfficer(officer.id);
      toast.success('Officer deactivated');
      load();
    } catch {
      toast.error('Failed to deactivate');
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignEngagementId || !assignOfficerId) return;
    setAssignSaving(true);
    try {
      await api.assignOfficer(assignEngagementId, assignOfficerId, handoverNotes.trim() || undefined);
      toast.success('Officer assigned');
      setShowAssign(false);
      setAssignEngagementId(''); setAssignOfficerId(''); setHandoverNotes('');
      load();
    } catch {
      toast.error('Failed to assign');
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleSetAvailability(officerId: string, isAvailable: boolean, reassignToId?: string | null) {
    setAvailSaving(true);
    try {
      const result = await api.setOfficerAvailability(officerId, isAvailable, reassignToId || null);
      toast.success(isAvailable
        ? 'Officer marked available'
        : `Officer marked unavailable. ${result.casesReassigned ?? 0} case(s) ${reassignToId ? 'reassigned' : 'unassigned'}.`
      );
      setAvailModal(null); setReassignTo('');
      load();
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setAvailSaving(false);
    }
  }

  async function handleUnassign(engagementId: string) {
    setAssigning(engagementId);
    try {
      await api.assignOfficer(engagementId, null);
      toast.success('Officer removed from case');
      load();
    } catch {
      toast.error('Failed to unassign');
    } finally {
      setAssigning(null);
    }
  }

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const activeOfficers = officers.filter(o => o.isActive !== false);
  const inactiveOfficers = officers.filter(o => o.isActive === false);
  const assignedEngagements = engagements.filter(e => e.officerId);
  const unassignedEngagements = engagements.filter(e => !e.officerId && e.status === 'ACTIVE');

  const filteredActive = activeOfficers.filter(o => {
    const q = search.toLowerCase();
    return !q || o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q);
  });

  const totalActiveCases = activeOfficers.reduce((s, o) => s + (o.officerEngagements?.filter((e: any) => e.status === 'ACTIVE').length ?? 0), 0);
  const availableOfficers = activeOfficers.filter(o => o.isAvailable !== false).length;

  // ── Officer card ──────────────────────────────────────────────────────────

  function OfficerCard({ o }: { o: any }) {
    const activeCases = o.officerEngagements?.filter((e: any) => e.status === 'ACTIVE').length ?? 0;
    const totalCases = o.officerEngagements?.length ?? 0;
    const completedCases = o.officerEngagements?.filter((e: any) => e.status === 'COMPLETED').length ?? 0;
    const isDeactivated = o.isActive === false;
    const isAvailable = o.isAvailable !== false;
    return (
      <div className={`rounded-2xl border border-border bg-white shadow-sm overflow-hidden transition-opacity ${isDeactivated ? 'opacity-60' : ''}`}>
        {/* Card header */}
        <div className={`h-1.5 w-full ${isDeactivated ? 'bg-slate-200' : isAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-base">
              {o.name?.slice(0, 2).toUpperCase() ?? 'OF'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{o.name}</p>
              <p className="text-xs text-muted-foreground truncate">{o.email}</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isDeactivated ? 'bg-slate-100 text-slate-500' : isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isDeactivated ? 'Deactivated' : isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {!isDeactivated && (
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => openEdit(o)} title="Edit profile"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <PencilSimple className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDeactivate(o)} title="Deactivate"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors">
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Active', value: activeCases, color: 'text-primary' },
              { label: 'Total', value: totalCases, color: 'text-foreground' },
              { label: 'Done', value: completedCases, color: 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-muted/40 p-2 text-center">
                <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {!isDeactivated && (
            <button
              onClick={() => { setAvailModal({ officer: o }); setReassignTo(''); }}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                isAvailable ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Shared modal styles ───────────────────────────────────────────────────

  const inputCls = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30';
  const btnPrimary = 'flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors';
  const btnCancel = 'flex-1 rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processing Officers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage back-office document processing staff</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Officer
          </button>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <UsersThree className="h-3.5 w-3.5" /> Assign to Case
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Officers', value: activeOfficers.length, icon: User, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Available Now', value: availableOfficers, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Cases', value: totalActiveCases, icon: UsersThree, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Unassigned', value: unassignedEngagements.length, icon: Warning, color: unassignedEngagements.length > 0 ? 'text-amber-600' : 'text-slate-400', bg: unassignedEngagements.length > 0 ? 'bg-amber-50' : 'bg-slate-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search officers…"
          className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Active officers grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Officers ({filteredActive.length}{search ? ` of ${activeOfficers.length}` : ''})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl animate-pulse bg-muted" />)}
          </div>
        ) : filteredActive.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-10 text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">{search ? 'No officers match your search' : 'No processing officers yet'}</p>
            {!search && <p className="text-xs text-muted-foreground mt-1">Click "Add Officer" to create the first account</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActive.map(o => <OfficerCard key={o.id} o={o} />)}
          </div>
        )}
      </div>

      {/* Deactivated officers (collapsed toggle) */}
      {inactiveOfficers.length > 0 && (
        <div>
          <button
            onClick={() => setShowInactive(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <CaretDown className={`h-4 w-4 transition-transform ${showInactive ? '' : '-rotate-90'}`} />
            Deactivated Officers ({inactiveOfficers.length})
          </button>
          {showInactive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveOfficers.map(o => <OfficerCard key={o.id} o={o} />)}
            </div>
          )}
        </div>
      )}

      {/* Assigned cases */}
      {assignedEngagements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Assigned Cases ({assignedEngagements.length})</h2>
          <div className="space-y-2">
            {assignedEngagements.map(e => {
              const officer = officers.find(o => o.id === e.officerId);
              return (
                <Card key={e.id} className="p-3 flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{e.person?.name ?? 'Unknown Client'}</p>
                    <p className="text-xs text-muted-foreground">Officer: {officer?.name ?? e.officerId}</p>
                  </div>
                  <button
                    onClick={() => handleUnassign(e.id)}
                    disabled={assigning === e.id}
                    className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {assigning === e.id ? 'Removing…' : 'Unassign'}
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Unassigned active engagements warning */}
      {unassignedEngagements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
            <Warning className="h-4 w-4" />
            Unassigned Active Cases ({unassignedEngagements.length})
          </h2>
          <div className="space-y-2">
            {unassignedEngagements.slice(0, 10).map(e => (
              <Card key={e.id} className="p-3 flex items-center gap-3 border-amber-200">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{e.person?.name ?? 'Unknown Client'}</p>
                  <p className="text-xs text-muted-foreground">{e.person?.email}</p>
                </div>
                <button
                  onClick={() => { setAssignEngagementId(e.id); setShowAssign(true); }}
                  className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                >
                  Assign
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Officer Modal ────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold">Add Processing Officer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Create a staff account with officer access</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Full Name" value={createName} onChange={setCreateName} required placeholder="e.g. Grace Mensah" />
              <Field label="Email Address" value={createEmail} onChange={setCreateEmail} type="email" required placeholder="grace@mjnhealthcare.com" />
              <div>
                <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                  <LockKey className="h-3.5 w-3.5" /> Temporary Password
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={e => setCreatePassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className={inputCls}
                />
                <p className="text-xs text-muted-foreground mt-1">Officer should change this on first login</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className={btnCancel}>Cancel</button>
                <button type="submit" disabled={createSaving} className={btnPrimary}>
                  {createSaving ? 'Creating…' : 'Create Officer'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Edit Officer Modal ──────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold">Edit Officer Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editModal.officer.name}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <Field label="Full Name" value={editName} onChange={setEditName} required />
              <Field label="Email Address" value={editEmail} onChange={setEditEmail} type="email" required />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditModal(null)} className={btnCancel}>Cancel</button>
                <button type="submit" disabled={editSaving} className={btnPrimary}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Availability Modal ──────────────────────────────────────────── */}
      {availModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {availModal.officer.isAvailable !== false ? 'Mark Officer Unavailable' : 'Mark Officer Available'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{availModal.officer.name}</p>
              </div>
              <button onClick={() => setAvailModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {availModal.officer.isAvailable !== false ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This will mark the officer as unavailable. Their{' '}
                  <strong>{availModal.officer.officerEngagements?.filter((e: any) => e.status === 'ACTIVE').length ?? 0} active case(s)</strong>{' '}
                  will be reassigned or unassigned.
                </p>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Reassign cases to <span className="text-muted-foreground font-normal">(optional — leave blank to unassign)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={reassignTo}
                      onChange={e => setReassignTo(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
                    >
                      <option value="">Unassign all cases</option>
                      {officers
                        .filter(o => o.id !== availModal.officer.id && o.isAvailable !== false && o.isActive)
                        .map(o => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.officerEngagements?.length ?? 0} cases)
                          </option>
                        ))}
                    </select>
                    <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setAvailModal(null)} className={btnCancel}>Cancel</button>
                  <button
                    onClick={() => handleSetAvailability(availModal.officer.id, false, reassignTo || null)}
                    disabled={availSaving}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                  >
                    {availSaving ? 'Saving…' : 'Confirm — Mark Unavailable'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This will mark the officer as available again so they can be assigned new cases.
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setAvailModal(null)} className={btnCancel}>Cancel</button>
                  <button
                    onClick={() => handleSetAvailability(availModal.officer.id, true)}
                    disabled={availSaving}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {availSaving ? 'Saving…' : 'Mark Available'}
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Assign Modal ────────────────────────────────────────────────── */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold">Assign Officer to Case</h2>
              <button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Case (Engagement)</label>
                <select
                  value={assignEngagementId}
                  onChange={e => setAssignEngagementId(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select a case…</option>
                  {engagements
                    .filter(e => e.status === 'ACTIVE')
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.person?.name ?? e.id} {e.officerId ? '(already assigned)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Processing Officer</label>
                <select
                  value={assignOfficerId}
                  onChange={e => setAssignOfficerId(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select an officer…</option>
                  {activeOfficers.filter(o => o.isAvailable !== false).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.officerEngagements?.filter((e: any) => e.status === 'ACTIVE').length ?? 0} active cases)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Handover Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  placeholder="Briefing notes for the officer…"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAssign(false); setAssignEngagementId(''); setAssignOfficerId(''); setHandoverNotes(''); }} className={btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={assignSaving || !assignEngagementId || !assignOfficerId} className={btnPrimary}>
                  {assignSaving ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
