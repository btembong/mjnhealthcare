'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketingNav } from '../../components/marketing-nav';
import {
  ArrowRight, ArrowLeft, CalendarBlank, CheckCircle, Clock,
  CircleNotch, ChatCircle, Warning,
  User, Envelope, Phone, Star,
} from '@mjn/ui';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
const CONSULTATION_RESOURCE_ID = 'general-consultation';
const WA_NUMBER = '971508638660';

// ── Translations ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'fr';
const T = {
  en: {
    hero: 'Book Your Free Consultation',
    hero_sub: 'A dedicated advisor will review your profile and map the fastest route to your goals.',
    step_details: 'Your details',
    step_profile: 'Your situation',
    step_advisor: 'Choose advisor',
    step_slot: 'Choose a time',
    advisor_pick_title: 'Choose your advisor',
    advisor_pick_sub: 'Pick the consultant you\'d like to meet. You\'ll then see their available times.',
    advisors_loading: 'Loading advisors…',
    no_advisors: 'No advisors available right now',
    no_advisors_sub: 'Please try again shortly or reach us on WhatsApp.',
    name: 'Full name',
    name_ph: 'Amara Diallo',
    email: 'Email address',
    email_ph: 'amara@example.com',
    phone: 'WhatsApp / Phone',
    phone_ph: '+237 6XX XXX XXX',
    phone_hint: 'Optional — used only for appointment reminders',
    profession: 'Your profession',
    destination: 'Where do you want to work?',
    service: 'What do you need help with?',
    next: 'Continue',
    back: 'Back',
    book: 'Confirm Booking',
    booking: 'Confirming…',
    slot_date: 'Select a date',
    slot_time: 'Available times',
    slot_tz: 'Your local time',
    no_slots: 'No slots on this day',
    no_slots_sub: 'Try a different date or reach out directly.',
    wa_instead: 'Prefer to book via WhatsApp?',
    wa_btn: 'Book on WhatsApp',
    summary_title: 'Your selected services',
    summary_estimate: 'Estimated total',
    confirmed_title: "You're booked!",
    confirmed_sub: 'A confirmation has been sent to',
    confirmed_check: 'Spam folder just in case',
    prepare_title: 'What to have ready for your call',
    prepare: [
      'Your nursing / medical licence number (if licensed)',
      'Name of your current or most recent employer',
      'Your target country and licensing body',
      'Any previous applications or rejections',
      'Your academic qualification certificates',
    ],
    trust_placed: 'Professionals placed',
    trust_rating: 'Consultation rating',
    trust_countries: 'Destination countries',
    advisor_title: "You'll speak with",
    advisor_line: "She'll review your profile and map the clearest path forward.",
    no_commitment_1: 'No commitment',
    no_commitment_2: 'No payment',
    no_commitment_3: '15-min video call',
    en_fr: 'FR',
  },
  fr: {
    hero: 'Réservez votre consultation gratuite',
    hero_sub: 'Un conseiller dédié examinera votre profil et tracera le chemin le plus rapide vers vos objectifs.',
    step_details: 'Vos coordonnées',
    step_profile: 'Votre situation',
    step_advisor: 'Choisir un conseiller',
    step_slot: 'Choisissez un créneau',
    advisor_pick_title: 'Choisissez votre conseiller',
    advisor_pick_sub: 'Sélectionnez le conseiller que vous souhaitez rencontrer. Vous verrez ensuite ses créneaux disponibles.',
    advisors_loading: 'Chargement des conseillers…',
    no_advisors: 'Aucun conseiller disponible pour le moment',
    no_advisors_sub: 'Réessayez bientôt ou contactez-nous sur WhatsApp.',
    name: 'Nom complet',
    name_ph: 'Amara Diallo',
    email: 'Adresse e-mail',
    email_ph: 'amara@exemple.com',
    phone: 'WhatsApp / Téléphone',
    phone_ph: '+237 6XX XXX XXX',
    phone_hint: 'Facultatif — utilisé uniquement pour les rappels',
    profession: 'Votre profession',
    destination: 'Où souhaitez-vous travailler ?',
    service: "De quoi avez-vous besoin ?",
    next: 'Continuer',
    back: 'Retour',
    book: 'Confirmer la réservation',
    booking: 'Confirmation…',
    slot_date: 'Sélectionnez une date',
    slot_time: 'Créneaux disponibles',
    slot_tz: 'Heure locale',
    no_slots: 'Aucun créneau ce jour',
    no_slots_sub: 'Essayez une autre date ou contactez-nous directement.',
    wa_instead: 'Vous préférez réserver via WhatsApp ?',
    wa_btn: 'Réserver sur WhatsApp',
    summary_title: 'Vos services sélectionnés',
    summary_estimate: 'Total estimé',
    confirmed_title: 'Réservation confirmée !',
    confirmed_sub: 'Une confirmation a été envoyée à',
    confirmed_check: 'Vérifiez aussi vos spams',
    prepare_title: 'Ce que vous devez préparer pour l\'appel',
    prepare: [
      'Votre numéro de licence infirmière / médicale (si licencié)',
      'Nom de votre employeur actuel ou précédent',
      'Votre pays cible et l\'organisme de réglementation',
      'Toute candidature ou refus antérieur',
      'Vos certificats de qualification académique',
    ],
    trust_placed: 'Professionnels placés',
    trust_rating: 'Note de consultation',
    trust_countries: 'Pays de destination',
    advisor_title: 'Vous parlerez avec',
    advisor_line: 'Elle examinera votre profil et tracera le chemin le plus clair.',
    no_commitment_1: 'Sans engagement',
    no_commitment_2: 'Sans paiement',
    no_commitment_3: 'Appel vidéo 15 min',
    en_fr: 'EN',
  },
} as const;

