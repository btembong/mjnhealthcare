'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight,
  ChatCircle,
  Users,
  Globe,
  WhatsappLogo,
  CheckCircle,
  CalendarBlank,
  Heart,
  Handshake,
  Megaphone,
} from '@phosphor-icons/react';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const groups = [
  {
    name: 'UAE Placement Group',
    flag: '🇦🇪',
    platform: 'WhatsApp',
    members: '1,240+',
    desc: 'Active nurses, physicians, and allied health professionals navigating DHA, DOH, and MOH licensing — sharing timelines, tips, and employer reviews.',
    topics: ['DataFlow updates', 'Exam prep tips', 'Employer reviews', 'Salary insights'],
    color: 'border-amber-200 bg-amber-50/40',
    accent: 'text-amber-700',
    href: '/get-started',
  },
  {
    name: 'UK / NMC Pathway Group',
    flag: '🇬🇧',
    platform: 'WhatsApp',
    members: '870+',
    desc: 'NMC CBT and OSCE preparation, NHS job hunting, and support from nurses already placed in UK trusts. English and French members.',
    topics: ['NMC CBT prep', 'OSCE strategy', 'NHS job boards', 'Tier 2 visa tips'],
    color: 'border-blue-200 bg-blue-50/40',
    accent: 'text-blue-700',
    href: '/get-started',
  },
  {
    name: 'NCLEX Study Group',
    flag: '🇺🇸',
    platform: 'WhatsApp',
    members: '620+',
    desc: 'Daily NCLEX practice questions, NGN item strategy, peer accountability, and support from nurses who have already passed. EN/FR bilingual.',
    topics: ['Daily practice Qs', 'NGN strategies', 'CGFNS guidance', 'Score share / peer support'],
    color: 'border-red-200 bg-red-50/40',
    accent: 'text-red-700',
    href: '/get-started',
  },
  {
    name: 'Ireland / NMBI Group',
    flag: '🇮🇪',
    platform: 'WhatsApp',
    members: '390+',
    desc: 'NMBI registration, Critical Skills Employment Permit, and life in Ireland from nurses who made the move. Primarily francophone members.',
    topics: ['NMBI documents', 'Permit processing', 'Cost of living', 'Employer tips'],
    color: 'border-emerald-200 bg-emerald-50/40',
    accent: 'text-emerald-700',
    href: '/get-started',
  },
  {
    name: 'Students & Interns',
    flag: '🎓',
    platform: 'WhatsApp',
    members: '510+',
    desc: 'For healthcare students planning ahead — internship opportunities, study-abroad advice, and exam preparation before graduation.',
    topics: ['Internship listings', 'Study abroad', 'Early exam prep', 'University applications'],
    color: 'border-purple-200 bg-purple-50/40',
    accent: 'text-purple-700',
    href: '/get-started',
  },
  {
    name: 'MJN General Community',
    flag: '🌍',
    platform: 'WhatsApp',
    members: '2,100+',
    desc: 'Open to all healthcare professionals considering international placement — introductions, general advice, webinar alerts, and MJN announcements.',
    topics: ['Webinar alerts', 'General Q&A', 'Introductions', 'Community updates'],
    color: 'border-teal-200 bg-teal-50/40',
    accent: 'text-teal-700',
    href: '/get-started',
  },
];

const guidelines = [
  'No spam, advertising, or unsolicited DMs — members report and mods remove immediately',
  'No sharing of documents or personal credentials in the group — use private DM for that',
  'Exam content is peer-discussed — not leaked. Do not share exam questions',
  'Be respectful — members are at different stages and need encouragement, not judgment',
  'MJN consultants moderate groups but are not on-call — for urgent case questions, use the portal',
];

const stories = [
  {
    name: 'Adaeze O.',
    role: 'Nurse · Lagos → Dubai',
    quote: 'The UAE group saved my DataFlow. Someone posted the exact attestation chain mistake I was about to make. Passed first attempt.',
  },
  {
    name: 'Jean-Pierre M.',
    role: 'Doctor · Yaoundé → Manchester',
    quote: 'The UK group introduced me to a nurse already working at my trust. She told me what the ward culture was actually like before I signed.',
  },
  {
    name: 'Amara D.',
    role: 'Nurse · Abidjan → Dublin',
    quote: 'The NMBI group is mostly francophone West African nurses. Amina answers questions regularly. It felt like a family that had already gone through it.',
  },
];

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Community & Support
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            5,700+ Professionals Going Through the Same Journey
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Peer support groups for every destination and stage — moderated by MJN consultants who have
            made the same move themselves.
          </p>

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { value: '5,700+', label: 'Community members' },
              { value: '6', label: 'WhatsApp groups' },
              { value: 'EN & FR', label: 'Languages active' },
              { value: 'Free', label: 'Always' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROUPS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-2">WhatsApp Groups</Badge>
            <h2 className="text-3xl font-bold">Join the Group for Your Destination</h2>
            <p className="mt-2 text-muted-foreground">
              Each group is destination- or stage-specific so conversations stay relevant. You can join more than one.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div
                key={g.name}
                className={`flex flex-col overflow-hidden rounded-2xl border ${g.color} shadow-sm`}
              >
                <div className="flex items-center justify-between border-b border-inherit px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.flag}</span>
                    <span className="font-bold text-foreground text-sm leading-snug">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <WhatsappLogo className={`h-4 w-4 ${g.accent}`} weight="fill" />
                    <span className={`text-[11px] font-semibold ${g.accent}`}>{g.members}</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {g.topics.map(t => (
                      <span key={t} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${g.color} ${g.accent} border-current/30`}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <Button className="mt-5 w-full rounded-xl" asChild>
                    <Link href={g.href}>
                      Join Group <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY STORIES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-2">From the Community</Badge>
            <h2 className="text-3xl font-bold">What Members Say</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {stories.map(({ name, role, quote }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-foreground/80 leading-relaxed italic">"{quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {name.split(' ')[0][0]}{name.split(' ')[1]?.[0] ?? ''}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY GUIDELINES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-2">Community Guidelines</Badge>
            <h2 className="text-2xl font-bold">How We Keep the Groups Useful</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              All groups are moderated. These rules protect everyone — especially new members.
            </p>
          </div>
          <div className="space-y-3">
            {guidelines.map((g) => (
              <div key={g} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="fill" />
                <p className="text-sm text-foreground/80">{g}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative grid gap-6 sm:grid-cols-2 sm:gap-10 items-center">
              <div>
                <Users className="mb-3 h-8 w-8 text-teal-300" />
                <h2 className="text-2xl font-bold">Join a Group</h2>
                <p className="mt-2 text-sm text-blue-100 leading-relaxed">
                  Connect with professionals at your destination and stage — peer support from people who have been exactly where you are.
                </p>
                <Button size="lg" className="mt-5 rounded-xl bg-white px-7 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Join the Community</Link>
                </Button>
              </div>
              <div className="border-t border-white/20 pt-6 sm:border-t-0 sm:border-l sm:pl-10">
                <ChatCircle className="mb-3 h-8 w-8 text-teal-300" />
                <h2 className="text-2xl font-bold">Need Personal Guidance?</h2>
                <p className="mt-2 text-sm text-blue-100 leading-relaxed">
                  Community groups are great for peer support. For case-specific advice, book a free 1-on-1 with a consultant.
                </p>
                <Button size="lg" variant="ghost" className="mt-5 text-white hover:bg-white/10 px-0" asChild>
                  <Link href="/get-started">Book Free Consultation <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
