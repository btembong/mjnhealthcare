'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight,
  CheckCircle,
  CalendarBlank,
  Globe,
  GraduationCap,
  Money,
  ClipboardText,
  Sliders,
  CaretRight,
  Warning,
} from '@phosphor-icons/react';

// ─── ELIGIBILITY CHECKER ──────────────────────────────────────────────────────

const destinations = ['UAE (DHA / MOH / DOH)', 'UK (NMC)', 'US (NCLEX / CGFNS)', 'Ireland (NMBI)', 'Canada (NNAS)', 'Australia (AHPRA)'];
const professions = ['Registered Nurse', 'Medical Doctor / Physician', 'Dentist', 'Pharmacist', 'Physiotherapist', 'Radiographer', 'Lab Technician', 'Other Allied Health'];
const qualLevels = ['Diploma (3-year)', 'Bachelor of Nursing / Medicine (4-year)', 'Master\'s or above', 'Not sure'];

// ─── COST ESTIMATOR ───────────────────────────────────────────────────────────

type CostItem = { label: string; cost: string; note?: string };

const costData: Record<string, Record<string, CostItem[]>> = {
  'UAE (DHA / MOH / DOH)': {
    'Registered Nurse': [
      { label: 'DataFlow verification', cost: '$370', note: 'Primary source verification' },
      { label: 'DHA exam fee', cost: '$286', note: 'Pearson VUE testing fee' },
      { label: 'MJN licensing support', cost: '$350 + $290', note: '2 instalments' },
      { label: 'Visa & Emirates ID', cost: '~$300', note: 'Employer typically covers' },
    ],
    'Medical Doctor / Physician': [
      { label: 'DataFlow verification', cost: '$457', note: 'Primary source verification' },
      { label: 'DHA exam fee', cost: '$408', note: 'Pearson VUE testing fee' },
      { label: 'MJN licensing support', cost: '$350 + $290', note: '2 instalments' },
      { label: 'Visa & Emirates ID', cost: '~$300', note: 'Employer typically covers' },
    ],
  },
  'UK (NMC)': {
    'Registered Nurse': [
      { label: 'NMC application fee', cost: '£140', note: 'One-time registration' },
      { label: 'CBT exam (Pearson)', cost: '£83', note: 'Computer-based test' },
      { label: 'OSCE exam', cost: '£794', note: 'Objective structured clinical exam' },
      { label: 'MJN support', cost: 'Quote on consultation' },
      { label: 'UK visa (Skilled Worker)', cost: '~£719', note: '3-year entry clearance' },
    ],
  },
  'US (NCLEX / CGFNS)': {
    'Registered Nurse': [
      { label: 'CGFNS credentials evaluation', cost: '$485', note: 'Or ERES $480' },
      { label: 'NCLEX-RN exam fee', cost: '$200', note: 'Pearson VUE' },
      { label: 'State board application', cost: '$100–$250', note: 'Varies by state' },
      { label: 'MJN processing support', cost: '$355 + $290', note: '2 instalments' },
    ],
  },
  'Ireland (NMBI)': {
    'Registered Nurse': [
      { label: 'NMBI application fee', cost: '€315', note: 'Decision on registration' },
      { label: 'English language test', cost: '~€220', note: 'IELTS / OET' },
      { label: 'MJN support', cost: 'Quote on consultation' },
      { label: 'Critical Skills Permit', cost: '€1,000', note: 'Employer-sponsored' },
    ],
  },
};

// ─── STUDY PLAN ───────────────────────────────────────────────────────────────

