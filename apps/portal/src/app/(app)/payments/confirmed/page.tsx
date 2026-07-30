'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@mjn/ui';
import {
  ShoppingCart,
  CheckCircle, CircleNotch, Clock, Warning, ArrowRight,
  Receipt, Envelope, WhatsappLogo,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';

function ConfirmedContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState('');

  React.useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    async function load() {
      try {
        const data = await api.getOrder(orderId!);
        setOrder(data);
      } catch {
        setFetchError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    }

    load();

    // Auto-refresh every 10s while order is PENDING (webhook hasn't fired yet)
    const interval = setInterval(async () => {
      try {
        const data = await api.getOrder(orderId!);
        setOrder(data);
        if (data?.status === 'PAID') clearInterval(interval);
      } catch { /* silent */ }
    }, 10_000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <CircleNotch className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (fetchError || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <Warning className="h-10 w-10 text-amber-500" />
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-slate-900">Order not found</h1>
        <p className="mb-6 text-slate-500">
          We couldn't retrieve your order details. If you completed payment, check your email for a receipt or view your payments history.
        </p>
        {orderId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Order reference: <span className="font-mono font-semibold text-slate-800">{orderId}</span>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild><Link href="/payments">View Payments <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button variant="outline" asChild><Link href="/">Back to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  // ── Awaiting payment ───────────────────────────────────────────────────────
  if (order.status === 'PENDING') {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-slate-900">Payment Processing</h1>
        <p className="mb-4 leading-relaxed text-slate-500">
          Your order is awaiting payment confirmation. Once verified, your receipt will be emailed to you and your case will be updated.
        </p>
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          If you completed payment, it may take a few minutes to confirm. Check your email or refresh below.
        </div>
        {orderId && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Order reference: <span className="font-mono font-semibold text-slate-800">{orderId}</span>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => window.location.reload()}>
            <CircleNotch className="mr-1.5 h-4 w-4" /> Refresh Status
          </Button>
          <Button variant="outline" asChild><Link href="/payments">View All Orders</Link></Button>
        </div>
      </div>
    );
  }

  // ── Paid / confirmed ───────────────────────────────────────────────────────
  const lineItems: any[] = order.lineItems ?? [];
  const total = Number(order.total ?? 0);
  const taxAmount = Number(order.taxAmount ?? 0);
  const subtotal = Number(order.subtotal ?? 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      {/* Success header */}
      <div className="text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-10 w-10 text-emerald-600" weight="fill" />
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Payment Confirmed!</h1>
        <p className="leading-relaxed text-slate-500">
          Your payment has been received and your engagement is now active. A receipt has been sent to your email and WhatsApp.
        </p>
      </div>

      {/* Order summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Receipt className="h-4 w-4 text-primary-600" weight="fill" />
          <span className="font-semibold text-slate-800">Order Summary</span>
        </div>
        {lineItems.length > 0 && (
          <div className="divide-y divide-slate-50 px-5">
            {lineItems.map((li: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-700">
                  {li.serviceItem?.name ?? li.name ?? 'Service'}
                  {li.variantKey ? ` (${li.variantKey})` : ''}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  ${Number(li.priceCharged ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1 border-t border-slate-200 px-5 py-4">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax</span><span>${taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
            <span>Total paid</span>
            <span className="text-primary-700">${total.toFixed(2)}</span>
          </div>
          {orderId && (
            <p className="pt-1 text-xs text-slate-400">
              Ref: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">What happens next</p>
        <div className="space-y-4">
          {[
            { icon: Envelope, label: 'Check your email', desc: 'Your receipt and a summary of your selected services have been emailed to you.' },
            { icon: WhatsappLogo, label: 'Check WhatsApp', desc: 'A payment confirmation has been sent to your WhatsApp number.' },
            { icon: ShoppingCart, label: 'Case is now active', desc: 'Your assigned consultant will review your case and be in touch within 1–2 business days.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <Icon className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/case">View My Case <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/payments">View Payments</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentsConfirmedPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <CircleNotch className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <ConfirmedContent />
    </React.Suspense>
  );
}
