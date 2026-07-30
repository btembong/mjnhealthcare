'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Skeleton } from '@mjn/ui';
import {
  Briefcase, MapPin, Buildings, ArrowRight, MagnifyingGlass,
  Stethoscope, Clock, CheckCircle, X, FunnelSimple,
  BookmarkSimple, ShareNetwork, Globe,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

// ── Helpers ────────────────────────────────────────────────────────────────────

function countryFlag(country: string) {
  const map: Record<string, string> = {
    UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', USA: '🇺🇸',
    Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺',
  };
  return map[country] ?? '🌍';
}

function professionIcon() {
  return <Stethoscope className="h-4 w-4 text-muted-foreground" />;
}

function statusVariant(s: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (s === 'ACTIVE' || s === 'OPEN') return 'success';
  if (s === 'CLOSED') return 'destructive';
  if (s === 'DRAFT' || s === 'FILLED') return 'outline';
  return 'warning';
}

function statusLabel(s: string) {
  if (s === 'ACTIVE') return 'Open';
  if (s === 'DRAFT') return 'Coming soon';
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function applicationStatusVariant(s: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (s === 'ACCEPTED') return 'success';
  if (s === 'REJECTED') return 'destructive';
  if (s === 'SHORTLISTED') return 'warning';
  return 'outline';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OpportunitiesSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-80" /></div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────

function OpportunityCard({
  opp, applied, onApply, applying,
}: {
  opp: any;
  applied: boolean;
  onApply: (id: string) => void;
  applying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
      applied ? 'border-primary/30' : 'border-border'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xl">
              {countryFlag(opp.country)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{opp.title ?? opp.type}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {opp.partner?.name && (
                  <span className="flex items-center gap-1">
                    <Buildings className="h-3 w-3" /> {opp.partner.name}
                  </span>
                )}
                {opp.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {opp.country}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant={statusVariant(opp.status ?? 'ACTIVE')} className="text-xs">
              {statusLabel(opp.status ?? 'ACTIVE')}
            </Badge>
            {applied && (
              <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Applied
              </span>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opp.profession && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              {professionIcon()} {opp.profession}
            </span>
          )}
          {opp.contractType && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {opp.contractType}
            </span>
          )}
          {opp.salaryRange && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              {opp.salaryRange}
            </span>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {opp.description}
          </p>
        )}
        {opp.description && opp.description.length > 120 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Requirements list */}
        {expanded && opp.requirements && (
          (() => {
            const reqs: string[] = Array.isArray(opp.requirements)
              ? opp.requirements
              : opp.requirements.split('\n').map((r: string) => r.trim()).filter(Boolean);
            return reqs.length > 0 ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Requirements</p>
                <ul className="space-y-1">
                  {reqs.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {!applied ? (
            <button
              onClick={() => onApply(opp.id)}
              disabled={applying || opp.status === 'CLOSED' || opp.status === 'FILLED'}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {applying ? 'Applying…' : 'Apply now'} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary">
              <CheckCircle weight="fill" className="h-4 w-4" /> Application submitted
            </div>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).catch(() => {});
              toast.success('Link copied');
            }}
            className="rounded-xl border border-border p-2.5 hover:bg-muted/50 transition-colors"
            title="Share"
          >
            <ShareNetwork className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab({ applications }: { applications: any[] }) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-white shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <BookmarkSimple className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-semibold text-foreground">No applications yet</h4>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Browse opportunities above and apply — your applications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div key={app.id} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-lg">
            {countryFlag(app.opportunity?.country ?? '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {app.opportunity?.title ?? app.opportunity?.type ?? 'Opportunity'}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
              {app.opportunity?.partner?.name && (
                <span className="flex items-center gap-1">
                  <Buildings className="h-3 w-3" /> {app.opportunity.partner.name}
                </span>
              )}
              {app.opportunity?.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {app.opportunity.country}
                </span>
              )}
              <span>Applied {new Date(app.appliedAt ?? app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <Badge variant={applicationStatusVariant(app.status)} className="text-xs shrink-0">
            {app.status?.replace(/_/g, ' ') ?? 'Pending'}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const router = useRouter();
  const { me, engagement } = useUser();

  const [tab, setTab] = useState<'browse' | 'applied'>('browse');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterProfession, setFilterProfession] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [opps, apps] = await Promise.allSettled([
          api.getOpportunities(),
          me ? api.getMyApplications(me.id) : Promise.resolve([]),
        ]);
        setOpportunities(opps.status === 'fulfilled' ? opps.value ?? [] : []);
        setApplications(apps.status === 'fulfilled' ? apps.value ?? [] : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [me]);

  async function handleApply(opportunityId: string) {
    if (!me) {
      toast.error('Please complete your profile first.');
      return;
    }
    setApplying(opportunityId);
    try {
      await api.applyToOpportunity(opportunityId, me.id);
      toast.success('Application submitted! Your consultant will follow up.');
      const apps = await api.getMyApplications(me.id);
      setApplications(apps);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to apply. Please try again.');
    } finally {
      setApplying(null);
    }
  }

  const appliedIds = new Set(applications.map((a) => a.opportunityId ?? a.opportunity?.id));

  const countries = [...new Set(opportunities.map((o) => o.country).filter(Boolean))];
  const professions = [...new Set(opportunities.map((o) => o.profession).filter(Boolean))];

  const filtered = opportunities.filter((o) => {
    if (filterCountry && o.country !== filterCountry) return false;
    if (filterProfession && o.profession !== filterProfession) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.title ?? o.type ?? '').toLowerCase().includes(q) ||
        (o.country ?? '').toLowerCase().includes(q) ||
        (o.partner?.name ?? '').toLowerCase().includes(q) ||
        (o.description ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <OpportunitiesSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Opportunities"
        subtitle="Explore placements in UAE, UK, US, Ireland and more. Your consultant handles applications on your behalf."
      />

      {/* No engagement notice */}
      {!engagement && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Briefcase className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Engagement required to apply</p>
            <p className="text-xs text-amber-700">Book a consultation to open your case — your consultant will then manage applications with you.</p>
          </div>
          <button
            onClick={() => router.push('/bookings')}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
          >
            Book now <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['browse', 'applied'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 pt-1 mr-6 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'browse' ? 'Browse' : 'My Applications'}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
              tab === t ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {t === 'browse' ? opportunities.length : applications.length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'applied' ? (
        <ApplicationsTab applications={applications} />
      ) : (
        <>
          {/* Search + filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles, countries, hospitals…"
                className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {countries.length > 0 && (
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="h-10 appearance-none rounded-xl border border-border bg-white pl-9 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All countries</option>
                  {countries.map((c) => <option key={c} value={c}>{countryFlag(c)} {c}</option>)}
                </select>
              </div>
            )}
            {professions.length > 0 && (
              <div className="relative">
                <FunnelSimple className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filterProfession}
                  onChange={(e) => setFilterProfession(e.target.value)}
                  className="h-10 appearance-none rounded-xl border border-border bg-white pl-9 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All professions</option>
                  {professions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Stats */}
          {(filterCountry || filterProfession || search) && (
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {opportunities.length} opportunities
              {filterCountry && ` in ${filterCountry}`}
              {filterProfession && ` for ${filterProfession}`}
            </p>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
              <Globe className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h4 className="font-semibold text-foreground">No opportunities found</h4>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {search || filterCountry || filterProfession
                  ? 'Try adjusting your filters or search term.'
                  : 'New placements are added regularly. Check back soon or ask your consultant.'}
              </p>
              {(search || filterCountry || filterProfession) && (
                <button
                  onClick={() => { setSearch(''); setFilterCountry(''); setFilterProfession(''); }}
                  className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  applied={appliedIds.has(opp.id)}
                  onApply={handleApply}
                  applying={applying === opp.id}
                />
              ))}
            </div>
          )}

          {/* Consultant note */}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Your consultant manages the full application and licensing process on your behalf.
              Submitting an application here notifies your consultant to begin the process — no direct employer contact is required from you.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
