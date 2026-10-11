import { Logger } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Asks the payment provider itself what happened to a payment.
 *
 * Nothing is ever marked as paid on the word of an incoming notice (webhook): the notice only
 * tells us to look. The answer that counts is the one we fetch here, with our own credentials,
 * for a payment reference we stored when the client started paying.
 */
export type VerifiedPayment = {
  provider: 'tranzak' | 'stripe';
  ref: string;
  /** The provider's own word for the state, for showing to staff. */
  status: string | null;
  paid: boolean;
  /** The provider says this attempt is finished and no money was taken. */
  failed: boolean;
  amount: number | null;
  currency: string | null;
  /** Our own reference the provider holds against the payment: the order or booking it was created for. */
  ourRef: string | null;
};

/** The provider could not be reached or gave no usable answer. Nothing is known; try again later. */
export class PaymentLookupError extends Error {}

const TRANZAK_FAILED = ['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'REJECTED', 'REVERSED'];
const logger = new Logger('PaymentVerifier');

export const providerOfRef = (ref: string): 'tranzak' | 'stripe' => (ref.startsWith('cs_') ? 'stripe' : 'tranzak');

let stripeClient: Stripe | null = null;
function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new PaymentLookupError('Stripe is not set up on this server.');
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-09-30.endive' as any });
  return stripeClient;
}

export const paymentVerifier = {
  /** Looks a payment up with whichever provider issued its reference. */
  async verify(ref: string): Promise<VerifiedPayment> {
    if (!ref) throw new PaymentLookupError('There is no payment reference to look up.');
    return providerOfRef(ref) === 'stripe' ? this.stripeSession(ref) : this.tranzakRequest(ref);
  },

  async tranzakRequest(requestId: string): Promise<VerifiedPayment> {
    const baseUrl = process.env.TRANZAK_BASE_URL ?? 'https://dsapi.tranzak.me';
    let data: any;
    try {
      const authRes = await fetch(`${baseUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: process.env.TRANZAK_APP_ID, appKey: process.env.TRANZAK_APP_KEY }),
      });
      const token = ((await authRes.json()) as any)?.data?.token;
      if (!token) throw new Error('no token');
      // Tranzak's lookup is "details?requestId=…". The older "/request/<id>" form answers "Page not found"
      // for every payment, which is why lookups used to come back empty.
      const res = await fetch(`${baseUrl}/xp021/v1/request/details?requestId=${encodeURIComponent(requestId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data = await res.json();
    } catch (err) {
      logger.warn(`Tranzak lookup failed for ${requestId}: ${err}`);
      throw new PaymentLookupError('Tranzak could not be reached. Try again in a minute.');
    }
    const resource = data?.data ?? data?.resource ?? {};
    const state = typeof resource.status === 'string' ? resource.status.toUpperCase() : null;
    // Tranzak adds its reason to a failure ("TXN_EXPIRED"); staff see it beside the status.
    const reason = typeof resource.errorMessage === 'string' && resource.errorMessage ? resource.errorMessage : null;
    const status = state && reason && state !== 'SUCCESSFUL' ? `${state} (${reason})` : state;
    // The answer must be about the payment we asked for.
    if (resource.requestId && resource.requestId !== requestId) {
      throw new PaymentLookupError('Tranzak answered about a different payment.');
    }
    return {
      provider: 'tranzak',
      ref: requestId,
      status,
      paid: state === 'SUCCESSFUL',
      failed: !!state && TRANZAK_FAILED.includes(state),
      amount: resource.amount ?? null,
      currency: resource.currencyCode ?? null,
      ourRef: typeof resource.mchTransactionRef === 'string' ? resource.mchTransactionRef : null,
    };
  },

  async stripeSession(sessionId: string): Promise<VerifiedPayment> {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe().checkout.sessions.retrieve(sessionId);
    } catch (err) {
      if (err instanceof PaymentLookupError) throw err;
      logger.warn(`Stripe lookup failed for ${sessionId}: ${err}`);
      throw new PaymentLookupError('Stripe could not be reached. Try again in a minute.');
    }
    return {
      provider: 'stripe',
      ref: sessionId,
      status: session.payment_status === 'paid' ? 'paid' : session.status ?? session.payment_status ?? null,
      paid: session.payment_status === 'paid',
      failed: session.status === 'expired',
      amount: session.amount_total == null ? null : session.amount_total / 100,
      currency: session.currency ? session.currency.toUpperCase() : null,
      ourRef: session.metadata?.orderId ?? session.metadata?.bookingId ?? null,
    };
  },
};

/**
 * True when the provider's record is for this order or booking. Tranzak order references are
 * "orderId|timestamp"; everything else is the id itself. A provider that returns no reference
 * of ours is accepted, because the payment reference was already ours to begin with.
 */
export function belongsTo(verified: VerifiedPayment, id: string): boolean {
  if (!verified.ourRef) return true;
  return verified.ourRef === id || verified.ourRef.startsWith(`${id}|`);
}
