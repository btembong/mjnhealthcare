import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { OrderService } from '../order/order.service';
import { TranzakProvider } from './providers/tranzak.provider';
import { StripeProvider } from './providers/stripe.provider';
import { paymentVerifier, belongsTo, isOver, PAID_ELSEWHERE } from '../../common/payment-verifier';

export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'none';

/** How many of an order's most recent payment attempts are looked up. */
const ATTEMPTS_CHECKED = 5;
/** The same order is not looked up more often than this, however often it is asked for. */
const VERIFY_EVERY_MS = 8000;

export type PaymentProvider = 'tranzak' | 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly orderService: OrderService,
    private readonly tranzak: TranzakProvider,
    private readonly stripe: StripeProvider,
    private readonly events: EventEmitter2,
  ) {}

  /** Fetch live USD→XAF rate; falls back to the pegged rate (655) if the API is unreachable */
  private async getUsdToXafRate(): Promise<number> {
    const FALLBACK_RATE = 655;
    try {
      const res = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { signal: AbortSignal.timeout(4000) },
      );
      if (!res.ok) return FALLBACK_RATE;
      const data: any = await res.json();
      const rate = data?.rates?.XAF;
      if (typeof rate === 'number' && rate > 400) return rate;
      return FALLBACK_RATE;
    } catch {
      this.logger.warn('Exchange rate fetch failed — using fallback rate 655 XAF/USD');
      return FALLBACK_RATE;
    }
  }

  async initiatePayment(
    orderId: string,
    customerPhone?: string,
    customerEmail?: string,
    provider: PaymentProvider = 'tranzak',
  ) {
    const order = await this.orderService.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    // ── DEV bypass ────────────────────────────────────────────────────────────
    if (process.env.DEV_SKIP_PAYMENT === 'true') {
      this.logger.warn(`[DEV] Skipping payment — auto-confirming order ${orderId}`);
      await this.orderService.markPaid(orderId);
      return {
        providerRef: 'dev-skip',
        redirectUrl: `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments/confirmed?orderId=${orderId}`,
        status: 'pending' as const,
      };
    }

    // Only what is still owed: part of the order may already have arrived by bank transfer or cash.
    const received = await this.db.manualPayment.aggregate({ where: { orderId, status: 'CONFIRMED' }, _sum: { amountUsd: true } });
    const amountUsd = Math.round((Number(order.total) - Number(received._sum.amountUsd ?? 0)) * 100) / 100;
    if (order.status !== 'PENDING') throw new BadRequestException('This order is not waiting for payment.');
    if (amountUsd <= 0) throw new BadRequestException('Nothing is left to pay on this order.');
    const returnUrl = `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments/confirmed?orderId=${orderId}`;

    const itemNames: string[] = (order.lineItems ?? [])
      .filter((li: any) => li.serviceItem?.name && li.serviceItem.name !== 'Engagement Fee')
      .map((li: any) => li.serviceItem.name as string);
    const descriptionDetail =
      itemNames.length === 0
        ? 'Engagement Fee'
        : itemNames.length <= 3
        ? itemNames.join(', ')
        : `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`;

    if (provider === 'stripe') {
      // ── Stripe: charge in USD ──────────────────────────────────────────────
      const notifyUrl = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/payments/webhook/stripe`;
      const description = `MJN Healthcare – ${descriptionDetail} · $${amountUsd.toLocaleString()} USD`;

      const result = await this.stripe.initiatePayment({
        orderId,
        amount: amountUsd,   // USD dollars — StripeProvider converts to cents
        currency: 'usd',
        description,
        customerPhone,
        customerEmail,
        returnUrl,
        notifyUrl,
      });

      await this.db.paymentAttempt.create({
        data: { orderId, provider: 'stripe', providerRef: result.providerRef, status: 'PENDING' },
      });

      return result;
    }

    // ── Tranzak: charge in XAF ────────────────────────────────────────────────
    const notifyUrl = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/payments/webhook/tranzak`;
    const xafRate = await this.getUsdToXafRate();
    const amountXaf = Math.round(amountUsd * xafRate);

    this.logger.log(
      `Payment conversion: $${amountUsd} USD × ${xafRate} = ${amountXaf} XAF (order ${orderId})`,
    );

    const description = `MJN Healthcare – ${descriptionDetail} · $${amountUsd.toLocaleString()} USD (${amountXaf.toLocaleString()} XAF)`;

    const result = await this.tranzak.initiatePayment({
      orderId,
      amount: amountXaf,
      currency: 'XAF',
      description,
      customerPhone,
      customerEmail,
      returnUrl,
      notifyUrl,
    });

    await this.db.paymentAttempt.create({
      data: { orderId, provider: 'tranzak', providerRef: result.providerRef, status: 'PENDING' },
    });

    return result;
  }

  async handleWebhook(
    provider: PaymentProvider,
    rawBody: Buffer | string,
    payload: unknown,
    signature: string,
  ) {
    const providerImpl = provider === 'stripe' ? this.stripe : this.tranzak;

    // Stripe signs every notice and its check is dependable, so an unsigned one is refused outright.
    // A Tranzak notice is not trusted either way: signed or not, it only tells us which order to look up.
    const signed = providerImpl.verifyWebhook(rawBody, signature);
    if (provider === 'stripe' && !signed) throw new Error('Invalid webhook signature');
    if (!signed) this.logger.warn('Tranzak notice arrived without a valid signature; asking Tranzak directly instead of trusting it');

    const { orderId } = await providerImpl.handleWebhook(payload);
    if (!orderId) return; // unhandled event type (e.g. Stripe non-checkout events)

    // What the notice says is ignored. The order is marked paid only if the provider, asked by us, says so.
    const result = await this.verifyOrderPayment(orderId, true);
    return { received: true, status: result.status };
  }

  private readonly lastVerified = new Map<string, number>();
  private readonly verifying = new Map<string, Promise<{ status: OrderPaymentStatus; closed?: number }>>();

  /**
   * Asks the payment provider about an order's unresolved payment attempts and marks the order
   * paid if one of them went through. Safe to call at any time and by anyone allowed to see the
   * order: it can only ever confirm a payment the provider itself reports as paid.
   *
   * Each attempt records when it was checked and what the provider said. An attempt that is over
   * without payment is closed, so it is not asked about again and the client can simply try again.
   *
   * A notice from the provider, the page the client returns to, and the ten-minute automatic check
   * can all ask at the same moment; they share one lookup rather than racing each other.
   * If the provider cannot be reached the error is passed on, so a notice is retried by its sender.
   */
  verifyOrderPayment(orderId: string, force = false): Promise<{ status: OrderPaymentStatus; closed?: number }> {
    const running = this.verifying.get(orderId);
    if (running) return running;
    const run = this.verifyOrderPaymentOnce(orderId, force).finally(() => this.verifying.delete(orderId));
    this.verifying.set(orderId, run);
    return run;
  }

  private async verifyOrderPaymentOnce(orderId: string, force: boolean): Promise<{ status: OrderPaymentStatus; closed?: number }> {
    const order = await this.db.order.findUnique({ where: { id: orderId }, select: { status: true, paidAt: true } });
    if (!order) return { status: 'none' };
    if (order.status === 'PAID') return { status: 'paid' };
    // Paid once and since refunded in full: closed for good.
    if (order.paidAt) return { status: 'none' };

    const attempts = await this.db.paymentAttempt.findMany({
      where: { orderId, providerRef: { not: '' } },
      orderBy: { createdAt: 'desc' },
      take: ATTEMPTS_CHECKED,
      select: { id: true, providerRef: true, status: true, createdAt: true },
    });
    if (attempts.length === 0) return { status: 'none' };
    const outcome = (): OrderPaymentStatus => (attempts[0].status === 'FAILED' ? 'failed' : 'pending');

    const last = this.lastVerified.get(orderId) ?? 0;
    if (!force && Date.now() - last < VERIFY_EVERY_MS) return { status: outcome() };
    this.lastVerified.set(orderId, Date.now());
    if (this.lastVerified.size > 5000) this.lastVerified.clear();

    let newestClosedNow = false;
    let closed = 0;
    for (const [index, attempt] of attempts.entries()) {
      if (attempt.status !== 'PENDING') continue; // already has its final answer
      const verified = await paymentVerifier.verify(attempt.providerRef);
      const ours = belongsTo(verified, orderId);
      if (verified.paid && ours) {
        this.logger.log(`Order ${orderId} confirmed as paid by ${verified.provider} (${attempt.providerRef})`);
        await this.db.paymentAttempt.update({ where: { id: attempt.id }, data: { checkedAt: new Date(), providerStatus: verified.status ?? 'paid' } });
        await this.orderService.markPaid(orderId, attempt.providerRef);
        await this.db.auditLog.create({
          data: { actorId: 'system', action: 'payment.confirmed_auto', resourceType: 'Order', resourceId: orderId, metadata: { via: verified.provider, ref: attempt.providerRef } },
        });
        return { status: 'paid' };
      }
      if (verified.paid) this.logger.error(`${verified.provider} payment ${attempt.providerRef} is paid but belongs to ${verified.ourRef}, not order ${orderId}`);
      const over = !verified.paid && isOver(verified, attempt.createdAt);
      await this.db.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          checkedAt: new Date(),
          providerStatus: verified.paid ? PAID_ELSEWHERE : verified.status ?? 'no record',
          ...(over ? { status: 'FAILED' } : {}),
        },
      });
      if (over) {
        attempt.status = 'FAILED';
        closed++;
        if (index === 0) newestClosedNow = true;
      }
    }
    if (newestClosedNow) this.events.emit('payment.failed', { orderId });
    return { status: outcome(), closed };
  }
}
