import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

interface ReminderPayload {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  consultantName: string;
  consultantEmail?: string | null;
  sessionStart: string;
  roomUrl: string;
  preSessionNote?: string;
}

interface FollowupPayload {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  consultantName: string;
  discountCode: string;
  discountExpiry: string;
}

@Processor('consultation-reminders')
export class ConsultationReminderProcessor {
  private readonly logger = new Logger(ConsultationReminderProcessor.name);

  constructor(private readonly notifications: NotificationService) {}

  // ── Legacy handlers (keep for backward compat with queued jobs) ─────────────

  @Process('consultation-reminder-24h')
  async handle24h(job: Job<ReminderPayload>) {
    await this._sendClientReminder(job.data, '24 hours');
    this.logger.log(`24h reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-1h')
  async handle1h(job: Job<ReminderPayload>) {
    await this._sendClientReminder(job.data, '1 hour');
    this.logger.log(`1h reminder sent for booking ${job.data.bookingId}`);
  }

  // ── Extended reminder chain ──────────────────────────────────────────────────

  @Process('consultation-reminder-48h')
  async handle48h(job: Job<ReminderPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'Your MJN Healthcare Consultation — In 2 Days',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>A quick heads-up: your consultation with <strong>${consultantName}</strong> is coming up in <strong>2 days</strong> at <strong>${time} WAT</strong>.</p>
        <p>Please ensure you have a stable internet connection and a quiet space. Your join link will be live 30 minutes before the session.</p>
        <p><a href="${roomUrl}" style="background:#0F4C81;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px;">Open Join Link</a></p>
        <p style="color:#888;font-size:13px;">Need to cancel? Do so at least 24 hours before to receive a full refund.</p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(
        clientPhone,
        `Hi ${clientName}, your MJN Healthcare consultation with ${consultantName} is in 2 days (${time} WAT). Join link: ${roomUrl}. Cancel 24h+ before for a full refund.`,
      ),
    ]);
    this.logger.log(`48h reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-2h')
  async handle2h(job: Job<ReminderPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'Your Consultation Starts in 2 Hours',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>Your session with <strong>${consultantName}</strong> begins in <strong>2 hours</strong> at <strong>${time} WAT</strong>.</p>
        <p>Test your camera and microphone now to avoid delays.</p>
        <p><a href="${roomUrl}" style="background:#0F4C81;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px;">Join Session</a></p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(
        clientPhone,
        `Hi ${clientName}, your consultation with ${consultantName} starts in 2 hours (${time} WAT). Click to join: ${roomUrl}`,
      ),
    ]);
    this.logger.log(`2h reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-15m')
  async handle15m(job: Job<ReminderPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'Your Session Starts in 15 Minutes — Join Now',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>Your session with <strong>${consultantName}</strong> starts in <strong>15 minutes</strong> at ${time} WAT. The room is open — you can join now.</p>
        <p><a href="${roomUrl}" style="background:#00A896;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-size:16px;font-weight:bold;">Join Now →</a></p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(
        clientPhone,
        `⏰ ${clientName}, your MJN consultation starts in 15 minutes! Join now: ${roomUrl}`,
      ),
    ]);
    this.logger.log(`15m reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-consultant')
  async handleConsultantReminder(job: Job<ReminderPayload>) {
    const { bookingId, consultantName, consultantEmail, clientName, clientEmail, sessionStart, preSessionNote } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });

    // Send to the consultant's own inbox when we have it; otherwise fall back to the admin alert inbox.
    const adminInbox = process.env.ADMIN_ALERT_EMAIL ?? 'admin@mjnhealth.com';
    const recipient = consultantEmail || adminInbox;

    // The host link requires an authenticated console session (host token is issued there),
    // so deep-link into the Sessions page rather than embedding the raw room URL.
    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3004';
    const joinHref = `${adminUrl}/sessions`;

    await this.notifications.sendEmail(
      recipient,
      `Upcoming Session in 30 Min — ${clientName} with ${consultantName}`,
      `<p>Hi <strong>${consultantName}</strong>,</p>
      <p>You have a consultation with <strong>${clientName}</strong> (<a href="mailto:${clientEmail}">${clientEmail}</a>) starting in <strong>30 minutes</strong> at <strong>${time} WAT</strong>.</p>
      ${preSessionNote ? `<p><strong>Client's pre-session note:</strong><br/><em>${preSessionNote}</em></p>` : ''}
      <p>Open the session in your console and click <strong>Join as host</strong> to start the video room:</p>
      <p><a href="${joinHref}" style="background:#0F4C81;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Open My Sessions</a></p>`,
      consultantName,
    );
    if (!consultantEmail) {
      this.logger.warn(`Consultant 30m alert for booking ${bookingId} sent to admin inbox — consultant has no email on file`);
    } else {
      this.logger.log(`Consultant 30m alert sent to ${consultantEmail} for booking ${bookingId}`);
    }
  }

  // ── 48h post-session follow-up for free consult clients ─────────────────────

  @Process('consultation-free-followup')
  async handleFreeFollowup(job: Job<FollowupPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, discountCode, discountExpiry } = job.data;
    const expiry = new Date(discountExpiry).toLocaleDateString('en-GB');
    const bookingUrl = `${process.env.WEB_URL ?? 'http://localhost:3001'}/consult`;

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'How was your free consultation? Book your full session — 10% off',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>We hope your free consultation with <strong>${consultantName}</strong> was helpful!</p>
        <p>As a thank-you, here is a <strong>10% discount</strong> on your next full session, valid until <strong>${expiry}</strong>:</p>
        <p style="text-align:center;margin:24px 0;">
          <span style="background:#F4A261;color:#fff;padding:12px 28px;border-radius:8px;font-size:22px;font-weight:bold;letter-spacing:2px;">${discountCode}</span>
        </p>
        <p>Ready to continue? Book your next session and apply the code at checkout.</p>
        <p><a href="${bookingUrl}" style="background:#0F4C81;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Book Full Session</a></p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(
        clientPhone,
        `Hi ${clientName}, thanks for your free MJN consultation with ${consultantName}! 🎉 Use code *${discountCode}* for 10% off your next booking (valid until ${expiry}). Book now: ${bookingUrl}`,
      ),
    ]);
    this.logger.log(`Free follow-up sent for booking ${job.data.bookingId}`);
  }

  // ── Private helper ───────────────────────────────────────────────────────────

  private async _sendClientReminder(data: ReminderPayload, timeLabel: string) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        `Your Consultation — ${timeLabel} Away`,
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>Your consultation with <strong>${consultantName}</strong> starts in <strong>${timeLabel}</strong> at ${time} WAT.</p>
        <p><a href="${roomUrl}" style="background:#0F4C81;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Join Session</a></p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(clientPhone, `Hi ${clientName}, your consultation with ${consultantName} starts in ${timeLabel} (${time} WAT). Join: ${roomUrl}`),
    ]);
  }
}
