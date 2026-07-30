'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';
import {
  CheckCircle,
  ArrowRight,
  Info,
  Phone,
} from '@phosphor-icons/react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Profession = 'nurse' | 'physician';

type LineItem = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  physicianPrice?: number;
  /** If true, only one from the group can be selected (radio behaviour) */
  group?: string;
  /** Show as 1st instalment label */
  instalmentLabel?: string;
  badge?: string;
  recommended?: boolean;
};

type Section = {
  id: string;
  heading: string;
  note?: string;
  items: LineItem[];
};

type Category = {
  id: string;
  label: string;
  color: string; // tailwind bg+text classes
  sections: Section[];
};

// ── Real Catalog ───────────────────────────────────────────────────────────────
const ENGAGEMENT_FEE = 50;

const CATALOG: Category[] = [
  {
    id: 'uae',
    label: 'UAE Licensure',
    color: 'bg-amber-100 text-amber-800',
    sections: [
      {
        id: 'uae-dha',
        heading: 'DHA Pathway',
        items: [
          {
            id: 'uae-dha-dataflow',
            name: 'DHA / MOH DataFlow Verification (3 credentials)',
            desc: 'Primary source verification of academic and professional credentials',
            price: 370,
            physicianPrice: 457,
            recommended: true,
          },
          {
            id: 'uae-dha-fresh-grad',
            name: 'Fresh Graduate DHA Eligibility Assessment',
            desc: 'Eligibility review for recent graduates applying to DHA',
            price: 72,
          },
          {
            id: 'uae-dha-prometric',
            name: 'DHA Prometric Exam',
            desc: 'Exam application and scheduling support',
            price: 240,
          },
          {
            id: 'uae-dha-eligibility-letter',
            name: 'DHA Eligibility Letter',
            desc: 'Eligibility letter procurement and coordination',
            price: 63,
          },
        ],
      },
      {
        id: 'uae-moh',
        heading: 'MOH Pathway',
        items: [
          {
            id: 'uae-moh-application',
            name: 'MOH Application Fee',
            desc: 'Ministry of Health initial application coordination',
            price: 100,
          },
          {
            id: 'uae-moh-att',
            name: 'MOH Authorization To Test (ATT) & Prometric Exam',
            desc: 'ATT obtainment and exam registration support',
            price: 244,
          },
          {
            id: 'uae-moh-eval-cert',
            name: 'MOH Evaluation Certificate',
            desc: 'Certificate processing and follow-up',
            price: 57,
          },
        ],
      },
      {
        id: 'uae-doh',
        heading: 'DOH Pathway (Abu Dhabi)',
        items: [
          {
            id: 'uae-doh-dataflow',
            name: 'DOH DataFlow Verification (3 credentials)',
            desc: 'Primary source verification for Abu Dhabi Department of Health',
            price: 314,
            physicianPrice: 372,
            recommended: true,
          },
          {
            id: 'uae-doh-approval',
            name: 'DOH Exam Approval & ATT',
            desc: 'Exam approval and Authorization To Test coordination',
            price: 46,
          },
          {
            id: 'uae-doh-pv-rn',
            name: 'DOH Pearson VUE Exam — Registered Nurse (RN)',
            desc: 'Exam booking and confirmation support',
            price: 147,
          },
          {
            id: 'uae-doh-pv-an',
            name: 'DOH Pearson VUE Exam — Assistant Nurse (AN)',
            desc: 'Exam booking and confirmation support',
            price: 135,
          },
        ],
      },
      {
        id: 'uae-additional',
        heading: 'Additional Items',
        note: 'Add only what applies to your situation',
        items: [
          {
            id: 'uae-internship-cert',
            name: 'Internship Certificate for Verification (Physicians)',
            desc: 'Verification of internship certificate through DataFlow',
            price: 90,
          },
          {
            id: 'uae-additional-cert',
            name: 'Additional Certificate for Verification',
            desc: 'Each additional credential submitted for DataFlow verification',
            price: 90,
          },
          {
            id: 'uae-nmc-ghana',
            name: 'NMC Ghana Verification Fee',
            desc: 'Ghana Nursing and Midwifery Council verification',
            price: 49,
          },
          {
            id: 'uae-ubuea',
            name: 'University of Buea Verification Fee',
            desc: 'University of Buea academic credential verification',
            price: 46,
          },
          {
            id: 'uae-proc-instate',
            name: 'Processing Fee — In-State Applicant',
            desc: 'MJN processing and coordination fee (in-state)',
            price: 228,
            group: 'uae-processing',
          },
          {
            id: 'uae-proc-intl-1',
            name: 'Processing Fee — International Applicant (1st Instalment)',
            desc: 'First instalment of international applicant processing fee',
            price: 230,
            instalmentLabel: '1st instalment',
            group: 'uae-processing',
          },
          {
            id: 'uae-proc-intl-2',
            name: 'Processing Fee — International Applicant (2nd Instalment)',
            desc: 'Second instalment, due at confirmed placement stage',
            price: 199,
            instalmentLabel: '2nd instalment',
          },
        ],
      },
    ],
  },
  {
    id: 'nclex',
    label: 'NCLEX — USA',
    color: 'bg-purple-100 text-purple-800',
    sections: [
      {
        id: 'nclex-eval',
        heading: 'Credential Evaluation (select one)',
        note: 'ERES, JSA, and CGFNS are alternative evaluation bodies — choose the one required by your target state board.',
        items: [
          {
            id: 'nclex-eres',
            name: 'ERES Evaluation',
            desc: 'Educational Records Evaluation Service — accepted by most state boards',
            price: 480,
            recommended: true,
            group: 'nclex-eval-body',
          },
          {
            id: 'nclex-eres-rush',
            name: 'ERES Rush Evaluation (add-on)',
            desc: 'Expedited processing — add alongside standard ERES',
            price: 180,
          },
          {
            id: 'nclex-jsa',
            name: 'JSA Evaluation',
            desc: 'Josef Silny & Associates credential evaluation',
            price: 400,
            group: 'nclex-eval-body',
          },
          {
            id: 'nclex-jsa-rush',
            name: 'JSA Rush Evaluation (add-on)',
            desc: 'Expedited processing — add alongside standard JSA',
            price: 100,
          },
          {
            id: 'nclex-cgfns',
            name: 'CGFNS Evaluation',
            desc: 'Commission on Graduates of Foreign Nursing Schools — required by some states',
            price: 485,
            group: 'nclex-eval-body',
          },
          {
            id: 'nclex-cgfns-expedite',
            name: 'CGFNS Expedite Service (add-on)',
            desc: 'Priority processing — add alongside standard CGFNS',
            price: 425,
          },
        ],
      },
      {
        id: 'nclex-exam',
        heading: 'Exam & Admin Fees',
        items: [
          {
            id: 'nclex-bon',
            name: 'Board of Nursing Account Creation',
            desc: 'State board account setup and application coordination',
            price: 175,
          },
          {
            id: 'nclex-pearson',
            name: 'Pearson VUE Account Creation',
            desc: 'Pearson VUE account setup and NCLEX scheduling support',
            price: 215,
          },
          {
            id: 'nclex-background',
            name: 'Criminal Background Check',
            desc: 'Required background check coordination',
            price: 185,
          },
          {
            id: 'nclex-booking',
            name: 'NCLEX Exam Booking',
            desc: 'Final exam scheduling and confirmation',
            price: 175,
          },
        ],
      },
      {
        id: 'nclex-processing',
        heading: 'MJN Processing Fee',
        note: 'Paid in two instalments — 1st at engagement, 2nd on receipt of ATT.',
        items: [
          {
            id: 'nclex-proc-1',
            name: 'NCLEX Processing Fee — 1st Instalment',
            desc: 'MJN coordination and case management fee (first payment)',
            price: 355,
            instalmentLabel: '1st instalment',
            recommended: true,
          },
          {
            id: 'nclex-proc-2',
            name: 'NCLEX Processing Fee — 2nd Instalment',
            desc: 'Due on receipt of Authorization To Test (ATT)',
            price: 290,
            instalmentLabel: '2nd instalment',
          },
        ],
      },
    ],
  },
  {
    id: 'student',
    label: 'Student Support',
    color: 'bg-rose-100 text-rose-800',
    sections: [
      {
        id: 'student-eval',
        heading: 'Credential Evaluation',
        items: [
          {
            id: 'student-wes',
            name: 'WES Evaluation (one academic credential)',
            desc: 'World Education Services evaluation — required by most Canadian and US universities',
            price: 301,
            recommended: true,
          },
          {
            id: 'student-wes-additional',
            name: 'WES Additional Evaluation',
            desc: 'Each additional credential submitted to WES',
            price: 50,
          },
        ],
      },
      {
        id: 'student-applications',
        heading: 'University Application Fees',
        note: 'Select how many universities you are applying to.',
        items: [
          {
            id: 'student-app-1',
            name: 'University Admission Application (1 university)',
            desc: 'Application coordination, personal statement review, document preparation',
            price: 100,
            group: 'student-app-count',
          },
          {
            id: 'student-app-2',
            name: 'University Admission Applications (2 universities)',
            desc: 'Application coordination for two institutions',
            price: 200,
            group: 'student-app-count',
          },
        ],
      },
      {
        id: 'student-processing',
        heading: 'MJN Processing Fee',
        note: 'Paid in two instalments — 1st at engagement, 2nd on offer acceptance.',
        items: [
          {
            id: 'student-proc-1',
            name: 'Student Support Processing Fee — 1st Instalment',
            desc: 'MJN coordination and admissions support fee (first payment)',
            price: 350,
            instalmentLabel: '1st instalment',
            recommended: true,
          },
          {
            id: 'student-proc-2',
            name: 'Student Support Processing Fee — 2nd Instalment',
            desc: 'Due on receipt of university offer letter',
            price: 250,
            instalmentLabel: '2nd instalment',
          },
        ],
      },
    ],
  },
];

