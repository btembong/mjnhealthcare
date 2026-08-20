'use client';

import Link from 'next/link';
import { FloatingNav } from '@mjn/ui';
import * as React from 'react';
import {
  ArrowRight,
  Envelope,
  InstagramLogo,
  FacebookLogo,
  LinkedinLogo,
  XLogo,
  WhatsappLogo,
  Bank,
  AirplaneTakeoff,
  Scroll,
  Compass,
  GraduationCap,
  TrendUp,
  Brain,
  Stethoscope,
  Heartbeat,
  Monitor,
  Sparkle,
  Chalkboard,
  Newspaper,
  Books,
  MonitorPlay,
  Sliders,
  Chats,
  Globe,
  Briefcase,
  House,
  ChartLine,
  FirstAidKit,
  Headset,
  UserCircle,
  UsersThree,
  Handshake,
  Gift,
  CurrencyDollar,
  CheckCircle,
  Copy,
  X,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mjnhealthcare.com') + '/api/v1';

const ICON = 'h-5 w-5';

const navItems = [
  {
    label: 'Services',
    megaMenu: [
      {
        label: 'Global Placement',
        href: '/services/global-placement',
        desc: 'All destinations — UAE, UK, US, Ireland and beyond',
        icon: <Globe className={ICON} />,
      },
      {
        label: 'UAE Licensing',
        href: '/services/uae',
        desc: 'DHA · MOH · DOH · DataFlow verification',
        icon: <Bank className={ICON} />,
      },
      {
        label: 'UK Placement',
        href: '/services/uk',
        desc: 'NMC registration and NHS job placement',
        icon: <AirplaneTakeoff className={ICON} />,
      },
      {
        label: 'US — NCLEX / CGFNS',
        href: '/services/us',
        desc: 'NCLEX-RN, CGFNS, ECFMG credential evaluation',
        icon: <Scroll className={ICON} />,
      },
      {
        label: 'Ireland — NMBI',
        href: '/services/ireland',
        desc: 'NMBI, IMC, CORU registration support',
        icon: <Compass className={ICON} />,
      },
      {
        label: 'Canada — Express Entry & Licensing',
        href: '/services/canada',
        desc: 'Express Entry PR · NNAS/NCLEX · Study Permit',
        icon: <AirplaneTakeoff className={ICON} />,
      },
      {
        label: 'Healthcare Staffing',
        href: '/services/staffing',
        desc: 'Employer matching for licensed professionals',
        icon: <Briefcase className={ICON} />,
      },
      {
        label: 'Career Planning',
        href: '/services/career-planning',
        desc: 'Customised 5-year career roadmap and pathway analysis',
        icon: <ChartLine className={ICON} />,
      },
      {
        label: 'Onboarding & Relocation',
        href: '/services/relocation',
        desc: 'Pre-departure to 90-day settled — practical support',
        icon: <House className={ICON} />,
      },
      {
        label: 'Health Training',
        href: '/services/health-training',
        desc: 'Clinical skills and workforce training across Africa',
        icon: <FirstAidKit className={ICON} />,
      },
      {
        label: 'Book a Consultation',
        href: '/consult',
        desc: 'Health advice or career guidance — live video, pay online',
        icon: <Headset className={ICON} />,
      },
      {
        label: 'Student Support',
        href: '/services/student-support',
        desc: 'Internships, study abroad, university applications',
        icon: <GraduationCap className={ICON} />,
      },
      {
        label: 'CPD Programs',
        href: '/services/cpd',
        desc: 'Continuing professional development for licensed professionals',
        icon: <TrendUp className={ICON} />,
      },
    ],
  },
  {
    label: 'Academy',
    megaMenu: [
      {
        label: 'NCLEX Prep',
        href: '/academy/nclex',
        desc: 'US nursing licensure — English and French support',
        icon: <Brain className={ICON} />,
      },
      {
        label: 'DHA Exam Prep',
        href: '/academy/dha',
        desc: 'Dubai Health Authority licensing exam',
        icon: <Stethoscope className={ICON} />,
      },
      {
        label: 'HAAD / DOH Prep',
        href: '/academy/haad',
        desc: 'Abu Dhabi health authority licensing',
        icon: <Heartbeat className={ICON} />,
      },
      {
        label: 'NMC CBT Prep',
        href: '/academy/cbt',
        desc: 'UK Nursing and Midwifery Council test',
        icon: <Monitor className={ICON} />,
      },
      {
        label: 'AI Study Assistant',
        href: '/academy/ai-tutor',
        desc: 'Personalised study plans powered by Claude AI',
        icon: <Sparkle className={ICON} />,
      },
      {
        label: 'Live Virtual Classes',
        href: '/academy/live',
        desc: 'Small cohort sessions with expert instructors',
        icon: <Chalkboard className={ICON} />,
      },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'About', href: '/about' },
  {
    label: 'Resources',
    megaMenu: [
      {
        label: 'Articles & Blog',
        href: '/blog',
        desc: 'Licensing guides, exam tips, salary breakdowns, and career advice',
        icon: <Newspaper className={ICON} />,
      },
      {
        label: 'Free Books',
        href: '/resources/library',
        desc: 'Downloadable checklists, guides, and regulatory body fee schedules',
        icon: <Books className={ICON} />,
      },
      {
        label: 'Webinars',
        href: '/resources/webinars',
        desc: 'Live and recorded sessions with consultants and placed professionals',
        icon: <MonitorPlay className={ICON} />,
      },
      {
        label: 'Interactive Tools',
        href: '/resources/tools',
        desc: 'Eligibility checker, cost estimator, study plan calculator',
        icon: <Sliders className={ICON} />,
      },
      {
        label: 'Community & Support',
        href: '/resources/community',
        desc: 'Connect with professionals going through the same journey',
        icon: <Chats className={ICON} />,
      },
      {
        label: 'Our Team',
        href: '/team',
        desc: 'Meet the consultants and advisors who manage your engagement',
        icon: <UsersThree className={ICON} />,
      },
      {
        label: 'Partners',
        href: '/partner',
        desc: 'Hospitals, universities, and agencies we place professionals with',
        icon: <Handshake className={ICON} />,
      },
      {
        label: 'Refer & Earn',
        href: '/refer',
        desc: 'Earn $20 cash for every healthcare professional you refer to MJN',
        icon: <Gift className={ICON} />,
      },
    ],
  },
];

// ── Referral Modal ────────────────────────────────────────────────────────────

function ReferralModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ code: string; link: string; alreadyExists?: boolean } | null>(null);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() && !phone.trim()) { setError('Please enter an email or phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/public-referral/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result?.link) return;
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed left-4 top-1/2 z-[201] w-[340px] max-w-[calc(100vw-2rem)] -translate-y-1/2 rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#00A896] px-5 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Gift className="h-5 w-5 text-white" />
              <h2 className="text-base font-bold text-white">Refer & Earn $20</h2>
            </div>
            <p className="text-xs text-white/80">Share your link — get paid when they join.</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Full name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Phone number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                />
              </div>
              <p className="text-[11px] text-slate-400">At least one of email or phone required.</p>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C81]/90 disabled:opacity-60"
              >
                {loading ? 'Generating…' : (
                  <><CurrencyDollar className="h-4 w-4" /> Get my referral link</>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-600" weight="fill" />
              </div>
              <h3 className="mb-1 font-bold text-slate-900">
                {result.alreadyExists ? 'Welcome back!' : 'Your link is ready!'}
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Share it — earn <strong>$20</strong> per person who joins and pays.
              </p>
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="flex-1 truncate text-left text-xs font-medium text-[#0F4C81]">{result.link}</span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0F4C81] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0F4C81]/90"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex gap-2">
                <a
                  href={`whatsapp://send?text=Join MJN Health through my link: ${result.link}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
                >
                  Share on WhatsApp
                </a>
                <a
                  href={`/refer/status/${result.code}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Track referrals
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Marketing Nav ─────────────────────────────────────────────────────────────

export function MarketingNav() {
  const [showReferral, setShowReferral] = React.useState(false);

  return (
    <>
      {/* Top info bar — fixed above the FloatingNav */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-white text-xs py-2 px-6 hidden sm:block">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a
              href="mailto:hello@mjnhealthcare.com"
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <Envelope className="h-3.5 w-3.5" />
              hello@mjnhealthcare.com
            </a>
            <a
              href="https://wa.me/971508638660"
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <WhatsappLogo className="h-3.5 w-3.5" />
              +971 50 863 8660
            </a>
          </div>
          <div className="flex items-center gap-3.5">
            <a href="https://instagram.com/mjnhealthcare" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
              <InstagramLogo className="h-3.5 w-3.5" />
            </a>
            <a href="https://facebook.com/mjnhealthcare" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
              <FacebookLogo className="h-3.5 w-3.5" />
            </a>
            <a href="https://linkedin.com/company/mjnhealthcare" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
              <LinkedinLogo className="h-3.5 w-3.5" />
            </a>
            <a href="https://x.com/mjnhealthcare" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">
              <XLogo className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      <FloatingNav
        className="sm:top-8"
        items={navItems}
        cta={
        <div className="flex items-center gap-2.5">
          {/* Sign in */}
          <Link
            href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3002'}/login`}
            className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow"
          >
            <UserCircle className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-primary" />
            Sign In
          </Link>

          {/* Book Free Consultation CTA */}
          <Link
            href="/get-started"
            className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-[#00A896] px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:shadow-primary/40 hover:opacity-95 active:scale-[0.98]"
          >
            Free Consultation
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      }
    />

      {/* Floating gift pill — left edge, vertically centred */}
      <button
        onClick={() => setShowReferral(true)}
        className="fixed left-0 top-1/2 z-[150] -translate-y-1/2 flex items-center gap-2 rounded-r-2xl bg-gradient-to-b from-[#0F4C81] to-[#00A896] px-3 py-4 shadow-lg hover:px-4 transition-all duration-200 group"
        title="Refer & Earn $20"
      >
        <Gift className="h-5 w-5 text-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold text-white transition-all duration-200 group-hover:max-w-[80px]">
          Earn $20
        </span>
      </button>

      {/* Referral modal */}
      {showReferral && <ReferralModal onClose={() => setShowReferral(false)} />}
    </>
  );
}
