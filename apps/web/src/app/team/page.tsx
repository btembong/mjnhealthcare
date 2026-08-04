'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight } from '@phosphor-icons/react';

export const members = [
  {
    slug: 'mbout-john-nyah',
    name: 'Mbout John Nyah',
    role: 'CEO & Founder',
    initials: 'MJN',
    location: 'Cameroon',
    flag: '🇨🇲',
    background: 'BSN · SRN · USRN · Founder of MJN Healthcare Academy and Professional Services',
    bio: 'John Nyah founded MJN Healthcare Academy and Professional Services to bridge the gap between African healthcare professionals and international licensing opportunities. As a BSN-trained, State Registered Nurse with US RN licensure, he brings first-hand experience of the international licensing process — building MJN from the ground up to ensure every client is guided by someone who has walked the same path.',
    expertise: ['Strategic Leadership', 'International Licensing', 'US NCLEX Pathway', 'Organisational Development'],
    credibility: 'BSN, SRN, and USRN — founded MJN after personally navigating international nursing licensure.',
    credentials: ['BSN', 'SRN', 'USRN'],
    photo: '/mboutjohn.webp',
  },
  {
    slug: 'arrey-manor-besongngem',
    name: 'Arrey Manor Besongngem',
    role: 'Licensing Officer — Cameroon & West Africa',
    initials: 'AM',
    location: 'Cameroon',
    flag: '🇨🇲',
    background: 'BSN · R.N · Licensing specialist for Cameroon and West African countries',
    bio: 'Arrey Manor leads licensing support for clients from Cameroon and across West Africa, guiding nurses and healthcare professionals through credential evaluation, regulatory body applications, and document submission. His deep familiarity with West African nursing education systems and licensing bodies ensures clients receive accurate, context-specific guidance from the very first step.',
    expertise: ['Credential Evaluation', 'West Africa Licensing', 'Document Preparation', 'Regulatory Body Applications'],
    credibility: 'Specialist in Cameroon and West African licensing pathways with hands-on regulatory experience.',
    credentials: ['BSN', 'R.N'],
    photo: '/arreymanor.webp',
  },
  {
    slug: 'louis-tita-manoji',
    name: 'Louis Tita Manoji',
    role: 'Licensing Officer — Nigeria & East Africa',
    initials: 'LT',
    location: 'Nigeria',
    flag: '🇳🇬',
    background: 'BSN · RN · Licensing specialist for Nigeria and East African countries',
    bio: 'Louis Tita manages licensing engagements for clients from Nigeria and East Africa — one of the highest-volume regions in MJN\'s portfolio. He specialises in navigating country-specific credential verification requirements, NCLEX eligibility timelines, and EB-3 retrogression realities for Nigerian candidates pursuing the US pathway, as well as UAE and UK licensing routes for East African professionals.',
    expertise: ['Nigeria Licensing Pathways', 'East Africa Credential Verification', 'NCLEX Eligibility', 'UAE / UK Licensing'],
    credibility: 'Specialist in Nigeria and East Africa — highest-volume markets in MJN\'s licensing portfolio.',
    credentials: ['BSN', 'RN'],
    photo: '/louistita.webp',
  },
  {
    slug: 'amina-ousseini',
    name: 'Amina Ousseini',
    role: 'Head of Student Support',
    initials: 'AO',
    location: 'Dublin, Ireland',
    flag: '🇮🇪',
    background: 'BSN (University of Ngaoundéré) · NMBI Registered Nurse · Postgraduate Diploma in Healthcare Management (UCD)',
    bio: 'Amina completed her own nursing degree in Cameroon and navigated the NMBI registration and Critical Skills Employment Permit process herself in 2021. She is now based in Dublin, working at an Irish voluntary hospital while leading MJN\'s student support services. She has particular expertise in francophone West and Central African candidates pursuing the Ireland pathway.',
    expertise: ['NMBI Registration', 'Ireland Critical Skills Permit', 'Student Advisory', 'French-Language Support'],
    credibility: 'Completed NMBI + Ireland Critical Skills Permit personally in 2021.',
    credentials: ['NMBI Registered', 'PG Dip UCD', 'BSN'],
    photo: null,
  },
  {
    slug: 'patrick-mbang',
    name: 'Patrick Mbang',
    role: 'Head of Staffing & Employer Relations',
    initials: 'PM',
    location: 'London, UK',
    flag: '🇬🇧',
    background: 'MBA (University of Bath) · Former NHS HR Director · 15 years international healthcare recruitment',
    bio: 'Patrick brings an employer perspective that most recruitment agencies lack — he spent 8 years on the NHS trust side managing overseas nurse recruitment before joining MJN. He built the employer partner network from 12 to 80+ institutions and designed the placement compliance documentation package that reduced employer onboarding friction significantly.',
    expertise: ['NHS Employer Relations', 'Healthcare Recruitment', 'Employment Contracts', 'Partner Development'],
    credibility: '8 years inside NHS trusts as HR director. Built 80+ institution employer network.',
    credentials: ['MBA Bath', 'Former NHS HR', '15 yrs Recruitment'],
    photo: null,
  },
  {
    slug: 'raissa-fombe',
    name: 'Dr. Raïssa Fombe',
    role: 'Head of Health Training',
    initials: 'RF',
    location: 'Douala, Cameroon',
    flag: '🇨🇲',
    background: 'MD (FMSB Yaoundé) · MPH (Tulane University) · WHO West Africa Fellow · 10 years health systems work',
    bio: 'Raïssa leads MJN\'s Africa-based health training division, bringing a public health systems perspective to clinical workforce development. She has designed training programmes for Ministry of Health teams in Cameroon and Nigeria, and led WHO-funded IPC training during the 2022 outbreak response. She holds a Master of Public Health from Tulane University.',
    expertise: ['Health Systems Strengthening', 'Community Health Training', 'Public Health Emergency Preparedness', 'WHO Frameworks'],
    credibility: 'Led WHO-funded IPC training in 2022 outbreak response. MPH Tulane.',
    credentials: ['MD', 'MPH Tulane', 'WHO Fellow'],
    photo: null,
  },
];

