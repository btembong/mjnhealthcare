'use client';

import * as React from 'react';
import { BookOpen, VideoCamera, FileText, Wrench, DownloadSimple, Clock, Users, ArrowRight } from '@phosphor-icons/react';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'webinars', label: 'Webinars', icon: VideoCamera },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

const libraryItems = [
  { title: 'UAE DHA Application Checklist', type: 'PDF Guide', pages: '12 pages', tag: 'UAE', free: true },
  { title: 'UK NMC Registration — Step by Step', type: 'PDF Guide', pages: '18 pages', tag: 'UK', free: true },
  { title: 'NCLEX 2026 Blueprint Summary', type: 'Study Guide', pages: '24 pages', tag: 'NCLEX', free: false },
  { title: 'DataFlow Document Requirements', type: 'Checklist', pages: '6 pages', tag: 'UAE', free: true },
  { title: 'CGFNS Process Guide (US)', type: 'PDF Guide', pages: '15 pages', tag: 'US', free: false },
  { title: 'Ireland NMBI Application Guide', type: 'PDF Guide', pages: '10 pages', tag: 'Ireland', free: true },
];

const webinarItems = [
  { title: 'DHA Exam 2026 — What Changed', date: 'Jul 22, 2026', time: '6:00 PM WAT', host: 'Dr. Mbeki, DHA Consultant', seats: 47, live: true },
  { title: 'NCLEX for African Nurses — First Attempt Strategy', date: 'Jul 29, 2026', time: '5:00 PM WAT', host: 'Nurse Amara (Passed 2025)', seats: 120, live: true },
  { title: 'UK NHS — What Life is Really Like', date: 'Recorded', time: '52 min replay', host: 'James Osei, London NHS', seats: 0, live: false },
  { title: 'Study Abroad in Ireland — Requirements', date: 'Recorded', time: '38 min replay', host: 'MJN Student Support Team', seats: 0, live: false },
];

const articleItems = [
  { title: 'DHA vs HAAD: Which Exam Should You Take First?', category: 'Licensing', read: '7 min', date: 'Jul 10, 2026' },
  { title: 'Complete Guide to UK NMC Registration for African Nurses', category: 'UK Placement', read: '12 min', date: 'Jul 5, 2026' },
  { title: 'Nurse Salaries in Dubai 2026 — Full Breakdown', category: 'Career', read: '5 min', date: 'Jun 28, 2026' },
  { title: 'How I Passed NCLEX in 75 Questions — My Study Plan', category: 'Exam Prep', read: '9 min', date: 'Jun 20, 2026' },
  { title: 'NCLEX vs CBT: Understanding the Difference', category: 'Exam Prep', read: '6 min', date: 'Jun 14, 2026' },
  { title: 'What Documents You Need Before Starting DataFlow', category: 'UAE Licensing', read: '4 min', date: 'Jun 8, 2026' },
];

const toolItems = [
  { title: 'Exam Eligibility Checker', desc: 'Select your profession + country → see which exams apply and average timeline', icon: '🎯', cta: 'Check Eligibility' },
  { title: 'Document Checklist Generator', desc: 'Pick your destination + profession → get a personalized document checklist to download', icon: '📋', cta: 'Generate Checklist' },
  { title: 'Study Plan Calculator', desc: 'Input your target exam + hours per week → AI builds a personalized study schedule', icon: '📅', cta: 'Build My Plan' },
  { title: 'Licensing Cost Estimator', desc: 'See a breakdown of regulatory, exam, and service fees for any destination', icon: '💰', cta: 'Estimate Costs' },
  { title: 'Salary Comparison Tool', desc: 'Compare nurse and physician salaries across UAE, UK, US, Ireland, and Canada', icon: '📊', cta: 'Compare Salaries' },
  { title: 'Language Assessment Quiz', desc: 'Quick proficiency check to see if you need IELTS/OET prep before your application', icon: '🌐', cta: 'Take Quiz' },
];

const tagColors: Record<string, string> = {
  UAE: 'bg-amber-50 text-amber-700',
  UK: 'bg-blue-50 text-blue-700',
  US: 'bg-red-50 text-red-700',
  Ireland: 'bg-emerald-50 text-emerald-700',
  NCLEX: 'bg-purple-50 text-purple-700',
};

export function ResourcesTabs() {
  const [active, setActive] = React.useState('library');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-1.5 rounded-2xl bg-muted p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
              active === id
                ? 'bg-white text-primary shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Library */}
      {active === 'library' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {libraryItems.map(({ title, type, pages, tag, free }) => (
            <div key={title} className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', tagColors[tag] ?? 'bg-muted text-muted-foreground')}>
                  {tag}
                </span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', free ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary')}>
                  {free ? 'Free' : 'Premium'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground leading-snug">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{type} · {pages}</p>
              </div>
              <button className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                <DownloadSimple className="h-3.5 w-3.5" />
                {free ? 'Download Free' : 'Unlock with Academy'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Webinars */}
      {active === 'webinars' && (
        <div className="grid gap-4 md:grid-cols-2">
          {webinarItems.map(({ title, date, time, host, seats, live }) => (
            <div key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className={cn('inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold', live ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground')}>
                {live ? '● Upcoming Live' : '▶ Recorded'}
              </span>
              <div>
                <p className="font-semibold text-foreground leading-snug">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Hosted by {host}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {date} · {time}</span>
                {live && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {seats} seats left</span>}
              </div>
              <button className="mt-auto text-left text-sm font-medium text-primary">
                {live ? 'Reserve Seat →' : 'Watch Replay →'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Articles */}
      {active === 'articles' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articleItems.map(({ title, category, read, date }) => (
            <div key={title} className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{category}</span>
              <p className="flex-1 font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">{title}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{read} read</span>
                <span>{date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tools */}
      {active === 'tools' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolItems.map(({ title, desc, icon, cta }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <button className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                {cta} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