// ── Static data ────────────────────────────────────────────────────────────────
const professionCards = [
  { value: 'Registered Nurse (RN)', label: 'Registered Nurse', sub: 'RN / LPN / NP', icon: '🩺' },
  { value: 'Physician / Doctor', label: 'Physician', sub: 'MD / MBChB / MBBS', icon: '🏥' },
  { value: 'Pharmacist', label: 'Pharmacist', sub: 'BPharm / PharmD', icon: '💊' },
  { value: 'Physiotherapist', label: 'Physiotherapist', sub: 'BSc / MSc Physio', icon: '🦴' },
  { value: 'Radiographer', label: 'Radiographer / MLS', sub: 'Imaging / Lab Science', icon: '🩻' },
  { value: 'Medical / Nursing Student', label: 'Student', sub: 'Nursing / Medicine', icon: '📚' },
  { value: 'Other Allied Health', label: 'Other Allied Health', sub: 'Dentist / OT / SLP…', icon: '🔬' },
];

const destinations = [
  { label: 'UAE', sub: 'DHA / MOH / DOH', flag: '🇦🇪' },
  { label: 'United Kingdom', sub: 'NMC / GMC', flag: '🇬🇧' },
  { label: 'United States', sub: 'NCLEX / CGFNS', flag: '🇺🇸' },
  { label: 'Ireland', sub: 'NMBI / IMC', flag: '🇮🇪' },
  { label: 'Canada', sub: 'NNAS / NCLEX-RN', flag: '🇨🇦' },
  { label: 'Australia', sub: 'AHPRA', flag: '🇦🇺' },
  { label: 'Not sure yet', sub: 'Need guidance', flag: '🌍' },
];

const serviceOptions = [
  { value: 'full-pipeline', label: 'Full licensing & placement support' },
  { value: 'exam-prep', label: 'Exam preparation (NCLEX / DHA / NMC CBT)' },
  { value: 'student-support', label: 'Internship / study-abroad support' },
  { value: 'specific-service', label: 'A specific service (DataFlow, translation…)' },
  { value: 'not-sure', label: 'Not sure — I need advice' },
];

const testimonials = [
  { quote: 'My journey was smooth and stress-free. Everything happened exactly as they said. I passed my DHA exam first attempt.', name: 'Constance Che A.', role: 'DHA Registered Nurse · Dubai, UAE' },
  { quote: 'MJN guided me to my UAE licence, then mentored me through every step of NCLEX. I passed both exams. An absolute pleasure.', name: 'Effery Asiedu', role: 'DOH RN · UAE + USRN' },
];

// ── Types ──────────────────────────────────────────────────────────────────────
type Step = 'details' | 'profile' | 'consultant' | 'slot' | 'confirmed';
type Slot = { id: string; startTime: string; endTime: string };
type Consultant = { id: string; name: string; photoUrl?: string | null; specialty?: string | null };

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function localTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }); }
  catch { return ''; }
}
// Appointment date/time shown in WAT (Africa/Douala), matching the confirmation emails.
function apptDateWAT(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function apptTimeWAT(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false });
}

