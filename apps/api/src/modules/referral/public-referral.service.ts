import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { NotificationService } from '../notification/notification.service';

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

    // Prevent duplicate signup by email or phone
    if (dto.email) {
      const existing = await this.db.publicReferrer.findFirst({ where: { email: dto.email } });
      if (existing) {
        return { code: existing.code, alreadyExists: true };
      }
    }

    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) throw new BadRequestException('Could not generate unique code');
    } while (await this.db.publicReferrer.findUnique({ where: { code } }));

    const referrer = await this.db.publicReferrer.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, code },
    });

    // Send welcome email if email provided
    if (referrer.email) {
      const link = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`;
      await this.notificationService.sendEmail({
        to: referrer.email,
        subject: 'Your MJN Referral Link is Ready!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#0F4C81">Welcome to MJN Refer & Earn, ${referrer.name}!</h2>
            <p>Your unique referral link is ready. Share it with healthcare professionals looking to advance their careers globally:</p>
            <div style="background:#f4f4f8;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
              <a href="${link}" style="color:#0F4C81;font-weight:bold;font-size:16px;word-break:break-all">${link}</a>
            </div>
            <p><strong>How it works:</strong></p>
            <ul>
              <li>Share your link with anyone interested in MJN Health services</li>
              <li>When they join and make their first payment, you earn <strong>$20</strong></li>
              <li>Track your referrals anytime at <a href="${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${code}">your status page</a></li>
            </ul>
            <p style="color:#666;font-size:13px">Questions? Contact us at info@mjnhealthcare.com</p>
          </div>
        `,
      });
    }

    const link = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`;
    return { code, link, alreadyExists: false };
  }

  // ── Public: status page ───────────────────────────────────────────────────

  async getStatus(code: string) {
    const referrer = await this.db.publicReferrer.findUnique({
      where: { code },
      include: { referrals: { include: { person: { select: { name: true, createdAt: true } } } } },
    });
    if (!referrer) throw new NotFoundException('Referral code not found');

    const total = referrer.referrals.length;
    const converted = referrer.referrals.filter((r) => r.status === 'CONVERTED' || r.status === 'PAID').length;
    const paid = referrer.referrals.filter((r) => r.status === 'PAID').length;
    const pending = referrer.referrals.filter((r) => r.status === 'CONVERTED').length;
    const totalEarned = paid * PAYOUT_AMOUNT;
    const totalDue = pending * PAYOUT_AMOUNT;

    return {
      name: referrer.name,
      code: referrer.code,
      link: `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/get-started?ref=${code}`,
      stats: { total, converted, paid, pending, totalEarned, totalDue },
      referrals: referrer.referrals.map((r) => ({
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

  // ── Called when a new person registers with ?ref=CODE ────────────────────

  async trackRegistration(personId: string, refCode: string) {
    const referrer = await this.db.publicReferrer.findUnique({ where: { code: refCode } });
    if (!referrer) return;

    // Don't double-track same person
    const existing = await this.db.publicReferral.findFirst({
      where: { personId, referrerId: referrer.id },
    });
    if (existing) return;

    await this.db.publicReferral.create({
      data: { referrerId: referrer.id, personId, status: 'PENDING' },
    });
  }

  // ── Hook: lead converted with refCode → track registration ───────────────

  @OnEvent('referral.track_registration')
  async onTrackRegistration(payload: { personId: string; refCode: string }) {
    await this.trackRegistration(payload.personId, payload.refCode);
  }

  // ── Hook: first payment triggers conversion ───────────────────────────────

  @OnEvent('payment.completed')
  async onPaymentCompleted(payload: { orderId?: string; personId?: string; engagementId?: string }) {
    // Resolve personId from order if not passed directly
    let personId = payload.personId;
    if (!personId && payload.orderId) {
      const order = await this.db.order.findUnique({
        where: { id: payload.orderId },
        include: { engagement: true },
      });
      personId = order?.engagement?.clientId ?? undefined;
    }
    if (!personId) return;

    // Find a pending referral for this person
    const referral = await this.db.publicReferral.findFirst({
      where: { personId, status: 'PENDING' },
      include: { referrer: true },
    });
    if (!referral) return;

    // Mark as converted
    await this.db.publicReferral.update({
      where: { id: referral.id },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    });

    // Email the referrer
    if (referral.referrer.email) {
      const statusLink = `${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${referral.referrer.code}`;
      const totalConverted = await this.db.publicReferral.count({
        where: { referrerId: referral.referrerId, status: { in: ['CONVERTED', 'PAID'] } },
      });
      await this.notificationService.sendEmail({
        to: referral.referrer.email,
        subject: '🎉 You just earned $20 — someone joined MJN via your link!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#0F4C81">Great news, ${referral.referrer.name}!</h2>
            <p>Someone you referred just made their first payment on MJN Health. You've earned <strong>$20</strong>!</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#16a34a">+$20.00 earned</p>
              <p style="margin:4px 0 0;color:#15803d;font-size:13px">Total conversions: ${totalConverted}</p>
            </div>
            <p>We'll contact you shortly to arrange your payout. You can also track all your referrals and earnings at your status page:</p>
            <p><a href="${statusLink}" style="color:#0F4C81;font-weight:bold">${statusLink}</a></p>
            <p style="color:#666;font-size:13px">Questions? Contact us at info@mjnhealthcare.com</p>
          </div>
        `,
      });
    }
  }

  // ── Admin: list all referrers + referrals ─────────────────────────────────

  async adminList() {
    const referrers = await this.db.publicReferrer.findMany({
      include: {
        referrals: {
          include: { person: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return referrers.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      code: r.code,
      createdAt: r.createdAt,
      total: r.referrals.length,
      converted: r.referrals.filter((x) => x.status === 'CONVERTED' || x.status === 'PAID').length,
      paid: r.referrals.filter((x) => x.status === 'PAID').length,
      amountDue: r.referrals.filter((x) => x.status === 'CONVERTED').length * PAYOUT_AMOUNT,
      amountPaid: r.referrals.filter((x) => x.status === 'PAID').length * PAYOUT_AMOUNT,
      referrals: r.referrals,
    }));
  }

  async adminMarkPaid(referralId: string) {
    const referral = await this.db.publicReferral.findUnique({
      where: { id: referralId },
      include: { referrer: true },
    });
    if (!referral) throw new NotFoundException('Referral not found');
    if (referral.status !== 'CONVERTED') throw new BadRequestException('Referral is not in CONVERTED state');

    await this.db.publicReferral.update({
      where: { id: referralId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Notify referrer
    if (referral.referrer.email) {
      await this.notificationService.sendEmail({
        to: referral.referrer.email,
        subject: 'MJN Referral Payout Sent — $20',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#0F4C81">Your payout has been sent, ${referral.referrer.name}!</h2>
            <p>We've processed your <strong>$20 referral payout</strong>. Check your mobile money or bank account shortly.</p>
            <p>Keep sharing your link to earn more: <a href="${process.env.WEB_URL ?? 'https://mjnhealthcare.com'}/refer/status/${referral.referrer.code}" style="color:#0F4C81">View your referrals</a></p>
          </div>
        `,
      });
    }

    return { ok: true };
  }

  async adminVoid(referralId: string) {
    await this.db.publicReferral.update({
      where: { id: referralId },
      data: { status: 'VOID' },
    });
    return { ok: true };
  }
}
