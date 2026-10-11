'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import { CheckCircle, Check, CaretDown, CaretUp, CircleNotch, CreditCard, DownloadSimple, Headset, X } from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'Payments',
    headline: (paid: string, total: string) => `${paid} paid of ${total}`,
    toPayShort: (a: string) => `${a} to pay`,
    nothingYet: 'Nothing to pay yet.',
    toPayNow: 'To pay now',
    tax: 'Tax',
    total: 'Total',
    pay: (a: string) => `Pay ${a}`,
    opening: 'Opening payment…',
    cancelOrder: 'Cancel this order',
    howCharged: 'Charged in CFA francs at today’s rate, by mobile money or card. You get a receipt by email.',
    upToDate: 'You are up to date. Nothing to pay right now.',
    noOrders: 'You have not been asked to pay for anything yet.',
    checkout: 'Choose services',
    confirming: (a: string) => `We are confirming your payment of ${a}.`,
    confirmingSub: 'This usually takes a minute. You do not need to pay again.',
    checkAgain: 'Check again',
    unconfirmed: 'We could not confirm a payment for this order.',
    unconfirmedSub: 'If money left your account, contact us before paying again.',
    failed: 'Your last payment did not go through.',
    failedSub: 'No money was taken. You can try again when you are ready.',
    getHelp: 'Get help',
    payFailed: 'The payment page could not be opened. Please try again.',
    plan: 'Your plan',
    planSub: 'pay per stage',
    planStatus: { PAID: 'Paid', INVOICED: 'To pay', PENDING: 'Later' } as Record<string, string>,
    history: 'Payments and receipts',
    noHistory: 'Your payments and receipts will appear here.',
    status: { PENDING: 'To pay', PAID: 'Paid', PARTIALLY_PAID: 'Part paid', CANCELLED: 'Cancelled' } as Record<string, string>,
    engagementFee: 'Engagement fee',
    more: (n: number) => `+${n} more`,
    receipt: 'Receipt',
    receiptFailed: 'The receipt could not be downloaded. Please try again.',
    receiptNotReady: 'The receipt is not ready yet. Try again in a minute.',
    nonRefundable: 'Non-refundable',
    details: 'Details',
    consultations: 'Consultations',
    consult: { HEALTH: 'Health consultation', CAREER: 'Career consultation', BOTH: 'Consultation' } as Record<string, string>,
    refunded: 'Refunded',
    partRefunded: 'Part refunded',
    paid: 'Paid',
    summary: 'Summary',
    sPaid: 'Paid',
    sToPay: 'To pay',
    sLater: 'Later stages',
    sTotal: 'Total agreed',
    good: 'Good to know',
    rules: [
      ['How you pay', 'By mobile money or card. Prices are in US dollars and the charge is made in CFA francs at the day’s rate.'],
      ['Receipts', 'Emailed after each payment, and kept on this page.'],
      ['Refunds', 'Fees we pay to licensing bodies on your behalf cannot be refunded. Each one is marked on its order.'],
    ],
    help: 'Need help?',
    helpBody: 'For a question about a payment or a receipt, our support team answers fastest.',
    cancelTitle: 'Cancel this order?',
    cancelBody: 'Nothing has been charged. Cancelling lets you choose your services again.',
    cancelLate: 'If you already paid for it and the payment arrives, the order is still marked as paid.',
    keep: 'Keep order',
    cancelled: 'Order cancelled. You can choose your services again.',
    cancelFailed: 'The order could not be cancelled.',
    loadFailed: 'Your payments could not be loaded. Check your connection and reload the page.',
  },
  fr: {
    title: 'Paiements',
    headline: (paid: string, total: string) => `${paid} payés sur ${total}`,
    toPayShort: (a: string) => `${a} à régler`,
    nothingYet: 'Rien à régler pour le moment.',
    toPayNow: 'À régler maintenant',
    tax: 'Taxe',
    total: 'Total',
    pay: (a: string) => `Payer ${a}`,
    opening: 'Ouverture du paiement…',
    cancelOrder: 'Annuler cette commande',
    howCharged: 'Débité en francs CFA au taux du jour, par mobile money ou par carte. Vous recevez un reçu par e-mail.',
    upToDate: 'Vous êtes à jour. Rien à régler pour le moment.',
    noOrders: 'Aucun paiement ne vous a encore été demandé.',
    checkout: 'Choisir mes services',
    confirming: (a: string) => `Nous confirmons votre paiement de ${a}.`,
    confirmingSub: 'Cela prend généralement une minute. Inutile de payer à nouveau.',
    checkAgain: 'Vérifier à nouveau',
    unconfirmed: 'Nous n’avons pas pu confirmer de paiement pour cette commande.',
    unconfirmedSub: 'Si votre compte a été débité, contactez-nous avant de payer à nouveau.',
    failed: 'Votre dernier paiement n’a pas abouti.',
    failedSub: 'Aucun montant n’a été prélevé. Vous pouvez réessayer quand vous le souhaitez.',
    getHelp: 'Obtenir de l’aide',
    payFailed: 'La page de paiement n’a pas pu s’ouvrir. Veuillez réessayer.',
    plan: 'Votre plan',
    planSub: 'paiement par étape',
    planStatus: { PAID: 'Payé', INVOICED: 'À régler', PENDING: 'Plus tard' } as Record<string, string>,
    history: 'Paiements et reçus',
    noHistory: 'Vos paiements et vos reçus apparaîtront ici.',
    status: { PENDING: 'À régler', PAID: 'Payé', PARTIALLY_PAID: 'Payé en partie', CANCELLED: 'Annulé' } as Record<string, string>,
    engagementFee: 'Frais d’engagement',
    more: (n: number) => `+${n} autres`,
    receipt: 'Reçu',
    receiptFailed: 'Le reçu n’a pas pu être téléchargé. Veuillez réessayer.',
    receiptNotReady: 'Le reçu n’est pas encore prêt. Réessayez dans une minute.',
    nonRefundable: 'Non remboursable',
    details: 'Détails',
    consultations: 'Consultations',
    consult: { HEALTH: 'Consultation santé', CAREER: 'Consultation carrière', BOTH: 'Consultation' } as Record<string, string>,
    refunded: 'Remboursé',
    partRefunded: 'Remboursé en partie',
    paid: 'Payé',
    summary: 'Résumé',
    sPaid: 'Payé',
    sToPay: 'À régler',
    sLater: 'Étapes suivantes',
    sTotal: 'Total convenu',
    good: 'Bon à savoir',
    rules: [
      ['Comment payer', 'Par mobile money ou par carte. Les prix sont en dollars américains et le débit se fait en francs CFA au taux du jour.'],
      ['Reçus', 'Envoyés par e-mail après chaque paiement, et conservés sur cette page.'],
      ['Remboursements', 'Les frais que nous réglons pour vous auprès des organismes ne sont pas remboursables. Chacun est signalé sur sa commande.'],
    ],
    help: 'Besoin d’aide ?',
    helpBody: 'Pour une question sur un paiement ou un reçu, notre équipe d’assistance répond le plus vite.',
    cancelTitle: 'Annuler cette commande ?',
    cancelBody: 'Rien n’a été débité. L’annulation vous permet de choisir à nouveau vos services.',
    cancelLate: 'Si vous l’avez déjà payée et que le paiement nous parvient, la commande sera tout de même marquée comme payée.',
    keep: 'Garder la commande',
    cancelled: 'Commande annulée. Vous pouvez choisir à nouveau vos services.',
    cancelFailed: 'La commande n’a pas pu être annulée.',
    loadFailed: 'Vos paiements n’ont pas pu être chargés. Vérifiez votre connexion et rechargez la page.',
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
const DOT: Record<string, string> = { PENDING: 'bg-accent', PAID: 'bg-secondary', PARTIALLY_PAID: 'bg-accent', CANCELLED: 'bg-muted-foreground/40' };
const PLAN_DOT: Record<string, string> = { PAID: 'bg-secondary', INVOICED: 'bg-accent', PENDING: 'border border-muted-foreground/50' };

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}
function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function short(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}
/** What an order is for, in a few words. */
function orderLabel(order: any, t: Text) {
  const names: string[] = (order.lineItems ?? []).map((li: any) => li.name as string);
  const main = names.filter((n) => !/^engagement fee$/i.test(n));
  if (main.length === 0) return t.engagementFee;
  return main.length === 1 ? main[0] : `${main[0]} ${t.more(main.length - 1)}`;
}
async function downloadReceipt(order: any) {
  const token = localStorage.getItem('mjn_token');
  const res = await fetch(`${API_BASE}/orders/${order.id}/receipt/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(String(res.status));
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `mjn-receipt-${new Date(order.createdAt).toISOString().slice(0, 10)}-${order.id.slice(-6)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function OrderLines({ order, t }: { order: any; t: Text }) {
  return (
    <div className="space-y-1.5 text-sm">
      {(order.lineItems ?? []).map((li: any) => (
        <div key={li.id}>
          <p className="flex justify-between gap-3 text-foreground">
            <span className="min-w-0">{li.name}{li.variant ? <span className="text-muted-foreground"> ({li.variant})</span> : null}</span>
            <span className="shrink-0 tabular-nums">{money(li.price)}</span>
          </p>
          {li.nonRefundable && <p className="text-xs text-muted-foreground">{t.nonRefundable}{li.nonRefundableReason ? `: ${li.nonRefundableReason}` : ''}</p>}
        </div>
      ))}
      {order.taxAmount > 0 && (
        <p className="flex justify-between gap-3 text-muted-foreground"><span>{t.tax} ({+(order.taxRate * 100).toFixed(2)}%)</span><span className="tabular-nums">{money(order.taxAmount)}</span></p>
      )}
      <p className="flex justify-between gap-3 border-t border-border/70 pt-1.5 font-bold text-foreground"><span>{t.total}</span><span className="tabular-nums">{money(order.total)}</span></p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { engagement, consultationBookings, loading, me } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const day = (d: string | Date) => new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const [orders, setOrders] = useState<any[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState('');
  const [receiptFor, setReceiptFor] = useState('');
  const [cancelling, setCancelling] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const eid: string | undefined = engagement?.id;

  const load = useCallback(async () => {
    try {
      setOrders((await api.getMyPayments()) ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { if (me) load(); }, [me, load]);
  useEffect(() => {
    setPlan(null);
    if (eid) api.getServicePlan(eid).then(setPlan).catch(() => {});
  }, [eid]);

  // While a payment is being confirmed, look again on its own.
  const confirming = (orders ?? []).some((o) => o.payment === 'confirming');
  // Asks the payment provider about each payment still being confirmed, then reads the result.
  const recheck = useCallback(async () => {
    const waiting = (orders ?? []).filter((o) => o.payment === 'confirming' || o.payment === 'unconfirmed');
    await Promise.all(waiting.map((o) => api.verifyOrderPayment(o.id).catch(() => undefined)));
    await load();
  }, [orders, load]);
  useEffect(() => {
    if (!confirming) return;
    const timer = setInterval(recheck, 20_000);
    return () => clearInterval(timer);
  }, [confirming, recheck]);

  const list = orders ?? [];
  const due = useMemo(() => list.filter((o) => o.status === 'PENDING').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [list]);
  const paid = list.filter((o) => o.status === 'PAID').reduce((s, o) => s + o.total, 0);
  const toPay = due.reduce((s, o) => s + o.total, 0);
  const stages: any[] = plan?.stages ?? [];
  // Stages of the plan that have not been invoiced yet.
  const later = stages.filter((s) => s.status === 'PENDING').reduce((sum, s) => sum + Number(s.stageTotal ?? 0), 0);
  const agreed = paid + toPay + later;
  const pct = agreed > 0 ? Math.round((paid / agreed) * 100) : 0;
  const consults = (consultationBookings ?? [])
    .filter((c: any) => Number(c.amountPaid ?? 0) > 0 && c.status !== 'AWAITING_PAYMENT' && c.slot?.startAt)
    .sort((a: any, b: any) => new Date(b.slot.startAt).getTime() - new Date(a.slot.startAt).getTime());

  async function pay(order: any) {
    setPaying(order.id);
    try {
      const result = await api.initiatePayment(order.id, me?.phone, me?.email);
      if (result.redirectUrl) { window.location.href = result.redirectUrl; return; }
      toast.error(t.payFailed);
    } catch {
      toast.error(t.payFailed);
    }
    setPaying('');
  }
  async function receipt(order: any) {
    setReceiptFor(order.id);
    try {
      await downloadReceipt(order);
    } catch (e: any) {
      toast.error(e?.message === '404' ? t.receiptNotReady : t.receiptFailed);
    } finally {
      setReceiptFor('');
    }
  }
  async function confirmCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api.cancelOrder(cancelling.id);
      toast.success(t.cancelled);
      setCancelling(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.cancelFailed);
    } finally {
      setBusy(false);
    }
  }

  if (loading || (orders === null && !failed)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div data-tour="page-header">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {agreed > 0 ? <>{t.headline(short(paid), short(agreed))}{toPay > 0 && <> · <span className="font-semibold text-foreground">{t.toPayShort(short(toPay))}</span></>}</> : t.nothingYet}
        </p>
      </div>

      {failed && <div className={`${card} px-5 py-4 text-sm text-muted-foreground`}>{t.loadFailed}</div>}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          {/* To pay now */}
          <div data-tour="pay-due" className="space-y-4">
            {due.length === 0 ? (
              <section className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-secondary" /> {list.length === 0 ? t.noOrders : t.upToDate}
                </p>
                {list.length === 0 && <Link href="/checkout" className={btnPrimary}>{t.checkout}</Link>}
              </section>
            ) : due.map((order) => (
              <section key={order.id} className={`${card} p-5`}>
                <h2 className={heading}>{t.toPayNow}</h2>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-foreground">{money(order.total)}</p>
                <div className="mt-3 max-w-lg"><OrderLines order={order} t={t} /></div>

                {order.payment === 'confirming' ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                    <p className="flex min-w-0 items-start gap-2.5 text-sm text-foreground">
                      <CircleNotch className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                      <span><span className="block font-bold">{t.confirming(short(order.total))}</span><span className="block text-muted-foreground">{t.confirmingSub}</span></span>
                    </p>
                    <button onClick={recheck} className={btnOutline}>{t.checkAgain}</button>
                  </div>
                ) : (
                  <>
                    {order.payment === 'failed' && (
                      <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">
                        <Dot className="mt-1.5 bg-muted-foreground/40" />
                        <span><span className="block font-bold">{t.failed}</span><span className="block text-muted-foreground">{t.failedSub}</span></span>
                      </p>
                    )}
                    {order.payment === 'unconfirmed' && (
                      <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-accent/15 px-4 py-3 text-sm text-foreground">
                        <Dot className="mt-1.5 bg-accent" />
                        <span><span className="block font-bold">{t.unconfirmed}</span><span className="block">{t.unconfirmedSub} <Link href="/tickets?topic=PAYMENT" className="font-bold text-primary hover:underline">{t.getHelp}</Link></span></span>
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button onClick={() => pay(order)} disabled={!!paying} className={`${btnPrimary} w-full px-6 py-2.5 text-sm sm:w-auto`}>
                        {paying === order.id ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} {paying === order.id ? t.opening : t.pay(short(order.total))}
                      </button>
                      {order.canCancel && <button onClick={() => setCancelling(order)} disabled={!!paying} className="text-xs font-bold text-muted-foreground hover:text-foreground">{t.cancelOrder}</button>}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{t.howCharged}</p>
                  </>
                )}
              </section>
            ))}
          </div>

          {/* Plan */}
          {stages.length > 0 && (
            <section data-tour="pay-plan" className={`${card} overflow-hidden`}>
              <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>{t.plan} <span className="normal-case tracking-normal">· {t.planSub}</span></h2></div>
              <ul className="divide-y divide-border/70">
                {stages.map((s, i) => (
                  <li key={s.stage?.id ?? i} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.status === 'PAID' ? 'bg-secondary text-white' : s.status === 'INVOICED' ? 'bg-primary' : 'border-2 border-border'}`}>{s.status === 'PAID' && <Check className="h-3 w-3" />}</span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{s.stage?.label ?? `${i + 1}`}</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{short(Number(s.stageTotal ?? 0))}</span>
                      <span className="inline-flex w-20 items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className={PLAN_DOT[s.status] ?? 'bg-muted'} /> {t.planStatus[s.status] ?? s.status}</span>
                    </div>
                    {(s.items ?? []).length > 0 && (
                      <ul className="ml-8 mt-1.5 space-y-0.5">
                        {s.items.map((item: any) => (
                          <li key={item.id} className="flex justify-between gap-3 text-xs text-muted-foreground"><span className="min-w-0 truncate">{item.name}</span><span className="shrink-0 tabular-nums">{short(Number(item.priceUsd ?? 0))}</span></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              <p className="flex justify-between gap-3 border-t border-border px-5 py-3 text-sm font-bold text-foreground"><span>{t.total}</span><span className="tabular-nums">{short(Number(plan.grandTotal ?? 0))}</span></p>
            </section>
          )}

          {/* Payments and receipts */}
          <section data-tour="pay-invoices" className={`${card} overflow-hidden`}>
            <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>{t.history}</h2></div>
            {list.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t.noHistory}</p> : (
              <ul className="divide-y divide-border/70">
                {list.map((order) => {
                  const open = expanded === order.id;
                  return (
                    <li key={order.id} className={order.status === 'CANCELLED' ? 'opacity-60' : ''}>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                        <button onClick={() => setExpanded(open ? null : order.id)} aria-expanded={open} aria-label={t.details} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className="w-24 shrink-0 text-xs text-muted-foreground">{day(order.createdAt)}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{orderLabel(order, t)}</span>
                          {open ? <CaretUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <CaretDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        </button>
                        <span className="text-sm font-bold tabular-nums text-foreground">{short(order.total)}</span>
                        <span className="inline-flex w-24 items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className={DOT[order.status] ?? 'bg-muted'} /> {Number(order.refundAmount ?? 0) >= Number(order.total) && Number(order.total) > 0 ? t.refunded : Number(order.refundAmount ?? 0) > 0 ? `${t.partRefunded ?? t.refunded} ${short(Number(order.refundAmount))}` : t.status[order.status] ?? order.status}</span>
                        {order.status === 'PAID' && (
                          <button onClick={() => receipt(order)} disabled={receiptFor === order.id} className={btnOutline}>
                            {receiptFor === order.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <DownloadSimple className="h-3.5 w-3.5" />} {t.receipt}
                          </button>
                        )}
                      </div>
                      {open && <div className="border-t border-border/70 bg-muted/30 px-5 py-4"><div className="max-w-lg"><OrderLines order={order} t={t} /></div></div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Consultations */}
          {consults.length > 0 && (
            <section data-tour="pay-consults" className={`${card} overflow-hidden`}>
              <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>{t.consultations}</h2></div>
              <ul className="divide-y divide-border/70">
                {consults.map((c: any) => {
                  const amount = Number(c.amountPaid);
                  const refund = Number(c.refundAmount ?? 0);
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{day(c.slot.startAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{t.consult[c.consultationCategory] ?? t.consult.BOTH}{c.slot.consultant?.name ? <span className="font-normal text-muted-foreground"> · {c.slot.consultant.name}</span> : null}</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{short(amount)}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Dot className={refund > 0 ? 'bg-muted-foreground/40' : 'bg-secondary'} />
                        {refund >= amount ? t.refunded : refund > 0 ? `${t.partRefunded} ${short(refund)}` : t.paid}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          {agreed > 0 && (
            <section data-tour="pay-stats" className={`${card} p-5`}>
              <h2 className={`mb-3 ${heading}`}>{t.summary}</h2>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
                <span className="text-sm font-bold text-foreground">{pct}%</span>
              </div>
              <dl className="mt-3 text-sm">
                {[[t.sPaid, paid], [t.sToPay, toPay], ...(later > 0 ? [[t.sLater, later]] : [])].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between gap-3 py-1"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums text-foreground">{short(value as number)}</dd></div>
                ))}
                <div className="mt-1 flex justify-between gap-3 border-t border-border/70 pt-2"><dt className="font-bold text-foreground">{t.sTotal}</dt><dd className="font-bold tabular-nums text-foreground">{short(agreed)}</dd></div>
              </dl>
            </section>
          )}
          <section className={`${card} p-5`}>
            <h2 className={`mb-3 ${heading}`}>{t.good}</h2>
            <dl className="space-y-3">
              {t.rules.map(([name, body]) => (
                <div key={name}><dt className="text-sm font-bold text-foreground">{name}</dt><dd className="text-sm text-muted-foreground">{body}</dd></div>
              ))}
            </dl>
          </section>
          <section className={`${card} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Headset className="h-4 w-4 text-primary" /> {t.help}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.helpBody}</p>
            <Link href="/tickets?topic=PAYMENT" className={`${btnOutline} mt-3 w-full`}>{t.getHelp}</Link>
          </section>
        </aside>
      </div>

      {/* Cancel an unpaid order */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => setCancelling(null)}>
          <div role="dialog" aria-modal="true" aria-label={t.cancelTitle} className="w-full rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">{t.cancelTitle}</h2>
              <button onClick={() => setCancelling(null)} aria-label={t.keep} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="rounded-xl bg-muted/50 px-4 py-2.5 text-sm font-semibold text-foreground">{orderLabel(cancelling, t)} · {short(cancelling.total)}</p>
            <p className="mt-3 text-sm text-foreground">{t.cancelBody}</p>
            {cancelling.payment !== 'none' && <p className="mt-2 text-sm text-muted-foreground">{t.cancelLate}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCancelling(null)} className={btnOutline}>{t.keep}</button>
              <button onClick={confirmCancel} disabled={busy} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.cancelOrder}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
