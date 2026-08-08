import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';
import { members, advisors, processingOfficers } from './data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  return (
    <>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
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
          <p className="mt-5 max-w-2xl text-lg text-blue-100 leading-relaxed">
            Every MJN team member has personally navigated the licensing or placement process they now advise on —
            as an internationally educated professional from Africa.
          </p>

          {/* Office locations */}
          <div className="mt-8 flex flex-wrap gap-3">
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

      {/* ── TRUST STATS ──────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
            {[
              { value: '6', label: 'Specialists on staff' },
              { value: '4', label: 'Countries represented' },
              { value: '5,000+', label: 'Clients guided' },
              { value: '80+', label: 'Employer partners' },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-6 text-center">
                <p className="text-2xl font-extrabold text-primary sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY FIRST-HAND EXPERIENCE MATTERS ────────────────────────────── */}
      <section className="bg-muted/20 border-b border-border px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Why It Matters</Badge>
            <h2 className="text-3xl font-bold">Advisors Who Have Done It. Not Just Studied It.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm leading-relaxed">
              Most licensing agencies hire administrative staff who follow a checklist. MJN hires professionals
              who navigated the exact process before they advised on it.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: '🧭',
                title: 'Real Pathway Knowledge',
                desc: 'When our advisor tells you what to expect from a DataFlow submission or NMBI application, they are recalling their own experience — not reading from a guide they were handed on day one.',
              },
              {
                icon: '🌍',
                title: 'African Context Built In',
                desc: 'Our team understands the realities of African nursing education, document attestation from Cameroon, Nigeria, and Kenya, and the specific challenges francophone candidates face at English-language regulatory bodies.',
              },
              {
                icon: '⚖️',
                title: 'Honest About What Takes Time',
                desc: 'Because our consultants have been through it themselves, they will not give you unrealistic timelines. They know exactly where delays happen and how to prevent them.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-xl">
                  {icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERSHIP TEAM ──────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Leadership Team</Badge>
            <h2 className="text-3xl font-bold">Six Specialists. Four Countries.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm">
              Each assigned to the service area they know from personal experience — not from a manual.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Link
                key={member.slug}
                href={`/team/${member.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8 hover:ring-primary/20"
              >
                {/* Photo / avatar — square */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="gradient-hero flex h-full w-full items-center justify-center">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/8 blur-2xl" />
                      <div className="pointer-events-none absolute -bottom-8 -left-6 h-32 w-32 rounded-full bg-white/5 blur-xl" />
                      <span className="relative text-5xl font-extrabold tracking-tight text-white/80 select-none">
                        {member.initials}
                      </span>
                    </div>
                  )}

                  {/* Bottom scrim */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Location badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
                    <span className="text-sm leading-none">{member.flag}</span>
                    <span className="text-xs font-semibold text-white">{member.location}</span>
                  </div>

                  {/* Language badges — top right */}
                  <div className="absolute right-3 top-3 flex gap-1">
                    {member.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-primary">{member.role}</p>

                  {/* Credibility — always visible */}
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {member.credibility}
                  </p>

                  {/* Credential pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {member.credentials.map((c) => (
                      <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Expertise chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.expertise.slice(0, 2).map((e) => (
                      <span key={e} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {e}
                      </span>
                    ))}
                    {member.expertise.length > 2 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        +{member.expertise.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* View profile link */}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View full profile
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESSING OFFICERS ──────────────────────────────────────────── */}
      <section className="bg-muted/20 border-t border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Processing Officers</Badge>
            <h2 className="text-3xl font-bold">The Team Behind Every Submission</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm leading-relaxed">
              Our processing officers handle the administrative execution — submitting documents to regulatory bodies,
              tracking applications, and ensuring nothing falls through the cracks.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {processingOfficers.map((officer) => (
              <div
                key={officer.slug}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-border"
              >
                {/* Photo / avatar */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {officer.photo ? (
                    <img
                      src={officer.photo}
                      alt={officer.name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="gradient-hero flex h-full w-full items-center justify-center">
                      <span className="text-5xl font-extrabold tracking-tight text-white/80 select-none">
                        {officer.initials}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
                    <span className="text-sm leading-none">{officer.flag}</span>
                    <span className="text-xs font-semibold text-white">{officer.location}</span>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1">
                    {officer.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-base font-bold leading-tight text-foreground">{officer.name}</p>
                  <p className="mt-0.5 text-sm font-medium text-primary">{officer.role}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {officer.expertise.map((e) => (
                      <span key={e} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVISORY BOARD ───────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Advisory Board</Badge>
            <h2 className="text-3xl font-bold">Independent Advisors</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm">
              External specialists who challenge our thinking, validate clinical content, and provide legal and academic oversight.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {advisors.map((advisor) => (
              <div key={advisor.name} className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                {/* Avatar */}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {avatarInitials(advisor.name)}
                </div>
                <p className="font-bold text-foreground">{advisor.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-primary">{advisor.role}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{advisor.affiliation}</p>
                {/* Contributes */}
                <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Contributes</p>
                  <p className="text-xs text-foreground leading-relaxed">{advisor.contributes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-8 sm:p-12 text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
            </div>
            <div className="relative grid gap-8 sm:grid-cols-2 sm:gap-12 items-start">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/60">Work With Us</p>
                <h2 className="text-2xl font-bold">Speak to the Right Specialist</h2>
                <p className="mt-3 text-blue-100 text-sm leading-relaxed">
                  Book a free consultation and you will be matched with the team member who knows your
                  destination country and profession from personal experience.
                </p>
                <Link
                  href="/get-started"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
                >
                  Book Free Consultation
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
              <div className="border-t border-white/20 pt-8 sm:border-t-0 sm:border-l sm:pl-12">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/60">Join Us</p>
                <h2 className="text-2xl font-bold">Become a Consultant</h2>
                <p className="mt-3 text-blue-100 text-sm leading-relaxed">
                  We hire consultants who have personally navigated the licensing processes they advise on.
                  If that is you, we want to hear from you.
                </p>
                <Link
                  href="/become-a-consultant"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Apply to Join
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
