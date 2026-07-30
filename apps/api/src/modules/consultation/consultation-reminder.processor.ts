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
  sessionStart: string;
  roomUrl: string;
}

@Processor('consultation-reminders')
export class ConsultationReminderProcessor {
  private readonly logger = new Logger(ConsultationReminderProcessor.name);

  constructor(private readonly notifications: NotificationService) {}

  @Process('consultation-reminder-24h')
  async handle24h(job: Job<ReminderPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    const msg = `Hi ${clientName}, this is a reminder that your MJN Health consultation with ${consultantName} is tomorrow at ${time} WAT. Your join link: ${roomUrl}`;

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'Your MJN Health Consultation — Tomorrow',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>Your consultation with <strong>${consultantName}</strong> is scheduled for <strong>${time} WAT</strong>.</p>
        <p><a href="${roomUrl}" style="background:#0F4C81;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Join Session</a></p>
        <p>If you need to cancel or reschedule, please do so at least 4 hours before to be eligible for a partial refund.</p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(
        clientPhone,
        msg,
      ),
    ]);
    this.logger.log(`24h reminder sent for booking ${job.data.bookingId}`);
  }

  @Process('consultation-reminder-1h')
  async handle1h(job: Job<ReminderPayload>) {
    const { clientName, clientEmail, clientPhone, consultantName, sessionStart, roomUrl } = job.data;
    const time = new Date(sessionStart).toLocaleString('en-GB', { timeZone: 'Africa/Douala', hour12: false });
    const msg = `Hi ${clientName}, your consultation with ${consultantName} starts in 1 hour (${time} WAT). Click to join: ${roomUrl}`;

    await Promise.all([
      this.notifications.sendEmail(
        clientEmail,
        'Your Consultation Starts in 1 Hour',
        `<p>Hi <strong>${clientName}</strong>,</p>
        <p>Your session with <strong>${consultantName}</strong> begins in <strong>1 hour</strong> at ${time} WAT.</p>
        <p><a href="${roomUrl}" style="background:#0F4C81;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Join Now</a></p>`,
        clientName,
      ),
      this.notifications.sendWhatsApp(clientPhone, msg),
    ]);
    this.logger.log(`1h reminder sent for booking ${job.data.bookingId}`);
  }
}
