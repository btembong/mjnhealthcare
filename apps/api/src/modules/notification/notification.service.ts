import { Injectable, Logger } from '@nestjs/common';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly brevoApi: Brevo.TransactionalEmailsApi;

  constructor() {
    this.brevoApi = new Brevo.TransactionalEmailsApi();
    this.brevoApi.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY ?? '',
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    name?: string,
    attachments?: { name: string; content: Buffer | string }[],
  ): Promise<void> {
    try {
      const email = new Brevo.SendSmtpEmail();
      email.sender = {
        email: process.env.BREVO_FROM_EMAIL ?? 'noreply@mjnhealthcare.com',
        name: process.env.BREVO_FROM_NAME ?? 'MJN Healthcare',
      };
      email.to = [{ email: to, name }];
      email.subject = subject;
      email.htmlContent = html;

      if (attachments?.length) {
        email.attachment = attachments.map((a) => ({
          name: a.name,
          content: Buffer.isBuffer(a.content)
            ? a.content.toString('base64')
            : a.content,
        }));
      }

      await this.brevoApi.sendTransacEmail(email);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AfricasTalking = require('africastalking');
      const at = AfricasTalking({
        apiKey: process.env.AT_API_KEY,
        username: process.env.AT_USERNAME,
      });
      await at.SMS.send({ to: [phone], message, from: 'MJNHealth' });
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${phone}: ${err}`);
    }
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      await twilio.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        body,
      });
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp to ${to}: ${err}`);
    }
  }
}
