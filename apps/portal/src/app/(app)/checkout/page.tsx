'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ShoppingCart, CheckCircle, CircleNotch,
  Lock, ArrowRight, ArrowLeft, Tag,
  WarningCircle, CreditCard, Signature, Info,
  CaretDown, CaretUp, ShieldCheck, Prohibit, Clock as ClockIcon,
  ChatCircle, X, Receipt, UserCircle, Envelope, Phone,
  CalendarCheck, Bell, ArrowSquareOut,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

type Variant = { id: string; variantKey: string; priceUsd: number };
type Item = {
  id: string;
  name: string;
  priceUsd: number;
  description?: string;
  variantGroup?: string | null;
  isDefaultSelected: boolean;
  variants: Variant[];
};
type Category = {
  id: string;
  name: string;
  isMandatory: boolean;
  sortOrder: number;
  items: Item[];
};

type ItemSel = { checked: boolean; variantKey?: string };
type Selections = Record<string, ItemSel>;

const STEPS = [
  { label: 'Select Services', icon: Tag },
  { label: 'Review Cart',     icon: ShoppingCart },
  { label: 'Payment',         icon: CreditCard },
];

const TAX_RATE = 0.0325;
const SESSION_KEY = 'mjn-checkout-v1';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <div className="hidden xl:block w-72 shrink-0">
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Order Summary Sidebar ─────────────────────────────────────────────────────

