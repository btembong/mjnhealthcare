'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton, Button, Badge } from '@mjn/ui';
import {
  MapTrifold, Plus, CaretDown, CaretRight, PencilSimple,
  Trash, CheckCircle, CircleNotch, X, Globe,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stage = {
  id: string;
  label: string;
  order: number;
  description?: string;
  requiredDocs?: string[];
};

type Pathway = {
  id: string;
  country: string;
  regulatoryBody: string;
  profession?: string;
  stages: Stage[];
  _count?: { progress: number };
};

// ─── Stage pill ────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺',
};

const DEFAULT_STAGES: Record<string, string[]> = {
  'UAE': ['DataFlow Verification', 'Exam Registration', 'Exam Sitting', 'Authority Approval', 'Visa Processing', 'Employer Onboarding'],
  'UK':  ['English Test', 'NMC Application', 'Credential Verification', 'CBT Preparation', 'CBT Sitting', 'OSCE Preparation', 'OSCE Sitting', 'NMC PIN Issued', 'Job Offer & Visa'],
  'US':  ['CGFNS / ERES Evaluation', 'State Board Application', 'ATT Issued', 'NCLEX Sitting', 'State License Issued', 'Visa Processing'],
  'Ireland': ['English Test', 'NMBI Application', 'Credential Verification', 'Competence Assessment', 'Registration Decision', 'Critical Skills Permit', 'Employment Start'],
  'Canada': ['Eligibility Assessment & Profile Creation', 'CRS Score Review & Enhancement Strategy', 'Express Entry Pool — Active Monitoring', 'Invitation to Apply (ITA) Received', 'Full PR Application Submitted', 'Medical Examination & Biometrics', 'COPR Issued & Landing in Canada'],
};

// ─── Modal ─────────────────────────────────────────────────────────────────────

const COUNTRIES = ['UAE', 'UK', 'US', 'Ireland', 'Canada', 'Australia'];
const BODIES: Record<string, string[]> = {
  UAE: ['DHA', 'DOH / HAAD', 'MOH'],
  UK:  ['NMC', 'GMC', 'HCPC', 'GDC'],
  US:  ['NCLEX / CGFNS', 'ECFMG', 'NNAS'],
  Ireland: ['NMBI', 'IMC', 'CORU'],
  Canada: ['IRCC — Express Entry', 'IRCC — Study Permit', 'NNAS', 'NCLEX-RN (Canada)', 'RCSFD'],
  Australia: ['AHPRA', 'AMC', 'ADC'],
};

function NewPathwayModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Pathway) => void }) {
  const [country, setCountry] = useState('UAE');
  const [body, setBody] = useState('DHA');
  const [profession, setProfession] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const bodies = BODIES[country] ?? [];
    setBody(bodies[0] ?? '');
  }, [country]);

  const defaultStages = DEFAULT_STAGES[country] ?? ['Stage 1', 'Stage 2', 'Stage 3'];

  async function handleCreate() {
    setSaving(true);
    try {
      const pathway = await api.createLicensingPathway({
        country,
        regulatoryBody: body,
        profession: profession || undefined,
        stages: defaultStages.map((label, idx) => ({ label, order: idx + 1, requiredDocs: [] })),
      });
      toast.success(`Pathway created: ${country} – ${body}`);
      onCreated(pathway);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">New Licensing Pathway</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Country</label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Regulatory Body</label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={body}
              onChange={e => setBody(e.target.value)}
            >
              {(BODIES[country] ?? []).map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Profession (optional — leave blank for all)</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Registered Nurse"
              value={profession}
              onChange={e => setProfession(e.target.value)}
            />
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Default stages (editable after creation)</p>
            <ol className="space-y-1">
              {defaultStages.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : 'Create Pathway'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pathway Row ───────────────────────────────────────────────────────────────

function PathwayRow({ pathway, onDelete }: { pathway: Pathway; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const flag = COUNTRY_FLAGS[pathway.country] ?? '🌍';

  async function handleDelete() {
    if (!confirm(`Delete ${pathway.country} – ${pathway.regulatoryBody} pathway? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteLicensingPathway(pathway.id);
      toast.success('Pathway deleted.');
      onDelete(pathway.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flag}</span>
          <div>
            <p className="font-bold text-foreground">{pathway.country} — {pathway.regulatoryBody}</p>
            {pathway.profession && <p className="text-xs text-muted-foreground">{pathway.profession}</p>}
          </div>
          <Badge variant="outline" className="text-[10px]">{pathway.stages.length} stages</Badge>
          {pathway._count?.progress ? (
            <Badge variant="secondary" className="text-[10px]">{pathway._count.progress} active clients</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            {deleting ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
          </button>
          {expanded ? <CaretDown className="h-4 w-4 text-muted-foreground" /> : <CaretRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Stages</p>
          <ol className="space-y-2">
            {[...pathway.stages]
              .sort((a, b) => a.order - b.order)
              .map((stage) => (
                <li key={stage.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                    {stage.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                    {stage.requiredDocs && stage.requiredDocs.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {stage.requiredDocs.map(doc => (
                          <span key={doc} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{doc}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PathwaysPage() {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getLicensingPathways()
      .then(setPathways)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pathways.filter(p =>
    !filter ||
    p.country.toLowerCase().includes(filter.toLowerCase()) ||
    p.regulatoryBody.toLowerCase().includes(filter.toLowerCase()) ||
    p.profession?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licensing Pathways"
        subtitle="Define the stage sequences for each country and regulatory body. Clients are tracked against these stages."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> New Pathway
          </Button>
        }
      />

      {/* Filter + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Filter by country, body, or profession…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:w-72"
        />
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{pathways.length}</strong> pathways</span>
          <span><strong className="text-foreground">{pathways.reduce((sum, p) => sum + p.stages.length, 0)}</strong> total stages</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">{filter ? 'No pathways match that filter' : 'No pathways configured yet'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter ? 'Clear the filter or create a new pathway.' : 'Create your first licensing pathway to start tracking client progress.'}
          </p>
          {!filter && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Create First Pathway
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PathwayRow
              key={p.id}
              pathway={p}
              onDelete={id => setPathways(prev => prev.filter(p => p.id !== id))}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewPathwayModal
          onClose={() => setShowModal(false)}
          onCreated={p => setPathways(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
