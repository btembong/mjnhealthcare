import { BadRequestException } from '@nestjs/common';

/** Sent with the error so a page can offer card payment instead. */
export const MOMO_UNAVAILABLE = 'MOMO_UNAVAILABLE';

/**
 * What a client is told when Mobile Money (Tranzak) could not be started. The real reason is
 * logged and sent to the team (event `payment.gateway_failed`); it means nothing to a client.
 */
export function momoUnavailable(): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    code: MOMO_UNAVAILABLE,
    message: 'Mobile Money payment is unavailable right now. Please pay by card, or try again later.',
  });
}

export interface GatewayFailure {
  provider: 'tranzak';
  /** Where it happened, for the team: "consultation booking" or "service payment". */
  where: string;
  /** Booking or order id. */
  reference: string;
  /** The provider's own answer or the error text. */
  detail: string;
}
