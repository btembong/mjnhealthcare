import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import * as Brevo from '@getbrevo/brevo';

// Sender identities. The same Brevo-authenticated domain backs all of them,
// so no per-address verification is needed. Keyed emails pick a from-identity;
// unkeyed calls fall back to the general `noreply` sender.
export type SenderKey = 'noreply' | 'security' | 'billing' | 'team';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly brevoApi: Brevo.TransactionalEmailsApi;

  constructor(@Optional() private readonly db?: DatabaseService) {
    this.brevoApi = new Brevo.TransactionalEmailsApi();
    this.brevoApi.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY ?? '',
    );
  }

  private resolveSender(key: SenderKey = 'noreply'): { email: string; name: string } {
    const fallbackEmail = process.env.BREVO_FROM_EMAIL ?? 'noreply@mjnhealthcare.com';
    const fallbackName = process.env.BREVO_FROM_NAME ?? 'MJN Healthcare';
    const map: Record<SenderKey, { email?: string; name?: string }> = {
      noreply: { email: process.env.BREVO_FROM_EMAIL, name: process.env.BREVO_FROM_NAME },
      security: { email: process.env.BREVO_SECURITY_EMAIL, name: process.env.BREVO_SECURITY_NAME },
      billing: { email: process.env.BREVO_BILLING_EMAIL, name: process.env.BREVO_BILLING_NAME },
      team: { email: process.env.BREVO_TEAM_EMAIL, name: process.env.BREVO_TEAM_NAME },
    };
    return {
      email: map[key].email ?? fallbackEmail,
      name: map[key].name ?? fallbackName,
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    name?: string,
    attachments?: { name: string; content: Buffer | string }[],
    sender: SenderKey = 'noreply',
  ): Promise<void> {
    try {
      const email = new Brevo.SendSmtpEmail();
      email.sender = this.resolveSender(sender);
      // Security mail carries no usable reply-to; everything else routes replies
      // to a monitored inbox so "reply to this email" templates actually work.
      if (sender !== 'security') {
        email.replyTo = {
          email: process.env.BREVO_REPLYTO_EMAIL ?? 'hello@mjnhealthcare.com',
        };
      }
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

  /**
   * True when the owner of this number has turned off WhatsApp and SMS copies of case updates.
   * Those updates still reach them by email. Sign-in codes are sent as `essential` and never skipped.
   */
  private async mutedPhone(phone: string): Promise<boolean> {
    if (!this.db || !phone) return false;
    try {
      const person = await this.db.person.findFirst({ where: { phone, whatsappUpdates: false }, select: { id: true } });
      return !!person;
    } catch {
      return false;
    }
  }

  async sendSms(phone: string, message: string, opts?: { essential?: boolean }): Promise<void> {
    if (!opts?.essential && (await this.mutedPhone(phone))) return;
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

  async sendWhatsApp(to: string, body: string, opts?: { essential?: boolean }): Promise<void> {
    if (!opts?.essential && (await this.mutedPhone(to))) return;
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