const advisors = [
  {
    name: 'Prof. Jean-Claude Assiga',
    role: 'Academic Advisor — Medical Education',
    affiliation: 'Faculty of Medicine and Biomedical Sciences, University of Yaoundé I',
  },
  {
    name: 'Nurse Charlotte Osei',
    role: 'Clinical Advisor — UAE Operations',
    affiliation: 'Senior Staff Nurse, Dubai Health Authority facility; DHA 2018',
  },
  {
    name: 'Barrister Ngozi Adeyemi',
    role: 'Legal Advisor — UK & Irish Operations',
    affiliation: 'Healthcare & Immigration Law, London',
  },
];

export default function TeamPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Our Team
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            We Have Been Where You Are Going
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Every MJN team member has personally navigated the licensing or placement process they now advise on — as an internationally educated professional from Africa.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { city: 'Yaoundé', flag: '🇨🇲', role: 'HQ & Academy' },
              { city: 'Dubai', flag: '🇦🇪', role: 'UAE Operations' },
              { city: 'London', flag: '🇬🇧', role: 'UK Placement' },
              { city: 'Dublin', flag: '🇮🇪', role: 'Ireland Support' },
            ].map(({ city, flag, role }) => (
              <div key={city} className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm backdrop-blur-sm ring-1 ring-white/20">
                <span>{flag}</span>
                <span className="font-semibold text-white">{city}</span>
                <span className="text-blue-200">· {role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP TEAM */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Leadership Team</Badge>
            <h2 className="text-4xl font-bold">Six Specialists. Four Countries.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Each assigned to the service area they know from personal experience — not from a manual.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map(({ slug, name, role, initials, location, flag, credentials, credibility, photo }) => (
              <Link
                key={slug}
                href={`/team/${slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10"
              >
                {/* ── Portrait photo area ── */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  {photo ? (
                    <img src={photo} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="gradient-hero flex h-full w-full items-center justify-center">
                      {/* Decorative orbs */}
                      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/6 blur-2xl" />
                      <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-white/4 blur-xl" />
                      <span className="relative text-6xl font-extrabold tracking-tight text-white/80 select-none">
                        {initials}
                      </span>
                    </div>
                  )}

                  {/* Bottom scrim */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

                  {/* Location badge — bottom left */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/20">
                    <span className="text-sm leading-none">{flag}</span>
                    <span className="text-xs font-semibold text-white">{location}</span>
                  </div>

                  {/* Hover overlay — credibility reveal */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-black/55 p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs font-medium leading-relaxed text-white/85">{credibility}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white">
                      View profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="flex flex-col p-5">
                  <p className="text-base font-bold leading-tight text-foreground">{name}</p>
                  <p className="mt-0.5 text-sm font-medium text-primary">{role}</p>

                  {/* Credential pills */}
                  {credentials && credentials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {credentials.map((c) => (
                        <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ADVISORS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Advisory Board</Badge>
            <h2 className="text-4xl font-bold">External Advisors</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Independent advisors who challenge our thinking, validate clinical content, and provide specialist legal and academic guidance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {advisors.map(({ name, role, affiliation }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {name.split(' ').filter((p: string) => p.length > 2).slice(-2).map((p: string) => p[0]).join('')}
                </div>
                <p className="font-semibold text-foreground">{name}</p>
                <p className="text-xs font-medium text-primary">{role}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{affiliation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-white">
            <div className="relative grid gap-6 sm:grid-cols-2 sm:gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold">Work With Our Team</h2>
                <p className="mt-3 text-blue-100 text-sm leading-relaxed">
                  Book a free consultation. You&apos;ll be assigned to the specialist who knows your destination and profession from personal experience.
                </p>
                <Button size="lg" className="mt-6 rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
              </div>
              <div className="border-t border-white/20 pt-6 sm:border-t-0 sm:border-l sm:pl-10">
                <h2 className="text-3xl font-bold">Join Our Team</h2>
                <p className="mt-3 text-blue-100 text-sm leading-relaxed">
                  We hire consultants who have personally navigated the licensing processes they advise on. If that is you, we want to hear from you.
                </p>
                <Button size="lg" variant="ghost" className="mt-6 text-white hover:bg-white/10 px-0" asChild>
                  <Link href="/careers">View Open Roles <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