const examWeeks: Record<string, number> = {
  'NCLEX-RN': 12,
  'DHA Exam': 10,
  'HAAD / DOH Exam': 10,
  'NMC CBT': 8,
  'NMBI / CORU': 6,
};

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  // ── Eligibility checker state ──
  const [dest, setDest] = React.useState('');
  const [prof, setProf] = React.useState('');
  const [qual, setQual] = React.useState('');
  const [eligResult, setEligResult] = React.useState<null | 'likely' | 'partial' | 'consult'>(null);

  function runEligibility() {
    if (!dest || !prof || !qual) return;
    if (qual === 'Diploma (3-year)') { setEligResult('partial'); return; }
    if (qual === 'Not sure') { setEligResult('consult'); return; }
    setEligResult('likely');
  }

  // ── Cost estimator state ──
  const [costDest, setCostDest] = React.useState('');
  const [costProf, setCostProf] = React.useState('');
  const costItems = costData[costDest]?.[costProf] ?? null;

  // ── Study plan state ──
  const [exam, setExam] = React.useState('');
  const [hoursPerDay, setHoursPerDay] = React.useState(2);
  const weeks = examWeeks[exam] ?? 0;
  const totalHours = weeks * 7 * hoursPerDay;
  const examDate = React.useMemo(() => {
    if (!exam) return null;
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [exam, weeks]);

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Interactive Tools
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Eligibility Checker. Cost Estimator. Study Plan Calculator.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Free tools to help you understand your pathway before booking a consultation.
            Results are indicative — your dedicated consultant confirms the details.
          </p>
        </div>
      </section>

      {/* TOOL 1 — ELIGIBILITY CHECKER */}
      <section id="eligibility" className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Tool 1</Badge>
              <h2 className="text-2xl font-bold">Eligibility Checker</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Check whether your qualification level and profession are generally eligible for your target destination.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Target destination</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={dest}
                  onChange={e => { setDest(e.target.value); setEligResult(null); }}
                >
                  <option value="">Select destination…</option>
                  {destinations.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Profession</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={prof}
                  onChange={e => { setProf(e.target.value); setEligResult(null); }}
                >
                  <option value="">Select profession…</option>
                  {professions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Qualification level</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={qual}
                  onChange={e => { setQual(e.target.value); setEligResult(null); }}
                >
                  <option value="">Select level…</option>
                  {qualLevels.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
            </div>

            <Button className="mt-5 rounded-xl" onClick={runEligibility} disabled={!dest || !prof || !qual}>
              Check Eligibility
            </Button>

            {eligResult && (
              <div className={`mt-5 rounded-xl border p-4 ${
                eligResult === 'likely' ? 'border-emerald-200 bg-emerald-50' :
                eligResult === 'partial' ? 'border-amber-200 bg-amber-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                {eligResult === 'likely' && (
                  <>
                    <div className="flex items-center gap-2 font-semibold text-emerald-700">
                      <CheckCircle className="h-4 w-4" weight="fill" /> Likely Eligible — subject to document verification
                    </div>
                    <p className="mt-1.5 text-sm text-emerald-700/80">
                      Your qualification and profession are generally accepted for {dest}. The next step is DataFlow or primary-source verification of your documents. Book a free consultation to confirm your specific situation.
                    </p>
                  </>
                )}
                {eligResult === 'partial' && (
                  <>
                    <div className="flex items-center gap-2 font-semibold text-amber-700">
                      <Warning className="h-4 w-4" /> Conditional — diploma holders face additional requirements
                    </div>
                    <p className="mt-1.5 text-sm text-amber-700/80">
                      Some destinations require a 4-year degree or bridging programme for diploma holders. Requirements vary by regulatory body. Book a consultation — some diploma holders are still eligible under bridging routes.
                    </p>
                  </>
                )}
                {eligResult === 'consult' && (
                  <>
                    <div className="flex items-center gap-2 font-semibold text-blue-700">
                      <ClipboardText className="h-4 w-4" /> Consult Required — qualification level needs review
                    </div>
                    <p className="mt-1.5 text-sm text-blue-700/80">
                      We need to review your actual certificate and transcript to determine eligibility. Book a free consultation — this takes 30 minutes and gives you a definitive answer.
                    </p>
                  </>
                )}
                <Link href="/get-started" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Book free consultation to confirm <CaretRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TOOL 2 — COST ESTIMATOR */}
      <section id="cost" className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <Money className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Tool 2</Badge>
              <h2 className="text-2xl font-bold">Cost Estimator</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Indicative cost breakdown by destination and profession. Employer-covered items are noted separately.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Destination</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={costDest}
                  onChange={e => { setCostDest(e.target.value); setCostProf(''); }}
                >
                  <option value="">Select destination…</option>
                  {Object.keys(costData).map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Profession</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={costProf}
                  onChange={e => setCostProf(e.target.value)}
                  disabled={!costDest}
                >
                  <option value="">Select profession…</option>
                  {costDest && Object.keys(costData[costDest] ?? {}).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {costItems && (
              <div className="mt-5">
                <div className="space-y-2">
                  {costItems.map(({ label, cost, note }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        {note && <p className="text-xs text-muted-foreground">{note}</p>}
                      </div>
                      <span className="font-bold text-primary">{cost}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Figures are estimates based on current regulatory body fees and MJN published pricing. Exchange rates and third-party fees may vary. Your engagement letter locks in MJN fees at the quoted rate.
                </p>
                <Button className="mt-4 rounded-xl" asChild>
                  <Link href="/pricing">View Full Pricing Breakdown <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            )}

            {!costItems && costDest && costProf && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Pricing for this combination is provided on consultation. <Link href="/get-started" className="font-semibold underline">Book your free call →</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TOOL 3 — STUDY PLAN CALCULATOR */}
      <section id="study-plan" className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <GraduationCap className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Tool 3</Badge>
              <h2 className="text-2xl font-bold">Study Plan Calculator</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Get a target exam date and total study hours based on your available time per day.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Target exam</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={exam}
                  onChange={e => setExam(e.target.value)}
                >
                  <option value="">Select exam…</option>
                  {Object.keys(examWeeks).map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Study hours per day: <span className="font-bold text-primary">{hoursPerDay}h</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={hoursPerDay}
                  onChange={e => setHoursPerDay(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>1h (working full-time)</span>
                  <span>8h (full-time study)</span>
                </div>
              </div>
            </div>

            {exam && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Recommended prep time</p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">{weeks} weeks</p>
                </div>
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total study hours</p>
                  <p className="mt-1 text-2xl font-extrabold text-teal-700">{totalHours}h</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Target exam date</p>
                  <p className="mt-1 text-lg font-extrabold text-amber-700 leading-tight">{examDate}</p>
                </div>
              </div>
            )}

            {exam && (
              <div className="mt-5 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
                This is an indicative timeline based on average first-attempt pass rates across MJN Academy cohorts. Your personalised study plan — with weak-area detection, question-bank rotation, and milestone check-ins — is built in the portal after enrollment.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button className="rounded-xl" asChild>
                <Link href="/academy">Browse Academy Courses <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/get-started">Talk to a Consultant</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative">
              <Sliders className="mx-auto mb-4 h-10 w-10 text-teal-300" />
              <h2 className="text-3xl font-bold">Tools give estimates. Consultants give answers.</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Book a free 30-minute call and get a definitive pathway map for your specific qualifications and destination.
              </p>
              <Button size="lg" className="mt-7 rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
