import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac, timingSafeEqual } from 'crypto';
import * as Brevo from '@getbrevo/brevo';
import { DatabaseService } from '@mjn/database';
import { CampaignStatus } from '@mjn/database';
import {
  Recurrence, Frequency, isValidTimezone, nextOccurrence, toCronExpression,
} from './campaign-schedule';

export type Contact = { email: string; name?: string | null };

export interface RecurrenceInput {
  frequency: Frequency;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  timeOfDay: string;
  timezone?: string;
  endsAt?: string | null;
  maxRuns?: number | null;
}

export interface CampaignInput {
  name?: string;
  subject?: string;
  body?: string;
  audienceFilter?: Record<string, any>;
  /** ISO instant for a one-off send; null clears the schedule. */
  scheduledAt?: string | null;
  /** Recurring schedule; null clears it. */
  recurrence?: RecurrenceInput | null;
}

const DEFAULT_TIMEZONE = 'Africa/Douala';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CANCEL_CHECK_EVERY = 20;
const ORPHAN_GRACE_MS = 2 * 60 * 1000;

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  private readonly emailCampaignsApi: Brevo.EmailCampaignsApi;
  private readonly transactionalApi: Brevo.TransactionalEmailsApi;

  /** Campaigns this process is currently sending. The API runs as a single instance. */
  private readonly activeSends = new Set<string>();
  private ticking = false;

  constructor(private readonly db: DatabaseService) {
    this.emailCampaignsApi = new Brevo.EmailCampaignsApi();
    this.emailCampaignsApi.setApiKey(
      Brevo.EmailCampaignsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY ?? '',
    );
    this.transactionalApi = new Brevo.TransactionalEmailsApi();
    this.transactionalApi.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY ?? '',
    );
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createCampaign(data: CampaignInput & { name: string; subject: string; body: string; createdById: string }) {
    const schedule = this.buildSchedule(data, new Date());
    return this.db.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        audienceFilter: data.audienceFilter ?? {},
        createdById: data.createdById,
        ...schedule,
      },
    });
  }

  async listCampaigns(status?: CampaignStatus) {
    return this.db.campaign.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 1 } },
    });
  }

  async getCampaign(id: string) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async listRuns(id: string) {
    await this.getCampaign(id);
    return this.db.campaignRun.findMany({
      where: { campaignId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async updateCampaign(id: string, data: CampaignInput) {
    const campaign = await this.getCampaign(id);
    const editable: CampaignStatus[] = [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED];
    if (!editable.includes(campaign.status)) {
      throw new BadRequestException(`Cannot edit a campaign that is ${campaign.status.toLowerCase()}`);
    }

    const update: Record<string, any> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.subject !== undefined) update.subject = data.subject;
    if (data.body !== undefined) update.body = data.body;
    if (data.audienceFilter !== undefined) update.audienceFilter = data.audienceFilter;

    if (data.scheduledAt !== undefined || data.recurrence !== undefined) {
      Object.assign(update, this.buildSchedule(data, new Date()));
      // A paused campaign keeps its new schedule but stays paused until resumed.
      if (campaign.status === CampaignStatus.PAUSED && update.status === CampaignStatus.SCHEDULED) {
        update.status = CampaignStatus.PAUSED;
        update.nextRunAt = null;
      }
    }

    return this.db.campaign.update({ where: { id }, data: update });
  }

  async cancelCampaign(id: string) {
    const campaign = await this.getCampaign(id);
    if (campaign.status === CampaignStatus.SENT) throw new BadRequestException('Campaign has already been sent');
    // A send in progress notices the CANCELLED status and stops.
    return this.db.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED, nextRunAt: null },
    });
  }

  async pauseCampaign(id: string) {
    const { count } = await this.db.campaign.updateMany({
      where: { id, status: CampaignStatus.SCHEDULED },
      data: { status: CampaignStatus.PAUSED, nextRunAt: null },
    });
    if (count === 0) throw new BadRequestException('Only scheduled campaigns can be paused');
    return this.getCampaign(id);
  }

  async resumeCampaign(id: string) {
    const campaign = await this.getCampaign(id);
    if (campaign.status !== CampaignStatus.PAUSED) throw new BadRequestException('Campaign is not paused');

    const now = new Date();
    let nextRunAt: Date | null;
    if (campaign.frequency) {
      nextRunAt = nextOccurrence(this.ruleOf(campaign), now);
      if (!nextRunAt || (campaign.endsAt && nextRunAt > campaign.endsAt)) {
        throw new BadRequestException('This schedule has no remaining send dates — edit it first');
      }
    } else {
      if (!campaign.scheduledAt || campaign.scheduledAt <= now) {
        throw new BadRequestException('The scheduled time has passed — pick a new time or send now');
      }
      nextRunAt = campaign.scheduledAt;
    }
    return this.db.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SCHEDULED, nextRunAt },
    });
  }

  // ── Contact lists ─────────────────────────────────────────────────────────

  async listContactLists() {
    return this.db.contactList.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, contactCount: true, createdAt: true },
    });
  }

  async createContactList(data: { name: string; contacts: any[]; createdById: string }) {
    const contacts = this.cleanContacts(data.contacts);
    if (contacts.length === 0) throw new BadRequestException('No valid email addresses in this list');
    const list = await this.db.contactList.create({
      data: {
        name: data.name,
        contacts: contacts as any,
        contactCount: contacts.length,
        createdById: data.createdById,
      },
    });
    return { id: list.id, name: list.name, contactCount: list.contactCount, createdAt: list.createdAt };
  }

  async deleteContactList(id: string) {
    const inUse = await this.db.campaign.count({
      where: {
        status: { in: [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED, CampaignStatus.SENDING] },
        audienceFilter: { path: ['listId'], equals: id },
      },
    });
    if (inUse > 0) {
      throw new BadRequestException(`This list is used by ${inUse} active campaign${inUse === 1 ? '' : 's'}`);
    }
    await this.db.contactList.deleteMany({ where: { id } });
    return { deleted: true };
  }

  // ── Audience ──────────────────────────────────────────────────────────────

  async countAudience(audienceFilter: Record<string, any>) {
    const contacts = await this.resolveAudience(audienceFilter);
    const unsubscribed = await this.unsubscribedAmong(contacts.map((c) => c.email));
    return {
      total: contacts.length,
      unsubscribed: unsubscribed.size,
      deliverable: contacts.length - unsubscribed.size,
    };
  }

  /** De-duplicated, valid-email recipients for an audience filter. */
  private async resolveAudience(af: any): Promise<Contact[]> {
    let raw: Array<{ email?: string | null; name?: string | null }> = [];
    if (af?.type === 'segment') {
      raw = await this.resolveSegment(af.segment as string);
    } else if (af?.type === 'contact_list' && af.listId) {
      const list = await this.db.contactList.findUnique({ where: { id: af.listId } });
      raw = (list?.contacts as any[]) ?? [];
    } else if (af?.type === 'custom_list' && Array.isArray(af.contacts)) {
      raw = af.contacts; // legacy: contacts embedded in the campaign
    }
    return this.cleanContacts(raw);
  }

  private cleanContacts(raw: any[]): Contact[] {
    const seen = new Set<string>();
    const out: Contact[] = [];
    for (const c of Array.isArray(raw) ? raw : []) {
      const email = String(c?.email ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || seen.has(email)) continue;
      seen.add(email);
      const name = c?.name ? String(c.name).trim() : null;
      out.push({ email, name: name || null });
    }
    return out;
  }

  private async unsubscribedAmong(emails: string[]): Promise<Set<string>> {
    if (emails.length === 0) return new Set();
    const rows = await this.db.emailUnsubscribe.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    return new Set(rows.map((r) => r.email));
  }

  private async resolveSegment(segment: string): Promise<Array<{ email: string | null; name: string | null }>> {
    switch (segment) {
      case 'leads':
        return this.db.lead.findMany({ select: { email: true, name: true } });
      case 'active':
        return this.db.person.findMany({
          where: { engagements: { some: { status: 'ACTIVE' } } },
          select: { email: true, name: true },
        });
      case 'on_hold':
        return this.db.person.findMany({
          where: { engagements: { some: { status: 'ON_HOLD' } } },
          select: { email: true, name: true },
        });
      case 'completed':
        return this.db.person.findMany({
          where: { engagements: { some: { status: 'COMPLETED' } } },
          select: { email: true, name: true },
        });
      case 'all_candidates':
        return this.db.person.findMany({ select: { email: true, name: true } });
      default:
        this.logger.warn(`Unknown segment: ${segment}`);
        return [];
    }
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  /** Starts the send in the background and returns the campaign in SENDING state. */
  async sendNow(id: string) {
    const campaign = await this.getCampaign(id);
    const af = campaign.audienceFilter as any;
    const hasAudience = ['segment', 'contact_list', 'custom_list'].includes(af?.type);

    if (!hasAudience && campaign.brevoId) {
      return this.sendLegacyBrevoCampaign(campaign.id, campaign.brevoId);
    }
    if (!hasAudience) throw new BadRequestException('Choose an audience before sending');

    const { count } = await this.db.campaign.updateMany({
      where: { id, status: { in: [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED] } },
      data: { status: CampaignStatus.SENDING },
    });
    if (count === 0) {
      throw new BadRequestException(`Cannot send a campaign that is ${campaign.status.toLowerCase()}`);
    }

    void this.dispatch(id, 'manual');
    return this.getCampaign(id);
  }

  async sendTest(id: string, toEmail: string) {
    const email = String(toEmail ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new BadRequestException('Enter a valid email address');
    const campaign = await this.getCampaign(id);
    try {
      await this.sendOne(campaign, { email, name: 'Test Recipient' }, true);
    } catch (err: any) {
      throw new BadRequestException(`Test email failed: ${err?.message ?? err}`);
    }
    return { sentTo: email };
  }

  /** Test send for content that has not been saved as a campaign yet. */
  async sendTestContent(content: { subject: string; body: string }, toEmail: string) {
    const email = String(toEmail ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new BadRequestException('Enter a valid email address');
    try {
      await this.sendOne({ id: '', ...content }, { email, name: 'Test Recipient' }, true);
    } catch (err: any) {
      throw new BadRequestException(`Test email failed: ${err?.message ?? err}`);
    }
    return { sentTo: email };
  }

  /** Validates a recurring schedule and reports when it would first send. */
  previewSchedule(recurrence: RecurrenceInput) {
    const schedule = this.buildSchedule({ recurrence }, new Date());
    return {
      nextRunAt: schedule.nextRunAt,
      cronExpression: schedule.cronExpression,
      timezone: recurrence.timezone ?? DEFAULT_TIMEZONE,
    };
  }

  private async sendLegacyBrevoCampaign(id: string, brevoId: number) {
    try {
      await this.emailCampaignsApi.sendEmailCampaignNow(brevoId);
    } catch (err) {
      this.logger.error(`Failed to send Brevo campaign ${brevoId}: ${err}`);
      throw new BadRequestException('Failed to send via Brevo: ' + err);
    }
    return this.db.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SENT, sentAt: new Date(), nextRunAt: null },
    });
  }

  /** Sends one occurrence of a campaign already claimed as SENDING. Never throws. */
  private async dispatch(campaignId: string, trigger: 'manual' | 'schedule') {
    this.activeSends.add(campaignId);
    let runId: string | null = null;
    let sent = 0, failed = 0, skipped = 0, total = 0;
    let completed = false;

    try {
      const campaign = await this.getCampaign(campaignId);
      const run = await this.db.campaignRun.create({ data: { campaignId, trigger } });
      runId = run.id;

      const contacts = await this.resolveAudience(campaign.audienceFilter);
      const unsubscribed = await this.unsubscribedAmong(contacts.map((c) => c.email));
      total = contacts.length;
      await this.db.campaignRun.update({ where: { id: run.id }, data: { recipientCount: total } });

      let cancelled = false;
      for (let i = 0; i < contacts.length; i++) {
        if (i > 0 && i % CANCEL_CHECK_EVERY === 0) {
          const current = await this.db.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
          if (current?.status !== CampaignStatus.SENDING) { cancelled = true; break; }
          await this.db.campaignRun.update({
            where: { id: run.id },
            data: { sentCount: sent, failedCount: failed, skippedCount: skipped },
          });
        }
        const contact = contacts[i];
        if (unsubscribed.has(contact.email)) { skipped++; continue; }
        try {
          await this.sendOne(campaign, contact, false);
          sent++;
        } catch (err) {
          failed++;
          this.logger.warn(`Campaign "${campaign.name}": failed to send to ${contact.email}: ${err}`);
        }
      }
      completed = !cancelled;
      this.logger.log(
        `Campaign "${campaign.name}" (${trigger}): sent ${sent}/${total}, failed ${failed}, unsubscribed ${skipped}` +
        (cancelled ? ' — stopped early (cancelled)' : ''),
      );
    } catch (err) {
      this.logger.error(`Campaign ${campaignId} send aborted: ${err}`);
    } finally {
      try {
        if (runId) {
          await this.db.campaignRun.update({
            where: { id: runId },
            data: {
              status: completed ? 'COMPLETED' : 'INTERRUPTED',
              sentCount: sent, failedCount: failed, skippedCount: skipped,
              finishedAt: new Date(),
            },
          });
        }
        await this.finishOccurrence(campaignId);
      } catch (err) {
        this.logger.error(`Campaign ${campaignId}: failed to record send result: ${err}`);
      }
      this.activeSends.delete(campaignId);
    }
  }

  /** Moves a SENDING campaign to its next state: rescheduled if recurring, otherwise SENT. */
  private async finishOccurrence(campaignId: string) {
    const campaign = await this.db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== CampaignStatus.SENDING) return; // cancelled mid-send

    const now = new Date();
    const runCount = campaign.runCount + 1;
    let next: Date | null = null;
    if (campaign.frequency) {
      next = nextOccurrence(this.ruleOf(campaign), now);
      if (campaign.maxRuns && runCount >= campaign.maxRuns) next = null;
      if (next && campaign.endsAt && next > campaign.endsAt) next = null;
    }

    await this.db.campaign.updateMany({
      where: { id: campaignId, status: CampaignStatus.SENDING },
      data: next
        ? { status: CampaignStatus.SCHEDULED, nextRunAt: next, runCount, lastRunAt: now }
        : { status: CampaignStatus.SENT, nextRunAt: null, runCount, lastRunAt: now, sentAt: now },
    });
  }

  private async sendOne(
    campaign: { id: string; subject: string; body: string },
    contact: Contact,
    isTest: boolean,
  ) {
    const unsubscribeUrl = this.unsubscribeUrl(contact.email, campaign.id);
    const name = contact.name?.trim() || 'there';
    const personalise = (text: string, value: string) => text.replace(/\{\{\s*name\s*\}\}/gi, value);

    const isHtml = /<[a-z][\s\S]*>/i.test(campaign.body);
    const content = isHtml
      ? personalise(campaign.body, escapeHtml(name))
      : personalise(escapeHtml(campaign.body), escapeHtml(name)).replace(/\r?\n/g, '<br>');

    const footer =
      `<p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">` +
      `You are receiving this email from MJN Healthcare. ` +
      `<a href="${unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a></p>`;

    await this.transactionalApi.sendTransacEmail({
      to: [{ email: contact.email, name: contact.name ?? contact.email }],
      subject: (isTest ? '[TEST] ' : '') + personalise(campaign.subject, name),
      htmlContent: content + footer,
      sender: {
        email: process.env.BREVO_FROM_EMAIL ?? 'hello@mjnhealth.com',
        name: process.env.BREVO_FROM_NAME ?? 'MJN Healthcare',
      },
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    } as any);
  }

  // ── Scheduler ─────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduler() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.recoverOrphanedSends();

      // Campaigns with a brevoId were scheduled inside Brevo before this scheduler existed.
      const due = await this.db.campaign.findMany({
        where: { status: CampaignStatus.SCHEDULED, nextRunAt: { lte: new Date() }, brevoId: null },
        orderBy: { nextRunAt: 'asc' },
        take: 10,
      });
      for (const campaign of due) {
        // Claim atomically so a campaign can never be picked up twice.
        const { count } = await this.db.campaign.updateMany({
          where: { id: campaign.id, status: CampaignStatus.SCHEDULED, nextRunAt: campaign.nextRunAt },
          data: { status: CampaignStatus.SENDING },
        });
        if (count === 1) void this.dispatch(campaign.id, 'schedule');
      }
    } catch (err) {
      this.logger.error(`Campaign scheduler tick failed: ${err}`);
    } finally {
      this.ticking = false;
    }
  }

  /** A restart mid-send leaves a campaign in SENDING. Close it out without re-sending. */
  private async recoverOrphanedSends() {
    const stuck = await this.db.campaign.findMany({
      where: { status: CampaignStatus.SENDING, updatedAt: { lt: new Date(Date.now() - ORPHAN_GRACE_MS) } },
      select: { id: true, name: true },
    });
    for (const campaign of stuck) {
      if (this.activeSends.has(campaign.id)) continue;
      this.logger.warn(`Campaign "${campaign.name}" was interrupted mid-send; not re-sending`);
      await this.db.campaignRun.updateMany({
        where: { campaignId: campaign.id, status: 'RUNNING' },
        data: { status: 'INTERRUPTED', finishedAt: new Date() },
      });
      await this.finishOccurrence(campaign.id);
    }
  }

  // ── Unsubscribe ───────────────────────────────────────────────────────────

  private unsubscribeToken(email: string): string {
    const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.JWT_SECRET ?? '';
    return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 40);
  }

  private unsubscribeUrl(email: string, campaignId: string): string {
    const base = process.env.API_URL ?? 'http://localhost:3000';
    const e = Buffer.from(email.toLowerCase()).toString('base64url');
    return `${base}/api/v1/email/unsubscribe?e=${e}&t=${this.unsubscribeToken(email)}&c=${campaignId}`;
  }

  /** Returns the email if the link is genuine, otherwise null. */
  verifyUnsubscribeLink(encodedEmail: string, token: string): string | null {
    let email: string;
    try {
      email = Buffer.from(String(encodedEmail ?? ''), 'base64url').toString('utf8').toLowerCase();
    } catch {
      return null;
    }
    if (!EMAIL_RE.test(email)) return null;
    const expected = Buffer.from(this.unsubscribeToken(email));
    const given = Buffer.from(String(token ?? ''));
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    return email;
  }

  async unsubscribe(email: string, campaignId?: string) {
    await this.db.emailUnsubscribe.upsert({
      where: { email },
      create: { email, campaignId: campaignId || null },
      update: {},
    });
  }

  // ── Schedule helpers ──────────────────────────────────────────────────────

  private ruleOf(campaign: {
    frequency: Frequency | null; daysOfWeek: number[]; dayOfMonth: number | null;
    timeOfDay: string | null; timezone: string;
  }): Recurrence {
    return {
      frequency: campaign.frequency as Frequency,
      daysOfWeek: campaign.daysOfWeek,
      dayOfMonth: campaign.dayOfMonth,
      timeOfDay: campaign.timeOfDay ?? '09:00',
      timezone: campaign.timezone,
    };
  }

  /** Derives status and all scheduling columns from the requested schedule. */
  private buildSchedule(input: CampaignInput, now: Date) {
    const cleared = {
      frequency: null, daysOfWeek: [] as number[], dayOfMonth: null, timeOfDay: null,
      cronExpression: null, endsAt: null, maxRuns: null,
    };

    if (input.recurrence) {
      const r = input.recurrence;
      const timezone = r.timezone ?? DEFAULT_TIMEZONE;
      if (!isValidTimezone(timezone)) throw new BadRequestException(`Unknown timezone: ${timezone}`);
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(r.timeOfDay ?? '')) {
        throw new BadRequestException('Time must be in HH:mm format');
      }
      const daysOfWeek = [...new Set(r.daysOfWeek ?? [])].sort((a, b) => a - b);
      if (r.frequency === 'WEEKLY' && daysOfWeek.length === 0) {
        throw new BadRequestException('Pick at least one day of the week');
      }
      if (r.frequency === 'MONTHLY' && !r.dayOfMonth) {
        throw new BadRequestException('Pick a day of the month');
      }
      const rule: Recurrence = {
        frequency: r.frequency,
        daysOfWeek: r.frequency === 'WEEKLY' ? daysOfWeek : [],
        dayOfMonth: r.frequency === 'MONTHLY' ? r.dayOfMonth : null,
        timeOfDay: r.timeOfDay,
        timezone,
      };
      const endsAt = r.endsAt ? new Date(r.endsAt) : null;
      const nextRunAt = nextOccurrence(rule, now);
      if (!nextRunAt || (endsAt && nextRunAt > endsAt)) {
        throw new BadRequestException('This schedule ends before its first send');
      }
      return {
        status: CampaignStatus.SCHEDULED,
        scheduledAt: null,
        nextRunAt,
        frequency: rule.frequency,
        daysOfWeek: rule.daysOfWeek,
        dayOfMonth: rule.dayOfMonth ?? null,
        timeOfDay: rule.timeOfDay,
        timezone,
        cronExpression: toCronExpression(rule),
        endsAt,
        maxRuns: r.maxRuns ?? null,
      };
    }

    if (input.scheduledAt) {
      const scheduledAt = new Date(input.scheduledAt);
      if (scheduledAt.getTime() <= now.getTime()) {
        throw new BadRequestException('Scheduled time must be in the future');
      }
      return { status: CampaignStatus.SCHEDULED, scheduledAt, nextRunAt: scheduledAt, ...cleared };
    }

    return { status: CampaignStatus.DRAFT, scheduledAt: null, nextRunAt: null, ...cleared };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
