'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, Star, Clock, MapPin } from '@phosphor-icons/react';

const stories = [
  {
    name: 'Constance Che A.',
    fullName: 'Constance Che Abongnueh Epse Afungchui',
    profession: 'Registered Nurse (DHA-Licensed)',
    from: 'Cameroon',
    to: 'Dubai, UAE',
    pathway: 'DHA Licensing',
    duration: '4 months',
    outcome: 'DHA-Licensed Registered Nurse, Dubai — passed DHA exam first attempt',
    quote: 'My journey to becoming a DHA-licensed Registered Nurse was smooth and stress-free, all thanks to MJN. From the very beginning, they clearly explained every step of the process, and everything happened exactly as they said it would. My process began while I was still in Cameroon. Once my DataFlow report was ready, I traveled to Dubai, took the exam in the second week, and passed on my first attempt. They were more than just consultants — they felt like family. A special thank you to Mme Arrey — words truly fail to express my gratitude.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/constanceche.webp',
  },
  {
    name: 'Atangch Pascaline S.',
    fullName: 'Atangch Pascaline Sirrir',
    profession: 'Registered Nurse',
    from: 'Cameroon',
    to: 'United States',
    pathway: 'NCLEX Eligibility & State Board Application',
    duration: 'Multiple attempts resolved',
    outcome: 'NCLEX eligibility letter approved — after two previous rejections overturned by MJN',
    quote: 'My cases are often extremely challenging, especially when I am at the final step and feeling stuck. MJN has consistently been the bridge that has carried me from the point of giving up to success. My eligibility letter application was returned twice and eventually rejected for not meeting the requirements. But when MJN submitted it, it was approved in no time. MJN, you have earned all my highest recommendations!',
    rating: 5,
    year: '2025',
    flag: '🇺🇸',
    photo: '/atangchpascaline.webp',
  },
  {
    name: 'Jeffrey Asiedu',
    fullName: 'Jeffrey Asiedu',
    profession: 'Registered Nurse (BSN, RN, USRN, DOH-RN)',
    from: 'Ghana',
    to: 'UAE & United States',
    pathway: 'DOH Licensing + NCLEX-RN',
    duration: 'End-to-end mentorship',
    outcome: 'DOH-Licensed RN in UAE + NCLEX-RN passed — dual international licensure',
    quote: 'My journey with MJN Consulting has been truly remarkable. They played a pivotal role in my quest to become an international nurse, providing the support and guidance I needed to obtain my RN licence in the UAE with ease. My association with MJN did not end there — they continued to mentor me throughout my NCLEX journey, from the very beginning to the final steps. Thanks to their immense support and expertise, I successfully passed the NCLEX exam. Working with MJN Consulting has been an absolute pleasure.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/jeffreyasiedu.webp',
  },
  {
    name: 'Vonvog Langmia N.',
    fullName: 'Vonvog Langmia Njei',
    profession: 'Registered Nurse (BSN, RN, USRN, DOH-RN)',
    from: 'Cameroon',
    to: 'UAE',
    pathway: 'DataFlow Verification + DOH Licensing',
    duration: 'Extended — MJN stayed committed throughout',
    outcome: 'DOH-Licensed Registered Nurse, UAE — despite delays and DataFlow setbacks',
    quote: 'I am writing to express my heartfelt appreciation to MJN and Ma\'am Arrey for your exceptional patience, unwavering support, and diligent follow-up, which ultimately led to my success. I vividly recall the challenges — the delays, the frustrations, and my failure to respond promptly to the DataFlow verification process. Despite these hurdles, you remained steadfast and committed. May God continue to bless your team with the spirit of dedication.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/vonvonglangmia.webp',
  },
  {
    name: 'Tita M. Louis',
    fullName: 'Tita M. Louis',
    profession: 'Staff Nurse (DOH-Licensed)',
    from: 'Cameroon',
    to: 'Abu Dhabi, UAE',
    pathway: 'DOH Licensing + Job Placement',
    duration: 'Full-service from Cameroon to Abu Dhabi placement',
    outcome: 'DOH Staff Nurse, Abu Dhabi — DataFlow managed from Cameroon, welcomed on arrival, CV prepared',
    quote: 'The benefits of MJN Healthcare Consulting cannot be overemphasised — her services are just the best. I was followed up through DataFlow, supported from my country, received on arrival, and helped to build a powerful CV for job search. The care and attention at every stage was something I had not experienced anywhere else.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/titam.webp',
  },
  {
    name: 'Sarah Danso',
    fullName: 'Sarah Danso',
    profession: 'Staff Nurse (DHA-Licensed)',
    from: 'Ghana',
    to: 'Dubai, UAE',
    pathway: 'DHA Licensing',
    duration: 'Full documentation support',
    outcome: 'DHA-Licensed Staff Nurse, Dubai — full documentation and placement support',
    quote: 'MJN Healthcare Consulting has been the best link to me — contributing to my successful documentation and the assurance of arriving at my desired destination. Their patience, teamwork skills, and good communication is the best.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/sarahdanso.webp',
  },
  {
    name: 'Richard',
    fullName: 'Richard',
    profession: 'Staff Nurse (DHA-Licensed)',
    from: 'Ghana',
    to: 'Dubai, UAE',
    pathway: 'DataFlow Verification + DHA Licensing',
    duration: 'Under 2 months',
    outcome: 'DHA-Licensed Staff Nurse, Dubai — licence secured in under 2 months',
    quote: 'I thank MJN Healthcare Consulting so much for their immense contribution towards my DataFlow processing and licence application. Despite the difficulty, they stood by me from the beginning till I had my licence in less than two months.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
    photo: '/richard.webp',
  },
  {
    name: 'Christelle N.',
    profession: 'Registered Nurse',
    from: 'Yaoundé, Cameroon',
    to: 'Dubai, UAE',
    pathway: 'DHA Licensing',
    duration: '4 months',
    outcome: 'Staff Nurse, Dubai Hospital Group — AED 9,500/month + accommodation',
    quote: 'I had tried the DataFlow process on my own for 8 months and got nowhere. MJN took over everything and had my DHA licence in 4 months. The difference was having someone who knew exactly what the case officers expected.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
  },
  {
    name: 'Dr. Raymond T.',
    profession: 'General Practitioner',
    from: 'Douala, Cameroon',
    to: 'London, UK',
    pathway: 'GMC Registration + NHS Placement',
    duration: '11 months',
    outcome: 'GP Registrar, NHS Foundation Trust — Band 7 equivalent',
    quote: 'The GMC PLAB process is brutal if you do not know the system. My MJN consultant had gone through it personally as a Cameroonian doctor. She knew exactly which PLAB 2 centres to apply to, how to prepare my portfolio, and which trusts had active overseas recruitment. I would not have done it without MJN.',
    rating: 5,
    year: '2025',
    flag: '🇬🇧',
  },
  {
    name: 'Patience A.',
    profession: 'Registered Nurse',
    from: 'Kumba, Cameroon',
    to: 'Dublin, Ireland',
    pathway: 'NMBI Registration + Critical Skills Permit',
    duration: '8 months',
    outcome: 'Staff Nurse, HSE Dublin — husband and two children now in Ireland',
    quote: 'What MJN understood that I did not was that the family piece matters as much as the job. My consultant mapped the Critical Skills permit implications for my husband from the very first call. He is now working in Dublin without needing a separate permit. The whole family moved together.',
    rating: 5,
    year: '2024',
    flag: '🇮🇪',
  },
  {
    name: 'Blaise K.',
    profession: 'ICU Nurse',
    from: 'Bafoussam, Cameroon',
    to: 'Abu Dhabi, UAE',
    pathway: 'DOH / HAAD Licensing',
    duration: '5 months',
    outcome: 'ICU Staff Nurse, Abu Dhabi Teaching Hospital — AED 11,000/month',
    quote: 'I specifically wanted Abu Dhabi because of the DOH hospitals and the salary bands. My consultant knew the difference in requirements between DHA and DOH — most advisors I had spoken to did not. That specificity made all the difference.',
    rating: 5,
    year: '2025',
    flag: '🇦🇪',
  },
  {
    name: 'Sandra O.',
    profession: 'Pharmacist',
    from: 'Lagos, Nigeria',
    to: 'Sharjah, UAE',
    pathway: 'MOH Licensing',
    duration: '3.5 months',
    outcome: 'Clinical Pharmacist, Private Hospital Group — MOH licence (Northern Emirates)',
    quote: 'I had no idea which UAE authority to apply to for pharmacy. DHA, DOH, MOH — the differences were completely unclear to me. My consultant explained it in 10 minutes and had me on the right track immediately. The MOH exam was harder than I expected but the study plan helped.',
    rating: 5,
    year: '2024',
    flag: '🇦🇪',
  },
  {
    name: 'Nurse Fatoumata D.',
    profession: 'Midwife',
    from: 'Conakry, Guinea',
    to: 'London, UK',
    pathway: 'NMC Registration (Midwifery)',
    duration: '13 months',
    outcome: 'Band 6 Midwife, NHS Trust, Birmingham — full OSCE first attempt',
    quote: 'The OSCE is where most midwives from West Africa fail. My consultant prepared me for the UK expectations specifically — how to document, how to communicate with the examiner, what the OSCE stations actually test. I passed first time. Two colleagues who tried without support failed and had to wait 6 months for a second slot.',
    rating: 5,
    year: '2025',
    flag: '🇬🇧',
  },
  {
    name: 'Jean-Marc E.',
    profession: 'Registered Nurse',
    from: 'Ngaoundéré, Cameroon',
    to: 'Houston, US',
    pathway: 'NCLEX-RN + EB-3 Visa Sponsor',
    duration: '18 months',
    outcome: 'RN, Texas Medical Center — EB-3 immigrant visa sponsored',
    quote: 'The US process is long. MJN was honest about that from the start — including the EB-3 retrogression realities for Cameroonians. They helped me choose the right state board, prepared a clean CGFNS submission, and introduced me to three hospital systems. I chose the best offer. 18 months was realistic.',
    rating: 5,
    year: '2024',
    flag: '🇺🇸',
  },
  {
    name: 'Alvine T.',
    profession: 'Physiotherapist',
    from: 'Yaoundé, Cameroon',
    to: 'Dublin, Ireland',
    pathway: 'CORU Registration (Physiotherapy)',
    duration: '9 months',
    outcome: 'Senior Physiotherapist, HSE Regional Hospital',
    quote: 'CORU registration for allied health professionals is less documented than NMBI nurses. Finding accurate information was almost impossible online. MJN had done it before for physios — my consultant knew the exact documentation CORU needed and we had no back-and-forth queries. Smooth from start to finish.',
    rating: 5,
    year: '2025',
    flag: '🇮🇪',
  },
];

