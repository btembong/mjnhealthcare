'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import { CircleNotch, Lock, X } from '@mjn/ui';
import { useUser } from '../../../contexts/user-context';
import { api, setToken } from '../../../lib/api';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'Settings',
    nav: { profile: 'Profile', contact: 'Contact details', language: 'Language', notifications: 'Notifications', privacy: 'Privacy and data', signin: 'Sign-in' },
    since: (d: string) => `Client since ${d}`,
    fullName: 'Full name',
    profession: 'Profession',
    chooseProfession: 'Choose your profession',
    professions: { Nurse: 'Nurse', Physician: 'Physician', Dentist: 'Dentist', Pharmacist: 'Pharmacist', 'Allied Health': 'Allied health', Student: 'Student', Other: 'Other' } as Record<string, string>,
    professionNote: 'Some prices depend on your profession.',
    professionLocked: 'Your prices are based on this. To change it, message your team.',
    messageTeam: 'Message team',
    save: 'Save',
    saved: 'Saved.',
    failed: 'That did not work. Please try again.',
    email: 'Email',
    emailNote: 'You sign in with this address.',
    noEmail: 'No email address',
    phone: 'Phone / WhatsApp',
    phoneNote: 'Used for reminders and case updates.',
    noPhone: 'No phone number yet',
    change: 'Change',
    add: 'Add',
    languageNote: 'Emails, guides and the main pages follow this choice. Some pages are still in English only.',
    languageSaved: 'Language saved.',
    aboutCase: 'About your case',
    alwaysOn: 'Always on',
    aboutCaseBody: 'Receipts, document decisions, session reminders and replies from your team are always emailed. We need to be able to reach you about your case.',
    whatsapp: 'Also send case updates on WhatsApp',
    whatsappBody: 'Turn this off to stop the WhatsApp and SMS copies. You still get the emails.',
    whatsappNoPhone: 'Add a phone number above to receive these.',
    marketing: 'News and offers by email',
    marketingBody: 'Occasional news from MJN Healthcare. This is the same choice as the unsubscribe link in those emails.',
    on: 'On',
    off: 'Off',
    hold: 'What we hold: your profile, your documents, your payments and your messages with us.',
    copy: 'Request a copy of my data',
    remove: 'Ask to delete my account',
    consent: (d: string) => `You agreed to the privacy policy on ${d}.`,
    policy: 'Privacy policy',
    signinHow: 'You sign in with a code sent to your email. There is no password to remember.',
    signOut: 'Sign out',
    signOutAll: 'Sign out on all devices',
    signOutAllTitle: 'Sign out on all devices?',
    signOutAllBody: 'Every phone and computer signed in to your account, including this one, will need a new code to get back in. Use this if you signed in on a device that is not yours.',
    cancel: 'Cancel',
    emailTitle: 'Change your email',
    newEmail: 'New email address',
    sendCode: 'Send code',
    codeSent: (e: string) => `We sent a 6-digit code to ${e}.`,
    code: 'Code',
    nothingChanges: 'Nothing changes until you enter it. Your current address is told about the change.',
    confirm: 'Confirm',
    emailChanged: 'Email changed. Sign in with the new address from now on.',
    useAnother: 'Use a different address',
    phoneTitle: 'Your phone number',
    phoneLabel: 'Phone number with country code',
    phoneHelp: 'For example +237 6 77 00 00 00. This should be a number you use on WhatsApp.',
    phoneBad: 'Enter the number with its country code, starting with +.',
    copyTitle: 'Request a copy of your data?',
    copyBody: 'We will send a request to our team. They will prepare a copy of the information we hold about you and reply through Get help, usually within a few working days.',
    removeTitle: 'Ask to delete your account?',
    removeBody: 'We will send a request to our team. Nothing is deleted straight away: they will tell you what can be removed and what we must keep by law, such as payment records, before anything happens.',
    reason: 'Anything you want us to know (optional)',
    sendRequest: 'Send request',
    requestSent: 'Request sent. We will reply in Get help.',
    viewRequest: 'View request',
    subjects: { copy: 'Request for a copy of my data', remove: 'Request to delete my account' },
    bodies: { copy: 'I would like a copy of the personal data you hold about me.', remove: 'I would like my account and personal data to be deleted.' },
  },
  fr: {
    title: 'Paramètres',
    nav: { profile: 'Profil', contact: 'Coordonnées', language: 'Langue', notifications: 'Notifications', privacy: 'Confidentialité et données', signin: 'Connexion' },
    since: (d: string) => `Client depuis ${d}`,
    fullName: 'Nom complet',
    profession: 'Profession',
    chooseProfession: 'Choisissez votre profession',
    professions: { Nurse: 'Infirmier / infirmière', Physician: 'Médecin', Dentist: 'Dentiste', Pharmacist: 'Pharmacien / pharmacienne', 'Allied Health': 'Paramédical', Student: 'Étudiant / étudiante', Other: 'Autre' } as Record<string, string>,
    professionNote: 'Certains prix dépendent de votre profession.',
    professionLocked: 'Vos prix sont calculés sur cette base. Pour la modifier, écrivez à votre équipe.',
    messageTeam: 'Écrire à mon équipe',
    save: 'Enregistrer',
    saved: 'Enregistré.',
    failed: 'Cela n’a pas fonctionné. Veuillez réessayer.',
    email: 'E-mail',
    emailNote: 'Vous vous connectez avec cette adresse.',
    noEmail: 'Aucune adresse e-mail',
    phone: 'Téléphone / WhatsApp',
    phoneNote: 'Utilisé pour les rappels et les nouvelles de votre dossier.',
    noPhone: 'Pas encore de numéro',
    change: 'Modifier',
    add: 'Ajouter',
    languageNote: 'Les e-mails, les guides et les pages principales suivent ce choix. Certaines pages ne sont encore qu’en anglais.',
    languageSaved: 'Langue enregistrée.',
    aboutCase: 'À propos de votre dossier',
    alwaysOn: 'Toujours actif',
    aboutCaseBody: 'Les reçus, les décisions sur vos documents, les rappels de séance et les réponses de votre équipe sont toujours envoyés par e-mail. Nous devons pouvoir vous joindre au sujet de votre dossier.',
    whatsapp: 'Recevoir aussi les nouvelles du dossier sur WhatsApp',
    whatsappBody: 'Désactivez pour ne plus recevoir les copies WhatsApp et SMS. Vous recevrez toujours les e-mails.',
    whatsappNoPhone: 'Ajoutez un numéro ci-dessus pour les recevoir.',
    marketing: 'Actualités et offres par e-mail',
    marketingBody: 'Des nouvelles occasionnelles de MJN Healthcare. C’est le même choix que le lien de désabonnement de ces e-mails.',
    on: 'Activé',
    off: 'Désactivé',
    hold: 'Ce que nous conservons : votre profil, vos documents, vos paiements et vos échanges avec nous.',
    copy: 'Demander une copie de mes données',
    remove: 'Demander la suppression de mon compte',
    consent: (d: string) => `Vous avez accepté la politique de confidentialité le ${d}.`,
    policy: 'Politique de confidentialité',
    signinHow: 'Vous vous connectez avec un code envoyé par e-mail. Aucun mot de passe à retenir.',
    signOut: 'Se déconnecter',
    signOutAll: 'Se déconnecter de tous les appareils',
    signOutAllTitle: 'Se déconnecter de tous les appareils ?',
    signOutAllBody: 'Tous les téléphones et ordinateurs connectés à votre compte, y compris celui-ci, devront saisir un nouveau code pour y revenir. À utiliser si vous vous êtes connecté sur un appareil qui n’est pas le vôtre.',
    cancel: 'Annuler',
    emailTitle: 'Modifier votre e-mail',
    newEmail: 'Nouvelle adresse e-mail',
    sendCode: 'Envoyer le code',
    codeSent: (e: string) => `Nous avons envoyé un code à 6 chiffres à ${e}.`,
    code: 'Code',
    nothingChanges: 'Rien ne change tant que vous ne l’avez pas saisi. Votre adresse actuelle est informée du changement.',
    confirm: 'Confirmer',
    emailChanged: 'E-mail modifié. Connectez-vous désormais avec la nouvelle adresse.',
    useAnother: 'Utiliser une autre adresse',
    phoneTitle: 'Votre numéro de téléphone',
    phoneLabel: 'Numéro avec l’indicatif du pays',
    phoneHelp: 'Par exemple +237 6 77 00 00 00. Indiquez un numéro que vous utilisez sur WhatsApp.',
    phoneBad: 'Saisissez le numéro avec l’indicatif du pays, en commençant par +.',
    copyTitle: 'Demander une copie de vos données ?',
    copyBody: 'Nous transmettons la demande à notre équipe. Elle préparera une copie des informations que nous conservons à votre sujet et vous répondra dans « Obtenir de l’aide », généralement sous quelques jours ouvrés.',
    removeTitle: 'Demander la suppression de votre compte ?',
    removeBody: 'Nous transmettons la demande à notre équipe. Rien n’est supprimé immédiatement : elle vous indiquera ce qui peut être effacé et ce que la loi nous oblige à conserver, comme les justificatifs de paiement, avant toute action.',
    reason: 'Ce que vous souhaitez nous préciser (facultatif)',
    sendRequest: 'Envoyer la demande',
    requestSent: 'Demande envoyée. Nous vous répondrons dans « Obtenir de l’aide ».',
    viewRequest: 'Voir la demande',
    subjects: { copy: 'Demande de copie de mes données', remove: 'Demande de suppression de mon compte' },
    bodies: { copy: 'Je souhaite recevoir une copie des données personnelles que vous conservez à mon sujet.', remove: 'Je souhaite la suppression de mon compte et de mes données personnelles.' },
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECTIONS = ['profile', 'contact', 'language', 'notifications', 'privacy', 'signin'] as const;
type Section = (typeof SECTIONS)[number];
const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? 'https://mjnhealthcare.com').replace(/\/$/, '');
const PHONE = /^\+[1-9]\d{7,14}$/;

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const label = 'mb-1.5 block text-xs font-bold text-foreground';

