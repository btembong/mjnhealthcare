'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Skeleton } from '@mjn/ui';
import {
  GraduationCap, MapPin, Buildings, ArrowRight, MagnifyingGlass,
  CheckCircle, X, Globe, BookOpen, Student, CalendarBlank,
  Certificate, FunnelSimple, PaperPlaneTilt,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

// ── Helpers ────────────────────────────────────────────────────────────────────

function countryFlag(country: string) {
  const map: Record<string, string> = {
    UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', USA: '🇺🇸', Nigeria: '🇳🇬',
    Ghana: '🇬🇭', Kenya: '🇰🇪', Ireland: '🇮🇪', Canada: '🇨🇦', Cameroon: '🇨🇲',
    France: '🇫🇷', Germany: '🇩🇪', Australia: '🇦🇺',
  };
  return map[country] ?? '🌍';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function InternshipsSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-80" /></div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Internship Card ───────────────────────────────────────────────────────────

function InternshipCard({
  item, applied, onApply, applying,
}: {
  item: any;
  applied: boolean;
  onApply: (id: string) => void;
  applying: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
      applied ? 'border-primary/30' : 'border-border'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-lg">
              {countryFlag(item.country ?? '')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{item.title ?? item.type ?? 'Internship'}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {item.institution && (
                  <span className="flex items-center gap-1"><Buildings className="h-3 w-3" /> {item.institution}</span>
                )}
                {item.country && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.country}</span>
                )}
                {item.duration && (
                  <span className="flex items-center gap-1"><CalendarBlank className="h-3 w-3" /> {item.duration}</span>
                )}
              </div>
            </div>
          </div>
          {applied && (
            <span className="text-xs font-semibold text-primary flex items-center gap-0.5 shrink-0">
              <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Applied
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.field && (
            <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              {item.field}
            </span>
          )}
          {item.stipend && (
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              {item.stipend}
            </span>
          )}
          {item.type === 'ABROAD' && (
            <span className="rounded-full border border-[#00A896]/30 bg-[#00A896]/10 px-2.5 py-1 text-xs font-semibold text-[#00A896]">
              International
            </span>
          )}
        </div>

        {!applied ? (
          <button
            onClick={() => onApply(item.id)}
            disabled={applying}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {applying ? 'Applying…' : <><PaperPlaneTilt className="h-4 w-4" /> Apply</>}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary">
            <CheckCircle weight="fill" className="h-4 w-4" /> Application submitted
          </div>
        )}
      </div>
    </div>
  );
}

// ── University Card ───────────────────────────────────────────────────────────

function UniversityCard({ program }: { program: any }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
          {countryFlag(program.country ?? '')}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{program.name ?? program.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {program.university && <span>{program.university}</span>}
            {program.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {program.country}</span>}
          </div>
        </div>
      </div>

      {program.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{program.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {program.level && (
          <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs">{program.level}</span>
        )}
        {program.duration && (
          <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs">{program.duration}</span>
        )}
        {program.tuitionRange && (
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            {program.tuitionRange}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => toast.info('Contact your consultant to begin your application for this program.')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5" /> Learn more
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InternshipsPage() {
  const router = useRouter();
  const { me, engagement } = useUser();

  const [tab, setTab] = useState<'internships' | 'university'>('internships');
  const [internships, setInternships] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [intRes, progRes] = await Promise.allSettled([
          api.getInternships(),
          api.getUniversityPrograms(),
        ]);
        setInternships(intRes.status === 'fulfilled' ? intRes.value ?? [] : []);
        setPrograms(progRes.status === 'fulfilled' ? progRes.value ?? [] : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleApply(internshipId: string) {
    if (!me) {
      toast.error('Please complete your profile first.');
      return;
    }
    setApplying(internshipId);
    try {
      await api.applyForInternship(internshipId, me.id);
      toast.success('Application submitted! Your consultant will be in touch.');
      setAppliedIds((prev) => new Set([...prev, internshipId]));
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to apply. Please try again.');
    } finally {
      setApplying(null);
    }
  }

  const internshipCountries = [...new Set(internships.map((i) => i.country).filter(Boolean))];

  const filteredInternships = internships.filter((i) => {
    if (filterCountry && i.country !== filterCountry) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (i.title ?? i.type ?? '').toLowerCase().includes(q) ||
        (i.country ?? '').toLowerCase().includes(q) ||
        (i.institution ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPrograms = programs.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.name ?? p.title ?? '').toLowerCase().includes(q) ||
      (p.country ?? '').toLowerCase().includes(q) ||
      (p.university ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) return <InternshipsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Support"
        subtitle="Internship placements, study-abroad guidance, and university application assistance."
      />

      {/* Engagement notice */}
      {!engagement && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Student className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Book a consultation first</p>
            <p className="text-xs text-amber-700">Your consultant manages the full application and enrollment process with you.</p>
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
        {([
          { key: 'internships', label: 'Internships', icon: Certificate, count: internships.length },
          { key: 'university', label: 'University Programs', icon: BookOpen, count: programs.length },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 pt-1 mr-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
              tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'internships' ? 'Search internships…' : 'Search programs…'}
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {tab === 'internships' && internshipCountries.length > 0 && (
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-border bg-white pl-9 pr-8 text-sm outline-none focus:border-primary"
            >
              <option value="">All countries</option>
              {internshipCountries.map((c) => <option key={c} value={c}>{countryFlag(c)} {c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {tab === 'internships' ? (
        filteredInternships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
            <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h4 className="font-semibold text-foreground">No internships found</h4>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              {search || filterCountry
                ? 'Try clearing your search or filters.'
                : 'Internship placements are curated for your profile. Contact your consultant for options.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredInternships.map((item) => (
              <InternshipCard
                key={item.id}
                item={item}
                applied={appliedIds.has(item.id)}
                onApply={handleApply}
                applying={applying === item.id}
              />
            ))}
          </div>
        )
      ) : (
        filteredPrograms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <h4 className="font-semibold text-foreground">No programs found</h4>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              University programs are matched to your profile and goals. Your consultant will present suitable options.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredPrograms.map((prog) => (
              <UniversityCard key={prog.id} program={prog} />
            ))}
          </div>
        )
      )}

      {/* Help footer */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4">
        <Student className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          MJN handles your application, credential evaluation (WES), and enrollment support end-to-end.
          You apply here — your consultant takes it from there.
        </p>
      </div>
    </div>
  );
}