function validateField(field: string, value: string): string {
  if (field === 'name' && !value.trim()) return 'Name is required';
  if (field === 'email') {
    if (!value.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Enter a valid email address';
  }
  if (field === 'phone' && value.trim() && !/^\+?[\d\s\-().]{7,}$/.test(value)) {
    return 'Enter a valid phone number';
  }
  return '';
}

// Build calendar grid for a given year/month
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateStr(new Date());
  const cells: Array<{ iso: string; day: number; isToday: boolean; isPast: boolean } | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ iso, day: d, isToday: iso === today, isPast: iso < today });
  }
  return cells;
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Inner component (needs useSearchParams) ────────────────────────────────────
function GetStartedInner() {
  const searchParams = useSearchParams();
  const fromServices = searchParams.get('services') ?? '';
  const fromEstimate = searchParams.get('estimate') ?? '';
  const refCode = searchParams.get('ref') ?? '';

  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];

  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [destination, setDestination] = useState('');
  const [serviceInterest, setServiceInterest] = useState('');

  // Inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function blur(field: string, value: string) {
    setTouched(p => ({ ...p, [field]: true }));
    setFieldErrors(p => ({ ...p, [field]: validateField(field, value) }));
  }

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateStr(addDays(today, 1)));
  // Map of date → slot count (populated by fetching each date when consultant is selected)
  const [availability, setAvailability] = useState<Record<string, number>>({});

  // Slot state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState<{ bookingId?: string; name: string; email: string; slotStart: string; consultant?: { name: string; photoUrl?: string; specialty?: string } | null; roomUrl?: string | null } | null>(null);

  // Consultant state
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantsError, setConsultantsError] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);

  const fetchConsultants = useCallback(async () => {
    setConsultantsLoading(true);
    setConsultantsError('');
    try {
      const res = await fetch(`${API}/bookings/general-consultation/consultants`);
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();
      setConsultants(Array.isArray(data) ? data : []);
    } catch {
      setConsultantsError('load_error');
      setConsultants([]);
    } finally {
      setConsultantsLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async (date: string, consultantId?: string) => {
    if (!consultantId) { setSlots([]); return; }
    setSlotsLoading(true);
    setSlotsError('');
    setSelectedSlot(null);
    try {
      const res = await fetch(`${API}/bookings/slots/${CONSULTATION_RESOURCE_ID}?date=${date}&consultantId=${consultantId}`);
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();
      const slotList = Array.isArray(data) ? data : [];
      setSlots(slotList);
      // Update availability map for this date
      setAvailability(prev => ({ ...prev, [date]: slotList.length }));
    } catch {
      setSlotsError('Could not load slots. Please try a different date or book via WhatsApp.');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Pre-fetch availability for all days in the visible month so dots render
  const prefetchMonthAvailability = useCallback(async (year: number, month: number, consultantId: string) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = toDateStr(new Date());
    const fetches = Array.from({ length: daysInMonth }, (_, i) => {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      if (iso <= todayStr) return Promise.resolve();
      return fetch(`${API}/bookings/slots/${CONSULTATION_RESOURCE_ID}?date=${iso}&consultantId=${consultantId}`)
        .then(r => r.ok ? r.json() : [])
        .then((data: Slot[]) => {
          const count = Array.isArray(data) ? data.length : 0;
          setAvailability(prev => ({ ...prev, [iso]: count }));
        })
        .catch(() => {});
    });
    await Promise.all(fetches);
  }, []);

  // Fetch consultants immediately so the sidebar preview is ready on Step 1
  useEffect(() => { fetchConsultants(); }, [fetchConsultants]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    fetchSlots(date, selectedConsultant?.id);
  }

  function handleCalDateSelect(iso: string, isPast: boolean, hasSlots: boolean) {
    if (isPast || hasSlots === false) return;
    setSelectedDate(iso);
    fetchSlots(iso, selectedConsultant?.id);
  }

  function goToProfile() {
    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const phoneErr = validateField('phone', phone);
    setTouched({ name: true, email: true, phone: true });
    setFieldErrors({ name: nameErr, email: emailErr, phone: phoneErr });
    if (nameErr || emailErr || phoneErr) return;
    setError('');
    setStep('profile');
  }

  function goToConsultant() {
    setError('');
    setStep('consultant');
    fetchConsultants();
  }

  function selectConsultant(c: Consultant) {
    setSelectedConsultant(c);
    setSelectedSlot(null);
    setAvailability({});
    setError('');
    setStep('slot');
    fetchSlots(selectedDate, c.id);
    prefetchMonthAvailability(calYear, calMonth, c.id);
  }

  function handleCalNav(dir: 1 | -1) {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
    if (selectedConsultant) prefetchMonthAvailability(y, m, selectedConsultant.id);
  }

  async function handleBook() {
    if (!selectedSlot) { setError('Please select a time slot.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/leads/book-consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          profession: profession || undefined,
          destination: destination || undefined,
          serviceInterest: serviceInterest || undefined,
          selectedServices: fromServices || undefined,
          estimate: fromEstimate || undefined,
          slotId: selectedSlot.id,
          lang,
          refCode: refCode || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong.');
      }
      const resJson = await res.json().catch(() => ({}));
      setConfirmed({ bookingId: resJson.bookingId ?? null, name: name.trim(), email: email.trim(), slotStart: selectedSlot.startTime, consultant: resJson.consultant ?? null, roomUrl: resJson.roomUrl ?? null });
      setStep('confirmed');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = { details: 0, profile: 1, consultant: 2, slot: 3, confirmed: 4 };
  const steps = [t.step_details, t.step_profile, t.step_advisor, t.step_slot];

  const waText = encodeURIComponent(
    lang === 'fr'
      ? `Bonjour, je souhaite réserver une consultation gratuite${profession ? ` (${profession})` : ''}${destination ? ` pour ${destination}` : ''}.`
      : `Hi, I'd like to book a free consultation${profession ? ` (${profession})` : ''}${destination ? ` for ${destination}` : ''}.`
  );

  return (
    <>
      <MarketingNav />

      {/* ── HERO ── */}
      {step !== 'confirmed' && (
        <section className="gradient-hero relative overflow-hidden pt-28 pb-14 text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4">
            {/* Lang toggle */}
            <div className="mb-5 flex justify-end">
              <button
                onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/20"
              >
                {t.en_fr}
              </button>
            </div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <CalendarBlank className="h-4 w-4" />
              {lang === 'en' ? 'Free 15-minute consultation' : 'Consultation gratuite 15 min'}
            </div>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              {t.hero}
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/70">{t.hero_sub}</p>

            {/* ── Stepper ── */}
            <div className="mt-10 flex items-center">
              {steps.map((label, i) => {
                const current = stepIndex[step];
                const done = current > i;
                const active = current === i;
                return (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        done
                          ? 'bg-white text-primary'
                          : active
                          ? 'bg-white text-primary ring-4 ring-white/30 ring-offset-2 ring-offset-transparent'
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {done ? <CheckCircle weight="fill" className="h-5 w-5" /> : i + 1}
                      </div>
                      <span className={`text-xs font-semibold ${active ? 'text-white' : done ? 'text-white/80' : 'text-white/50'}`}>
                        {label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`mx-3 mb-5 h-0.5 w-16 sm:w-24 transition-colors ${current > i ? 'bg-white' : 'bg-white/25'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <main className={`min-h-screen bg-muted/20 px-4 pb-20 ${step === 'confirmed' ? 'pt-24' : 'pt-8'}`}>
        <div className="mx-auto max-w-5xl">

          {/* Two-column layout */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">

            {/* ── Left: form ──────────────────────────────────────────── */}
            <div className="min-w-0">

              {/* ── STEP 1: Details ─────────────────────────────────── */}
              {step === 'details' && (
                <div className="rounded-3xl border border-border bg-white p-7 shadow-sm">
                  {/* Step heading */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 1 of 4</p>
                    <h2 className="mt-1 text-xl font-extrabold text-foreground">{t.step_details}</h2>
                  </div>

                  <div className="space-y-5">

                    {/* Pricing summary from /pricing */}
                    {fromServices && (
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                          {t.summary_title}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{fromServices}</p>
                        {fromEstimate && (
                          <p className="mt-2 text-sm font-bold text-primary">
                            {t.summary_estimate}: ${Number(fromEstimate).toLocaleString()}
                          </p>
                        )}
                        <Link href="/pricing" className="mt-2 block text-xs text-primary/70 hover:text-primary hover:underline">
                          ← Edit selections
                        </Link>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t.name} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onBlur={e => blur('name', e.target.value)}
                          placeholder={t.name_ph}
                          className={`h-11 w-full rounded-xl border bg-muted/30 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                            touched.name && fieldErrors.name ? 'border-rose-400 focus:border-rose-400' : 'border-border focus:border-primary'
                          }`}
                        />
                      </div>
                      {touched.name && fieldErrors.name && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                          <Warning className="h-3 w-3" /> {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t.email} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={e => blur('email', e.target.value)}
                          placeholder={t.email_ph}
                          className={`h-11 w-full rounded-xl border bg-muted/30 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                            touched.email && fieldErrors.email ? 'border-rose-400 focus:border-rose-400' : 'border-border focus:border-primary'
                          }`}
                        />
                      </div>
                      {touched.email && fieldErrors.email && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                          <Warning className="h-3 w-3" /> {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t.phone}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          onBlur={e => blur('phone', e.target.value)}
                          placeholder={t.phone_ph}
                          className={`h-11 w-full rounded-xl border bg-muted/30 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                            touched.phone && fieldErrors.phone ? 'border-rose-400 focus:border-rose-400' : 'border-border focus:border-primary'
                          }`}
                        />
                      </div>
                      {touched.phone && fieldErrors.phone ? (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                          <Warning className="h-3 w-3" /> {fieldErrors.phone}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-muted-foreground">{t.phone_hint}</p>
                      )}
                    </div>

                    <button
                      onClick={goToProfile}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:-translate-y-px hover:bg-primary/90"
                    >
                      {t.next} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* WhatsApp alternative */}
                  <div className="mt-5 border-t border-border pt-5 text-center">
                    <p className="mb-2 text-xs text-muted-foreground">{t.wa_instead}</p>
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-secondary/10"
                    >
                      <ChatCircle className="h-4 w-4" /> {t.wa_btn}
                    </a>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Profile ──────────────────────────────────── */}
              {step === 'profile' && (
                <div className="rounded-3xl border border-border bg-white p-7 shadow-sm">
                  <button
                    onClick={() => setStep('details')}
                    className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> {t.back}
                  </button>

                  {/* Step heading */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 2 of 4</p>
                    <h2 className="mt-1 text-xl font-extrabold text-foreground">{t.step_profile}</h2>
                  </div>

                  <div className="space-y-7">

                    {/* Profession cards */}
                    <div>
                      <label className="mb-3 block text-sm font-bold text-foreground">{t.profession}</label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {professionCards.map(({ value, label, sub, icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setProfession(value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                              profession === value
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border bg-white hover:border-primary/40'
                            }`}
                          >
                            <span className="text-2xl leading-none">{icon}</span>
                            <span className={`text-sm font-semibold leading-tight ${profession === value ? 'text-primary' : 'text-foreground'}`}>
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground leading-tight">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Destination cards */}
                    <div>
                      <label className="mb-3 block text-sm font-bold text-foreground">{t.destination}</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {destinations.map(({ label, sub, flag }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setDestination(label)}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                              destination === label
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border bg-white hover:border-primary/40'
                            }`}
                          >
                            <span className="text-2xl">{flag}</span>
                            <span className={`text-xs font-semibold leading-tight ${destination === label ? 'text-primary' : 'text-foreground'}`}>
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Service interest */}
                    <div>
                      <label className="mb-3 block text-sm font-bold text-foreground">{t.service}</label>
                      <div className="space-y-2">
                        {serviceOptions.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setServiceInterest(value)}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${
                              serviceInterest === value
                                ? 'border-primary bg-primary/5 font-semibold text-primary ring-2 ring-primary/20'
                                : 'border-border bg-white text-foreground hover:border-primary/40'
                            }`}
                          >
                            {/* Proper radio circle */}
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              serviceInterest === value ? 'border-primary' : 'border-muted-foreground/40'
                            }`}>
                              {serviceInterest === value && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic nudge */}
                    {profession && destination && destination !== 'Not sure yet' && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                        <p className="font-semibold">Good choice.</p>
                        <p className="mt-1 text-muted-foreground">
                          {destination === 'UAE' && profession.includes('Nurse')
                            ? 'For nurses targeting UAE, DataFlow verification is typically the first step. Our consultants know this process well and will map your exact pathway on the call.'
                            : destination === 'United Kingdom'
                            ? 'For UK placement, NMC registration and OSCE preparation are the critical milestones. Your advisor will walk you through the full timeline.'
                            : destination === 'United States'
                            ? 'For the US, you\'ll need a credential evaluation (ERES, JSA, or CGFNS) before applying to a state board. Your advisor will recommend the right body for your target state.'
                            : `Your advisor specialises in ${destination} pathways and will map the exact steps, costs, and timelines for your situation.`
                          }
                        </p>
                      </div>
                    )}

                    <button
                      onClick={goToConsultant}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:-translate-y-px hover:bg-primary/90"
                    >
                      {t.next} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Choose advisor ───────────────────────────── */}
              {step === 'consultant' && (
                <div className="rounded-3xl border border-border bg-white p-7 shadow-sm">
                  <button
                    onClick={() => setStep('profile')}
                    className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> {t.back}
                  </button>

                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 3 of 4</p>
                    <h2 className="mt-1 text-xl font-extrabold text-foreground">{t.advisor_pick_title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t.advisor_pick_sub}</p>
                  </div>

                  {consultantsLoading && (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                      <CircleNotch className="h-4 w-4 animate-spin" /> {t.advisors_loading}
                    </div>
                  )}

                  {!consultantsLoading && (consultantsError || consultants.length === 0) && (
                    <div className="rounded-xl bg-muted/40 p-5 text-center">
                      <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{t.no_advisors}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.no_advisors_sub}</p>
                      <a
                        href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-secondary/90"
                      >
                        <ChatCircle className="h-3.5 w-3.5" /> {t.wa_btn}
                      </a>
                    </div>
                  )}

                  {!consultantsLoading && consultants.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {consultants.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectConsultant(c)}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-primary/50 hover:bg-primary/5"
                        >
                          {c.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.photoUrl} alt={c.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-foreground">{c.name}</span>
                            {c.specialty && <span className="block truncate text-xs text-muted-foreground">{c.specialty}</span>}
                          </span>
                          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Slot picker ──────────────────────────────── */}
              {step === 'slot' && (
                <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-white p-7 shadow-sm">
                  <button
                    onClick={() => setStep('consultant')}
                    className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> {t.back}
                  </button>

                  {/* Step heading */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 4 of 4</p>
                    <h2 className="mt-1 text-xl font-extrabold text-foreground">{t.step_slot}</h2>
                  </div>

                  {/* Chosen advisor */}
                  {selectedConsultant && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                      {selectedConsultant.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedConsultant.photoUrl} alt={selectedConsultant.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {selectedConsultant.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-foreground">{selectedConsultant.name}</span>
                        {selectedConsultant.specialty && <span className="block truncate text-xs text-muted-foreground">{selectedConsultant.specialty}</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('consultant')}
                        className="ml-auto shrink-0 text-xs font-semibold text-primary hover:underline"
                      >
                        {lang === 'en' ? 'Change' : 'Changer'}
                      </button>
                    </div>
                  )}

                  {/* Calendar grid */}
                  <div className="mb-6">
                    <label className="mb-3 block text-sm font-bold text-foreground">{t.slot_date}</label>
                    <div className="rounded-2xl border border-border bg-white overflow-hidden">
                      {/* Month navigation header */}
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleCalNav(-1)}
                          disabled={calYear === today.getFullYear() && calMonth <= today.getMonth()}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft className="h-4 w-4 text-foreground" />
                        </button>
                        <span className="text-sm font-bold text-foreground">
                          {MONTH_NAMES[calMonth]} {calYear}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCalNav(1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted"
                        >
                          <ArrowRight className="h-4 w-4 text-foreground" />
                        </button>
                      </div>

                      {/* Day-of-week headers */}
                      <div className="grid grid-cols-7 border-b border-border">
                        {DAY_HEADERS.map(d => (
                          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
                        ))}
                      </div>

                      {/* Day cells */}
                      <div className="grid grid-cols-7 p-2 gap-1">
                        {buildCalendarGrid(calYear, calMonth).map((cell, idx) => {
                          if (!cell) return <div key={`empty-${idx}`} />;
                          const isSelected = cell.iso === selectedDate;
                          const slotCount = availability[cell.iso];
                          const hasSlots = slotCount !== undefined ? slotCount > 0 : null;
                          const isDisabled = cell.isPast || hasSlots === false;
                          const isUnknown = !cell.isPast && hasSlots === null;
                          return (
                            <button
                              key={cell.iso}
                              type="button"
                              onClick={() => !isDisabled && handleCalDateSelect(cell.iso, cell.isPast, hasSlots ?? true)}
                              disabled={isDisabled}
                              className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-semibold transition-all
                                ${isSelected ? 'bg-primary text-white shadow-sm' : ''}
                                ${!isSelected && !isDisabled ? 'hover:bg-primary/8 text-foreground cursor-pointer' : ''}
                                ${isDisabled ? 'text-muted-foreground/40 cursor-not-allowed' : ''}
                                ${cell.isToday && !isSelected ? 'ring-1 ring-primary/40' : ''}
                              `}
                            >
                              {cell.day}
                              {/* Availability dot */}
                              <span className={`mt-0.5 h-1 w-1 rounded-full transition-all ${
                                isSelected ? 'bg-white/60' :
                                hasSlots === true ? 'bg-secondary' :
                                isUnknown && !cell.isPast ? 'bg-muted-foreground/20' :
                                'bg-transparent'
                              }`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2 w-2 rounded-full bg-secondary inline-block" />
                          {lang === 'en' ? 'Available' : 'Disponible'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-bold text-foreground">{t.slot_time}</label>
                      <span className="text-xs text-muted-foreground">
                        {t.slot_tz}: {localTime(new Date().toISOString())}
                      </span>
                    </div>

                    {slotsLoading && (
                      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                        <CircleNotch className="h-4 w-4 animate-spin" />
                        {lang === 'en' ? 'Loading slots…' : 'Chargement…'}
                      </div>
                    )}

                    {!slotsLoading && slotsError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                        <p>{slotsError}</p>
                        <a
                          href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1.5 font-semibold text-secondary hover:underline"
                        >
                          <ChatCircle className="h-4 w-4" /> {t.wa_btn}
                        </a>
                      </div>
                    )}

                    {!slotsLoading && !slotsError && slots.length === 0 && (
                      <div className="rounded-xl bg-muted/40 p-5 text-center">
                        <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">{t.no_slots}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t.no_slots_sub}</p>
                        <a
                          href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-secondary/90"
                        >
                          <ChatCircle className="h-3.5 w-3.5" /> {t.wa_btn}
                        </a>
                      </div>
                    )}

                    {!slotsLoading && slots.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-xl border py-3 text-center text-sm font-semibold transition-all ${
                              selectedSlot?.id === slot.id
                                ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                                : 'border-border bg-white hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booking summary */}
                  {selectedSlot && (
                    <div className="mb-5 rounded-xl bg-primary/5 p-4 text-sm">
                      <p className="font-bold text-primary">{lang === 'en' ? 'Booking summary' : 'Récapitulatif'}</p>
                      <p className="mt-1.5 text-foreground font-medium">{name}</p>
                      <p className="text-muted-foreground text-xs">{email}</p>
                      <p className="mt-2 font-semibold text-foreground">
                        {formatDate(selectedDate)} · {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                      </p>
                    </div>
                  )}

                  {error && (
                    <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={loading || !selectedSlot}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:-translate-y-px hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? <><CircleNotch className="h-4 w-4 animate-spin" /> {t.booking}</>
                      : <><CheckCircle className="h-4 w-4" /> {t.book}</>
                    }
                  </button>

                  {/* No-commitment pills */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[t.no_commitment_1, t.no_commitment_2, t.no_commitment_3].map((pill) => (
                      <span key={pill} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Confirmed ────────────────────────────────── */}
              {step === 'confirmed' && confirmed && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-primary/20 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle weight="fill" className="h-9 w-9 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground">{t.confirmed_title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.confirmed_sub}{' '}
                      <span className="font-semibold text-foreground">{confirmed.email}</span>.{' '}
                      {t.confirmed_check}.
                    </p>

                    <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-muted/40 p-5 text-left">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {lang === 'en' ? 'Your appointment' : 'Votre rendez-vous'}
                      </p>

                      {/* Advisor */}
                      {confirmed.consultant && (
                        <div className="mt-3 flex items-center gap-2.5">
                          {confirmed.consultant.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={confirmed.consultant.photoUrl} alt={confirmed.consultant.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {confirmed.consultant.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block text-xs text-muted-foreground">{lang === 'en' ? 'With' : 'Avec'}</span>
                            <span className="block truncate text-sm font-bold text-foreground">{confirmed.consultant.name}</span>
                          </span>
                        </div>
                      )}

                      <p className="mt-3 text-sm font-semibold text-foreground">{confirmed.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apptDateWAT(confirmed.slotStart)}
                      </p>
                      <p className="text-sm font-semibold text-primary">{apptTimeWAT(confirmed.slotStart)} WAT</p>
                      {confirmed.bookingId && confirmed.roomUrl ? (
                        <>
                          <a
                            href={`${API}/leads/free-consult/join?bookingId=${confirmed.bookingId}&email=${encodeURIComponent(confirmed.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                          >
                            {lang === 'en' ? 'Join Session' : 'Rejoindre'}
                          </a>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {lang === 'en'
                              ? 'The room opens at session time. This link is also in your confirmation email.'
                              : 'La salle ouvre à l\'heure de la session. Ce lien est aussi dans votre e-mail de confirmation.'}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Video call — link sent by your advisor before the call
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <a
                        href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi, I just booked a consultation and have a question')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90"
                      >
                        <ChatCircle className="h-4 w-4" /> Chat on WhatsApp
                      </a>
                      <Link
                        href="/"
                        className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                      >
                        Back to homepage
                      </Link>
                    </div>
                  </div>

                  {/* What to prepare */}
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-bold text-foreground">{t.prepare_title}</h3>
                    <ul className="space-y-2.5">
                      {t.prepare.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      You don't need everything — bring what you have. Your advisor will identify any gaps.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: sidebar ──────────────────────────────────────── */}
            {step !== 'confirmed' && (
              <div className="mt-6 space-y-4 lg:mt-0">

                {/* Advisor card — selected consultant or clickable preview list */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.advisor_title}
                  </p>

                  {selectedConsultant ? (
                    /* Single selected card */
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 bg-primary/10 flex items-center justify-center">
                          {selectedConsultant.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={selectedConsultant.photoUrl} alt={selectedConsultant.name} className="h-full w-full object-cover object-top" />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {selectedConsultant.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">{selectedConsultant.name}</p>
                          {selectedConsultant.specialty && <p className="truncate text-xs text-muted-foreground">{selectedConsultant.specialty}</p>}
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {lang === 'en'
                          ? `${selectedConsultant.name.split(' ')[0]} will review your profile and map the clearest path forward.`
                          : `${selectedConsultant.name.split(' ')[0]} examinera votre profil et tracera le chemin le plus clair.`}
                      </p>
                    </>
                  ) : consultantsLoading ? (
                    /* Loading skeleton */
                    <div className="space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex items-center gap-3 rounded-xl p-2">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : consultants.length > 0 ? (
                    /* Clickable preview — pick and jump straight to slots */
                    <>
                      <div className="space-y-1">
                        {consultants.slice(0, 3).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectConsultant(c)}
                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-primary/5 group"
                          >
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                              {c.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover object-top" />
                              ) : (
                                <span className="text-xs font-bold text-primary">
                                  {c.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                              {c.specialty && <p className="truncate text-xs text-muted-foreground">{c.specialty}</p>}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {lang === 'en' ? 'Click an advisor to book directly.' : 'Cliquez sur un conseiller pour réserver.'}
                      </p>
                    </>
                  ) : (
                    /* Fallback if no consultants loaded */
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary/50" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{lang === 'en' ? 'One of our advisors' : 'Un de nos conseillers'}</p>
                        <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Choose in the next step' : 'Choisissez à l\'étape suivante'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trust stats */}
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="flex divide-x divide-border">
                    {[
                      { value: '800+', label: t.trust_placed },
                      { value: '4.9/5', label: t.trust_rating },
                      { value: '12+', label: t.trust_countries },
                    ].map(({ value, label }) => (
                      <div key={label} className="flex flex-1 flex-col items-center p-4 text-center">
                        <div className="mb-1 h-0.5 w-8 rounded-full bg-primary" />
                        <p className="text-2xl font-extrabold text-primary">{value}</p>
                        <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonials */}
                <div className="space-y-3">
                  {testimonials.map((item) => (
                    <div key={item.name} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      {/* 5 stars */}
                      <div className="mb-2 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} weight="fill" className="h-3 w-3 text-primary" />
                        ))}
                      </div>
                      {/* Decorative quote opener */}
                      <p className="text-3xl font-black leading-none text-primary/20">"</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-foreground italic">{item.quote}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="gradient-hero flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white">
                          {item.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No commitment — pill badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[t.no_commitment_1, t.no_commitment_2, t.no_commitment_3].map((pill) => (
                    <span key={pill} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// ── Page export — Suspense required for useSearchParams ────────────────────────
export default function GetStartedPage() {
  return (
    <Suspense>
      <GetStartedInner />
    </Suspense>
  );
}
