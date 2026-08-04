import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  IPaymentProvider,
  InitiatePaymentInput,
  InitiatePaymentResult,
} from './payment-provider.interface';

@Injectable()
export class TranzakProvider implements IPaymentProvider {
  readonly name = 'tranzak';

  private readonly baseUrl = process.env.TRANZAK_BASE_URL ?? 'https://dsapi.tranzak.me';
  private readonly appId = process.env.TRANZAK_APP_ID ?? '';
  private readonly appKey = process.env.TRANZAK_APP_KEY ?? '';

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const res = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: this.appId, appKey: this.appKey }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth: any = await res.json();
    const token = auth.data?.token;
    if (!token) {
      throw new Error(`Tranzak auth failed: ${JSON.stringify(auth)}`);
    }

    // Append timestamp so retries don't duplicate mchTransactionRef (orderId|timestamp)
    const mchRef = `${input.orderId}|${Date.now()}`;

    const payRes = await fetch(`${this.baseUrl}/xp021/v1/request/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        amount: input.amount,
        currencyCode: input.currency,
        description: input.description,
        returnUrl: input.returnUrl,
        callbackUrl: input.notifyUrl,
        mchTransactionRef: mchRef,
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await payRes.json();

    if (!data.data?.links?.paymentAuthUrl) {
      throw new Error(`Tranzak payment create failed: ${JSON.stringify(data)}`);
    }

    return {
      providerRef: data.data?.requestId ?? '',
      redirectUrl: data.data?.links?.paymentAuthUrl,
      status: 'pending',
    };
  }

  verifyWebhook(rawBody: Buffer | string, signature: string): boolean {
    if (!signature || !this.appKey) return false;
    const expected = createHmac('sha256', this.appKey)
      .update(rawBody)
      .digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<{ orderId: string; status: 'success' | 'failed' }> {
    // mchTransactionRef format: "orderId|timestamp" — extract orderId from the first segment
    const mchRef: string =
      payload?.mchTransactionRef ??
      payload?.data?.mchTransactionRef ??
      payload?.customData?.orderId ??
      '';
    const orderId = mchRef.includes('|') ? mchRef.split('|')[0] : mchRef;
    const status = payload?.status === 'SUCCESSFUL' ? 'success' : 'failed';
    return { orderId, status };
  }
}
