'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { User, UsersThree, CheckCircle, Warning } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

export default function OfficersPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Assign modal state
  const [showAssign, setShowAssign] = useState(false);
  const [assignEngagementId, setAssignEngagementId] = useState('');
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const load = () =>
    Promise.all([api.listOfficers(), api.getAllEngagements()])
      .then(([o, e]) => { setOfficers(o); setEngagements(e); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignEngagementId || !assignOfficerId) return;
    setAssignSaving(true);
    try {
      await api.assignOfficer(assignEngagementId, assignOfficerId, handoverNotes.trim() || undefined);
      toast.success('Officer assigned');
      setShowAssign(false);
      setAssignEngagementId('');
      setAssignOfficerId('');
      setHandoverNotes('');
      load();
    } catch {
      toast.error('Failed to assign');
    } finally {
      setAssignSaving(false);
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

  const assignedEngagements = engagements.filter(e => e.officerId);
  const unassignedEngagements = engagements.filter(e => !e.officerId && e.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UsersThree className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Processing Officers</h1>
            <p className="text-xs text-muted-foreground">Manage back-office document processing staff</p>
          </div>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <User className="h-3.5 w-3.5" /> Assign Officer
        </button>
      </div>

      {/* Officers list */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Officers ({officers.length})</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
          </div>
        ) : officers.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No processing officers yet</p>
            <p className="text-xs mt-1">Create one via Staff page with role PROCESSING_OFFICER</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officers.map(o => (
              <Card key={o.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                    {o.name?.slice(0, 2).toUpperCase() ?? 'OF'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{o.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{o.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <UsersThree className="h-3.5 w-3.5" />
                    {o.officerEngagements?.length ?? 0} cases
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${o.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {o.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
                    <p className="text-xs font-semibold text-foreground truncate">
                      {e.person?.name ?? 'Unknown Client'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Officer: {officer?.name ?? e.officerId}
                    </p>
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
                  <p className="text-xs font-semibold text-foreground truncate">
                    {e.person?.name ?? 'Unknown Client'}
                  </p>
                  <p className="text-xs text-muted-foreground">{e.person?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setAssignEngagementId(e.id);
                    setShowAssign(true);
                  }}
                  className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                >
                  Assign
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-base font-bold mb-4">Assign Officer to Case</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Case (Engagement)</label>
                <select
                  value={assignEngagementId}
                  onChange={e => setAssignEngagementId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select an officer…</option>
                  {officers.filter(o => o.isActive).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.officerEngagements?.length ?? 0} cases)
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
                  placeholder="Briefing notes for the officer — context, pending actions, any special instructions…"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAssign(false); setAssignEngagementId(''); setAssignOfficerId(''); setHandoverNotes(''); }}
                  className="flex-1 rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSaving || !assignEngagementId || !assignOfficerId}
                  className="flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
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
