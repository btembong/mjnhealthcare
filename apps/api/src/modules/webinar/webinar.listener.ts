import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { NotificationService } from '../notification/notification.service';
import { WebinarService } from './webinar.service';
import {
  calendarFile, cancelledEmail, confirmationEmail, movedEmail, reminderEmail, reminderWhatsApp, replayEmail, Seat,
} from './webinar-emails';

/** Every message a registrant gets about a webinar, in the webinar's language. */
@Injectable()
export class WebinarListener {
  private readonly logger = new Logger(WebinarListener.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly mail: NotificationService,
    private readonly webinars: WebinarService,
  ) {}

  private async webinar(id: string) {
    return this.db.webinar.findUnique({ where: { id }, include: { hosts: { include: { person: { select: { name: true } } } } } });
  }

  private seats(webinarId: string) {
    return this.db.webinarRegistration.findMany({ where: { webinarId, status: 'REGISTERED' } });
  }

  /** Sends to everyone, one at a time, so one bad address never stops the rest. */
  private async each<T extends { email: string; name: string }>(rows: T[], send: (row: T) => Promise<void>, label: string) {
    let sent = 0;
    for (const row of rows) {
      try { await send(row); sent++; } catch (err: any) { this.logger.error(`Webinar ${label} to ${row.email} failed: ${err?.message ?? err}`); }
    }
    this.logger.log(`Webinar ${label}: ${sent} of ${rows.length} sent`);
  }

  @OnEvent('webinar.registered')
  async onRegistered(payload: { registrationId: string }) {
    const reg = await this.db.webinarRegistration.findUnique({ where: { id: payload.registrationId } });
    if (!reg) return;
    const w = await this.webinar(reg.webinarId);
    if (!w) return;
    const info = this.webinars.info(w);
    const seat: Seat = { name: reg.name, joinToken: reg.joinToken };
    const { subject, html } = confirmationEmail(info, seat);
    await this.mail.sendEmail(reg.email, subject, html, reg.name, [{ name: 'webinar.ics', content: Buffer.from(calendarFile(info, seat, reg.id), "utf8") }], 'team');
    await this.db.webinarRegistration.update({ where: { id: reg.id }, data: { confirmationSentAt: new Date() } });
  }

  @OnEvent('webinar.reminder')
  async onReminder(payload: { webinarId: string; when: '24h' | '1h' }) {
    const w = await this.webinar(payload.webinarId);
    if (!w) return;
    const info = this.webinars.info(w);
    await this.each(await this.seats(w.id), async (r) => {
      const seat = { name: r.name, joinToken: r.joinToken };
      const { subject, html } = reminderEmail(info, seat, payload.when);
      await this.mail.sendEmail(r.email, subject, html, r.name, undefined, 'team');
      if (payload.when === '1h' && r.phone) await this.mail.sendWhatsApp(r.phone, reminderWhatsApp(info, seat));
    }, `${payload.when} reminder (${w.id})`);
  }

  @OnEvent('webinar.moved')
  async onMoved(payload: { webinarId: string; previous: string }) {
    const w = await this.webinar(payload.webinarId);
    if (!w) return;
    const info = this.webinars.info(w);
    await this.each(await this.seats(w.id), async (r) => {
      const seat = { name: r.name, joinToken: r.joinToken };
      const { subject, html } = movedEmail(info, seat, new Date(payload.previous));
      await this.mail.sendEmail(r.email, subject, html, r.name, [{ name: 'webinar.ics', content: Buffer.from(calendarFile(info, seat, r.id), "utf8") }], 'team');
    }, `new-time notice (${w.id})`);
  }

  @OnEvent('webinar.cancelled')
  async onCancelled(payload: { webinarId: string; reason: string }) {
    const w = await this.webinar(payload.webinarId);
    if (!w) return;
    const info = this.webinars.info(w);
    await this.each(await this.seats(w.id), async (r) => {
      const { subject, html } = cancelledEmail(info, { name: r.name, joinToken: r.joinToken }, payload.reason);
      await this.mail.sendEmail(r.email, subject, html, r.name, undefined, 'team');
    }, `cancellation (${w.id})`);
  }

  /** Everyone registered gets the replay: a thank-you if they came, "sorry we missed you" if not. */
  @OnEvent('webinar.replay_ready')
  async onReplayReady(payload: { webinarId: string }) {
    const w = await this.webinar(payload.webinarId);
    if (!w) return;
    const info = this.webinars.info(w);
    const rows = (await this.seats(w.id)).filter((r) => !r.replaySentAt);
    await this.each(rows, async (r) => {
      const { subject, html } = replayEmail(info, { name: r.name, joinToken: r.joinToken }, !!r.firstJoinedAt);
      await this.mail.sendEmail(r.email, subject, html, r.name, undefined, 'team');
      await this.db.webinarRegistration.update({ where: { id: r.id }, data: { replaySentAt: new Date() } });
    }, `replay (${w.id})`);
  }
}
