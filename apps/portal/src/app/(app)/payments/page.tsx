'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Skeleton } from '@mjn/ui';
import {
  CreditCard, CheckCircle, CaretDown, CaretUp,
  Receipt, Clock, TrendUp, DownloadSimple,
  ArrowRight, ShoppingCart, Confetti,
  Coins, FilePdf, Printer, ChatText, Folder, CircleNotch,
  CaretLeft, CaretRight,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from '@tanstack/react-table';

const ORDERS_PAGE_SIZE = 8;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
async function downloadReceiptPdf(orderId: string, createdAt: string): Promise<void> {
  const token = localStorage.getItem('mjn_token');
  const res = await fetch(`${API_BASE}/orders/${orderId}/receipt/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mjn-receipt-${new Date(createdAt).toISOString().slice(0, 10)}-${orderId.slice(-6)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function orderStatusVariant(status: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIALLY_PAID') return 'warning';
  if (status === 'CANCELLED') return 'destructive';
  return 'outline';
}

function paymentModeLabel(mode: string) {
  if (mode === 'INSTALLMENT') return 'Instalment plan';
  if (mode === 'PAY_PER_STAGE') return 'Pay-per-stage';
  return 'Full payment';
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-36 mb-2" /><Skeleton className="h-4 w-72" /></div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="hidden xl:block w-[288px] shrink-0 space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Instalment mini-badge ─────────────────────────────────────────────────────

function InstalmentBadge({ paid, total }: { paid: number; total: number }) {
  const pct = Math.round((paid / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-4 rounded-full ${i < paid ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{paid}/{total}</span>
      <span className="text-xs text-muted-foreground">({pct}%)</span>
    </div>
  );
}

// ── Payment Progress Ring ─────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r; // 263.89
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke="currentColor" strokeWidth="10"
          className="text-muted"
        />
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke="currentColor" strokeWidth="10"
          className="text-primary"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground leading-none">{pct}%</span>
        <span className="text-xs text-muted-foreground mt-0.5">paid</span>
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

function RightSidebar({
  overallPct,
  totalPaid,
  grandTotal,
  dueOrder,
  amountDue,
  dueItems,
  orders,
  router,
  onPayNow,
  paying,
  onDownload,
  downloadingId,
}: {
  overallPct: number;
  totalPaid: number;
  grandTotal: number;
  dueOrder: any;
  amountDue: number;
  dueItems: any[];
  orders: any[];
  router: ReturnType<typeof useRouter>;
  onPayNow: (orderId: string) => void;
  paying: boolean;
  onDownload: (orderId: string, createdAt: string) => void;
  downloadingId: string | null;
}) {
  const paidOrders = orders.filter((o) => o.status === 'PAID');

  return (
    <div className="hidden xl:block w-[288px] shrink-0 sticky top-6 self-start space-y-4">

      {/* Payment progress ring */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Payment Progress
        </p>
        <ProgressRing pct={overallPct} />
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-semibold text-foreground">${totalPaid.toLocaleString()}</span>
          </div>
          {grandTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total agreed</span>
              <span className="font-semibold text-foreground">${grandTotal.toLocaleString()}</span>
            </div>
          )}
          {grandTotal > 0 && totalPaid < grandTotal && (
            <div className="flex items-center justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-foreground">
                ${(grandTotal - totalPaid).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next payment due */}
      {dueOrder && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Next Payment Due
          </p>
          <p className="text-3xl font-bold text-foreground leading-tight">
            ${amountDue.toLocaleString()}
          </p>
          {dueItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Instalment {dueItems[0].installmentPlan.installmentsPaid + 1} of{' '}
              {dueItems[0].installmentPlan.totalInstallments}
            </p>
          )}
          <button
            onClick={() => onPayNow(dueOrder.id)}
            disabled={paying}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {paying ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Pay Now
          </button>
        </div>
      )}

      {/* Receipts & export */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Documents
        </p>
        <div className="space-y-1.5">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Printer className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-left">Export statement</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {paidOrders.length > 0 ? (
            paidOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => onDownload(order.id, order.createdAt)}
                disabled={downloadingId === order.id}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {downloadingId === order.id
                  ? <CircleNotch className="h-4 w-4 text-primary shrink-0 animate-spin" />
                  : <FilePdf className="h-4 w-4 text-primary shrink-0" />}
                <span className="flex-1 min-w-0 truncate text-left">
                  Receipt · {shortDate(order.createdAt)}
                </span>
                <DownloadSimple className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              Receipts appear here once payment is confirmed.
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Actions
        </p>
        <div className="space-y-1.5">
          <button
            onClick={() => router.push('/case')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChatText className="h-4 w-4 text-primary shrink-0" />
            Message consultant
          </button>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
            Go to checkout
          </button>
          <button
            onClick={() => router.push('/documents')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Folder className="h-4 w-4 text-primary shrink-0" />
            My documents
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const router = useRouter();
  const { orders, engagement, loading, me } = useUser();
  const [servicePlan, setServicePlan] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(orderId: string, createdAt: string) {
    setDownloadingId(orderId);
    try {
      await downloadReceiptPdf(orderId, createdAt);
      toast.success('Receipt downloaded successfully.');
    } catch (err: any) {
      if (err?.message?.includes('404')) {
        toast.error('Receipt not available yet. Please try again after payment is confirmed.');
      } else {
        toast.error('Could not download receipt. Please try again.');
      }
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleResumePayment(orderId: string) {
    setPaying(true);
    try {
      const result = await api.initiatePayment(orderId, me?.phone, me?.email);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error('Payment link unavailable. Please contact support.');
      }
    } catch {
      toast.error('Could not initiate payment. Please try again or contact support.');
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    if (!engagement) return;
    api.getServicePlan(engagement.id).then(setServicePlan).catch(() => {});
  }, [engagement]);

  const totalPaid = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const totalOutstanding = orders
    .filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const grandTotal = servicePlan?.grandTotal ? Number(servicePlan.grandTotal) : totalPaid + totalOutstanding;
  const overallPct = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 0;

  // TanStack Table for orders pagination
  const orderColHelper = createColumnHelper<any>();
  const orderCols = [orderColHelper.display({ id: 'order', cell: (info) => info.row.original })];
  const orderTable = useReactTable({
    data: orders,
    columns: orderCols,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: ORDERS_PAGE_SIZE } },
  });
  const paginatedOrders = orderTable.getRowModel().rows.map((r) => r.original);
  const { pageIndex: orderPageIndex, pageSize: orderPageSize } = orderTable.getState().pagination;
  const orderPageCount = orderTable.getPageCount();

  if (loading) return <PaymentsSkeleton />;

  // Outstanding order (first pending/partial)
  const dueOrder = orders.find((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID');
  const dueItems = (dueOrder?.lineItems ?? []).filter(
    (li: any) => li.installmentPlan && li.installmentPlan.installmentsPaid < li.installmentPlan.totalInstallments
  );
  const amountDue = dueOrder
    ? dueItems.length > 0
      ? dueItems.reduce((s: number, li: any) => s + Number(li.priceCharged ?? 0), 0)
      : Number(dueOrder.amountDueNow ?? dueOrder.total ?? 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Track your invoices, payment history, and service plan."
      />

      <div className="flex gap-6 items-start">

        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Outstanding payment banner */}
          {dueOrder ? (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment outstanding</p>
                      <p className="text-2xl font-bold text-foreground leading-tight">
                        ${amountDue.toLocaleString()}
                      </p>
                      {dueItems.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Instalment {dueItems[0].installmentPlan.installmentsPaid + 1} of{' '}
                          {dueItems[0].installmentPlan.totalInstallments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleResumePayment(dueOrder.id)}
                      disabled={paying}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-60"
                    >
                      {paying ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                      Pay now
                    </button>
                    <button
                      onClick={() => setExpandedOrder(dueOrder.id)}
                      className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Receipt className="h-4 w-4" /> View invoice
                    </button>
                  </div>
                </div>

                {dueItems.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {dueItems.map((li: any) => {
                      const paid = li.installmentPlan.installmentsPaid;
                      const total = li.installmentPlan.totalInstallments;
                      const pct = Math.round((paid / total) * 100);
                      return (
                        <div key={li.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">
                              {li.serviceItem?.name ?? 'Service'}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {paid}/{total} paid · {pct}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-2.5 rounded-full bg-primary transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : orders.length > 0 && totalOutstanding === 0 ? (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Confetti weight="fill" className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">All payments up to date</p>
                <p className="text-xs text-muted-foreground">You have no outstanding balances. Your receipts are available in the panel.</p>
              </div>
            </div>
          ) : null}

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Paid</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${totalPaid.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                  <CheckCircle weight="fill" className="h-5 w-5 text-primary" />
                </div>
              </div>
              {grandTotal > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-1.5 rounded-full bg-primary transition-all duration-700" style={{ width: `${overallPct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{overallPct}% of total</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Outstanding</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              {totalOutstanding > 0 && dueOrder && (
                <button
                  onClick={() => handleResumePayment(dueOrder.id)}
                  disabled={paying}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
                >
                  Pay now <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoices</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {orders.filter((o) => o.status === 'PAID').length} paid ·{' '}
                {orders.filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED').length} pending
              </p>
            </div>
          </div>

          {/* Service plan */}
          {servicePlan && servicePlan.stages?.length > 0 && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Agreed Service Plan</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{paymentModeLabel(servicePlan.paymentMode ?? 'FULL')}</Badge>
                  {grandTotal > 0 && (
                    <span className="text-xs text-muted-foreground">{overallPct}% paid</span>
                  )}
                </div>
              </div>

              {grandTotal > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">Paid: ${totalPaid.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Total: ${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="px-6 pb-6 pt-3 space-y-3">
                {servicePlan.stages.map((stage: any, i: number) => {
                  const stageTotal = Number(stage.total ?? 0);
                  const isCompleted = stageTotal > 0 && totalPaid >= stageTotal;
                  const isCurrent = !isCompleted && i === servicePlan.stages.findIndex(
                    (s: any) => Number(s.total ?? 0) > 0 && totalPaid < Number(s.total ?? 0)
                  );

                  return (
                    <div key={i} className={`rounded-xl border p-4 transition-colors ${
                      isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-primary/20 text-primary'
                              : isCurrent
                              ? 'bg-primary text-white ring-4 ring-primary/20'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-4 w-4" weight="bold" /> : i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{stage.stageLabel ?? `Stage ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground">{stage.items?.length ?? 0} service{stage.items?.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">${stageTotal.toLocaleString()}</p>
                          {isCompleted ? (
                            <span className="text-xs font-semibold text-primary">Paid</span>
                          ) : isCurrent ? (
                            <span className="text-xs font-semibold text-primary">Current</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Upcoming</span>
                          )}
                        </div>
                      </div>

                      {stage.items?.length > 0 && (
                        <div className="mt-3 space-y-1 border-t border-border/50 pt-3 pl-11">
                          {stage.items.map((item: any, j: number) => (
                            <div key={j} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.name}</span>
                              <span className="font-medium">${Number(item.price ?? 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {servicePlan.grandTotal != null && (
                  <div className="flex items-center justify-between rounded-xl bg-primary px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-white/80" />
                      <span className="text-sm font-semibold text-white">Grand Total</span>
                    </div>
                    <span className="text-xl font-bold text-white">${Number(servicePlan.grandTotal).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice history */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Invoice History</h3>
                {orders.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{orders.length} invoice{orders.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">No invoices yet</h4>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Your invoices will appear here once your engagement is active and your payment plan is set up.
                </p>
                <button
                  onClick={() => router.push('/checkout')}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" /> Go to checkout
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const isPending = order.status === 'PENDING' || order.status === 'PARTIALLY_PAID';

                  const instalmentItems = (order.lineItems ?? []).filter((li: any) => li.installmentPlan);
                  const totalInstalments = instalmentItems.reduce(
                    (s: number, li: any) => s + (li.installmentPlan?.totalInstallments ?? 0), 0
                  );
                  const paidInstalments = instalmentItems.reduce(
                    (s: number, li: any) => s + (li.installmentPlan?.installmentsPaid ?? 0), 0
                  );

                  return (
                    <div key={order.id}>
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                          <Receipt className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {order.orderType === 'standalone' ? 'À la carte order' : 'Engagement order'}
                            </p>
                            <Badge variant={orderStatusVariant(order.status)} className="text-xs">
                              {statusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {shortDate(order.createdAt)}
                            {' · '}{order.lineItems?.length ?? 0} service{order.lineItems?.length !== 1 ? 's' : ''}
                            {order.paymentMode && order.paymentMode !== 'FULL' && ` · ${paymentModeLabel(order.paymentMode)}`}
                          </p>
                          {totalInstalments > 0 && (
                            <div className="mt-1.5">
                              <InstalmentBadge paid={paidInstalments} total={totalInstalments} />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">${Number(order.total).toLocaleString()}</p>
                            {isPending && order.amountDueNow != null && (
                              <p className="text-xs font-semibold text-muted-foreground">
                                ${Number(order.amountDueNow).toLocaleString()} due
                              </p>
                            )}
                          </div>
                          {isExpanded
                            ? <CaretUp className="h-4 w-4 text-muted-foreground" />
                            : <CaretDown className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 px-6 py-5 space-y-4">
                          {order.lineItems?.length > 0 ? (
                            <div className="space-y-2">
                              {order.lineItems.map((item: any) => (
                                <div key={item.id} className="flex items-start justify-between rounded-xl bg-white px-4 py-3 border border-border gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">
                                      {item.serviceItem?.name ?? 'Service'}
                                    </p>
                                    {item.variant && (
                                      <p className="text-xs text-muted-foreground capitalize">{item.variant.variantKey}</p>
                                    )}
                                    {item.installmentPlan && (
                                      <div className="mt-2">
                                        <InstalmentBadge
                                          paid={item.installmentPlan.installmentsPaid}
                                          total={item.installmentPlan.totalInstallments}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-foreground">
                                      ${Number(item.priceCharged).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              <div className="space-y-1 px-1 pt-1">
                                {order.taxAmount != null && Number(order.taxAmount) > 0 && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Tax ({Number(order.taxRate) * 100}%)</span>
                                    <span>${Number(order.taxAmount).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                                  <span>Total</span>
                                  <span>${Number(order.total).toLocaleString()}</span>
                                </div>
                                {order.amountDueNow != null && order.status !== 'PAID' && (
                                  <div className="flex justify-between text-sm font-semibold rounded-xl border border-border bg-muted/30 px-3 py-2.5 mt-2">
                                    <span className="text-foreground">Due now</span>
                                    <span className="text-primary font-bold">${Number(order.amountDueNow).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No line items recorded.</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {order.status === 'PAID' && (
                              <button
                                onClick={() => handleDownload(order.id, order.createdAt)}
                                disabled={downloadingId === order.id}
                                className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-primary/30 transition-colors disabled:opacity-60"
                              >
                                {downloadingId === order.id
                                  ? <CircleNotch className="h-4 w-4 text-primary animate-spin" />
                                  : <FilePdf className="h-4 w-4 text-primary" />}
                                {downloadingId === order.id ? 'Downloading…' : 'Download receipt'}
                                {downloadingId !== order.id && <DownloadSimple className="h-3.5 w-3.5 text-muted-foreground" />}
                              </button>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleResumePayment(order.id)}
                                disabled={paying}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-60"
                              >
                                {paying ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                Pay now
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination controls */}
            {orders.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <p className="text-xs text-muted-foreground">
                  {orderPageIndex * orderPageSize + 1}–{Math.min((orderPageIndex + 1) * orderPageSize, orders.length)} of {orders.length}
                </p>
                {orderPageCount > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => orderTable.previousPage()}
                      disabled={!orderTable.getCanPreviousPage()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      <CaretLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: orderPageCount }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => orderTable.setPageIndex(i)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                          i === orderPageIndex ? 'bg-primary text-white' : 'border border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => orderTable.nextPage()}
                      disabled={!orderTable.getCanNextPage()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      <CaretRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────── */}
        <RightSidebar
          overallPct={overallPct}
          totalPaid={totalPaid}
          grandTotal={grandTotal}
          dueOrder={dueOrder}
          amountDue={amountDue}
          dueItems={dueItems}
          orders={orders}
          router={router}
          onPayNow={handleResumePayment}
          paying={paying}
          onDownload={handleDownload}
          downloadingId={downloadingId}
        />
      </div>
    </div>
  );
}