// Categories where pricing is TBD — link to consultation
const CONSULTATION_CATEGORIES = [
  { id: 'uk', label: 'UK Placement (NMC)', desc: 'NMC registration, NHS job placement, CBT & OSCE preparation' },
  { id: 'ireland', label: 'Ireland — NMBI / IMC', desc: 'NMBI, IMC, CORU registration and Critical Skills permit support' },
  { id: 'academy', label: 'Academy & Exam Prep', desc: 'NCLEX, DHA, HAAD, CBT prep courses and live virtual classes' },
  { id: 'career', label: 'Career & Relocation', desc: 'Career planning, onboarding packages, healthcare staffing, CPD' },
  { id: 'health', label: 'Health Training & Consultation', desc: 'Clinical training programmes across Africa and expert health consultations' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function priceFor(item: LineItem, profession: Profession): number {
  if (profession === 'physician' && item.physicianPrice != null) return item.physicianPrice;
  return item.price;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [profession, setProfession] = useState<Profession>('nurse');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('uae');

  function toggle(item: LineItem) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        // If this item belongs to a radio group, deselect others in same group
        if (item.group) {
          for (const cat of CATALOG) {
            for (const sec of cat.sections) {
              for (const it of sec.items) {
                if (it.group === item.group && it.id !== item.id) {
                  next.delete(it.id);
                }
              }
            }
          }
        }
        next.add(item.id);
      }
      return next;
    });
  }

  // Flatten all items for lookup
  const allItems = useMemo(() => {
    const map = new Map<string, LineItem>();
    for (const cat of CATALOG) {
      for (const sec of cat.sections) {
        for (const item of sec.items) map.set(item.id, item);
      }
    }
    return map;
  }, []);

  const selectedItems = useMemo(() => {
    const result: LineItem[] = [];
    for (const [id, item] of allItems) {
      if (selected.has(id)) result.push(item);
    }
    return result;
  }, [selected, allItems]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + priceFor(item, profession), ENGAGEMENT_FEE);
  }, [selectedItems, profession]);

  const queryString = selectedItems.length
    ? `?services=${encodeURIComponent(selectedItems.map((i) => i.name).join('; '))}&estimate=${subtotal}`
    : '';

  const activeCategory = CATALOG.find((c) => c.id === activeTab);

  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-12 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Transparent Pricing
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
            Build Your Own Engagement
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Select the services you need, see your total upfront, then book a free consultation to confirm your plan with an advisor before any payment.
          </p>
          <p className="mt-3 text-sm text-blue-200/70">
            All prices in USD · $50 engagement fee included in every plan · Regulatory body fees billed separately
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">

        {/* Profession toggle */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-foreground">Your profession <span className="font-normal text-muted-foreground">(affects DataFlow pricing)</span></p>
          <div className="flex rounded-xl border border-border bg-white p-1 shadow-sm">
            {([
              { value: 'nurse', label: 'Nurse / Midwife / Allied Health' },
              { value: 'physician', label: 'Physician / Doctor' },
            ] as { value: Profession; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setProfession(value)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                  profession === value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">

          {/* ── Left: Catalog ─────────────────────────────────────────── */}
          <div>
            {/* Category tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {CATALOG.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === cat.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Active category */}
            {activeCategory && (
              <div className="space-y-8">
                {activeCategory.sections.map((sec) => (
                  <div key={sec.id}>
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-foreground">{sec.heading}</h3>
                      {sec.note && (
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                          {sec.note}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {sec.items.map((item) => {
                        const price = priceFor(item, profession);
                        const isSelected = selected.has(item.id);
                        const isRadio = !!item.group && CATALOG.flatMap(c => c.sections).flatMap(s => s.items).filter(i => i.group === item.group).length > 1;

                        return (
                          <button
                            key={item.id}
                            onClick={() => toggle(item)}
                            className={`relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-150 ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border bg-white hover:border-primary/40 hover:shadow-sm'
                            }`}
                          >
                            {/* Selection indicator */}
                            <div className={`absolute right-3.5 top-3.5 flex h-5 w-5 shrink-0 items-center justify-center transition-all ${
                              isRadio ? 'rounded-full' : 'rounded-full'
                            } border-2 ${
                              isSelected ? 'border-primary bg-primary' : 'border-border bg-white'
                            }`}>
                              {isSelected && <CheckCircle weight="fill" className="h-3.5 w-3.5 text-white" />}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 pr-7">
                              {item.recommended && (
                                <span className="rounded-full bg-primary px-2.5 py-[3px] text-[11px] font-bold tracking-wide text-white shadow-sm shadow-primary/30">
                                  Recommended
                                </span>
                              )}
                              {item.instalmentLabel && (
                                <span className="rounded-full border border-teal-300 bg-teal-50 px-2.5 py-[3px] text-[11px] font-semibold text-teal-700">
                                  {item.instalmentLabel}
                                </span>
                              )}
                              {item.badge && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-[3px] text-[11px] font-semibold text-amber-700">
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-semibold leading-snug text-foreground">{item.name}</p>
                              {item.desc && (
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                              )}
                            </div>

                            <div className="mt-auto pt-1">
                              <span className="text-lg font-bold text-foreground">{fmt(price)}</span>
                              {profession === 'physician' && item.physicianPrice != null && (
                                <span className="ml-1.5 text-[10px] text-muted-foreground">physician rate</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consultation-only categories */}
            <div className="mt-12">
              <h3 className="mb-4 text-base font-bold text-foreground">Other Services — Pricing on Consultation</h3>
              <p className="mb-5 text-sm text-muted-foreground">
                The following services are scoped and priced per engagement during your free consultation, based on your specific situation.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CONSULTATION_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href="/get-started"
                    className="group flex flex-col gap-2 rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                    <span className="mt-auto text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors">
                      Book free consultation →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Sticky summary ─────────────────────────────────── */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-24 rounded-2xl border border-border bg-white shadow-lg shadow-black/5">

              {/* Header */}
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Your Estimate</h3>
                  {selectedItems.length > 0 && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">

                {/* Engagement fee — always shown */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Engagement fee
                    <span className="ml-1 text-[10px] text-muted-foreground/70">(mandatory)</span>
                  </span>
                  <span className="font-semibold text-foreground">{fmt(ENGAGEMENT_FEE)}</span>
                </div>

                {/* Selected items */}
                {selectedItems.length > 0 ? (
                  <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-foreground leading-snug">{item.name}</p>
                          {item.instalmentLabel && (
                            <p className="text-[10px] text-teal-600">{item.instalmentLabel}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-foreground">
                          {fmt(priceFor(item, profession))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                    Select services from the catalog to build your estimate
                  </div>
                )}

                {/* Total */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Estimated total</span>
                    <span className="text-2xl font-extrabold text-primary">{fmt(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Regulatory body fees (DataFlow, Pearson VUE, WES, etc.) are charged directly by those bodies and are not included above.
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-4 space-y-2">
                  <Link
                    href={`/get-started${queryString}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                  >
                    Book Free Consultation <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-center text-[10px] text-muted-foreground">
                    No payment required — confirm your plan with an advisor first
                  </p>
                </div>

                {/* Disclaimer note */}
                <div className="mt-4 flex gap-2 rounded-xl bg-blue-50 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[11px] leading-relaxed text-primary/80">
                    Prices shown are MJN consulting and coordination fees. Third-party regulatory body fees are separate and billed by those bodies directly.
                  </p>
                </div>

                {/* WhatsApp fallback */}
                <a
                  href="https://wa.me/971508638660?text=Hi%2C%20I%27d%20like%20to%20discuss%20pricing%20for%20my%20situation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-emerald-400 hover:text-emerald-600"
                >
                  <Phone className="h-3.5 w-3.5" /> Ask us on WhatsApp instead
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/96 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-primary">{fmt(subtotal)}</p>
              <p className="text-xs text-muted-foreground">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
            </div>
            <Link
              href={`/get-started${queryString}`}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90"
            >
              Book Consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* What's always included */}
      <section className="bg-muted/30 px-6 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-3">Included in every engagement</Badge>
          <h2 className="text-3xl font-bold text-foreground">No surprises, no hidden fees</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Dedicated Consultant',
                desc: 'One assigned advisor manages your full case. You are never passed to a call centre or generic support queue.',
              },
              {
                title: 'Signed Engagement Letter',
                desc: 'A scope-of-work document is signed before any payment. Scope, fees, and exclusions are in writing — no verbal promises.',
              },
              {
                title: 'Real-Time Case Dashboard',
                desc: 'Full visibility into your licensing pipeline, document status, and upcoming deadlines from your client portal.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 text-left shadow-sm">
                <CheckCircle weight="fill" className="mb-3 h-5 w-5 text-teal-500" />
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
