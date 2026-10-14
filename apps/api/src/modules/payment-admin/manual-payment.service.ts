import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { S3 } from 'aws-sdk';
import { OrderService } from '../order/order.service';
import { MANUAL_METHODS } from '../../common/manual-methods';

/** A confirmed total this close to the order total counts as paid in full (exchange-rate rounding). */
const PAID_TOLERANCE_USD = 0.5;
/** Recording may go this far over what is left, for the same reason. */
const OVER_TOLERANCE_USD = 1;
const PROOF_EXT = /\.(pdf|jpe?g|png)$/i;

type Actor = { id: string; role?: string };
export type ManualPaymentInput = {
  method: string;
  amount: number;
  currency: string;
  rate?: number | null;
  receivedAt: string;
  reference?: string;
  note?: string;
  proof?: { key: string; name: string; type?: string } | null;
  seenInAccount?: boolean;
  allowDuplicate?: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;
const isAdmin = (a: Actor) => (a.role ?? '').toUpperCase() === 'ADMIN';
const cleanRef = (ref?: string | null) => (ref ?? '').trim().replace(/\s+/g, ' ');

@Injectable()
export class ManualPaymentService {
  private readonly s3 = new S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    signatureVersion: 'v4',
  });

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly orders: OrderService,
  ) {}

  // ── Reading ─────────────────────────────────────────────────────────────────

  /** Every manual payment on an order, newest first, with staff names. The proof's storage key never leaves here. */
  async forOrder(orderId: string) {
    const rows = await this.db.manualPayment.findMany({ where: { orderId }, orderBy: { recordedAt: 'desc' } });
    const ids = [...new Set(rows.flatMap((r) => [r.recordedById, r.confirmedById, r.voidedById]).filter(Boolean) as string[])];
    const people = ids.length ? await this.db.person.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } }) : [];
    const nameOf = (id: string | null) => (id ? people.find((p) => p.id === id)?.name ?? people.find((p) => p.id === id)?.email ?? 'Staff' : null);
    return rows.map((r) => ({
      id: r.id,
      method: r.method,
      methodLabel: MANUAL_METHODS[r.method]?.en ?? r.method,
      amount: Number(r.amount),
      currency: r.currency,
      rate: r.rate == null ? null : Number(r.rate),
      amountUsd: Number(r.amountUsd),
      receivedAt: r.receivedAt,
      reference: r.reference,
      note: r.note,
      proof: r.proofKey ? { name: r.proofName ?? 'Proof', type: r.proofType ?? '' } : null,
      status: r.status,
      recordedBy: nameOf(r.recordedById),
      recordedById: r.recordedById,
      recordedAt: r.recordedAt,
      confirmedBy: nameOf(r.confirmedById),
      confirmedAt: r.confirmedAt,
      voidedBy: nameOf(r.voidedById),
      voidedAt: r.voidedAt,
      voidReason: r.voidReason,
    }));
  }

  /** Dollars confirmed so far on an order. */
  async received(orderId: string): Promise<number> {
    const sum = await this.db.manualPayment.aggregate({ where: { orderId, status: 'CONFIRMED' }, _sum: { amountUsd: true } });
    return round(Number(sum._sum.amountUsd ?? 0));
  }

  // ── Recording ───────────────────────────────────────────────────────────────

  /** Where the browser may upload the proof the client emailed. */
  async proofUploadUrl(orderId: string, fileName: string) {
    if (!PROOF_EXT.test(fileName ?? '')) throw new BadRequestException('Proof must be a PDF, JPG or PNG file.');
    await this.openOrder(orderId);
    const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-120);
    const key = `manual-payments/${orderId}/${Date.now()}-${safeName}`;
    const url = await this.s3.getSignedUrlPromise('putObject', { Bucket: process.env.R2_BUCKET_NAME, Key: key, Expires: 300 });
    return { url, key };
  }

  /**
   * Records money that arrived outside Tranzak and Stripe. It counts once an admin confirms it;
   * when an admin records it, it is confirmed at once.
   */
  async record(actor: Actor, orderId: string, input: ManualPaymentInput) {
    const order = await this.openOrder(orderId);
    const method = String(input?.method ?? '').toUpperCase();
    if (!MANUAL_METHODS[method]) throw new BadRequestException('Choose how the money was received.');
    const currency = String(input?.currency ?? '').toUpperCase();
    if (currency !== 'XAF' && currency !== 'USD') throw new BadRequestException('The currency must be XAF or USD.');
    const amount = round(Number(input?.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Enter the amount received.');
    let rate: number | null = null;
    if (currency === 'XAF') {
      rate = Number(input?.rate);
      if (!Number.isFinite(rate) || rate < 300 || rate > 2000) throw new BadRequestException('Enter the exchange rate you got: how many CFA francs to one US dollar (for example 600).');
    }
    const amountUsd = round(currency === 'USD' ? amount : amount / (rate as number));
    if (amountUsd <= 0) throw new BadRequestException('That amount is too small to record.');

    const receivedAt = new Date(input?.receivedAt);
    if (Number.isNaN(receivedAt.getTime())) throw new BadRequestException('Enter the date the money arrived.');
    if (receivedAt.getTime() > Date.now() + 86400000) throw new BadRequestException('The date received cannot be in the future.');
    if (receivedAt.getTime() < Date.now() - 366 * 86400000) throw new BadRequestException('That date is more than a year ago. Check it.');

    if (!input?.seenInAccount) throw new BadRequestException('Only record money you have seen arrive in our account or till. A screenshot alone is not enough.');
    const reference = cleanRef(input?.reference).slice(0, 100) || null;
    if (method === 'BANK_TRANSFER' && !reference) throw new BadRequestException('Enter the bank reference of the transfer.');
    const note = (input?.note ?? '').trim().slice(0, 1000) || null;
    const proof = input?.proof ?? null;
    if (proof && !proof.key.startsWith(`manual-payments/${orderId}/`)) throw new BadRequestException('That proof file was not uploaded for this order.');

    // The same reference on another payment usually means the same money recorded twice.
    if (reference && !input?.allowDuplicate) {
      const [twinManual, twinAttempt] = await Promise.all([
        this.db.manualPayment.findFirst({ where: { reference: { equals: reference, mode: 'insensitive' }, status: { not: 'VOIDED' } }, select: { orderId: true } }),
        this.db.paymentAttempt.findFirst({ where: { providerRef: { equals: reference, mode: 'insensitive' } }, select: { orderId: true } }),
      ]);
      const twin = twinManual ?? twinAttempt;
      if (twin) {
        throw new ConflictException(twin.orderId === orderId
          ? 'A payment with this reference is already recorded on this order.'
          : 'A payment with this reference is already recorded on another order.');
      }
    }

    // Never record more than is still owed, counting what is waiting for confirmation.
    const pending = await this.db.manualPayment.aggregate({ where: { orderId, status: { in: ['RECORDED', 'CONFIRMED'] } }, _sum: { amountUsd: true } });
    const left = round(Number(order.total) - Number(pending._sum.amountUsd ?? 0));
    if (amountUsd > left + OVER_TOLERANCE_USD) {
      throw new BadRequestException(left > 0
        ? `That is $${amountUsd.toFixed(2)}, more than the $${left.toFixed(2)} still owed on this order (including payments waiting to be confirmed).`
        : 'Nothing more is owed on this order once the payments waiting to be confirmed are counted.');
    }

    const created = await this.db.manualPayment.create({
      data: {
        orderId, method, amount, currency, rate, amountUsd, receivedAt, reference, note,
        proofKey: proof?.key ?? null,
        proofName: proof ? (proof.name || 'Proof').slice(0, 200) : null,
        proofType: proof?.type?.slice(0, 100) ?? null,
        recordedById: actor.id,
      },
    });
    await this.log(actor, orderId, 'payment.manual_recorded', { manualPaymentId: created.id, amount: amountUsd, method: MANUAL_METHODS[method].en, ref: reference, note });

    if (isAdmin(actor)) return this.confirm(actor, created.id, true);

    this.events.emit('payment.manual_awaiting_confirmation', { orderId, manualPaymentId: created.id, amountUsd, method: MANUAL_METHODS[method].en, recordedById: actor.id });
    return { message: `$${amountUsd.toFixed(2)} recorded. An admin must confirm it before the client gets a receipt.`, status: 'RECORDED' };
  }

  // ── Confirming and voiding ──────────────────────────────────────────────────

  /** An admin confirms a recorded payment. When the order is then paid in full, the receipt goes out as for any payment. */
  async confirm(actor: Actor, id: string, justRecorded = false) {
    if (!isAdmin(actor)) throw new ForbiddenException('Only an admin can confirm a payment.');
    const payment = await this.db.manualPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('That payment record no longer exists.');
    await this.openOrder(payment.orderId);
    // Only one confirmation can win, even if two admins press at once.
    const moved = await this.db.manualPayment.updateMany({
      where: { id, status: 'RECORDED' },
      data: { status: 'CONFIRMED', confirmedById: actor.id, confirmedAt: new Date() },
    });
    if (moved.count === 0) throw new BadRequestException('This payment has already been confirmed or voided.');
    await this.log(actor, payment.orderId, 'payment.manual_confirmed', { manualPaymentId: id, amount: Number(payment.amountUsd) });
    return this.settle(payment.orderId, justRecorded);
  }

  /**
   * A recorded payment that is wrong is voided, never deleted. The person who recorded it may void
   * it until it is confirmed; after that only an admin, and only while the order is not yet paid.
   */
  async void(actor: Actor, id: string, reason: string) {
    const why = (reason ?? '').trim();
    if (why.length < 3) throw new BadRequestException('Say why this payment is being voided.');
    const payment = await this.db.manualPayment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('That payment record no longer exists.');
    if (payment.status === 'VOIDED') throw new BadRequestException('This payment is already voided.');
    const mine = payment.recordedById === actor.id && payment.status === 'RECORDED';
    if (!isAdmin(actor) && !mine) throw new ForbiddenException('Only an admin, or the person who recorded it before it is confirmed, can void this payment.');
    const order = await this.db.order.findUnique({ where: { id: payment.orderId }, select: { status: true } });
    // A confirmed payment is on the receipt once the order is paid; an unconfirmed one never counted.
    if (order?.status === 'PAID' && payment.status === 'CONFIRMED') throw new BadRequestException('This order is paid and its receipt has been issued. Record a refund instead.');
    await this.db.manualPayment.update({ where: { id }, data: { status: 'VOIDED', voidedById: actor.id, voidedAt: new Date(), voidReason: why.slice(0, 500) } });
    await this.log(actor, payment.orderId, 'payment.manual_voided', { manualPaymentId: id, amount: Number(payment.amountUsd), reason: why });
    return { message: 'Payment voided. It no longer counts towards the order.' };
  }

  /** A five-minute link to the proof file, logged. */
  async proofUrl(actor: Actor, id: string) {
    const payment = await this.db.manualPayment.findUnique({ where: { id }, select: { orderId: true, proofKey: true, proofName: true } });
    if (!payment?.proofKey) throw new NotFoundException('No proof file is attached to this payment.');
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: payment.proofKey,
      Expires: 300,
      ResponseContentDisposition: `inline; filename="${(payment.proofName ?? 'proof').replace(/[^A-Za-z0-9._-]+/g, '-')}"`,
    });
    await this.log(actor, payment.orderId, 'payment.manual_proof_viewed', { manualPaymentId: id });
    return { url, name: payment.proofName ?? 'Proof' };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** After a confirmation: paid in full → receipt and everything else; otherwise tell the client what arrived. */
  private async settle(orderId: string, justRecorded: boolean) {
    const order = await this.db.order.findUnique({ where: { id: orderId }, select: { total: true } });
    const total = Number(order?.total ?? 0);
    const confirmed = await this.db.manualPayment.findMany({ where: { orderId, status: 'CONFIRMED' }, orderBy: { receivedAt: 'asc' } });
    const received = round(confirmed.reduce((s, p) => s + Number(p.amountUsd), 0));
    const latest = confirmed[confirmed.length - 1];

    if (received >= total - PAID_TOLERANCE_USD) {
      await this.orders.markPaid(orderId, `manual:${latest.id}`, confirmed.map((p) => ({
        method: MANUAL_METHODS[p.method]?.en ?? p.method,
        reference: p.reference,
        receivedAt: p.receivedAt.toISOString(),
        amountUsd: Number(p.amountUsd),
        amount: Number(p.amount),
        currency: p.currency,
      })));
      return { message: `${justRecorded ? 'Recorded and confirmed' : 'Confirmed'}. The order is paid in full; the receipt has been emailed to the client.`, status: 'CONFIRMED', paid: true };
    }

    const leftUsd = round(total - received);
    this.events.emit('payment.manual_part_received', { orderId, amountUsd: Number(latest.amountUsd), receivedUsd: received, leftUsd, method: latest.method, reference: latest.reference });
    return { message: `${justRecorded ? 'Recorded and confirmed' : 'Confirmed'}. $${leftUsd.toFixed(2)} is still owed; the client has been emailed what was received.`, status: 'CONFIRMED', paid: false };
  }

  /** The order, if it can still take a payment. */
  private async openOrder(orderId: string) {
    const order = await this.db.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, total: true } });
    if (!order) throw new NotFoundException('That order no longer exists.');
    if (order.status === 'PAID') throw new BadRequestException('This order is already paid.');
    if (order.status !== 'PENDING') throw new BadRequestException('This order is closed and cannot take a payment.');
    return order;
  }

  private log(actor: Actor, orderId: string, action: string, metadata: Record<string, unknown>) {
    return this.db.auditLog.create({ data: { actorId: actor.id, action, resourceType: 'Order', resourceId: orderId, metadata: metadata as any } });
  }
}
