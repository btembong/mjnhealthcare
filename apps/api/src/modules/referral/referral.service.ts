import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database.module';
import { CreditService } from './credit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// System config keys — values stored in systemConfig table
const CFG_REFERRAL_REWARD_CENTS = 'referral_reward_cents';      // default 1000 ($10)
const CFG_CONSULTATION_CUT_PCT  = 'referral_consultation_cut';  // default 5 (5%)

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly credit: CreditService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Code management ────────────────────────────────────────────────────────

  async getOrCreateCode(personId: string): Promise<string> {
    const existing = await this.db.referralCode.findFirst({
      where: { ownerId: personId, isActive: true },
      select: { code: true },
    });
    if (existing) return existing.code;

    const person = await this.db.person.findUnique({
      where: { id: personId },
      select: { name: true },
    });
    const slug = (person?.name ?? 'MJN')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    const code = `MJN-${slug}-${suffix}`;

    await this.db.referralCode.create({
      data: { code, ownerId: personId },
    });
    return code;
  }

  async getMyCode(personId: string) {
    const code = await this.getOrCreateCode(personId);
    const record = await this.db.referralCode.findUnique({
      where: { code },
      select: { code: true, totalUses: true, totalRewardedCents: true, createdAt: true },
    });
    return record;
  }

  async getMyReferrals(personId: string) {
    const codes = await this.db.referralCode.findMany({
      where: { ownerId: personId },
      include: {
        uses: {
          include: { referredPerson: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return codes;
  }

  // ── Track a referred signup ─────────────────────────────────────────────────

  async trackReferral(code: string, newPersonId: string) {
    const referralCode = await this.db.referralCode.findUnique({ where: { code, isActive: true } });
    if (!referralCode) return; // silent — bad/expired code

    // Block self-referral
    if (referralCode.ownerId === newPersonId) return;

    // Block duplicate
    const existing = await this.db.referralUse.findUnique({
      where: { referralCodeId_referredPersonId: { referralCodeId: referralCode.id, referredPersonId: newPersonId } },
    });
    if (existing) return;

    await this.db.referralUse.create({
      data: { referralCodeId: referralCode.id, referredPersonId: newPersonId, status: 'PENDING' },
    });

    // Store code on person for reward trigger later
    await this.db.person.update({
      where: { id: newPersonId },
      data: { referredByCode: code },
    });
  }

  // ── Reward the referrer when referred person makes first payment ────────────

  async rewardOnFirstPayment(referredPersonId: string, orderId: string) {
    const person = await this.db.person.findUnique({
      where: { id: referredPersonId },
      select: { referredByCode: true },
    });
    if (!person?.referredByCode) return;

    const referralCode = await this.db.referralCode.findUnique({
      where: { code: person.referredByCode },
      select: { id: true, ownerId: true },
    });
    if (!referralCode) return;

    const use = await this.db.referralUse.findUnique({
      where: { referralCodeId_referredPersonId: { referralCodeId: referralCode.id, referredPersonId } },
    });
    if (!use || use.status !== 'PENDING') return;

    // Get reward amount from config
    const cfg = await this.db.systemConfig.findUnique({ where: { key: CFG_REFERRAL_REWARD_CENTS } });
    const rewardCents = cfg ? parseInt(cfg.value) : 1000;

    // Credit the referrer's wallet
    await this.credit.addCredits(
      referralCode.ownerId,
      rewardCents,
      'EARNED',
      `Referral reward — new client joined (order #${orderId.slice(0, 8).toUpperCase()})`,
      referralCode.id,
    );

    // Mark use as rewarded
    await this.db.referralUse.update({
      where: { id: use.id },
      data: { status: 'REWARDED', rewardAmountCents: rewardCents, rewardedAt: new Date(), firstOrderId: orderId },
    });

    // Update code stats
    await this.db.referralCode.update({
      where: { id: referralCode.id },
      data: { totalUses: { increment: 1 }, totalRewardedCents: { increment: rewardCents } },
    });

    this.logger.log(`Referral rewarded: ${rewardCents} cents → owner ${referralCode.ownerId}`);
    this.events.emit('credit.earned', { personId: referralCode.ownerId, amountCents: rewardCents, reason: 'referral' });
  }

  // ── Consultation cut ────────────────────────────────────────────────────────

  async rewardConsultationCut(referrerId: string, bookingAmountCents: number, bookingId: string) {
    const cfg = await this.db.systemConfig.findUnique({ where: { key: CFG_CONSULTATION_CUT_PCT } });
    const pct = cfg ? parseInt(cfg.value) : 5;
    const cutCents = Math.floor(bookingAmountCents * pct / 100);
    if (cutCents <= 0) return;

    await this.credit.addCredits(
      referrerId,
      cutCents,
      'EARNED',
      `Consultation referral cut (${pct}%) — booking #${bookingId.slice(0, 8).toUpperCase()}`,
      bookingId,
    );

    this.events.emit('credit.earned', { personId: referrerId, amountCents: cutCents, reason: 'consultation_cut' });
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async getAllCodes(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [codes, total] = await Promise.all([
      this.db.referralCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true, email: true } },
          uses: { select: { status: true } },
        },
      }),
      this.db.referralCode.count(),
    ]);
    return { codes, total, page, limit };
  }

  async voidCode(codeId: string) {
    return this.db.referralCode.update({
      where: { id: codeId },
      data: { isActive: false },
    });
  }
}
