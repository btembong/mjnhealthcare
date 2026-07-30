'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton, Badge } from '@mjn/ui';
import {
  Briefcase, Plus, CircleNotch, X, MapPin, Buildings, MagnifyingGlass,
  Trash, PencilSimple, Users, CheckCircle, CaretDown, ArrowRight,
  WarningCircle, Clock,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type Tab = 'opportunities' | 'applications';

const COUNTRIES = ['UAE', 'UK', 'US', 'Ireland', 'Canada', 'Australia', 'Germany', 'Saudi Arabia'];
const PROFESSIONS = ['Nurse', 'Physician', 'Allied Health', 'Pharmacist', 'Dentist', 'Midwife', 'Other'];
const APP_STATUSES = ['SUBMITTED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN', 'DEPLOYED'];

function appStatusVariant(s: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (s === 'OFFERED' || s === 'DEPLOYED') return 'success';
  if (s === 'SHORTLISTED' || s === 'INTERVIEW') return 'warning';
  if (s === 'REJECTED' || s === 'WITHDRAWN') return 'destructive';
  return 'outline';
}

function oppStatusVariant(s: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'DRAFT') return 'outline';
  if (s === 'CLOSED') return 'destructive';
  return 'warning';
}

// ── Opportunity Form Modal ─────────────────────────────────────────────────────

