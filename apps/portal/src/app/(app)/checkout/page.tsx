'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ShoppingCart, CheckCircle, CircleNotch,
  Lock, ArrowRight, ArrowLeft, Tag,
  WarningCircle, CreditCard, Signature, Info,
  CaretDown, CaretUp, ShieldCheck, Prohibit, Clock as ClockIcon,
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

function OrderSummarySidebar({
  cartLines,
  subtotal,
  paymentMode,
  step,
}: {
  cartLines: { serviceItemId: string; variantKey?: string; name: string; price: number }[];
  subtotal: number;
  paymentMode: 'FULL' | 'INSTALLMENT';
  step: number;
}) {
  const firstInstalment = Math.ceil(subtotal / 2);
  const secondInstalment = subtotal - firstInstalment;
  const dueToday = paymentMode === 'INSTALLMENT' ? firstInstalment : subtotal;

  return (
    <div className="hidden xl:block w-72 shrink-0 sticky top-6">
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" weight="fill" />
          <p className="font-semibold text-foreground text-sm">Order Summary</p>
        </div>

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
              <span className="flex items-center gap-1">Tax <Info className="h-3 w-3" /></span>
              <span>At payment</span>
            </div>

            {step >= 1 && paymentMode === 'INSTALLMENT' && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>1st instalment (today)</span>
                  <span className="font-semibold text-foreground">${firstInstalment.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>2nd instalment (on milestone)</span>
                  <span>${secondInstalment.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold text-foreground">Due today</span>
              <span className="text-lg font-bold text-primary">${dueToday.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Trust signals */}
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
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'INSTALLMENT'>('FULL');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Duplicate payment guard
  const [paidItemIds, setPaidItemIds] = useState<Set<string>>(new Set());
  const [hasPendingOrder, setHasPendingOrder] = useState(false);

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

      // Build paid item set and detect in-flight orders
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
      const init: Selections = {};
      const initExpanded = new Set<string>();

      for (const cat of cats) {
        const hasSelections = cat.items.some((item) => item.isDefaultSelected && !paid.has(item.id));
        if (cat.isMandatory || hasSelections) initExpanded.add(cat.id);

        for (const item of cat.items) {
          // Already paid — lock it checked but don't add to cart total
          if (paid.has(item.id)) {
            init[item.id] = { checked: false }; // excluded from new cart
            continue;
          }
          let variantKey: string | undefined;
          if (item.variantGroup === 'profession' && prof) {
            const match = item.variants.find((v) => v.variantKey.toLowerCase() === prof);
            if (match) variantKey = match.variantKey;
          }
          init[item.id] = {
            checked: cat.isMandatory ? true : item.isDefaultSelected,
            variantKey,
          };
        }
      }
      setSelections(init);
      setExpandedCats(initExpanded);
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
    const lines: { serviceItemId: string; variantKey?: string; name: string; price: number }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        const sel = selections[item.id];
        if (sel?.checked) {
          lines.push({
            serviceItemId: item.id,
            variantKey: sel.variantKey,
            name: item.name + (sel.variantKey ? ` (${sel.variantKey})` : ''),
            price: resolvePrice(item, sel.variantKey),
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
    if (mandatory) return; // mandatory always open
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }

  const cartLines = buildLines();
  const subtotal = cartLines.reduce((s, l) => s + l.price, 0);
  const firstInstalment = Math.ceil(subtotal / 2);
  const secondInstalment = subtotal - firstInstalment;
  const dueToday = paymentMode === 'INSTALLMENT' ? firstInstalment : subtotal;
  const letterSigned = !!engagement?.letterSignedAt;
  const canProceed = cartLines.length > 0 && letterSigned && !!engagement && !hasMissingVariants() && !hasPendingOrder;

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

  async function handlePay() {
    if (!engagement) { setSubmitError('No active engagement found. Please contact your consultant.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const lines = cartLines.map((l) => ({ serviceItemId: l.serviceItemId, variantKey: l.variantKey }));
      const order = await api.createOrder(engagement.id, lines, paymentMode);
      const payment = await api.initiatePayment(order.id, me?.phone, me?.email);
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

      {/* ── Engagement gate banners ───────────────────────────────────── */}
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

          {/* ── Step 0: Select services ─────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catSel = cat.items.filter((item) => selections[item.id]?.checked).length;
                const isExpanded = cat.isMandatory || expandedCats.has(cat.id);
                const sub = catSubtotal(cat);

                return (
                  <div key={cat.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    {/* Category header — clickable to collapse if not mandatory */}
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

                          // Already-paid items render as a locked "paid" row, excluded from cart
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

                                  {/* Variant selector */}
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

              {/* Mobile running total */}
              {subtotal > 0 && (
                <div className="xl:hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Estimated total</span>
                    <span className="text-xl font-bold text-primary">${subtotal.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-primary/70">
                    {cartLines.length} service{cartLines.length !== 1 ? 's' : ''} selected · Tax calculated at payment
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

          {/* ── Step 1: Review cart ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-3.5">
                  <p className="font-semibold text-foreground">Order Summary</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cartLines.length} service{cartLines.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="divide-y divide-border/50 px-5">
                  {cartLines.map((line) => (
                    <div key={line.serviceItemId + (line.variantKey ?? '')} className="flex items-center justify-between py-3.5">
                      <span className="text-sm text-foreground">{line.name}</span>
                      <span className="text-sm font-bold text-foreground">${line.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border bg-muted/10 px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">Tax <Info className="h-3 w-3" /></span>
                    <span>Calculated at payment</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">${subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment plan */}
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-foreground">Choose a payment plan</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    {
                      mode: 'FULL' as const,
                      title: 'Pay in full',
                      desc: 'Pay the full amount now — no further invoices.',
                      badge: null,
                      amount: `$${subtotal.toLocaleString()} today`,
                    },
                    {
                      mode: 'INSTALLMENT' as const,
                      title: 'Instalment plan',
                      desc: 'Pay now, second instalment auto-invoiced on your milestone.',
                      badge: 'Flexible',
                      amount: `$${firstInstalment.toLocaleString()} today · $${secondInstalment.toLocaleString()} later`,
                    },
                  ]).map(({ mode, title, desc, badge, amount }) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMode === mode
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-white hover:border-primary/30'
                      }`}
                    >
                      {badge && (
                        <span className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {badge}
                        </span>
                      )}
                      <div className={`flex items-center gap-2 mb-1 ${paymentMode === mode ? 'text-primary' : 'text-foreground'}`}>
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 shrink-0 ${
                          paymentMode === mode ? 'border-primary' : 'border-border'
                        }`}>
                          {paymentMode === mode && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-sm font-semibold">{title}</span>
                      </div>
                      <p className={`text-xs leading-relaxed pl-6 ${paymentMode === mode ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        {desc}
                      </p>
                      <p className={`mt-1.5 pl-6 text-xs font-semibold ${paymentMode === mode ? 'text-primary' : 'text-muted-foreground'}`}>
                        {amount}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
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
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" weight="fill" />
                  <p className="font-semibold text-foreground">Confirm your order</p>
                </div>

                <div className="divide-y divide-border/50 px-5">
                  {cartLines.map((line) => (
                    <div key={line.serviceItemId + (line.variantKey ?? '')} className="flex items-center justify-between py-3 text-sm">
                      <span className="text-muted-foreground">{line.name}</span>
                      <span className="font-semibold text-foreground">${line.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border bg-muted/10 px-5 py-4">
                  <div className="flex items-center justify-between mb-1 text-sm text-muted-foreground">
                    <span>Plan</span>
                    <span className="font-medium text-foreground">{paymentMode === 'FULL' ? 'Full payment' : 'Instalment plan'}</span>
                  </div>
                  {paymentMode === 'INSTALLMENT' && (
                    <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                      <span>2nd instalment</span>
                      <span>${secondInstalment.toLocaleString()} — invoiced on milestone</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Due today</span>
                    <span className="text-2xl font-bold text-primary">${dueToday.toLocaleString()}</span>
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
                  including the scope of services, fee schedule, and the explicit disclaimer that MJN Health does not guarantee
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
            </div>
          )}

        </div>

        {/* ── Sticky sidebar (xl+) ──────────────────────────────────────── */}
        <OrderSummarySidebar
          cartLines={cartLines}
          subtotal={subtotal}
          paymentMode={paymentMode}
          step={step}
        />
      </div>
    </div>
  );
}
