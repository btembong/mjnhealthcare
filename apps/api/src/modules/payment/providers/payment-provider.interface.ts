export interface InitiatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  /** Browser redirect URL after payment completes (shown to user) */
  returnUrl: string;
  /** Server-side webhook URL Tranzak POSTs to on completion */
  notifyUrl: string;
}

export interface InitiatePaymentResult {
  providerRef: string;
  redirectUrl?: string;
  status: 'pending' | 'processing';
}

export interface IPaymentProvider {
  readonly name: string;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyWebhook(rawBody: Buffer | string, signature: string): boolean;
  handleWebhook(payload: unknown): Promise<{ orderId: string; status: 'success' | 'failed' }>;
}
