'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  Buildings, Plus, CircleNotch, CheckCircle, X, WarningCircle, ShieldCheck,
  Envelope, MagnifyingGlass,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const PARTNER_TYPES = ['HOSPITAL', 'UNIVERSITY', 'AGENCY', 'CLINIC', 'GOVERNMENT'];

const TYPE_STYLES: Record<string, string> = {
  HOSPITAL: 'bg-blue-100 text-blue-700',
  UNIVERSITY: 'bg-violet-100 text-violet-700',
  AGENCY: 'bg-amber-100 text-amber-700',
  CLINIC: 'bg-teal-100 text-teal-700',
  GOVERNMENT: 'bg-rose-100 text-rose-700',
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('HOSPITAL');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setPartners(await api.getPartners());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createPartner({ name, type, contactEmail });
      setPartners((p) => [created, ...p]);
      setShowModal(false);
      setName(''); setType('HOSPITAL'); setContactEmail('');
      toast.success('Partner created.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(id: string) {
    setVerifying(id);
    try {
      const updated = await api.verifyPartner(id);
      setPartners((p) => p.map((x) => x.id === id ? { ...x, ...updated } : x));
      toast.success('Partner verified.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setVerifying(null);
    }
  }

  const filtered = partners.filter((p) =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const verified = partners.filter((p) => p.verificationStatus === 'VERIFIED').length;
  const pending = partners.filter((p) => p.verificationStatus !== 'VERIFIED').length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PageHeader
            title="Partners"
            subtitle={`${partners.length} partners · ${verified} verified · ${pending} pending`}
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Partner
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5"><Buildings className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{partners.length}</p><p className="text-xs text-muted-foreground">Total Partners</p></div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{verified}</p><p className="text-xs text-muted-foreground">Verified</p></div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5"><WarningCircle className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending Verification</p></div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
            <Buildings className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">{search ? 'No partners match' : 'No partners yet'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Try a different search term.' : 'Add your first hospital, university, or agency partner.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map((partner) => {
                const isVerified = partner.verificationStatus === 'VERIFIED';
                return (
                  <div key={partner.id} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                        <Buildings className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{partner.name}</p>
                          {isVerified && <CheckCircle weight="fill" className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        {partner.contactEmail && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Envelope className="h-3 w-3" /> {partner.contactEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Type badge */}
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_STYLES[partner.type] ?? 'bg-muted text-muted-foreground'}`}>
                      {partner.type}
                    </span>

                    {/* Verification status */}
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isVerified ? 'Verified' : 'Pending'}
                    </span>

                    {/* Opportunities count */}
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {partner._count?.opportunities ?? partner.opportunities?.length ?? 0} opportunities
                    </span>

                    {/* Verify action */}
                    {!isVerified && (
                      <button
                        onClick={() => handleVerify(partner.id)}
                        disabled={verifying === partner.id}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                      >
                        {verifying === partner.id
                          ? <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                          : <ShieldCheck className="h-3.5 w-3.5" />}
                        Verify
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add partner modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Partner</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-muted/60">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Organisation name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dubai Health Authority"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Contact email</label>
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="hr@partner.com"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Creating…' : 'Create partner'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
