import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { OrderService } from '../order/order.service';
import { TranzakProvider } from './providers/tranzak.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly orderService: OrderService,
    private readonly tranzak: TranzakProvider,
    private readonly events: EventEmitter2,
  ) {}

  /** Fetch live USD→XAF rate; falls back to the pegged rate (655) if the API is unreachable */
  private async getUsdToXafRate(): Promise<number> {
    const FALLBACK_RATE = 655; // CFA franc is semi-pegged; safe floor
    try {
      const res = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { signal: AbortSignal.timeout(4000) },
      );
      if (!res.ok) return FALLBACK_RATE;
      const data: any = await res.json();
      const rate = data?.rates?.XAF;
      if (typeof rate === 'number' && rate > 400) return rate; // sanity check
      return FALLBACK_RATE;
    } catch {
      this.logger.warn('Exchange rate fetch failed — using fallback rate 655 XAF/USD');
      return FALLBACK_RATE;
    }
  }

  async initiatePayment(orderId: string, customerPhone?: string, customerEmail?: string) {
    const order = await this.orderService.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    // ── DEV bypass ────────────────────────────────────────────────────────────
    if (process.env.DEV_SKIP_PAYMENT === 'true') {
      this.logger.warn(`[DEV] Skipping Tranzak — auto-confirming order ${orderId}`);
      await this.orderService.markPaid(orderId); // emits payment.completed with full context
      return {
        providerRef: 'dev-skip',
        redirectUrl: `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments/confirmed?orderId=${orderId}`,
        status: 'pending' as const,
      };
    }

    const notifyUrl = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/payments/webhook/tranzak`;
    const returnUrl = `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/payments/confirmed?orderId=${orderId}`;

    // Build a human-readable description from the line items
    const itemNames: string[] = (order.lineItems ?? [])
      .filter((li: any) => li.serviceItem?.name && li.serviceItem.name !== 'Engagement Fee')
      .map((li: any) => li.serviceItem.name as string);
    const descriptionDetail =
      itemNames.length === 0
        ? 'Engagement Fee'
        : itemNames.length <= 3
        ? itemNames.join(', ')
        : `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`;

    // ── USD → XAF conversion ─────────────────────────────────────────────────
    // All prices in DB are stored in USD. Tranzak processes in XAF (CFA franc).
    // We convert here; receipts and order totals remain in USD.
    const amountUsd = Number(order.total);
    const xafRate = await this.getUsdToXafRate();
    const amountXaf = Math.round(amountUsd * xafRate); // XAF has no decimal places

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

  async handleWebhook(provider: 'tranzak', rawBody: Buffer | string, payload: unknown, signature: string) {
    const providerImpl = this.tranzak;
    if (!providerImpl.verifyWebhook(rawBody, signature)) {
      throw new Error('Invalid webhook signature');
    }
    const { orderId, status } = await providerImpl.handleWebhook(payload);

    if (status === 'success') {
      // markPaid already emits payment.completed with full person/engagement context
      await this.orderService.markPaid(orderId);
    } else {
      this.events.emit('payment.failed', { orderId, provider });
    }
  }
}
