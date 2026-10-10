'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@mjn/ui';
import Link from 'next/link';
import {
  CircleNotch, ArrowsClockwise, UserPlus, UsersFour, ArrowSquareOut,
  X, Tag, Gift, Phone, EnvelopeSimple, Rows, SquaresFour, MagnifyingGlass,
} from '@mjn/ui';
import { api } from '../../../lib/api';

// ── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { key: 'NEW',                  label: 'New',               color: 'bg-blue-50 border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  { key: 'FREE_CONSULT_BOOKED', label: 'Free Consult Booked', color: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  { key: 'FREE_CONSULT_DONE',   label: 'Free Consult Done',  color: 'bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  { key: 'CONTACTED',           label: 'Contacted',         color: 'bg-amber-50 border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  { key: 'QUALIFIED',           label: 'Qualified',         color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  { key: 'PROPOSAL_SENT',       label: 'Proposal Sent',     color: 'bg-sky-50 border-sky-200',      badge: 'bg-sky-100 text-sky-700' },
  { key: 'CONVERTED',           label: 'Converted',         color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  { key: 'LOST',                label: 'Lost',              color: 'bg-rose-50 border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
] as const;

type Stage = typeof STAGES[number]['key'];

// ── Detail drawer ────────────────────────────────────────────────────────────

function LeadDrawer({
  lead, consultants, onClose, onStageChange, onAssign, onConvert, actionLoading,
}: {
  lead: any;
  consultants: any[];
  onClose: () => void;
  onStageChange: (id: string, stage: Stage) => void;
  onAssign: (id: string, consultantId: string) => void;
  onConvert: (id: string) => void;
  actionLoading: string | null;
}) {
  const stage = STAGES.find((s) => s.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-lg font-bold text-foreground">{lead.name}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${stage?.badge ?? 'bg-muted text-muted-foreground'}`}>
              {stage?.label ?? lead.status}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/60 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact */}
        <div className="space-y-3 border-b border-border p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <EnvelopeSimple className="h-4 w-4 shrink-0" />
            <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            </div>
          )}
          {lead.discountCode && (
            <div className="flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-mono font-bold text-amber-600">{lead.discountCode}</span>
              {lead.discountExpiry && (
                <span className="text-xs text-muted-foreground">
                  expires {new Date(lead.discountExpiry).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 border-b border-border p-5 text-sm">
          {lead.profession && <p><span className="text-muted-foreground">Profession:</span> <span className="capitalize">{lead.profession}</span></p>}
          {lead.destination && <p><span className="text-muted-foreground">Destination:</span> {lead.destination}</p>}
          {lead.serviceInterest && <p><span className="text-muted-foreground">Interest:</span> {lead.serviceInterest}</p>}
          {lead.sourceBookingId && <p><span className="text-muted-foreground">Source:</span> Free Consultation</p>}
          {lead.notes && <p><span className="text-muted-foreground">Notes:</span> {lead.notes}</p>}
          <p><span className="text-muted-foreground">Created:</span> {new Date(lead.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Move stage */}
        <div className="space-y-3 border-b border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Move Stage</p>
          <div className="grid grid-cols-2 gap-2">
            {STAGES.filter((s) => s.key !== 'CONVERTED' && s.key !== lead.status).map((s) => (
              <button
                key={s.key}
                onClick={() => onStageChange(lead.id, s.key)}
                disabled={!!actionLoading}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-40 ${s.badge}`}
              >
                → {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assign consultant */}
        {lead.status !== 'CONVERTED' && (
          <div className="border-b border-border p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign Consultant</p>
            <select
              value={lead.assignedConsultantId ?? ''}
              onChange={(e) => onAssign(lead.id, e.target.value)}
              disabled={actionLoading === lead.id + '_assign'}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Unassigned</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>{c.person?.name ?? c.name ?? c.id}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 space-y-2">
          {lead.status === 'CONVERTED' && lead.convertedPersonId ? (
            <Link
              href={`/caseload/${lead.convertedPersonId}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <ArrowSquareOut className="h-4 w-4" /> View Case
            </Link>
          ) : (
            <button
              onClick={() => onConvert(lead.id)}
              disabled={!!actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionLoading === lead.id + '_convert'
                ? <ArrowsClockwise className="h-4 w-4 animate-spin" />
                : <UserPlus className="h-4 w-4" />}
              Convert to Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-white p-3 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <p className="font-semibold text-sm text-foreground group-hover:text-primary leading-tight">{lead.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.email}</p>
      {lead.serviceInterest && (
        <div className="mt-2 flex items-center gap-1">
          <Tag className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground/80">{lead.serviceInterest}</span>
        </div>
      )}
      {lead.discountCode && (
        <div className="mt-1.5 flex items-center gap-1">
          <Gift className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-mono text-amber-600">{lead.discountCode}</span>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground/60">{new Date(lead.createdAt).toLocaleDateString()}</p>
    </button>
  );
}

// ── List row ──────────────────────────────────────────────────────────────────

function LeadRow({
  lead, consultants, onOpen,
}: { lead: any; consultants: any[]; onOpen: () => void }) {
  const stage = STAGES.find((s) => s.key === lead.status);
  const consultant = consultants.find((c) => c.id === lead.assignedConsultantId);
  const consultantName = consultant?.person?.name ?? consultant?.name ?? null;

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <p className="font-semibold text-sm text-foreground">{lead.name}</p>
        {lead.profession && <p className="text-xs text-muted-foreground capitalize">{lead.profession}</p>}
      </td>
      <td className="px-4 py-3">
        <a href={`mailto:${lead.email}`} className="text-xs text-primary hover:underline block">{lead.email}</a>
        {lead.phone && <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground block">{lead.phone}</a>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${stage?.badge ?? 'bg-muted text-muted-foreground'}`}>
          {stage?.label ?? lead.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {lead.serviceInterest ?? '—'}
      </td>
      <td className="px-4 py-3">
        {lead.discountCode ? (
          <span className="font-mono text-xs font-bold text-amber-600">{lead.discountCode}</span>
        ) : <span className="text-xs text-muted-foreground/50">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {consultantName ?? <span className="text-muted-foreground/40">Unassigned</span>}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {new Date(lead.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onOpen}
          className="rounded-lg border border-border px-3 py-1 text-xs font-semibold hover:bg-muted/60 transition-colors"
        >
          Open
        </button>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [toast, setToast] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');

  useEffect(() => {
    Promise.allSettled([
      api.getLeads(),
      api.getConsultants(true),
    ]).then(([leadsRes, consultantsRes]) => {
      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value ?? []);
      if (consultantsRes.status === 'fulfilled') setConsultants(consultantsRes.value ?? []);
    }).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleStageChange(id: string, stage: Stage) {
    setActionLoading(id + '_stage');
    try {
      await api.advanceLeadStage(id, stage);
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: stage } : l));
      setSelectedLead((prev: any) => prev?.id === id ? { ...prev, status: stage } : prev);
      showToast('Stage updated');
    } catch (err: any) {
      showToast('Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAssign(id: string, consultantId: string) {
    if (!consultantId) return;
    setActionLoading(id + '_assign');
    try {
      await api.updateLead(id, { assignedConsultantId: consultantId });
      const profile = consultants.find((c) => c.id === consultantId);
      const name = profile?.person?.name ?? profile?.name ?? consultantId;
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, assignedConsultantId: consultantId } : l));
      setSelectedLead((prev: any) => prev?.id === id ? { ...prev, assignedConsultantId: consultantId } : prev);
      showToast(`Assigned to ${name}`);
    } catch (err: any) {
      showToast('Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConvert(id: string) {
    setActionLoading(id + '_convert');
    try {
      const res = await api.convertLead(id);
      setLeads((prev) => prev.map((l) =>
        l.id === id ? { ...l, status: 'CONVERTED', convertedPersonId: res?.personId ?? l.convertedPersonId } : l
      ));
      setSelectedLead((prev: any) => prev?.id === id ? { ...prev, status: 'CONVERTED', convertedPersonId: res?.personId } : prev);
      showToast('Lead converted — portal invite sent.');
    } catch (err: any) {
      showToast('Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const activeLeads = leads.filter((l) => l.status !== 'LOST');
  const lostLeads = leads.filter((l) => l.status === 'LOST');

  // Filtered leads for list view
  const filteredLeads = leads.filter((l) => {
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || l.status === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Leads Pipeline"
          subtitle={`${activeLeads.length} active · ${lostLeads.length} lost · ${leads.filter((l) => l.status === 'CONVERTED').length} converted`}
        />
        {/* View toggle */}
        <div data-tour="leads-view" className="mt-1 flex shrink-0 items-center rounded-xl border border-border bg-white p-1 shadow-sm">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
          >
            <SquaresFour className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === 'list' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
          >
            <Rows className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <UsersFour className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No leads yet. They appear here when clients book free consultations or are captured via the support bot.</p>
        </div>
      ) : view === 'kanban' ? (
        /* ── KANBAN VIEW ── */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage.key);
              return (
                <div key={stage.key} className={`flex flex-col rounded-2xl border ${stage.color} w-56 shrink-0`}>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-foreground/70">{stage.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${stage.badge}`}>{stageLeads.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 px-2 pb-3 min-h-[120px]">
                    {stageLeads.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground/50">Empty</p>
                    ) : (
                      stageLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="space-y-3">
          {/* Filters bar */}
          <div data-tour="leads-filters" className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as Stage | 'ALL')}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">All stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consultant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No leads match your filters.</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      consultants={consultants}
                      onOpen={() => setSelectedLead(lead)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer — same for both views */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          consultants={consultants}
          onClose={() => setSelectedLead(null)}
          onStageChange={handleStageChange}
          onAssign={handleAssign}
          onConvert={handleConvert}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