function OrderSummaryContent({
  cartLines,
  subtotal,
}: {
  cartLines: { serviceItemId: string; variantKey?: string; name: string; price: number }[];
  subtotal: number;
}) {
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const dueToday = subtotal + taxAmount;

  return (
    <>
      {cartLines.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No services selected yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50 px-5 max-h-72 overflow-y-auto">
          {cartLines.map((line) => (
            <div key={line.serviceItemId + (line.variantKey ?? '')} className="flex items-start justify-between gap-2 py-3">
              <span className="text-xs text-foreground leading-snug">{line.name}</span>
              <span className="text-xs font-bold text-foreground shrink-0">${line.price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {cartLines.length > 0 && (
        <div className="border-t border-border bg-muted/10 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">Tax (3.25%) <Info className="h-3 w-3" /></span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-foreground">Due today</span>
            <span className="text-lg font-bold text-primary">${dueToday.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="border-t border-border px-5 py-4 space-y-2">
        {[
          'SSL-encrypted, secure payment',
          'Powered by Tranzak — PCI compliant',
          'Receipt sent to your email + WhatsApp',
        ].map((signal) => (
          <div key={signal} className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" weight="fill" />
            <span className="text-xs text-muted-foreground">{signal}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function OrderSummarySidebar({
  cartLines, subtotal,
}: {
  cartLines: { serviceItemId: string; variantKey?: string; name: string; price: number }[];
  subtotal: number;
}) {
  return (
    <div className="hidden xl:block w-72 shrink-0 sticky top-6">
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" weight="fill" />
          <p className="font-semibold text-foreground text-sm">Order Summary</p>
        </div>
        <OrderSummaryContent cartLines={cartLines} subtotal={subtotal} />
      </div>
    </div>
  );
}

// ── Mobile Cart Drawer ────────────────────────────────────────────────────────

function MobileCartDrawer({
  open,
  onClose,
  cartLines,
  subtotal,
}: {
  open: boolean;
  onClose: () => void;
  cartLines: { serviceItemId: string; variantKey?: string; name: string; price: number }[];
  subtotal: number;
}) {
  if (!open) return null;
  return (
    <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" weight="fill" />
            <p className="font-semibold text-foreground text-sm">Order Summary</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto">
          <OrderSummaryContent cartLines={cartLines} subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}

// ── Billing Summary Card ──────────────────────────────────────────────────────

function BillingSummaryCard({ me }: { me: any }) {
  const name = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.name || 'You';
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
        <UserCircle className="h-4 w-4 text-primary" weight="fill" />
        <p className="font-semibold text-foreground text-sm">Billing to</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
        {me?.email && (
          <div className="flex items-center gap-2.5">
            <Envelope className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{me.email}</span>
          </div>
        )}
        {me?.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{me.phone}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground/70 border-t border-border pt-3">
          Receipt and payment confirmation will be sent to the above contacts.
          <a href="/profile" className="ml-1 text-primary underline underline-offset-2">Update details</a>
        </p>
      </div>
    </div>
  );
}

// ── What Happens Next ─────────────────────────────────────────────────────────

function WhatHappensNext() {
  const steps = [
    {
      icon: Receipt,
      title: 'Receipt issued',
      desc: 'An itemised receipt is sent to your email and WhatsApp immediately after payment.',
    },
    {
      icon: CalendarCheck,
      title: 'Consultant contacts you',
      desc: 'Your assigned consultant will reach out within 24 hours to confirm next steps.',
    },
    {
      icon: Bell,
      title: 'Case activated on dashboard',
      desc: 'Your My Case page updates with your active services and document checklist.',
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-5 py-3.5">
        <p className="font-semibold text-foreground text-sm">What happens after you pay</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" weight="fill" />
              </div>
              {i < steps.length - 1 && (
                <div className="absolute top-8 bottom-0 w-px bg-border" style={{ height: 28 }} />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { me, engagement, loading: userLoading } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const paymentMode = 'FULL' as const;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paidItemIds, setPaidItemIds] = useState<Set<string>>(new Set());
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditPreview, setCreditPreview] = useState<{ maxSpendableCents: number } | null>(null);
  const [useCredits, setUseCredits] = useState(false);

  // ── Session persistence ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && Object.keys(selections).length > 0) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, selections }));
      } catch { /* ignore quota errors */ }
    }
  }, [step, selections, loading]);

  useEffect(() => {
    if (userLoading || !me) return;
    loadCatalog();
  }, [userLoading, me]);

  async function loadCatalog() {
    setLoading(true);
    try {
      const [cats, existingOrders] = await Promise.all([
        api.getCategories() as Promise<Category[]>,
        engagement ? api.getOrdersByEngagement(engagement.id) : Promise.resolve([]),
      ]);

      const orders = existingOrders as any[];
      const pending = orders.find((o: any) => o.status === 'PENDING');
      setHasPendingOrder(!!pending);
      const paid = new Set<string>(
        orders
          .filter((o: any) => o.status === 'PAID')
          .flatMap((o: any) => (o.lineItems ?? []).map((li: any) => li.serviceItemId as string)),
      );
      setPaidItemIds(paid);

      setCategories(cats);
      const prof = me?.profession?.toLowerCase() ?? '';
      const initExpanded = new Set<string>();
      const defaultInit: Selections = {};

      for (const cat of cats) {
        const hasSelections = cat.items.some((item) => item.isDefaultSelected && !paid.has(item.id));
        if (cat.isMandatory || hasSelections) initExpanded.add(cat.id);

        for (const item of cat.items) {
          if (paid.has(item.id)) {
            defaultInit[item.id] = { checked: false };
            continue;
          }
          let variantKey: string | undefined;
          if (item.variantGroup === 'profession' && prof) {
            const match = item.variants.find((v) => v.variantKey.toLowerCase() === prof);
            if (match) variantKey = match.variantKey;
          }
          defaultInit[item.id] = {
            checked: cat.isMandatory ? true : item.isDefaultSelected,
            variantKey,
          };
        }
      }

      setExpandedCats(initExpanded);

      // Restore from session if available
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const { step: savedStep, selections: savedSel } = JSON.parse(saved);
          const restored: Selections = {};
          for (const cat of cats) {
            for (const item of cat.items) {
              if (savedSel[item.id] !== undefined && !paid.has(item.id)) {
                restored[item.id] = savedSel[item.id];
              } else {
                restored[item.id] = defaultInit[item.id];
              }
            }
          }
          setSelections(restored);
          setStep(typeof savedStep === 'number' ? savedStep : 0);
        } else {
          setSelections(defaultInit);
        }
      } catch {
        setSelections(defaultInit);
      }
    } catch {
      setError('Failed to load checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function resolvePrice(item: Item, variantKey?: string): number {
    if (variantKey) {
      const v = item.variants.find((x) => x.variantKey === variantKey);
      if (v) return Number(v.priceUsd);
    }
    return Number(item.priceUsd);
  }

  function buildLines() {
    const lines: { serviceItemId: string; variantKey?: string; name: string; price: number; categoryId: string }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        const sel = selections[item.id];
        if (sel?.checked) {
          lines.push({
            serviceItemId: item.id,
            variantKey: sel.variantKey,
            name: item.name + (sel.variantKey ? ` (${sel.variantKey})` : ''),
            price: resolvePrice(item, sel.variantKey),
            categoryId: cat.id,
          });
        }
      }
    }
    return lines;
  }

  function hasMissingVariants(): boolean {
    for (const cat of categories) {
      for (const item of cat.items) {
        const sel = selections[item.id];
        if (sel?.checked && item.variants.length > 0 && !sel.variantKey) return true;
      }
    }
    return false;
  }

  function toggleCat(catId: string, mandatory: boolean) {
    if (mandatory) return;
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }

  const cartLines = buildLines();
  const subtotal = cartLines.reduce((s, l) => s + l.price, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const subtotalCents = Math.round(subtotal * 100);
  const creditDiscount = useCredits && creditPreview
    ? Math.min(creditPreview.maxSpendableCents, Math.round(subtotalCents * 0.3)) / 100
    : 0;
  const dueToday = subtotal + taxAmount - creditDiscount;
  const letterSigned = !!engagement?.letterSignedAt;
  const canProceed = cartLines.length > 0 && letterSigned && !!engagement && !hasMissingVariants() && !hasPendingOrder;

  // Categories that have items in cart (for grouped step 1 view)
  const categoriesWithCart = categories
    .map((cat) => ({
      ...cat,
      cartItems: cartLines.filter((l) => l.categoryId === cat.id),
    }))
    .filter((cat) => cat.cartItems.length > 0);

  function toggleItem(itemId: string, mandatory: boolean) {
    if (mandatory || paidItemIds.has(itemId)) return;
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], checked: !prev[itemId]?.checked },
    }));
  }

  function setVariant(itemId: string, variantKey: string) {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], variantKey },
    }));
  }

  function catSubtotal(cat: Category): number {
    return cat.items.reduce((sum, item) => {
      const sel = selections[item.id];
      if (!sel?.checked) return sum;
      return sum + resolvePrice(item, sel.variantKey);
    }, 0);
  }

  // Load credit preview when entering payment step
  useEffect(() => {
    if (step === 2 && subtotalCents > 0) {
      api.previewCreditSpend(subtotalCents)
        .then((p) => { setCreditBalance(p.balanceCents ?? 0); setCreditPreview(p); })
        .catch(() => {});
    }
  }, [step, subtotalCents]);

  async function handlePay() {
    if (!engagement) { setSubmitError('No active engagement found. Please contact your consultant.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const lines = cartLines.map((l) => ({ serviceItemId: l.serviceItemId, variantKey: l.variantKey }));
      const order = await api.createOrder(engagement.id, lines, paymentMode);
      // Apply credits if toggled
      if (useCredits && creditPreview && creditPreview.maxSpendableCents > 0) {
        await api.transferCredits('__spend__', creditPreview.maxSpendableCents, `Applied to order ${order.id}`)
          .catch(() => {}); // best-effort; server spends via markPaid flow
      }
      const payment = await api.initiatePayment(order.id, me?.phone, me?.email);
      // Clear session on successful redirect to payment
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
      if (payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
      } else {
        router.push(`/payments?confirmed=${order.id}`);
      }
    } catch (e: any) {
      setSubmitError(e.message ?? 'Payment initiation failed. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading || userLoading) return <CheckoutSkeleton />;

  const proceedBlockedReason =
    !engagement ? 'No active engagement — contact your consultant to get started.'
    : !letterSigned ? 'Sign your engagement letter on the My Case page before checkout.'
    : hasPendingOrder ? 'Complete your in-progress payment before starting a new order.'
    : hasMissingVariants() ? 'Some selected services need a profession variant — see warnings below.'
    : cartLines.length === 0 ? 'Select at least one service to continue.'
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Page title ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Select the services you need and proceed to secure payment.</p>
      </div>

      {/* ── Gate banners ──────────────────────────────────────────────── */}
      {!engagement && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" weight="fill" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">No active engagement</p>
            <p className="text-amber-700">Your consultant needs to set up your engagement before you can check out.</p>
          </div>
        </div>
      )}

      {engagement && !letterSigned && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Signature className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Sign your engagement letter first</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The engagement letter defines your agreed scope and fees. It's required before any payment can be processed.
            </p>
            <a
              href="/case"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <Signature className="h-3.5 w-3.5" /> Go to My Case
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {hasPendingOrder && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" weight="fill" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800">Payment in progress</p>
            <p className="text-amber-700 mt-0.5">
              You have a pending payment. Complete it before starting a new order — your session may still be open with Tranzak.
            </p>
            <a href="/payments" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
              View payments
            </a>
          </div>
        </div>
      )}

      {/* ── Step indicator ────────────────────────────────────────────── */}
      <div className="flex items-center">
        {STEPS.map(({ label }, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className={`flex items-center gap-2.5 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? 'bg-primary text-white'
                  : i === step
                  ? 'bg-primary text-white ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle className="h-4 w-4" weight="bold" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${
                i === step ? 'text-foreground' : i < step ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-px flex-1 w-8 ${i < step ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">

          {/* ── Step 0: Select services ──────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catSel = cat.items.filter((item) => selections[item.id]?.checked).length;
                const isExpanded = cat.isMandatory || expandedCats.has(cat.id);
                const sub = catSubtotal(cat);

                return (
                  <div key={cat.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCat(cat.id, cat.isMandatory)}
                      className={`w-full flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3.5 ${cat.isMandatory ? 'cursor-default' : 'cursor-pointer hover:bg-muted/30 transition-colors'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" weight="fill" />
                        <span className="font-semibold text-foreground">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({catSel}/{cat.items.filter((i) => !paidItemIds.has(i.id)).length} selected)
                        </span>
                        {cat.items.some((i) => paidItemIds.has(i.id)) && (
                          <span className="text-xs text-primary/60">
                            · {cat.items.filter((i) => paidItemIds.has(i.id)).length} paid
                          </span>
                        )}
                        {sub > 0 && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            ${sub.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {cat.isMandatory && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <Lock className="h-3 w-3" /> Required
                          </span>
                        )}
                        {!cat.isMandatory && (
                          isExpanded
                            ? <CaretUp className="h-4 w-4 text-muted-foreground" />
                            : <CaretDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-border/50 px-5">
                        {cat.items.map((item) => {
                          const alreadyPaid = paidItemIds.has(item.id);
                          const sel = selections[item.id] ?? { checked: false };
                          const price = resolvePrice(item, sel.variantKey);
                          const mandatory = cat.isMandatory;
                          const needsVariant = item.variants.length > 0 && sel.checked && !sel.variantKey;

                          if (alreadyPaid) {
                            return (
                              <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 opacity-60">
                                <div className="flex items-center gap-3">
                                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-primary/30 bg-primary/5 cursor-not-allowed">
                                    <Prohibit className="h-3 w-3 text-primary/40" />
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground line-through">{item.name}</span>
                                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Already paid</span>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">${resolvePrice(item, undefined).toLocaleString()}</span>
                              </div>
                            );
                          }

                          return (
                            <div key={item.id} className={`py-4 transition-colors ${sel.checked ? '' : 'opacity-60'}`}>
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => toggleItem(item.id, mandatory)}
                                  aria-label={sel.checked ? `Deselect ${item.name}` : `Select ${item.name}`}
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                                    sel.checked
                                      ? 'border-primary bg-primary'
                                      : 'border-border bg-white hover:border-primary/50'
                                  } ${mandatory ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {sel.checked && (
                                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className={`text-sm font-medium ${sel.checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {item.name}
                                    </span>
                                    <span className={`shrink-0 text-sm font-bold ${sel.checked ? 'text-primary' : 'text-muted-foreground'}`}>
                                      ${price.toLocaleString()}
                                    </span>
                                  </div>

                                  {item.description && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                                  )}

                                  {item.variants.length > 0 && sel.checked && (
                                    <div className="mt-2.5">
                                      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Select profession:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.variants.map((v) => (
                                          <button
                                            key={v.variantKey}
                                            onClick={() => setVariant(item.id, v.variantKey)}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                                              sel.variantKey === v.variantKey
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                            }`}
                                          >
                                            {v.variantKey.charAt(0).toUpperCase() + v.variantKey.slice(1)}
                                            <span className={`ml-1.5 ${sel.variantKey === v.variantKey ? 'text-white/70' : 'text-muted-foreground'}`}>
                                              ${Number(v.priceUsd).toLocaleString()}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                      {needsVariant && (
                                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                                          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                          <p className="text-xs font-medium text-amber-700">Select a profession variant to continue.</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Consultant escape hatch ─────────────────────────────── */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <ChatCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Not sure which services to select?{' '}
                  <a href="/messages" className="font-semibold text-primary underline underline-offset-2 inline-flex items-center gap-1">
                    Message your consultant <ArrowSquareOut className="h-3 w-3" />
                  </a>
                </p>
              </div>

              {/* Mobile running total */}
              {subtotal > 0 && (
                <div className="xl:hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Estimated total</span>
                    <span className="text-xl font-bold text-primary">${dueToday.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-xs text-primary/70">
                    {cartLines.length} service{cartLines.length !== 1 ? 's' : ''} selected · includes 3.25% tax
                  </p>
                </div>
              )}

              {/* Proceed */}
              <div className="flex flex-col items-end gap-2">
                {proceedBlockedReason && cartLines.length > 0 && (
                  <p className="text-xs text-muted-foreground text-right max-w-xs">{proceedBlockedReason}</p>
                )}
                <button
                  onClick={() => canProceed && setStep(1)}
                  disabled={!canProceed}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                >
                  Review cart <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Review cart (grouped by category) ─────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Grouped by category */}
              {categoriesWithCart.map((cat) => {
                const catTotal = cat.cartItems.reduce((s, l) => s + l.price, 0);
                return (
                  <div key={cat.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-muted/20 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" weight="fill" />
                        <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {cat.cartItems.length} item{cat.cartItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">${catTotal.toLocaleString()}</span>
                    </div>
                    <div className="divide-y divide-border/50 px-5">
                      {cat.cartItems.map((line) => (
                        <div key={line.serviceItemId + (line.variantKey ?? '')} className="flex items-center justify-between py-3.5 gap-3">
                          <span className="text-sm text-foreground">{line.name}</span>
                          <span className="text-sm font-bold text-foreground shrink-0">${line.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Totals card */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-3.5">
                  <p className="font-semibold text-foreground text-sm">Order total</p>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({cartLines.length} services)</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">Tax (3.25%) <Info className="h-3 w-3" /></span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-semibold text-foreground">Total due today</span>
                    <span className="text-xl font-bold text-primary">${dueToday.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit services
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  Continue to payment <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Confirm & pay ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Billing summary */}
              <BillingSummaryCard me={me} />

              {/* Grouped order confirm */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" weight="fill" />
                  <p className="font-semibold text-foreground text-sm">Confirm your order</p>
                </div>

                {categoriesWithCart.map((cat) => (
                  <div key={cat.id} className="border-b border-border/50 last:border-0">
                    <div className="px-5 pt-3 pb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.name}</p>
                    </div>
                    <div className="divide-y divide-border/30 px-5">
                      {cat.cartItems.map((line) => (
                        <div key={line.serviceItemId + (line.variantKey ?? '')} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-muted-foreground">{line.name}</span>
                          <span className="font-semibold text-foreground">${line.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="border-t border-border bg-muted/10 px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tax (3.25%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  {/* Credit toggle */}
                  {creditPreview && creditPreview.maxSpendableCents > 0 && (
                    <div className={`rounded-xl border px-3 py-2.5 transition-colors ${useCredits ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-white'}`}>
                      <label className="flex items-center justify-between cursor-pointer gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => setUseCredits((v) => !v)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${useCredits ? 'border-emerald-500 bg-emerald-500' : 'border-border bg-white'}`}
                          >
                            {useCredits && (
                              <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Apply credits</p>
                            <p className="text-[10px] text-muted-foreground">
                              Balance: ${(creditBalance / 100).toFixed(2)} · Up to ${(creditPreview.maxSpendableCents / 100).toFixed(2)} applicable
                            </p>
                          </div>
                        </div>
                        {useCredits && (
                          <span className="text-sm font-bold text-emerald-600">−${creditDiscount.toFixed(2)}</span>
                        )}
                      </label>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Total due today</span>
                    <span className="text-2xl font-bold text-primary">${dueToday.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Security notice */}
              <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-2.5">
                {[
                  'SSL-encrypted connection — your card data is never stored on our servers.',
                  'Powered by Tranzak, a PCI DSS–compliant payment processor.',
                  'Receipt sent to your email and WhatsApp immediately after payment.',
                ].map((signal) => (
                  <div key={signal} className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" weight="fill" />
                    <span className="text-xs text-muted-foreground">{signal}</span>
                  </div>
                ))}
              </div>

              {/* Terms acknowledgement */}
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border bg-white px-4 py-3.5 hover:bg-muted/20 transition-colors">
                <div
                  onClick={() => setTermsAccepted((v) => !v)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${
                    termsAccepted ? 'border-primary bg-primary' : 'border-border bg-white'
                  }`}
                >
                  {termsAccepted && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  I confirm I have read and agree to the terms set out in my{' '}
                  <a href="/case" className="text-primary underline underline-offset-2">engagement letter</a>,
                  including the scope of services, fee schedule, and the explicit disclaimer that MJN Healthcare does not guarantee
                  exam pass rates, visa approvals, or job placements.
                </p>
              </label>

              {submitError && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <WarningCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" weight="fill" />
                  <p className="text-sm text-rose-700">{submitError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={submitting || !letterSigned || !engagement || !termsAccepted}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <><CircleNotch className="h-4 w-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Pay ${dueToday.toLocaleString()} securely</>
                  )}
                </button>
              </div>

              {/* What happens next */}
              <WhatHappensNext />
            </div>
          )}

        </div>

        {/* ── Sticky sidebar (xl+) ──────────────────────────────────────── */}
        <OrderSummarySidebar cartLines={cartLines} subtotal={subtotal} />
      </div>

      {/* ── Mobile cart drawer ────────────────────────────────────────── */}
      {cartLines.length > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-sm font-bold text-foreground">${dueToday.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{cartLines.length} service{cartLines.length !== 1 ? 's' : ''} · incl. tax</p>
          </div>
          <button
            onClick={() => setMobileCartOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> View cart
          </button>
        </div>
      )}

      <MobileCartDrawer
        open={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        cartLines={cartLines}
        subtotal={subtotal}
      />
    </div>
  );
}
