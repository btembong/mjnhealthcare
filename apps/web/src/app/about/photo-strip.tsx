'use client';

// ── Types ─────────────────────────────────────────────────────────────────────

type PhotoItem =
  | { kind: 'photo'; src: string; label: string; sub: string }
  | { kind: 'gradient'; label: string; sub: string; icon: string; gradient: string };

// ── Data — Row 1 ──────────────────────────────────────────────────────────────
// Mix of real photos (team + placed clients) and gradient event cards

const row1: PhotoItem[] = [
  { kind: 'photo', src: '/nyah-ceo.png',          label: 'Mbout John Nyah — Founder',        sub: 'Yaoundé · 2016–present' },
  { kind: 'photo', src: '/arreymanor.webp',        label: 'Arrey Manor — Licensing Officer',   sub: 'Cameroon & West Africa' },
  { kind: 'gradient', label: 'Academy Live Class',        sub: 'Yaoundé · 2025', icon: '🎓', gradient: 'from-[#00A896] to-[#006e62]' },
  { kind: 'photo', src: '/adaeza.webp',            label: 'Ada Eze — DHA Licensed',            sub: 'Dubai · UAE' },
  { kind: 'photo', src: '/constanceche.webp',      label: 'Constance Che — NMC Registered',   sub: 'United Kingdom' },
  { kind: 'gradient', label: 'UAE Licensing Workshop',    sub: 'Dubai · 2024', icon: '🏥', gradient: 'from-[#00A896] to-[#0F4C81]' },
  { kind: 'photo', src: '/hero-nurse.jpg',         label: 'Pre-Departure Briefing',            sub: 'MJN Programme' },
  { kind: 'photo', src: '/louistita.webp',         label: 'Louis Tita — Licensing Officer',   sub: 'Nigeria & East Africa' },
];

// ── Data — Row 2 ──────────────────────────────────────────────────────────────

const row2: PhotoItem[] = [
  { kind: 'photo', src: '/sarahdanso.webp',        label: 'Sarah Danso — NCLEX Passer',        sub: 'US Pathway' },
  { kind: 'gradient', label: 'Ireland NMBI Workshop',     sub: 'Dublin · 2024', icon: '🇮🇪', gradient: 'from-[#006e62] to-[#0F4C81]' },
  { kind: 'photo', src: '/jeffreyasiedu.webp',     label: 'Jeffrey Asiedu — Placed in UK',     sub: 'London NHS' },
  { kind: 'photo', src: '/examhero.jpg',            label: 'DHA Exam Prep Session',             sub: 'MJN Academy' },
  { kind: 'photo', src: '/richard.webp',           label: 'Richard — DHA Licensed',            sub: 'Dubai · UAE' },
  { kind: 'gradient', label: 'Partner Hospital Visit',    sub: 'Dublin · 2024', icon: '🤝', gradient: 'from-[#00A896] to-[#007a6e]' },
  { kind: 'photo', src: '/vonvonglangmia.webp',    label: 'Von Von Glangmia — Placed',         sub: 'International' },
  { kind: 'photo', src: '/atangchpascaline.webp',  label: 'Atang Ch. Pascaline',               sub: 'MJN Graduate' },
];

// ── Card components ───────────────────────────────────────────────────────────

function PhotoCardItem({ item }: { item: PhotoItem }) {
  if (item.kind === 'photo') {
    return (
      <div className="relative flex-shrink-0 w-72 h-48 rounded-2xl overflow-hidden shadow-md bg-muted">
        <img
          src={item.src}
          alt={item.label}
          className="h-full w-full object-cover object-top"
        />
        {/* scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <p className="text-[11px] font-semibold text-white/90 leading-tight">{item.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex-shrink-0 w-72 h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${item.gradient} shadow-md`}>
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute top-5 left-5 text-3xl">{item.icon}</div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
        <p className="text-[11px] font-semibold text-white/90 leading-tight">{item.label}</p>
      </div>
    </div>
  );
}

function PhotoRow({ items, reverse = false }: { items: PhotoItem[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-4 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <PhotoCardItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function PhotoStrip() {
  return (
    <section className="py-10 border-b border-border bg-muted/20 photo-strip-wrap overflow-hidden">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5 px-6">
        Team, events &amp; placed professionals
      </p>
      <div className="space-y-4">
        <PhotoRow items={row1} reverse={false} />
        <PhotoRow items={row2} reverse={true} />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4 px-6">
        Hover to pause
      </p>
    </section>
  );
}
