import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { NotificationService } from '../notification/notification.service';
import * as T from '../notification/email-templates';

const REFERRER_FOOTER = 'Sent because you joined MJN Refer &amp; Earn. Reply to this email with any questions.';

const PAYOUT_AMOUNT = 20; // $20 flat fee

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class PublicReferralService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Public: signup as referrer ────────────────────────────────────────────

  async signup(dto: { name: string; email?: string; phone?: string }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Provide at least an email or phone number');
    }

    if (dto.email) {
      const existing = await (this.db as any).publicReferrer.findFirst({ where: { email: dto.email } });
      if (existing) return { code: existing.code, alreadyExists: true };
    }

    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) throw new BadRequestException('Could not generate unique code');
    } while (await (this.db as any).publicReferrer.findUnique({ where: { code } }));

    const referrer = await (this.db as any).publicReferrer.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, code },
    });

    if (referrer.email) {
      const link = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`;
      await this.notificationService.sendEmail(
        referrer.email,
        'Your MJN referral link is ready',
        T.shell(
          T.greeting(T.esc(referrer.name)) +
          T.label('Refer & Earn') +
          T.h1('Your referral link is ready') +
          T.p('Share it with healthcare professionals who want to work abroad. When someone joins through your link and makes their first payment, you earn <strong>$20</strong>.') +
          T.notice(`<a href="${link}" style="color:#0F4C81;font-weight:700;word-break:break-all;">${link}</a>`, 'info') +
          T.btn('See my referrals', `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${code}`),
          REFERRER_FOOTER,
        ),
        referrer.name,
        undefined,
        'team',
      );
    }

    const link = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`;
    return { code, link, alreadyExists: false };
  }

  // ── Public: status page ───────────────────────────────────────────────────

  async getStatus(code: string) {
    const referrer = await (this.db as any).publicReferrer.findUnique({
      where: { code },
      include: { referrals: { include: { person: { select: { name: true, createdAt: true } } } } },
    });
    if (!referrer) throw new NotFoundException('Referral code not found');

    const total = referrer.referrals.length;
    const converted = referrer.referrals.filter((r: any) => r.status === 'CONVERTED' || r.status === 'PAID').length;
    const paid = referrer.referrals.filter((r: any) => r.status === 'PAID').length;
    const pending = referrer.referrals.filter((r: any) => r.status === 'CONVERTED').length;

    return {
      name: referrer.name,
      code: referrer.code,
      link: `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`,
      stats: { total, converted, paid, pending, totalEarned: paid * PAYOUT_AMOUNT, totalDue: pending * PAYOUT_AMOUNT },
      referrals: referrer.referrals.map((r: any) => ({
        id: r.id,
        status: r.status,
        convertedAt: r.convertedAt,
        paidAt: r.paidAt,
        amountDue: Number(r.amountDue),
        personName: r.person?.name ?? 'Anonymous',
        joinedAt: r.person?.createdAt,
      })),
    };
  }

  // ── Track registration when lead converts with a refCode ─────────────────

  async trackRegistration(personId: string, refCode: string) {
    const referrer = await (this.db as any).publicReferrer.findUnique({ where: { code: refCode } });
    if (!referrer) return;

    const existing = await (this.db as any).publicReferral.findFirst({
      where: { personId, referrerId: referrer.id },
    });
    if (existing) return;

    await (this.db as any).publicReferral.create({
      data: { referrerId: referrer.id, personId, status: 'PENDING' },
    });
  }

  @OnEvent('referral.track_registration')
  async onTrackRegistration(payload: { personId: string; refCode: string }) {
    await this.trackRegistration(payload.personId, payload.refCode);
  }

  // ── Hook: first payment triggers conversion ───────────────────────────────

  @OnEvent('payment.completed')
  async onPaymentCompleted(payload: { orderId?: string; personId?: string }) {
    let personId = payload.personId;
    if (!personId && payload.orderId) {
      const order = await this.db.order.findUnique({
        where: { id: payload.orderId },
        include: { engagement: true },
      });
      personId = order?.engagement?.personId ?? undefined;
    }
    if (!personId) return;

    const referral = await (this.db as any).publicReferral.findFirst({
      where: { personId, status: 'PENDING' },
      include: { referrer: true },
    });
    if (!referral) return;

    await (this.db as any).publicReferral.update({
      where: { id: referral.id },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    });

    if (referral.referrer.email) {
      const statusLink = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${referral.referrer.code}`;
      const totalConverted = await (this.db as any).publicReferral.count({
        where: { referrerId: referral.referrerId, status: { in: ['CONVERTED', 'PAID'] } },
      });
      await this.notificationService.sendEmail(
        referral.referrer.email,
        'You earned $20 — someone joined MJN through your link',
        T.shell(
          T.greeting(T.esc(referral.referrer.name)) +
          T.label('Refer & Earn') +
          T.h1('You earned $20') +
          T.p('Someone you referred has just made their first payment with MJN Healthcare.') +
          T.infoTable([
            T.row('Earned', `<strong>$${PAYOUT_AMOUNT.toFixed(2)}</strong> ${T.badge('Due to you', 'success')}`),
            T.row('People who joined', String(totalConverted), true),
          ]) +
          T.p('We send your payout by mobile money or bank transfer and email you when it is on its way.') +
          T.btn('See my referrals', statusLink),
          REFERRER_FOOTER,
        ),
        referral.referrer.name,
        undefined,
        'billing',
      );
    }
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminList() {
    const referrers = await (this.db as any).publicReferrer.findMany({
      include: {
        referrals: { include: { person: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return referrers.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      code: r.code,
      createdAt: r.createdAt,
      total: r.referrals.length,
      converted: r.referrals.filter((x: any) => x.status === 'CONVERTED' || x.status === 'PAID').length,
      paid: r.referrals.filter((x: any) => x.status === 'PAID').length,
      amountDue: r.referrals.filter((x: any) => x.status === 'CONVERTED').length * PAYOUT_AMOUNT,
      amountPaid: r.referrals.filter((x: any) => x.status === 'PAID').length * PAYOUT_AMOUNT,
      referrals: r.referrals,
    }));
  }

  async adminMarkPaid(referralId: string) {
    const referral = await (this.db as any).publicReferral.findUnique({
      where: { id: referralId },
      include: { referrer: true },
    });
    if (!referral) throw new NotFoundException('Referral not found');
    if (referral.status !== 'CONVERTED') throw new BadRequestException('Referral is not in CONVERTED state');

    await (this.db as any).publicReferral.update({
      where: { id: referralId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    if (referral.referrer.email) {
      await this.notificationService.sendEmail(
        referral.referrer.email,
        'Your $20 referral payout is on its way',
        T.shell(
          T.greeting(T.esc(referral.referrer.name)) +
          T.label('Refer & Earn') +
          T.h1('Your payout has been sent') +
          T.p(`We have sent your <strong>$${PAYOUT_AMOUNT.toFixed(2)}</strong> referral payout. It should appear in your mobile money or bank account shortly.`) +
          T.btn('See my referrals', `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${referral.referrer.code}`) +
          T.pSmall('Keep sharing your link: every person who joins and pays earns you another $20.'),
          REFERRER_FOOTER,
        ),
        referral.referrer.name,
        undefined,
        'billing',
      );
    }

    return { ok: true };
  }

  async adminVoid(referralId: string) {
    await (this.db as any).publicReferral.update({
      where: { id: referralId },
      data: { status: 'VOID' },
    });
    return { ok: true };
  }
}