function message(e: any, fallback: string) {
  return e?.message && !/^Request failed/.test(e.message) && e.message !== 'Unauthorised' ? e.message : fallback;
}

function Modal({ title, onClose, children, closeLabel }: { title: string; onClose: () => void; children: ReactNode; closeLabel: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button onClick={onClose} aria-label={closeLabel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Switch({ checked, onChange, disabled, label: name, t }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string; t: Text }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={name} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 items-center gap-2 disabled:opacity-40"
    >
      <span className="text-xs font-semibold text-muted-foreground">{checked ? t.on : t.off}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { me, loading, refresh, signOut } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const dl = locale === 'fr' ? 'fr-FR' : 'en-GB';

  const [prefs, setPrefs] = useState<{ whatsappUpdates: boolean; marketingEmails: boolean; privacyConsentAt: string | null; professionLocked: boolean } | null>(null);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [busy, setBusy] = useState('');
  const [dialog, setDialog] = useState<null | 'email' | 'phone' | 'copy' | 'remove' | 'signout'>(null);
  const [active, setActive] = useState<Section>('profile');

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  // Phone and data requests
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const refs = useRef<Partial<Record<Section, HTMLElement | null>>>({});

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? '');
    setProfession(me.profession ?? '');
  }, [me]);
  useEffect(() => {
    if (me) api.getPreferences().then(setPrefs).catch(() => {});
  }, [me?.id]);

  function open(kind: NonNullable<typeof dialog>) {
    setNewEmail(''); setSentTo(''); setCode(''); setNote('');
    setPhone(me?.phone ?? '');
    setDialog(kind);
  }
  function go(section: Section) {
    setActive(section);
    refs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    try { await action(); } catch (e: any) { toast.error(message(e, t.failed)); } finally { setBusy(''); }
  }

  const saveProfile = () => run('profile', async () => {
    await api.updateMe({ name: name.trim(), ...(prefs?.professionLocked ? {} : { profession }) });
    await refresh();
    toast.success(t.saved);
  });
  const saveLanguage = (next: Locale) => run('language', async () => {
    await api.updateMe({ locale: next });
    await refresh();
    toast.success(TEXT[next].languageSaved);
  });
  const savePref = (change: { whatsappUpdates?: boolean; marketingEmails?: boolean }) => run('prefs', async () => {
    setPrefs(await api.setPreferences(change));
    toast.success(t.saved);
  });
  const sendCode = () => run('email', async () => {
    const r = await api.requestEmailChange(newEmail.trim());
    setSentTo(r.sentTo); setCode('');
  });
  const confirmEmail = () => run('email', async () => {
    const r = await api.confirmEmailChange(code.trim());
    setToken(r.access_token);
    await refresh();
    setDialog(null);
    toast.success(t.emailChanged);
  });
  const savePhone = () => run('phone', async () => {
    const clean = phone.replace(/[\s().-]/g, '');
    if (!PHONE.test(clean)) { toast.error(t.phoneBad); return; }
    await api.updateMe({ phone: clean });
    await refresh();
    setDialog(null);
    toast.success(t.saved);
  });
  const sendDataRequest = (kind: 'copy' | 'remove') => run('data', async () => {
    const ticket = await api.createTicket(t.subjects[kind], 'PRIVACY', [t.bodies[kind], note.trim()].filter(Boolean).join('\n\n'));
    setDialog(null);
    toast.success(t.requestSent, { action: { label: t.viewRequest, onClick: () => { window.location.href = `/tickets?ticket=${ticket.id}`; } } });
  });
  const signOutAll = () => run('signout', async () => {
    await api.signOutEverywhere();
    signOut();
  });

  if (loading || !me) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const professionOptions = Object.keys(t.professions);
  const knownProfession = professionOptions.find((p) => p.toLowerCase() === (profession ?? '').toLowerCase());
  const locked = !!prefs?.professionLocked;
  const dirty = name.trim() !== (me.name ?? '') || (!locked && profession !== (me.profession ?? ''));
  const section = (key: Section, children: ReactNode) => (
    <section key={key} ref={(el) => { refs.current[key] = el; }} data-tour={`settings-${key}`} className={`${card} scroll-mt-24 p-5`}>
      <h2 className={`mb-4 ${heading}`}>{t.nav[key]}</h2>
      {children}
    </section>
  );
  const row = (title: string, body: string, control: ReactNode) => (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 data-tour="page-header" className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>

      <div className="grid items-start gap-4 lg:grid-cols-[13rem_minmax(0,44rem)]">
        {/* Section list */}
        <nav aria-label={t.title} className="sticky top-16 z-10 -mx-1 flex gap-1 overflow-x-auto bg-background/95 px-1 py-1 lg:top-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:bg-transparent lg:p-0">
          {SECTIONS.map((key) => (
            <button key={key} onClick={() => go(key)} aria-current={active === key ? 'true' : undefined} className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${active === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>
              {t.nav[key]}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {section('profile', (
            <>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{(me.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase() || '?'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{me.name}</p>
                  {me.createdAt && <p className="text-xs text-muted-foreground">{t.since(new Date(me.createdAt).toLocaleDateString(dl, { month: 'long', year: 'numeric' }))}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="set-name" className={label}>{t.fullName}</label>
                  <input id="set-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={field} />
                </div>
                <div>
                  <label htmlFor="set-profession" className={label}>{t.profession}</label>
                  {locked ? (
                    <p className="flex h-11 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-foreground">
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> {knownProfession ? t.professions[knownProfession] : me.profession || '—'}
                    </p>
                  ) : (
                    <select id="set-profession" value={knownProfession ?? profession} onChange={(e) => setProfession(e.target.value)} className={field}>
                      <option value="">{t.chooseProfession}</option>
                      {!knownProfession && profession && <option value={profession}>{profession}</option>}
                      {professionOptions.map((p) => <option key={p} value={p}>{t.professions[p]}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {locked ? t.professionLocked : t.professionNote}
                {locked && <Link href="/messages" className="font-bold text-primary hover:underline">{t.messageTeam}</Link>}
              </p>
              <div className="mt-4 flex justify-end">
                <button onClick={saveProfile} disabled={!dirty || !name.trim() || busy === 'profile'} className={btnPrimary}>{busy === 'profile' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.save}</button>
              </div>
            </>
          ))}

          {section('contact', (
            <div className="divide-y divide-border/70">
              {row(t.email, t.emailNote, (
                <div className="flex items-center gap-3">
                  <span className="max-w-[14rem] truncate text-sm font-semibold text-foreground">{me.email ?? t.noEmail}</span>
                  <button onClick={() => open('email')} className={btnOutline}>{me.email ? t.change : t.add}</button>
                </div>
              ))}
              {row(t.phone, t.phoneNote, (
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${me.phone ? 'text-foreground' : 'text-muted-foreground'}`}>{me.phone ?? t.noPhone}</span>
                  <button onClick={() => open('phone')} className={btnOutline}>{me.phone ? t.change : t.add}</button>
                </div>
              ))}
            </div>
          ))}

          {section('language', (
            <>
              <div role="radiogroup" aria-label={t.nav.language} className="grid grid-cols-2 gap-2 sm:max-w-sm">
                {([['en', 'English'], ['fr', 'Français']] as const).map(([value, text]) => (
                  <button key={value} role="radio" aria-checked={locale === value} disabled={busy === 'language'} onClick={() => locale !== value && saveLanguage(value)} className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${locale === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                    {text}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t.languageNote}</p>
            </>
          ))}

          {section('notifications', (
            <div className="divide-y divide-border/70">
              {row(t.aboutCase, t.aboutCaseBody, <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{t.alwaysOn}</span>)}
              {row(t.whatsapp, me.phone ? t.whatsappBody : t.whatsappNoPhone, (
                <Switch t={t} label={t.whatsapp} checked={!!prefs?.whatsappUpdates && !!me.phone} disabled={!prefs || !me.phone || busy === 'prefs'} onChange={(next) => savePref({ whatsappUpdates: next })} />
              ))}
              {row(t.marketing, t.marketingBody, (
                <Switch t={t} label={t.marketing} checked={!!prefs?.marketingEmails} disabled={!prefs || !me.email || busy === 'prefs'} onChange={(next) => savePref({ marketingEmails: next })} />
              ))}
            </div>
          ))}

          {section('privacy', (
            <>
              <p className="text-sm text-foreground">{t.hold}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => open('copy')} className={btnOutline}>{t.copy}</button>
                <button onClick={() => open('remove')} className={btnOutline}>{t.remove}</button>
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                {prefs?.privacyConsentAt && <span>{t.consent(new Date(prefs.privacyConsentAt).toLocaleDateString(dl, { day: 'numeric', month: 'short', year: 'numeric' }))}</span>}
                <a href={`${WEB_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{t.policy}</a>
              </p>
            </>
          ))}

          {section('signin', (
            <>
              <p className="text-sm text-foreground">{t.signinHow}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={signOut} className={btnOutline}>{t.signOut}</button>
                <button onClick={() => open('signout')} className={btnOutline}>{t.signOutAll}</button>
              </div>
            </>
          ))}
        </div>
      </div>

      {/* Change email */}
      {dialog === 'email' && (
        <Modal title={t.emailTitle} onClose={() => setDialog(null)} closeLabel={t.cancel}>
          {!sentTo ? (
            <>
              <label htmlFor="new-email" className={label}>{t.newEmail}</label>
              <input id="new-email" type="email" autoFocus value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newEmail.includes('@') && sendCode()} className={field} />
              <p className="mt-2 text-xs text-muted-foreground">{t.nothingChanges}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setDialog(null)} className={btnOutline}>{t.cancel}</button>
                <button onClick={sendCode} disabled={busy === 'email' || !/^\S+@\S+\.\S+$/.test(newEmail.trim())} className={btnPrimary}>{busy === 'email' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.sendCode}</button>
              </div>
            </>
          ) : (
            <>
              <p className="rounded-xl bg-muted/50 px-4 py-2.5 text-sm text-foreground">{t.codeSent(sentTo)}</p>
              <label htmlFor="email-code" className={`${label} mt-4`}>{t.code}</label>
              <input id="email-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && confirmEmail()} className={`${field} text-center text-lg font-bold tracking-[0.5em]`} />
              <p className="mt-2 text-xs text-muted-foreground">{t.nothingChanges}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <button onClick={() => { setSentTo(''); setCode(''); }} className="text-xs font-bold text-primary hover:underline">{t.useAnother}</button>
                <span className="flex gap-2">
                  <button onClick={() => setDialog(null)} className={btnOutline}>{t.cancel}</button>
                  <button onClick={confirmEmail} disabled={busy === 'email' || code.length !== 6} className={btnPrimary}>{busy === 'email' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.confirm}</button>
                </span>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Phone */}
      {dialog === 'phone' && (
        <Modal title={t.phoneTitle} onClose={() => setDialog(null)} closeLabel={t.cancel}>
          <label htmlFor="new-phone" className={label}>{t.phoneLabel}</label>
          <input id="new-phone" type="tel" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && savePhone()} placeholder="+237 6 77 00 00 00" className={field} />
          <p className="mt-2 text-xs text-muted-foreground">{t.phoneHelp}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>{t.cancel}</button>
            <button onClick={savePhone} disabled={busy === 'phone' || !phone.trim()} className={btnPrimary}>{busy === 'phone' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.save}</button>
          </div>
        </Modal>
      )}

      {/* Data requests */}
      {(dialog === 'copy' || dialog === 'remove') && (
        <Modal title={dialog === 'copy' ? t.copyTitle : t.removeTitle} onClose={() => setDialog(null)} closeLabel={t.cancel}>
          <p className="text-sm text-foreground">{dialog === 'copy' ? t.copyBody : t.removeBody}</p>
          <label htmlFor="data-note" className={`${label} mt-4`}>{t.reason}</label>
          <textarea id="data-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>{t.cancel}</button>
            <button onClick={() => sendDataRequest(dialog)} disabled={busy === 'data'} className={btnPrimary}>{busy === 'data' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.sendRequest}</button>
          </div>
        </Modal>
      )}

      {/* Sign out everywhere */}
      {dialog === 'signout' && (
        <Modal title={t.signOutAllTitle} onClose={() => setDialog(null)} closeLabel={t.cancel}>
          <p className="text-sm text-foreground">{t.signOutAllBody}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>{t.cancel}</button>
            <button onClick={signOutAll} disabled={busy === 'signout'} className={btnPrimary}>{busy === 'signout' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.signOutAll}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
