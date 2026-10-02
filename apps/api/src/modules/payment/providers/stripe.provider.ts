import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  IPaymentProvider,
  InitiatePaymentInput,
  InitiatePaymentResult,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  readonly name = 'stripe';
  private readonly stripe: Stripe;
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  private readonly logger = new Logger(StripeProvider.name);
  private lastEvent: Stripe.Event | null = null;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-06-30.basil',
    });
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    // input.amount is USD (dollars, not cents)
    const amountCents = Math.round(input.amount * 100);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: input.description },
          },
          quantity: 1,
        },
      ],
      success_url: `${input.returnUrl}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: input.returnUrl.replace('/confirmed', ''),
      customer_email: input.customerEmail,
      metadata: { orderId: input.orderId },
    });

    this.logger.log(`Stripe Checkout session created: ${session.id} for order ${input.orderId} ($${input.amount} USD)`);

    return {
      providerRef: session.id,
      redirectUrl: session.url ?? undefined,
      status: 'pending',
    };
  }

  verifyWebhook(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      return false;
    }
    if (!signature) return false;
    try {
      this.lastEvent = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature verification failed: ${err.message}`);
      this.lastEvent = null;
      return false;
    }
  }

  async handleWebhook(payload: unknown): Promise<{ orderId: string; status: 'success' | 'failed' }> {
    const event = this.lastEvent ?? (payload as Stripe.Event);
    this.lastEvent = null; // reset after use

    if (event?.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId ?? '';
      const status = session.payment_status === 'paid' ? 'success' : 'failed';
      this.logger.log(`Stripe checkout.session.completed: orderId=${orderId} status=${status}`);
      return { orderId, status };
    }

    // Unhandled event type — not an error, just ignore
    return { orderId: '', status: 'failed' };
  }
}