const stats = [
  { value: '1,200+', label: 'Professionals placed' },
  { value: '6', label: 'Countries served' },
  { value: '94%', label: 'First-attempt pass rate' },
  { value: '98%', label: 'DataFlow success rate' },
];

const destinations = [
  { flag: '🇦🇪', label: 'UAE', count: '600+', href: '/services/uae' },
  { flag: '🇬🇧', label: 'UK', count: '400+', href: '/services/uk' },
  { flag: '🇮🇪', label: 'Ireland', count: '150+', href: '/services/ireland' },
  { flag: '🇺🇸', label: 'US', count: '200+', href: '/services/us' },
];

export default function SuccessStoriesPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Success Stories
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            1,200+ African Healthcare Professionals. Real Outcomes.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            These are not testimonials we wrote. These are summaries of real engagements — with real timelines, real salaries, and real candour about what worked and why.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-2xl font-extrabold sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-blue-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS FILTER BAR */}
      <section className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">By destination:</span>
            {destinations.map(({ flag, label, count, href }) => (
              <Link
                key={label}
                href={href}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {flag} {label} <span className="text-xs text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {stories.map(({ name, profession, from, to, pathway, duration, outcome, quote, rating, year, flag, photo }) => (
              <div key={name} className={`flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all ${photo ? 'flex-col sm:flex-row' : 'flex-col'}`}>

                {/* Photo panel — stacks on mobile, side panel on sm+ */}
                {photo && (
                  <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-44">
                    <img
                      src={photo}
                      alt={name}
                      className="h-full w-full object-cover [object-position:center_20%] sm:object-top"
                    />
                    {/* Gradient overlay — bottom fade on mobile, right fade on sm+ */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/10 to-transparent sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:w-4 sm:h-auto sm:bg-gradient-to-r sm:from-transparent sm:to-white/10" />
                  </div>
                )}

                <div className="flex flex-col flex-1 min-w-0">
                  {/* Outcome headline — the visual anchor */}
                  <div className="bg-gradient-to-r from-teal-500/10 to-primary/10 border-b border-border px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">Outcome</p>
                    <p className="font-bold text-foreground leading-snug text-sm">{outcome}</p>
                  </div>

                  <div className="flex flex-col gap-4 p-5 flex-1">
                    {/* Person + stars */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{flag}</span>
                          <p className="font-bold text-foreground">{name}</p>
                        </div>
                        <p className="text-sm font-medium text-primary">{profession}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {from} → {to}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-0.5 justify-end">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} weight="fill" className="h-3.5 w-3.5 text-amber-400" />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{year}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{pathway}</span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" /> {duration}
                      </span>
                    </div>

                    {/* Quote */}
                    <blockquote className="border-l-2 border-primary/25 pl-4 text-sm text-muted-foreground leading-relaxed italic flex-1 line-clamp-4 sm:line-clamp-none">
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COULD THIS BE YOU */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Could This Be You?</Badge>
            <h2 className="text-3xl font-bold">The Common Thread in Every Story</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every professional above had the right clinical qualifications. What they were missing was a guide who knew the regulatory system from the inside.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'They had tried on their own first', sub: 'And lost months to preventable errors in documentation or exam prep.' },
              { label: 'They were matched to the right pathway', sub: 'Not a generic plan — a specific route based on their profession, nationality, and target market.' },
              { label: 'Their consultant had done it personally', sub: 'Every MJN advisor has personally completed the process they advise on, as an African professional.' },
            ].map(({ label, sub }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-3 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>
                <p className="font-semibold text-foreground mb-2">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="border-t border-border bg-white px-6 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All stories are based on real client engagements. Names are abbreviated for privacy. Salary figures are as reported at time of placement and are not guarantees of future earnings. Individual outcomes depend on qualifications, exam performance, employer requirements, and regulatory decisions outside MJN&apos;s control — as stated in every client engagement letter.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Your Story Starts With a Conversation</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free 30-minute consultation. We&apos;ll map your specific pathway — honestly, with realistic timelines.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/services/global-placement">View All Services <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