function OpportunityModal({
  partners, editing, onClose, onSaved,
}: {
  partners: any[];
  editing: any | null;
  onClose: () => void;
  onSaved: (opp: any) => void;
}) {
  const [partnerId, setPartnerId] = useState(editing?.partnerId ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [country, setCountry] = useState(editing?.country ?? '');
  const [profession, setProfession] = useState(editing?.profession ?? '');
  const [type, setType] = useState(editing?.type ?? 'JOB');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [requirements, setRequirements] = useState(editing?.requirements ?? '');
  const [salaryRange, setSalaryRange] = useState(editing?.salaryRange ?? '');
  const [closingDate, setClosingDate] = useState(
    editing?.closingDate ? new Date(editing.closingDate).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { partnerId, title, country, profession: profession || undefined, type, description: description || undefined, requirements: requirements || undefined, salaryRange: salaryRange || undefined, closingDate: closingDate || undefined };
      const result = editing
        ? await api.updateOpportunity(editing.id, data)
        : await api.createOpportunity(data);
      onSaved(result);
      toast.success(editing ? 'Opportunity updated.' : 'Opportunity created.');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const verifiedPartners = partners.filter((p) => p.verificationStatus === 'VERIFIED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-bold text-foreground">{editing ? 'Edit Opportunity' : 'New Opportunity'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/60"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Partner / Employer *</label>
              {verifiedPartners.length === 0 ? (
                <p className="text-xs text-rose-600 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  No verified partners yet. <a href="/partners" className="underline font-semibold">Add and verify a partner first.</a>
                </p>
              ) : (
                <select required value={partnerId} onChange={(e) => setPartnerId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select partner…</option>
                  {verifiedPartners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Job title *</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Nurse — ICU"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Country *</label>
                <select required value={country} onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Profession</label>
                <select value={profession} onChange={(e) => setProfession(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Any profession</option>
                  {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="JOB">Job</option>
                  <option value="PROGRAM">Program</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Salary range</label>
                <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. AED 12,000–15,000/mo"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Closing date</label>
                <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="Role overview, responsibilities…"
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Requirements <span className="font-normal text-muted-foreground">(one per line)</span></label>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4}
                placeholder="Valid nursing license&#10;2+ years ICU experience&#10;IELTS 7.0+"
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving || verifiedPartners.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create opportunity'}
              </button>
              <button type="button" onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Applications Pipeline ─────────────────────────────────────────────────────

function ApplicationsTab({ applications, loading, onStatusChange }: {
  applications: any[];
  loading: boolean;
  onStatusChange: (id: string, status: string, notes?: string) => Promise<void>;
}) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOpp, setFilterOpp] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ app: any; status: string } | null>(null);
  const [notes, setNotes] = useState('');

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;

  const oppOptions = [...new Map(applications.map((a) => [a.opportunityId, a.opportunity?.title ?? a.opportunityId])).entries()];

  const filtered = applications.filter((a) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterOpp && a.opportunityId !== filterOpp) return false;
    return true;
  });

  async function doStatusChange(id: string, status: string, n?: string) {
    setUpdatingId(id);
    try {
      await onStatusChange(id, status, n);
    } finally {
      setUpdatingId(null);
      setNotesModal(null);
      setNotes('');
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All statuses</option>
            {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        {oppOptions.length > 1 && (
          <div className="relative">
            <select value={filterOpp} onChange={(e) => setFilterOpp(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All opportunities</option>
              {oppOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}
        {(filterStatus || filterOpp) && (
          <button onClick={() => { setFilterStatus(''); setFilterOpp(''); }}
            className="text-xs text-primary font-semibold hover:underline">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No applications</p>
          <p className="mt-1 text-sm text-muted-foreground">Applications appear here when candidates apply from the portal.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                {/* Candidate */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {app.person?.name?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{app.person?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.person?.email ?? ''}</p>
                  </div>
                </div>

                {/* Opportunity */}
                <div className="min-w-0 max-w-[200px]">
                  <p className="text-xs font-medium text-foreground truncate">{app.opportunity?.title ?? '—'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {app.opportunity?.country ?? ''}
                  </p>
                </div>

                {/* Applied date */}
                <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
                  {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                {/* Status badge */}
                <Badge variant={appStatusVariant(app.status)} className="text-xs shrink-0">
                  {app.status}
                </Badge>

                {/* Move status dropdown */}
                <div className="relative shrink-0">
                  {updatingId === app.id ? (
                    <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <select
                        value={app.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'REJECTED') {
                            setNotesModal({ app, status: newStatus });
                          } else {
                            doStatusChange(app.id, newStatus);
                          }
                        }}
                        className="h-8 appearance-none rounded-xl border border-border bg-white pl-2.5 pr-7 text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                      >
                        {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    </>
                  )}
                </div>

                {/* Deploy button (for OFFERED) */}
                {app.status === 'OFFERED' && (
                  <button
                    onClick={() => doStatusChange(app.id, 'DEPLOYED')}
                    disabled={updatingId === app.id}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Mark deployed
                  </button>
                )}

                {/* Notes */}
                {app.notes && (
                  <p className="w-full text-xs text-muted-foreground italic pl-12 -mt-2">Note: {app.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes modal for rejection */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Rejection Notes</h3>
              <button onClick={() => setNotesModal(null)} className="rounded-lg p-1.5 hover:bg-muted/60">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Add a note for <strong>{notesModal.app.person?.name}</strong> (optional — visible to your team, not the candidate).
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for rejection…"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setNotesModal(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={() => doStatusChange(notesModal.app.id, notesModal.status, notes || undefined)}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
              >
                <WarningCircle className="h-4 w-4" /> Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('opportunities');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [opps, parts] = await Promise.all([
          api.getOpportunities(),
          api.getPartners(),
        ]);
        setOpportunities(opps ?? []);
        setPartners(parts ?? []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (tab !== 'applications') return;
    setAppsLoading(true);
    api.getAllApplications()
      .then((apps) => setApplications(apps ?? []))
      .catch((err) => toast.error(err.message))
      .finally(() => setAppsLoading(false));
  }, [tab]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this opportunity? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.deleteOpportunity(id);
      setOpportunities((o) => o.filter((x) => x.id !== id));
      toast.success('Opportunity deleted.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(id: string, status: string, notes?: string) {
    const updated = await api.updateApplicationStatus(id, status, notes);
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, ...updated } : a));
    toast.success(`Application moved to ${status}.`);
  }

  function handleSaved(opp: any) {
    if (editing) {
      setOpportunities((prev) => prev.map((o) => o.id === opp.id ? opp : o));
    } else {
      setOpportunities((prev) => [opp, ...prev]);
    }
    setEditing(null);
  }

  const filtered = opportunities.filter((o) =>
    !search ||
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.country?.toLowerCase().includes(search.toLowerCase()) ||
    o.partner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const active = opportunities.filter((o) => o.status === 'ACTIVE').length;
  const totalApps = applications.length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PageHeader
            title="Jobs & Opportunities"
            subtitle={`${active} active · ${opportunities.length} total · ${totalApps} applications`}
          />
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Opportunity
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1 w-fit">
          {([
            { id: 'opportunities', label: 'Opportunities', count: opportunities.length },
            { id: 'applications', label: 'Applications', count: totalApps },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === 'opportunities' ? (
          <>
            {/* Search */}
            <div className="relative max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities…"
                className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">{search ? 'No results' : 'No opportunities yet'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search ? 'Try a different search.' : 'Create your first job opportunity above.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((opp) => {
                  const appCount = applications.filter((a) => a.opportunityId === opp.id).length;
                  return (
                    <div key={opp.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xl">
                          {{ UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺' }[opp.country] ?? '🌍'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-bold text-foreground">{opp.title}</p>
                            <Badge variant={oppStatusVariant(opp.status)} className="text-xs">
                              {opp.status === 'ACTIVE' ? 'Open' : opp.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {opp.partner?.name && (
                              <span className="flex items-center gap-1"><Buildings className="h-3 w-3" />{opp.partner.name}</span>
                            )}
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.country}</span>
                            {opp.profession && <span>{opp.profession}</span>}
                            {opp.salaryRange && <span className="font-semibold text-primary">{opp.salaryRange}</span>}
                          </div>
                          {opp.closingDate && (
                            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Closes {new Date(opp.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {appCount > 0 && (
                          <button
                            onClick={() => setTab('applications')}
                            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
                          >
                            <Users className="h-3.5 w-3.5" /> {appCount} applicant{appCount !== 1 ? 's' : ''}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditing(opp); setShowModal(true); }}
                          className="rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors"
                          title="Edit"
                        >
                          <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          disabled={deleting === opp.id}
                          className="rounded-xl border border-rose-200 p-2 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === opp.id
                            ? <CircleNotch className="h-3.5 w-3.5 animate-spin text-rose-500" />
                            : <Trash className="h-3.5 w-3.5 text-rose-500" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <ApplicationsTab
            applications={applications}
            loading={appsLoading}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {showModal && (
        <OpportunityModal
          partners={partners}
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
