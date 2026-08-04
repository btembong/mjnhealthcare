'use client';

import Link from 'next/link';
import { FloatingNav, Button } from '@mjn/ui';
import {
  ArrowRight,
  Envelope,
  Phone,
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
  Info,
} from '@phosphor-icons/react';

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
    ],
  },
];

export function MarketingNav() {
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
        <div className="flex items-center gap-3">
          {/* Sign in — icon + label, bordered */}
          <Link
            href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3002'}/login`}
            className="group flex items-center gap-1.5 rounded-lg border border-border/70 bg-white px-3 py-2 text-[12.5px] font-medium text-foreground/65 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <UserCircle className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
            Sign in
          </Link>

          {/* Book CTA — square, two-line */}
          <Link
            href="/get-started"
            className="flex h-11 w-[72px] flex-col items-center justify-center rounded-lg bg-primary text-center text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
          >
            <span className="text-[11px] font-bold leading-tight tracking-tight">Book Free</span>
            <span className="text-[11px] font-bold leading-tight tracking-tight">Consultation</span>
          </Link>
        </div>
      }
    />
    </>
  );
}
