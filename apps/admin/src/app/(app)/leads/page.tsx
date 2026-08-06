'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@mjn/ui';
import Link from 'next/link';
import {
  CircleNotch, ArrowsClockwise, UserPlus, UsersFour, ArrowSquareOut,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  QUALIFIED: 'bg-violet-100 text-violet-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
};

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.allSettled([
      api.getLeads(),
      api.getConsultants(),
    ]).then(([leadsRes, consultantsRes]) => {
      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value);
      if (consultantsRes.status === 'fulfilled') setConsultants(consultantsRes.value ?? []);
    }).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleStatusChange(id: string, status: string) {
    setActionLoading(id + '_status');
    try {
      await api.updateLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch (err: any) {
      showToast('Failed to update status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAssignConsultant(id: string, consultantId: string) {
    if (!consultantId) return;
    setActionLoading(id + '_assign');
    try {
      await api.assignLeadConsultant(id, consultantId);
      const profile = consultants.find((c) => c.id === consultantId);
      const name = profile?.person?.name ?? profile?.name ?? consultantId;
      setLeads((prev) => prev.map((l) =>
        l.id === id ? { ...l, assignedConsultantId: consultantId, assignedConsultantName: name, status: l.status === 'NEW' ? 'CONTACTED' : l.status } : l
      ));
      showToast(`Assigned to ${name}`);
    } catch (err: any) {
      showToast('Failed to assign: ' + err.message);
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
      showToast('Lead converted — Person created and portal invite sent.');
    } catch (err: any) {
      showToast('Failed to convert: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" subtitle={`${leads.length} leads captured from support bot and web forms`} />

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <UsersFour className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No leads yet. They appear here when captured from the support bot or web forms.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Profession</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{lead.profession ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.destination ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{lead.serviceInterest ?? '—'}</td>
                  <td className="px-4 py-3">
                    {lead.status === 'CONVERTED' ? (
                      <span className="text-xs text-muted-foreground">{lead.assignedConsultantName ?? '—'}</span>
                    ) : (
                      <select
                        value={lead.assignedConsultantId ?? ''}
                        onChange={(e) => handleAssignConsultant(lead.id, e.target.value)}
                        disabled={actionLoading === lead.id + '_assign'}
                        className="rounded-lg border border-border bg-white px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                      >
                        <option value="">Unassigned</option>
                        {consultants.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.person?.name ?? c.name ?? c.id}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.status === 'CONVERTED' ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">CONVERTED</span>
                    ) : (
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={actionLoading === lead.id + '_status'}
                        className={`rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/30 ${STATUS_STYLES[lead.status] ?? ''}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.status === 'CONVERTED' ? (
                      lead.convertedPersonId ? (
                        <Link
                          href={`/caseload/${lead.convertedPersonId}`}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                        >
                          <ArrowSquareOut className="h-3.5 w-3.5" />
                          Go to case
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )
                    ) : (
                      <button
                        onClick={() => handleConvert(lead.id)}
                        disabled={!!actionLoading}
                        title="Convert to client — creates portal account and sends invite"
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        {actionLoading === lead.id + '_convert'
                          ? <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" />
                          : <UserPlus className="h-3.5 w-3.5" />
                        }
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
