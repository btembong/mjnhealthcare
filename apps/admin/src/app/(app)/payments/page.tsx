'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CurrencyDollar,
  ArrowSquareOut,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowClockwise,
  DownloadSimple,
  X,
  Warning,
  Receipt,
  CalendarBlank,
  Funnel,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  NO_SHOW: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: 'Awaiting Payment',
  PARTIALLY_PAID: 'Partially Paid',
};

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Payment detail drawer ────────────────────────────────────────────────────

function PaymentDrawer({
  payment,
  onClose,
  onRefresh,
}: {
  payment: any;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tranzakResult, setTranzakResult] = useState<any>(null);
  const [tranzakLoading, setTranzakLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);

  const ref = payment.paymentRef || payment.id;

  async function handleVerifyTranzak() {
    if (!payment.paymentRef) {
      toast.error('No Tranzak payment reference on this record.');
      return;
    }
    setTranzakLoading(true);
    try {
      const result = await api.verifyPaymentTranzak(payment.paymentRef);
      setTranzakResult(result);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTranzakLoading(false);
    }
  }

  async function handleValidate() {
    setValidateLoading(true);
    try {
      const res = await api.validatePayment(ref, adminNote || undefined);
      toast.success(res.message);
      setConfirmValidate(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setValidateLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) { toast.error('Please enter a cancellation reason.'); return; }
    setCancelLoading(true);
    try {
      const res = await api.cancelPayment(ref, cancelReason);
      toast.success(res.message);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelLoading(false);
    }
  }

  const canValidate = ['AWAITING_PAYMENT', 'PENDING', 'PARTIALLY_PAID'].includes(payment.status);
  const canCancel = ['AWAITING_PAYMENT', 'PENDING', 'PARTIALLY_PAID', 'CONFIRMED'].includes(payment.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${payment.type === 'CONSULTATION' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
                {payment.type === 'CONSULTATION' ? 'Consultation' : 'Order'}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[payment.status] ?? 'bg-muted text-muted-foreground'}`}>
                {statusLabel(payment.status)}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{payment.id}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          {/* Client info */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</h3>
            <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-4">
              <p className="font-semibold text-foreground">{payment.clientName}</p>
              <p className="text-sm text-muted-foreground">{payment.clientEmail}</p>
              {payment.clientPhone && <p className="text-sm text-muted-foreground">{payment.clientPhone}</p>}
            </div>
          </section>

          {/* Payment info */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</h3>
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">${Number(payment.amount).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
              {payment.paymentRef && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Tranzak Ref</span>
                  <span className="font-mono text-xs text-foreground break-all text-right">{payment.paymentRef}</span>
                </div>
              )}
            </div>
          </section>

          {/* Type-specific info */}
          {payment.type === 'CONSULTATION' && payment.meta?.consultantName && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session</h3>
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultant</span>
                  <span className="text-foreground">{payment.meta.consultantName}</span>
                </div>
                {payment.meta.sessionStart && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session</span>
                    <span className="text-foreground">
                      {new Date(payment.meta.sessionStart).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {payment.meta.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-foreground">{payment.meta.category}</span>
                  </div>
                )}
                {payment.meta.dailyRoomUrl && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Room</span>
                    <a href={payment.meta.dailyRoomUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-primary text-xs hover:underline">
                      Open <ArrowSquareOut className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {payment.meta.preSessionNote && (
                  <div className="pt-1 border-t border-border">
                    <p className="text-xs text-muted-foreground">Pre-session note</p>
                    <p className="mt-0.5 text-sm">{payment.meta.preSessionNote}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {payment.type === 'ORDER' && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Details</h3>
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line items</span>
                  <span className="text-foreground">{payment.meta.lineItems?.length ?? 0}</span>
                </div>
                {payment.meta.subtotal != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${Number(payment.meta.subtotal).toFixed(2)}</span>
                  </div>
                )}
                {payment.meta.taxAmount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${Number(payment.meta.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                {payment.meta.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="capitalize">{payment.meta.paymentMode.replace(/_/g, ' ').toLowerCase()}</span>
                  </div>
                )}
                {(payment.meta.lineItems ?? []).map((li: any, i: number) => (
                  <div key={i} className="flex justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground text-xs">{li.description ?? `Item ${i + 1}`}</span>
                    <span className="text-xs">${Number(li.priceCharged ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tranzak live check */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tranzak Verification</h3>
            <button
              onClick={handleVerifyTranzak}
              disabled={tranzakLoading || !payment.paymentRef}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ArrowClockwise className={`h-4 w-4 ${tranzakLoading ? 'animate-spin' : ''}`} />
              {tranzakLoading ? 'Checking Tranzak…' : 'Check Live Status on Tranzak'}
            </button>
            {!payment.paymentRef && (
              <p className="mt-1.5 text-center text-xs text-muted-foreground">No Tranzak reference stored for this payment.</p>
            )}
            {tranzakResult && (
              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tranzak Status</span>
                  <span className={`font-bold ${tranzakResult.tranzakStatus === 'SUCCESSFUL' ? 'text-emerald-600' : tranzakResult.tranzakStatus === 'PENDING' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {tranzakResult.tranzakStatus ?? '—'}
                  </span>
                </div>
                {tranzakResult.amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{tranzakResult.amount} {tranzakResult.currencyCode}</span>
                  </div>
                )}
                {tranzakResult.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(tranzakResult.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {tranzakResult.tranzakStatus === 'SUCCESSFUL' && canValidate && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-emerald-700 font-medium">
                      Tranzak shows SUCCESSFUL — you can validate this payment below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Validate */}
          {canValidate && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validate Payment</h3>
              {!confirmValidate ? (
                <button
                  onClick={() => setConfirmValidate(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Manually Confirm Payment
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Confirm this payment as paid?</p>
                  <p className="text-xs text-emerald-700">This will mark the {payment.type === 'CONSULTATION' ? 'booking as CONFIRMED and email the client their join link' : 'order as PAID and generate a receipt'}.</p>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Admin note (optional — logged for audit)"
                    rows={2}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmValidate(false)}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted">
                      Cancel
                    </button>
                    <button onClick={handleValidate} disabled={validateLoading}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                      {validateLoading ? 'Confirming…' : 'Yes, Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Cancel */}
          {canCancel && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cancel Payment</h3>
              {!cancelMode ? (
                <button
                  onClick={() => setCancelMode(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel & Void
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center gap-2">
                    <Warning className="h-4 w-4 text-rose-600 shrink-0" />
                    <p className="text-sm font-medium text-rose-800">This will cancel the payment and free the slot if applicable.</p>
                  </div>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (required)…"
                    rows={3}
                    className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setCancelMode(false)}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted">
                      Back
                    </button>
                    <button onClick={handleCancel} disabled={cancelLoading || !cancelReason.trim()}
                      className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                      {cancelLoading ? 'Cancelling…' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const searchRef = useRef<any>(null);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    api.getPaymentStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const loadPayments = useCallback(() => {
    setLoading(true);
    api.listPayments({ search: search || undefined, status: statusFilter || undefined, type: typeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then(setPayments)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  // Load stats once on mount; reload payments when filters change (debounced for search)
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => loadPayments(), 350);
    return () => clearTimeout(searchRef.current);
  }, [loadPayments]);

  function handleRefresh() { loadStats(); loadPayments(); }

  function handleExport() {
    const token = localStorage.getItem('mjn_admin_token');
    const url = api.getPaymentsExportUrl({ search: search || undefined, status: statusFilter || undefined, type: typeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    // Trigger download with auth header via fetch → blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `mjn-payments-${Date.now()}.csv`;
        a.click();
      })
      .catch(() => toast.error('Export failed'));
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = stats?.totalRevenue ?? 0;
  const pendingCount = stats?.pendingCount ?? 0;
  const cancelledCount = stats?.cancelledCount ?? 0;
  const totalTransactions = stats?.totalTransactions ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Payments"
          subtitle="All payment activity — orders and consultation bookings"
        />
        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors">
            <ArrowClockwise className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors">
            <DownloadSimple className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              sub={`${totalTransactions} total transactions`}
              color="text-emerald-600"
            />
            <StatCard
              label="Consultation Revenue"
              value={`$${(stats?.consultRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              sub="confirmed + completed"
              color="text-purple-600"
            />
            <StatCard
              label="Order Revenue"
              value={`$${(stats?.orderRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              sub="paid orders"
              color="text-sky-600"
            />
            <StatCard
              label="Pending / Cancelled"
              value={`${pendingCount} / ${cancelledCount}`}
              sub="awaiting payment · voided"
              color="text-amber-600"
            />
          </>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ID, ref…"
            className="h-10 w-72 rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 h-10">
          <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-sm outline-none text-foreground">
            <option value="">All types</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="ORDER">Order</option>
          </select>
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAID">Paid</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="flex items-center gap-2">
          <CalendarBlank className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {(search || statusFilter || typeFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1 rounded-xl border border-border bg-white px-3 h-10 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {payments.length} result{payments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No payments found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statusFilter || typeFilter || dateFrom || dateTo
              ? 'Try adjusting your filters.'
              : 'Payment activity will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.clientName}</div>
                      <div className="text-xs text-muted-foreground">{p.clientEmail}</div>
                      {p.clientPhone && <div className="text-xs text-muted-foreground">{p.clientPhone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${p.type === 'CONSULTATION' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
                        {p.type === 'CONSULTATION' ? 'Consult' : 'Order'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.type === 'CONSULTATION'
                        ? p.meta?.consultantName ?? '—'
                        : `${p.meta?.lineItems?.length ?? 0} item${p.meta?.lineItems?.length !== 1 ? 's' : ''}`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[p.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.paymentRef ? p.paymentRef.slice(0, 10) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {['AWAITING_PAYMENT', 'PENDING', 'PARTIALLY_PAID'].includes(p.status) && (
                          <button
                            title="Validate payment"
                            onClick={() => setSelected(p)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {['AWAITING_PAYMENT', 'PENDING', 'PARTIALLY_PAID', 'CONFIRMED'].includes(p.status) && (
                          <button
                            title="Cancel payment"
                            onClick={() => setSelected(p)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          title="View details"
                          onClick={() => setSelected(p)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <ArrowSquareOut className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail drawer ────────────────────────────────────────────────── */}
      {selected && (
        <PaymentDrawer
          payment={selected}
          onClose={() => setSelected(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
