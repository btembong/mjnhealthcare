import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

export interface UnifiedPayment {
  id: string;
  type: 'CONSULTATION' | 'ORDER';
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  amount: number;
  status: string;
  paymentRef?: string;
  createdAt: Date;
  meta: Record<string, any>;
}

@Injectable()
export class PaymentAdminService {
  private readonly logger = new Logger(PaymentAdminService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  // ── List all payments (merged) ──────────────────────────────────────────────

  async listPayments(params: {
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<UnifiedPayment[]> {
    const { search, status, type, dateFrom, dateTo } = params;

    const dateFilter =
      dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {};

    let consultations: any[] = [];
    let orders: any[] = [];

    if (!type || type === 'CONSULTATION') {
      const where: any = { ...dateFilter };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { clientName: { contains: search, mode: 'insensitive' } },
          { clientEmail: { contains: search, mode: 'insensitive' } },
          { paymentRef: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
          { clientPhone: { contains: search } },
        ];
      }
      consultations = await this.db.consultationBooking.findMany({
        where,
        include: {
          slot: {
            include: {
              consultant: { select: { name: true, priceUsd: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!type || type === 'ORDER') {
      const where: any = { ...dateFilter };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { engagement: { person: { name: { contains: search, mode: 'insensitive' } } } },
          { engagement: { person: { email: { contains: search, mode: 'insensitive' } } } },
        ];
      }
      orders = await this.db.order.findMany({
        where,
        include: {
          engagement: { include: { person: true } },
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const normalized: UnifiedPayment[] = [
      ...consultations.map((b) => this.normalizeBooking(b)),
      ...orders.map((o) => this.normalizeOrder(o)),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return normalized;
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  async getStats() {
    const [bookings, orders] = await Promise.all([
      this.db.consultationBooking.findMany({ select: { status: true, amountPaid: true } }),
      this.db.order.findMany({ select: { status: true, total: true } }),
    ]);

    const consultRevenue = bookings
      .filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.amountPaid ?? 0), 0);

    const orderRevenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

    const pendingConsult = bookings.filter((b) => b.status === 'AWAITING_PAYMENT').length;
    const pendingOrders = orders.filter((o) => ['PENDING', 'PARTIALLY_PAID'].includes(o.status)).length;

    const cancelledCount =
      bookings.filter((b) => b.status === 'CANCELLED').length +
      orders.filter((o) => o.status === 'CANCELLED').length;

    return {
      totalRevenue: consultRevenue + orderRevenue,
      consultRevenue,
      orderRevenue,
      pendingCount: pendingConsult + pendingOrders,
      cancelledCount,
      totalTransactions: bookings.length + orders.length,
    };
  }

  // ── Find by ref (bookingId, paymentRef, orderId) ────────────────────────────

  async findByRef(ref: string): Promise<UnifiedPayment & { raw: any }> {
    const booking = await this.db.consultationBooking.findFirst({
      where: { OR: [{ id: ref }, { paymentRef: ref }] },
      include: { slot: { include: { consultant: true } } },
    });
    if (booking) return { ...this.normalizeBooking(booking), raw: booking };

    const order = await this.db.order.findFirst({
      where: { id: ref },
      include: { engagement: { include: { person: true } }, lineItems: true },
    });
    if (order) return { ...this.normalizeOrder(order), raw: order };

    throw new NotFoundException(`No payment found with ref "${ref}"`);
  }

  // ── Verify live status on Tranzak ───────────────────────────────────────────

  async verifyWithTranzak(paymentRef: string) {
    const baseUrl = process.env.TRANZAK_BASE_URL ?? 'https://dsapi.tranzak.me';

    const authRes = await fetch(`${baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: process.env.TRANZAK_APP_ID,
        appKey: process.env.TRANZAK_APP_KEY,
      }),
    });
    const auth = (await authRes.json()) as any;
    const token = auth.data?.token;
    if (!token) throw new BadRequestException('Failed to authenticate with Tranzak');

    const statusRes = await fetch(`${baseUrl}/xp021/v1/request/${paymentRef}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await statusRes.json()) as any;
    const resource = data.data ?? data.resource ?? {};

    return {
      tranzakStatus: resource.status,
      amount: resource.amount,
      currencyCode: resource.currencyCode,
      description: resource.description,
      mchTransactionRef: resource.mchTransactionRef,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      raw: data,
    };
  }

  // ── Manually validate / confirm a pending payment ───────────────────────────

  async validatePayment(ref: string, adminNote?: string): Promise<{ success: boolean; message: string }> {
    const payment = await this.findByRef(ref);

    if (payment.type === 'CONSULTATION') {
      if (!['AWAITING_PAYMENT', 'CONFIRMED'].includes(payment.status)) {
        throw new BadRequestException(`Cannot validate a booking with status ${payment.status}`);
      }
      await this.db.consultationBooking.update({
        where: { id: payment.id },
        data: { status: 'CONFIRMED' },
      });
      this.events.emit('consultation.confirmed', {
        bookingId: payment.id,
        clientName: payment.clientName,
        clientEmail: payment.clientEmail,
        clientPhone: payment.clientPhone,
        consultantName: payment.meta.consultantName,
        sessionStart: payment.meta.sessionStart,
        durationMins: payment.meta.durationMins,
        roomUrl: payment.meta.dailyRoomUrl ?? '',
        category: payment.meta.category,
        recordingConsent: payment.meta.recordingConsent,
      });
      this.logger.log(`Admin validated consultation booking ${payment.id}. Note: ${adminNote ?? '—'}`);
      return { success: true, message: 'Booking confirmed and client notified by email.' };
    }

    if (payment.type === 'ORDER') {
      if (!['PENDING', 'PARTIALLY_PAID'].includes(payment.status)) {
        throw new BadRequestException(`Cannot validate an order with status ${payment.status}`);
      }
      await this.db.order.update({ where: { id: payment.id }, data: { status: 'PAID' } });
      this.events.emit('payment.completed', { orderId: payment.id, source: 'admin_validate', adminNote });
      this.logger.log(`Admin validated order ${payment.id}. Note: ${adminNote ?? '—'}`);
      return { success: true, message: 'Order marked as paid and receipt will be generated.' };
    }

    throw new BadRequestException('Unknown payment type');
  }

  // ── Cancel a pending payment ─────────────────────────────────────────────────

  async cancelPayment(ref: string, reason: string, adminId: string): Promise<{ success: boolean; message: string }> {
    if (!reason?.trim()) throw new BadRequestException('A cancellation reason is required');

    const payment = await this.findByRef(ref);

    if (payment.type === 'CONSULTATION') {
      if (!['AWAITING_PAYMENT', 'CONFIRMED'].includes(payment.status)) {
        throw new BadRequestException(`Cannot cancel a booking with status ${payment.status}`);
      }
      const slotId = payment.raw.slotId;
      await this.db.$transaction([
        this.db.consultationBooking.update({
          where: { id: payment.id },
          data: { status: 'CANCELLED' },
        }),
        ...(slotId
          ? [this.db.consultationSlot.update({ where: { id: slotId }, data: { status: 'AVAILABLE' } })]
          : []),
      ]);
      this.events.emit('consultation.cancelled', {
        bookingId: payment.id,
        clientName: payment.clientName,
        clientEmail: payment.clientEmail,
        clientPhone: payment.clientPhone,
        reason,
        adminCancelled: true,
        refundAmount: 0,
        refundPercent: 0,
      });
      this.logger.log(`Admin cancelled consultation booking ${payment.id} (by ${adminId}). Reason: ${reason}`);
      return { success: true, message: 'Booking cancelled and slot freed.' };
    }

    if (payment.type === 'ORDER') {
      if (!['PENDING', 'PARTIALLY_PAID'].includes(payment.status)) {
        throw new BadRequestException(`Cannot cancel an order with status ${payment.status}`);
      }
      await this.db.order.update({ where: { id: payment.id }, data: { status: 'CANCELLED' } });
      this.logger.log(`Admin cancelled order ${payment.id} (by ${adminId}). Reason: ${reason}`);
      return { success: true, message: 'Order cancelled.' };
    }

    throw new BadRequestException('Unknown payment type');
  }

  // ── CSV export ───────────────────────────────────────────────────────────────

  async exportCsv(params: {
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<string> {
    const payments = await this.listPayments(params);
    const header = 'ID,Type,Client Name,Client Email,Client Phone,Amount USD,Status,Payment Ref,Date\n';
    const rows = payments
      .map((p) =>
        [
          p.id,
          p.type,
          `"${(p.clientName ?? '').replace(/"/g, '""')}"`,
          p.clientEmail ?? '',
          p.clientPhone ?? '',
          Number(p.amount).toFixed(2),
          p.status,
          p.paymentRef ?? '',
          new Date(p.createdAt).toISOString(),
        ].join(','),
      )
      .join('\n');
    return header + rows;
  }

  // ── Normalizers ──────────────────────────────────────────────────────────────

  private normalizeBooking(b: any): UnifiedPayment & { raw: any } {
    return {
      id: b.id,
      type: 'CONSULTATION',
      clientName: b.clientName ?? '—',
      clientEmail: b.clientEmail ?? '—',
      clientPhone: b.clientPhone,
      amount: Number(b.amountPaid ?? b.slot?.consultant?.priceUsd ?? 0),
      status: b.status,
      paymentRef: b.paymentRef,
      createdAt: b.createdAt,
      meta: {
        consultantName: b.slot?.consultant?.name,
        sessionStart: b.slot?.startAt,
        durationMins: b.slot?.durationMinutes,
        category: b.consultationCategory,
        dailyRoomUrl: b.dailyRoomUrl,
        preSessionNote: b.preSessionNote,
        recordingConsent: b.recordingConsent,
      },
      raw: b,
    };
  }

  private normalizeOrder(o: any): UnifiedPayment & { raw: any } {
    const person = o.person ?? o.engagement?.person;
    return {
      id: o.id,
      type: 'ORDER',
      clientName: person?.name ?? '—',
      clientEmail: person?.email ?? '—',
      clientPhone: person?.phone,
      amount: Number(o.total ?? 0),
      status: o.status,
      paymentRef: undefined,
      createdAt: o.createdAt,
      meta: {
        lineItems: o.lineItems ?? [],
        paymentMode: o.paymentMode,
        subtotal: o.subtotal,
        taxAmount: o.taxAmount,
        engagementId: o.engagementId,
      },
      raw: o,
    };
  }
}
