import { adminAlertEmail } from '../../common/admin-alert';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { DatabaseService } from '@mjn/database';
import * as T from '../notification/email-templates';
import { localeForEmail } from '../../common/email-locale';

/** One client reminder, in the client's language. `soon` is the "starts in…" wording. */
function reminderEmail(fr: boolean, o: { name: string; consultant: string; start: string; roomUrl: string; soon: { en: string; fr: string }; tip?: { en: string; fr: string }; now?: boolean }) {
  const name = T.esc(o.name);
  const consultant = T.esc(o.consultant);
  const when = T.doualaWhen(o.start, fr);
  return fr
    ? T.shell(
        T.greetingFr(name) +
        T.label('Consultation') +
        T.h1(o.now ? 'Votre séance commence — vous pouvez rejoindre' : `Votre consultation commence ${o.soon.fr}`) +
        T.infoTable([
          T.row('Avec', `<strong>${consultant}</strong>`),
          T.row('Quand', `<strong>${when}</strong> (heure de Douala)`, true),
        ]) +
        (o.tip ? T.p(o.tip.fr) : '') +
        T.btn(o.now ? 'Rejoindre maintenant' : 'Ouvrir le lien de la séance', o.roomUrl) +
        T.pSmall('Pour annuler avec remboursement complet, faites-le au moins 24 heures avant depuis votre espace client.'),
        T.FOOTER_FR,
      )
    : T.shell(
        T.greeting(name) +
        T.label('Consultation') +
        T.h1(o.now ? 'Your session is starting — you can join now' : `Your consultation starts ${o.soon.en}`) +
        T.infoTable([
          T.row('With', `<strong>${consultant}</strong>`),
          T.row('When', `<strong>${when}</strong> (Douala time)`, true),
        ]) +
        (o.tip ? T.p(o.tip.en) : '') +
        T.btn(o.now ? 'Join now' : 'Open the session link', o.roomUrl) +
        T.pSmall('To cancel with a full refund, do it at least 24 hours before, from your client portal.'),
      );
}

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

  constructor(
    private readonly notifications: NotificationService,
    private readonly db: DatabaseService,
  ) {}

  /** A reminder is only sent if the session is still confirmed for the time it was queued for. */
  private async stillOn(data: ReminderPayload): Promise<boolean> {
    try {
      const booking = await this.db.consultationBooking.findUnique({
        where: { id: data.bookingId },
        select: { status: true, slot: { select: { startAt: true } } },
      });
      if (!booking) return false;
      const moved = Math.abs(booking.slot.startAt.getTime() - new Date(data.sessionStart).getTime()) > 60_000;
      if (booking.status !== 'CONFIRMED' || moved) {
        this.logger.log(`Reminder skipped for booking ${data.bookingId}: ${moved ? 'session was moved' : `status is ${booking.status}`}`);
        return false;
      }
      return true;
    } catch (err) {
      // If the check itself fails, send the reminder rather than leave a client without one.
      this.logger.error(`Could not check booking ${data.bookingId} before a reminder: ${err}`);
      return true;
    }
  }

  // ── Legacy handlers (keep for backward compat with queued jobs) ─────────────

  @Process('consultation-reminder-24h')
  async handle24h(job: Job<ReminderPayload>) {
    if (!(await this.stillOn(job.data))) return;
    await this._sendClientReminder(job.data, '24 hours');
    this.logger.log(`24h reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-1h')
  async handle1h(job: Job<ReminderPayload>) {
    if (!(await this.stillOn(job.data))) return;
    await this._sendClientReminder(job.data, '1 hour');
    this.logger.log(`1h reminder sent for booking ${job.data.bookingId}`);
  }

  // ── Extended reminder chain ──────────────────────────────────────────────────

  @Process('consultation-reminder-48h')
  async handle48h(job: Job<ReminderPayload>) {
    if (!(await this.stillOn(job.data))) return;
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    const fr = (await localeForEmail(this.db, clientEmail)) === 'fr';

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        fr ? 'Votre consultation MJN Healthcare — dans 2 jours' : 'Your MJN Healthcare consultation — in 2 days',
        reminderEmail(fr, {
          name: clientName, consultant: consultantName, start: sessionStart, roomUrl,
          soon: { en: 'in 2 days', fr: 'dans 2 jours' },
          tip: { en: 'Plan a quiet place with a steady internet connection. The link opens shortly before the session.', fr: 'Prévoyez un endroit calme avec une connexion stable. Le lien s’ouvre peu avant la séance.' },
        }),
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
    if (!(await this.stillOn(job.data))) return;
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    const fr = (await localeForEmail(this.db, clientEmail)) === 'fr';

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        fr ? 'Votre consultation commence dans 2 heures' : 'Your consultation starts in 2 hours',
        reminderEmail(fr, {
          name: clientName, consultant: consultantName, start: sessionStart, roomUrl,
          soon: { en: 'in 2 hours', fr: 'dans 2 heures' },
          tip: { en: 'Test your camera and microphone now to avoid delays.', fr: 'Testez dès maintenant votre caméra et votre micro pour éviter les retards.' },
        }),
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
    if (!(await this.stillOn(job.data))) return;
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    const fr = (await localeForEmail(this.db, clientEmail)) === 'fr';

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        fr ? 'Votre séance commence dans 15 minutes' : 'Your session starts in 15 minutes — join now',
        reminderEmail(fr, { name: clientName, consultant: consultantName, start: sessionStart, roomUrl, soon: { en: 'in 15 minutes', fr: 'dans 15 minutes' }, now: true }),
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
    if (!(await this.stillOn(job.data))) return;
    const { bookingId, consultantName, consultantEmail, clientName, clientEmail, sessionStart, preSessionNote } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });

    // Send to the consultant's own inbox when we have it; otherwise fall back to the admin alert inbox.
    const adminInbox = adminAlertEmail();
    const recipient = consultantEmail || adminInbox;

    // The host link requires an authenticated console session (host token is issued there),
    // so deep-link into the Sessions page rather than embedding the raw room URL.
    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3004';
    const joinHref = `${adminUrl}/sessions`;

    await this.notifications.sendEmail(
      recipient,
      `Session in 30 minutes — ${clientName} with ${consultantName}`,
      T.shell(
        T.greeting(T.esc(consultantName)) +
        T.label('Consultation') +
        T.h1(`Your session with ${T.esc(clientName)} starts in 30 minutes`) +
        T.infoTable([
          T.row('When', `<strong>${T.doualaWhen(sessionStart)}</strong> (Douala time)`),
          T.row('Client', `${T.esc(clientName)}<br><a href="mailto:${T.esc(clientEmail)}" style="color:#0F4C81;">${T.esc(clientEmail)}</a>`, true),
        ]) +
        (preSessionNote ? T.p('The client’s note before the session:') + T.quote(T.esc(preSessionNote)) : '') +
        T.p('Open the session in your console and press <strong>Join as host</strong> to start the video room.') +
        T.btn('Open my sessions', joinHref),
        consultantEmail ? 'Sent to you as the consultant for this session.' : 'Sent to the admin inbox because this consultant has no email on file.',
      ),
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
    const expiryFr = new Date(discountExpiry).toLocaleDateString('fr-FR');
    const fr = (await localeForEmail(this.db, clientEmail)) === 'fr';
    const bookingUrl = `${process.env.WEB_URL ?? 'http://localhost:3001'}/consult`;

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        fr ? 'Votre consultation gratuite — 10 % sur votre prochaine séance' : 'How was your free consultation? 10% off your next session',
        fr
          ? T.shell(
              T.greetingFr(T.esc(clientName)) +
              T.label('Merci') +
              T.h1('10 % sur votre prochaine séance') +
              T.p(`Nous espérons que votre consultation gratuite avec <strong>${T.esc(consultantName)}</strong> vous a été utile. Pour vous remercier, voici un code de réduction de 10 % valable jusqu’au <strong>${expiryFr}</strong> :`) +
              T.codeBox(T.esc(discountCode)) +
              T.p('Saisissez-le au moment du paiement de votre prochaine séance.') +
              T.btn('Réserver une séance', bookingUrl),
              T.FOOTER_FR,
            )
          : T.shell(
              T.greeting(T.esc(clientName)) +
              T.label('Thank you') +
              T.h1('10% off your next session') +
              T.p(`We hope your free consultation with <strong>${T.esc(consultantName)}</strong> was helpful. As a thank-you, here is a 10% discount code, valid until <strong>${expiry}</strong>:`) +
              T.codeBox(T.esc(discountCode)) +
              T.p('Enter it when you pay for your next session.') +
              T.btn('Book a session', bookingUrl),
            ),
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
    const fr = (await localeForEmail(this.db, clientEmail)) === 'fr';
    const labelFr = ({ '24 hours': '24 heures', '1 hour': '1 heure' } as Record<string, string>)[timeLabel] ?? timeLabel;
    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        fr ? `Votre consultation commence dans ${labelFr}` : `Your consultation starts in ${timeLabel}`,
        reminderEmail(fr, { name: clientName, consultant: consultantName, start: sessionStart, roomUrl, soon: { en: `in ${timeLabel}`, fr: `dans ${labelFr}` } }),
        clientName,
      ),
      this.notifications.sendWhatsApp(clientPhone, `Hi ${clientName}, your consultation with ${consultantName} starts in ${timeLabel} (${time} WAT). Join: ${roomUrl}`),
    ]);
  }
}
