import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@mjn/database';
import { PaymentService } from '../payment/payment.service';
import { ConsultationService } from '../consultation/consultation.service';
import { PaymentLookupError } from '../../common/payment-verifier';

/** The most payments one run will ask the providers about. Whatever is left waits for the next run. */
const MAX_PER_RUN = 40;
/** A cancelled, never-paid order or booking is still watched this long in case the money arrives late. */
const WATCH_CANCELLED_DAYS = 3;
/** This many failed lookups in a row means the provider is down: stop and try again next time. */
const GIVE_UP_AFTER = 3;

export type SweepResult = {
  at: Date;
  looked: number;
  confirmed: number;
  closed: number;
  unreachable: number;
  stoppedEarly: boolean;
};

/**
 * The automatic payment check.
 *
 * Every ten minutes it asks Tranzak or Stripe about every payment a client started that has no
 * final answer yet, and acts on what the provider says: a paid order or booking is confirmed
 * exactly as if its notice had arrived; an attempt that is over without payment is closed.
 * So a payment is never lost because a notice went missing or the client closed the page, and
 * nothing waits on a person unless the providers themselves cannot be reached.
 *
 * It only ever acts on a provider's own answer for a reference we stored ourselves.
 * Set PAYMENT_AUTO_CHECK=off to switch it off (for example on a machine that is not the live server).
 */
@Injectable()
export class PaymentSweepService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaymentSweepService.name);
  private running = false;
  private last: SweepResult | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly payments: PaymentService,
    private readonly consultations: ConsultationService,
  ) {}

  private get enabled() {
    return (process.env.PAYMENT_AUTO_CHECK ?? '').toLowerCase() !== 'off';
  }

  onApplicationBootstrap() {
    if (!this.enabled) {
      this.logger.warn('Automatic payment check is switched off (PAYMENT_AUTO_CHECK=off)');
      return;
    }
    // Shortly after start-up, so a restart never leaves payments unchecked until the next ten-minute mark.
    const timer = setTimeout(() => void this.sweep(), 45000);
    timer.unref?.();
  }

  /** What the Payments page shows about the automatic check. */
  status() {
    return { enabled: this.enabled, everyMinutes: 10, lastRun: this.last };
  }

  @Cron('*/10 * * * *')
  async sweep(): Promise<SweepResult | null> {
    if (!this.enabled || this.running) return null;
    this.running = true;
    try {
      const result = await this.run();
      this.last = result;
      if (result.confirmed || result.closed || result.unreachable) {
        this.logger.log(
          `Automatic payment check: ${result.looked} looked up, ${result.confirmed} confirmed as paid, ${result.closed} closed unpaid` +
          (result.unreachable ? `, ${result.unreachable} could not be looked up${result.stoppedEarly ? ' (provider unreachable, stopped early)' : ''}` : ''),
        );
      }
      return result;
    } catch (err) {
      this.logger.error(`Automatic payment check failed: ${err}`);
      return null;
    } finally {
      this.running = false;
    }
  }

  /** One pass. Public so it can be run and checked without waiting for the clock. */
  async run(now = new Date()): Promise<SweepResult> {
    const result: SweepResult = { at: now, looked: 0, confirmed: 0, closed: 0, unreachable: 0, stoppedEarly: false };
    const watchFrom = new Date(now.getTime() - WATCH_CANCELLED_DAYS * 86400000);
    let failuresInARow = 0;

    /** Runs one lookup and keeps count. Returns false once the provider looks to be down. */
    const look = async (work: () => Promise<{ confirmed?: boolean; closed?: number }>, what: string) => {
      try {
        const outcome = await work();
        result.looked++;
        if (outcome.confirmed) result.confirmed++;
        result.closed += outcome.closed ?? 0;
        failuresInARow = 0;
      } catch (err) {
        result.unreachable++;
        failuresInARow++;
        if (!(err instanceof PaymentLookupError)) this.logger.error(`Automatic payment check: ${what} failed: ${err}`);
      }
      if (failuresInARow >= GIVE_UP_AFTER) result.stoppedEarly = true;
      return !result.stoppedEarly;
    };

    // ── Orders: every attempt with no final answer, least recently checked first ──
    const attempts = await this.db.paymentAttempt.findMany({
      where: {
        status: 'PENDING',
        providerRef: { not: '' },
        OR: [
          { order: { status: 'PENDING', paidAt: null } },
          // An unpaid order that was cancelled can still be paid on a payment page left open.
          { order: { status: 'CANCELLED', paidAt: null }, createdAt: { gte: watchFrom } },
        ],
      },
      orderBy: [{ checkedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
      take: MAX_PER_RUN * 3,
      select: { orderId: true },
    });
    const orderIds = [...new Set(attempts.map((a) => a.orderId))].slice(0, MAX_PER_RUN);
    for (const orderId of orderIds) {
      const carryOn = await look(async () => {
        const { status, closed } = await this.payments.verifyOrderPayment(orderId, true);
        return { confirmed: status === 'paid', closed };
      }, `order ${orderId}`);
      if (!carryOn) return result;
    }

    // ── Consultations ──
    const bookings = await this.db.consultationBooking.findMany({
      where: {
        paymentRef: { not: null },
        paidAt: null,
        paymentClosedAt: null,
        slot: { isFree: false },
        OR: [
          { status: 'AWAITING_PAYMENT' },
          { status: 'CANCELLED', createdAt: { gte: watchFrom } },
        ],
      },
      orderBy: [{ paymentCheckedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
      take: MAX_PER_RUN,
      select: { id: true },
    });
    for (const { id } of bookings) {
      const carryOn = await look(async () => {
        const status = await this.consultations.verifyBookingPayment(id, true);
        return { confirmed: status === 'confirmed', closed: status === 'failed' ? 1 : 0 };
      }, `booking ${id}`);
      if (!carryOn) return result;
    }
    return result;
  }
}
