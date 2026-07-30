import { Injectable } from '@nestjs/common';

export interface RefundCalculation {
  refundAmount: number;
  refundPercent: number;
  reason: string;
}

@Injectable()
export class RefundService {
  /**
   * Refund policy:
   * > 24h before session  → 100%
   * 4–24h before session  → 50%
   * < 4h / no-show        → 0%
   */
  calculate(amountPaid: number, sessionStartAt: Date, cancelledAt: Date = new Date()): RefundCalculation {
    const msUntilSession = sessionStartAt.getTime() - cancelledAt.getTime();
    const hoursUntilSession = msUntilSession / (1000 * 60 * 60);

    if (hoursUntilSession > 24) {
      return {
        refundAmount: amountPaid,
        refundPercent: 100,
        reason: 'Cancelled more than 24 hours before session',
      };
    }

    if (hoursUntilSession >= 4) {
      const refundAmount = Math.round((amountPaid * 0.5) * 100) / 100;
      return {
        refundAmount,
        refundPercent: 50,
        reason: 'Cancelled 4–24 hours before session',
      };
    }

    return {
      refundAmount: 0,
      refundPercent: 0,
      reason: 'Cancelled less than 4 hours before session — no refund applicable',
    };
  }
}
