import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomBytes } from 'crypto';
import { DatabaseService } from '@mjn/database';
import { DailyCoService } from '../consultation/daily-co.service';
import { calendarFile, WebinarInfo } from './webinar-emails';

export const WEBINAR_QUEUE = 'webinar-jobs';

/** Viewers may enter this long before the start. */
const OPENS_BEFORE_MIN = 15;
/** Hosts may enter this long before the start, to prepare. */
const HOST_OPENS_BEFORE_MIN = 120;
/** After the planned end, the room stays open this long for overruns. */
const OVERRUN_MIN = 90;
/** The recording is looked for every 10 minutes, this many times, after the webinar ends. */
const RECORDING_CHECKS = 12;
const MAX_CAPACITY = 150;

type Actor = { id: string; role?: string };
export type WebinarInput = {
  title?: string; description?: string; language?: 'en' | 'fr'; topic?: string | null;
  startAt?: string; durationMinutes?: number; capacity?: number; hostIds?: string[];
};
export type RegistrationInput = {
  name?: string; email?: string; phone?: string; profession?: string; destination?: string;
  question?: string; marketingConsent?: boolean; source?: string;
};

const isAdmin = (a: Actor) => (a.role ?? '').toUpperCase() === 'ADMIN';
const clean = (v: unknown, max: number) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function slugify(title: string) {
  const base = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${base || 'webinar'}-${randomBytes(3).toString('hex')}`;
}

@Injectable()
export class WebinarService {
  private readonly logger = new Logger(WebinarService.name);
  private readonly replayLinks = new Map<string, { url: string; expiresAt: Date }>();

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly daily: DailyCoService,
    @InjectQueue(WEBINAR_QUEUE) private readonly queue: Queue,
  ) {}

  // ── Shared ──────────────────────────────────────────────────────────────────

  private readonly include = {
    hosts: { include: { person: { select: { id: true, name: true, email: true } } } },
    _count: { select: { registrations: { where: { status: 'REGISTERED' } } } },
  } as const;

  /** What emails and calendar files need about a webinar. */
  info(w: any): WebinarInfo {
    return {
      title: w.title, slug: w.slug, startAt: w.startAt, durationMinutes: w.durationMinutes, language: w.language,
      hosts: (w.hosts ?? []).map((h: any) => h.person?.name).filter(Boolean),
    };
  }

  private closesAt(w: { startAt: Date; durationMinutes: number }) {
    return new Date(w.startAt.getTime() + (w.durationMinutes + OVERRUN_MIN) * 60000);
  }

  /** Over for viewers: ended, or long past its time without anyone pressing End. */
  private isOver(w: { status: string; startAt: Date; durationMinutes: number }) {
    return w.status === 'ENDED' || Date.now() > this.closesAt(w).getTime();
  }

  private async load(id: string) {
    const w = await this.db.webinar.findUnique({ where: { id }, include: this.include });
    if (!w) throw new NotFoundException('That webinar no longer exists.');
    return w;
  }

  /** Admins manage every webinar; a consultant manages the ones they host or created. */
  private async manageable(actor: Actor, id: string) {
    const w = await this.load(id);
    if (!isAdmin(actor) && w.createdById !== actor.id && !w.hosts.some((h) => h.personId === actor.id)) {
      throw new ForbiddenException('Only an admin or a host of this webinar can change it.');
    }
    return w;
  }

  private async validHosts(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) throw new BadRequestException('Choose at least one host.');
    const staff = await this.db.person.findMany({ where: { id: { in: unique }, role: { in: ['ADMIN', 'CONSULTANT'] as any } }, select: { id: true } });
    if (staff.length !== unique.length) throw new BadRequestException('Hosts must be admins or consultants.');
    return unique;
  }

  private checked(input: WebinarInput, partial: boolean) {
    const out: Record<string, any> = {};
    if (!partial || input.title !== undefined) {
      out.title = clean(input.title, 150);
      if (out.title.length < 5) throw new BadRequestException('Give the webinar a title.');
    }
    if (!partial || input.description !== undefined) {
      out.description = String(input.description ?? '').trim().slice(0, 4000);
      if (out.description.length < 20) throw new BadRequestException('Describe the webinar in a few sentences.');
    }
    if (!partial || input.language !== undefined) {
      if (input.language !== 'en' && input.language !== 'fr') throw new BadRequestException('Choose English or French.');
      out.language = input.language;
    }
    if (input.topic !== undefined) out.topic = clean(input.topic, 60) || null;
    if (!partial || input.startAt !== undefined) {
      const at = new Date(String(input.startAt));
      if (Number.isNaN(at.getTime())) throw new BadRequestException('Choose the date and time.');
      out.startAt = at;
    }
    if (!partial || input.durationMinutes !== undefined) {
      const d = Number(input.durationMinutes ?? 60);
      if (!Number.isInteger(d) || d < 15 || d > 240) throw new BadRequestException('Length must be between 15 and 240 minutes.');
      out.durationMinutes = d;
    }
    if (!partial || input.capacity !== undefined) {
      const c = Number(input.capacity ?? 100);
      if (!Number.isInteger(c) || c < 1 || c > MAX_CAPACITY) throw new BadRequestException(`Seats must be between 1 and ${MAX_CAPACITY}.`);
      out.capacity = c;
    }
    return out;
  }

  private present(w: any, now = Date.now()) {
    return {
      id: w.id, slug: w.slug, title: w.title, description: w.description, language: w.language, topic: w.topic,
      startAt: w.startAt, durationMinutes: w.durationMinutes, capacity: w.capacity, status: w.status,
      startedAt: w.startedAt, endedAt: w.endedAt, cancelReason: w.cancelReason,
      recordingStatus: w.recordingStatus, replayReadyAt: w.replayReadyAt,
      registered: w._count?.registrations ?? 0,
      hosts: (w.hosts ?? []).map((h: any) => ({ id: h.personId, name: h.person?.name ?? h.person?.email ?? 'Staff' })),
      createdById: w.createdById,
      over: this.isOver(w) && w.status !== 'CANCELLED' && w.status !== 'DRAFT',
      hostOpen: ['PUBLISHED', 'LIVE'].includes(w.status) && now >= w.startAt.getTime() - HOST_OPENS_BEFORE_MIN * 60000 && now <= this.closesAt(w).getTime(),
    };
  }

  // ── Staff: list, create, edit ───────────────────────────────────────────────

  async list() {
    const rows = await this.db.webinar.findMany({ include: this.include, orderBy: { startAt: 'desc' } });
    const attended = await this.db.webinarRegistration.groupBy({ by: ['webinarId'], where: { firstJoinedAt: { not: null } }, _count: { _all: true } });
    const seen = new Map(attended.map((a) => [a.webinarId, a._count._all]));
    return rows.map((w) => ({ ...this.present(w), attended: seen.get(w.id) ?? 0 }));
  }

  async detail(id: string) {
    const w = await this.load(id);
    const regs = await this.db.webinarRegistration.findMany({ where: { webinarId: id }, orderBy: { createdAt: 'desc' } });
    const active = regs.filter((r) => r.status === 'REGISTERED');
    const came = active.filter((r) => r.firstJoinedAt);
    return {
      ...this.present(w),
      publicUrl: `${process.env.WEB_URL ?? 'http://localhost:3001'}/webinars/${w.slug}`,
      stats: {
        registered: active.length,
        attended: came.length,
        showRate: active.length ? Math.round((came.length / active.length) * 100) : 0,
        averageMinutes: came.length ? Math.round(came.reduce((s, r) => s + r.minutesWatched, 0) / came.length) : 0,
        cancelled: regs.length - active.length,
        newLeads: active.filter((r) => r.leadId && !r.personId).length,
      },
      registrations: regs.map((r) => ({
        id: r.id, name: r.name, email: r.email, phone: r.phone, profession: r.profession, destination: r.destination,
        question: r.question, marketingConsent: r.marketingConsent, status: r.status, createdAt: r.createdAt,
        attended: !!r.firstJoinedAt, minutesWatched: r.minutesWatched, leadId: r.leadId, personId: r.personId, source: r.source,
      })),
    };
  }

  /** Staff who can host: admins and consultants. */
  hostChoices() {
    return this.db.person.findMany({ where: { role: { in: ['ADMIN', 'CONSULTANT'] as any } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
  }

  async create(actor: Actor, input: WebinarInput) {
    const data = this.checked(input, false);
    // A consultant always hosts what they create.
    const hostIds = await this.validHosts([...(input.hostIds ?? []), ...(isAdmin(actor) ? [] : [actor.id])]);
    const w = await this.db.webinar.create({
      data: { ...(data as any), slug: slugify(data.title), createdById: actor.id, hosts: { create: hostIds.map((personId) => ({ personId })) } },
      include: this.include,
    });
    await this.log(actor, w.id, 'webinar.created', { title: w.title });
    return this.present(w);
  }

  async update(actor: Actor, id: string, input: WebinarInput) {
    const w = await this.manageable(actor, id);
    if (!['DRAFT', 'PUBLISHED'].includes(w.status)) throw new BadRequestException('A webinar that has started, ended or been cancelled can no longer be changed.');
    const data = this.checked(input, true);
    if (data.capacity !== undefined && data.capacity < (w._count?.registrations ?? 0)) {
      throw new BadRequestException(`${w._count?.registrations} people are already registered; seats cannot go below that.`);
    }
    if (w.status === 'PUBLISHED' && data.startAt && data.startAt.getTime() < Date.now()) throw new BadRequestException('Choose a time in the future.');
    if (w.status === 'PUBLISHED' && data.language && data.language !== w.language) throw new BadRequestException('The language cannot change once people have registered in it. Cancel this webinar and create one in the other language.');
    const hostIds = input.hostIds ? await this.validHosts(input.hostIds) : null;

    const updated = await this.db.$transaction(async (tx) => {
      if (hostIds) {
        await tx.webinarHost.deleteMany({ where: { webinarId: id } });
        await tx.webinarHost.createMany({ data: hostIds.map((personId) => ({ webinarId: id, personId })) });
      }
      return tx.webinar.update({ where: { id }, data: data as any, include: this.include });
    });

    const moved = w.status === 'PUBLISHED' && data.startAt && data.startAt.getTime() !== w.startAt.getTime();
    if (w.status === 'PUBLISHED' && (moved || data.durationMinutes || data.capacity)) await this.prepareRoom(updated);
    if (moved) {
      await this.scheduleReminders(updated);
      this.events.emit('webinar.moved', { webinarId: id, previous: w.startAt.toISOString() });
    }
    await this.log(actor, id, 'webinar.updated', { moved: !!moved });
    return { ...this.present(updated), message: moved ? 'Saved. Everyone registered has been emailed the new time.' : 'Saved.' };
  }

  async publish(actor: Actor, id: string) {
    const w = await this.manageable(actor, id);
    if (w.status !== 'DRAFT') throw new BadRequestException('Only a draft can be published.');
    if (w.startAt.getTime() < Date.now() + 30 * 60000) throw new BadRequestException('Set a start time at least 30 minutes from now.');
    if (w.hosts.length === 0) throw new BadRequestException('Add at least one host.');
    await this.prepareRoom(w);
    const published = await this.db.webinar.update({ where: { id }, data: { status: 'PUBLISHED' }, include: this.include });
    await this.scheduleReminders(published);
    await this.log(actor, id, 'webinar.published', {});
    return { ...this.present(published), message: 'Published. The webinar is on the website and open for registration.' };
  }

  async cancel(actor: Actor, id: string, reason: string) {
    const w = await this.manageable(actor, id);
    if (!['DRAFT', 'PUBLISHED'].includes(w.status)) throw new BadRequestException('Only a webinar that has not started can be cancelled.');
    const why = clean(reason, 500);
    if (w.status === 'PUBLISHED' && why.length < 3) throw new BadRequestException('Give a reason. Everyone registered is told.');
    await this.db.webinar.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: why || null } });
    if (w.status === 'PUBLISHED') this.events.emit('webinar.cancelled', { webinarId: id, reason: why });
    await this.log(actor, id, 'webinar.cancelled', { reason: why });
    return { message: w.status === 'PUBLISHED' ? 'Cancelled. Everyone registered has been emailed.' : 'Draft cancelled.' };
  }

  // ── Staff: running it ───────────────────────────────────────────────────────

  /** A host's pass into the room. Opens two hours before the start. */
  async hostPass(actor: Actor, id: string) {
    const w = await this.manageable(actor, id);
    const view = this.present(w);
    if (!view.hostOpen) {
      throw new BadRequestException(w.status === 'ENDED' ? 'This webinar has ended.' : `The room opens ${HOST_OPENS_BEFORE_MIN / 60} hours before the start.`);
    }
    if (!w.roomName || !w.roomUrl) await this.prepareRoom(w);
    const fresh = await this.load(id);
    const me = await this.db.person.findUnique({ where: { id: actor.id }, select: { name: true, email: true } });
    const token = await this.daily.webinarToken(fresh.roomName!, { host: true, userName: me?.name ?? me?.email ?? 'Host', expiresAt: this.closesAt(fresh) });
    await this.log(actor, id, 'webinar.host_joined', {});
    return { roomUrl: fresh.roomUrl, token, status: fresh.status };
  }

  async start(actor: Actor, id: string) {
    const w = await this.manageable(actor, id);
    if (w.status !== 'PUBLISHED') throw new BadRequestException(w.status === 'LIVE' ? 'It is already live.' : 'Only a published webinar can go live.');
    const updated = await this.db.webinar.update({ where: { id }, data: { status: 'LIVE', startedAt: new Date() }, include: this.include });
    await this.log(actor, id, 'webinar.started', {});
    return { ...this.present(updated), message: 'You are live.' };
  }

  async end(actor: Actor, id: string) {
    const w = await this.manageable(actor, id);
    if (!['LIVE', 'PUBLISHED'].includes(w.status)) throw new BadRequestException('This webinar is not running.');
    const updated = await this.db.webinar.update({ where: { id }, data: { status: 'ENDED', endedAt: new Date(), recordingStatus: 'WAITING' }, include: this.include });
    await this.queue.add('recording', { webinarId: id, attempt: 1 }, { delay: 5 * 60000, jobId: `webinar:${id}:recording:1`, removeOnComplete: true, removeOnFail: true });
    await this.log(actor, id, 'webinar.ended', {});
    return { ...this.present(updated), message: 'Webinar ended. When the recording is ready, the replay goes online and registrants are emailed.' };
  }

  /** Looks for the recording; once found, the replay goes public and registrants are emailed. */
  async checkRecording(id: string, attempt = 0) {
    const w = await this.load(id);
    if (w.recordingStatus === 'READY' || !w.roomName) return { status: w.recordingStatus ?? 'NONE' };
    const found = await this.daily.finishedRecording(w.roomName);
    if (found && found.duration >= 60) {
      await this.db.webinar.update({ where: { id }, data: { recordingId: found.id, recordingStatus: 'READY', replayReadyAt: new Date() } });
      this.events.emit('webinar.replay_ready', { webinarId: id });
      return { status: 'READY' };
    }
    if (attempt > 0 && attempt < RECORDING_CHECKS) {
      await this.queue.add('recording', { webinarId: id, attempt: attempt + 1 }, { delay: 10 * 60000, jobId: `webinar:${id}:recording:${attempt + 1}`, removeOnComplete: true, removeOnFail: true });
      return { status: 'WAITING' };
    }
    if (attempt >= RECORDING_CHECKS) await this.db.webinar.update({ where: { id }, data: { recordingStatus: 'NONE' } });
    return { status: attempt >= RECORDING_CHECKS ? 'NONE' : 'WAITING' };
  }

  async checkRecordingNow(actor: Actor, id: string) {
    const w = await this.manageable(actor, id);
    if (w.status !== 'ENDED') throw new BadRequestException('The recording is looked for after the webinar ends.');
    const result = await this.checkRecording(id, 0);
    return { ...result, message: result.status === 'READY' ? 'The recording is ready. The replay is online and registrants are being emailed.' : 'No finished recording yet. Daily usually needs a few minutes after the end.' };
  }

  async exportCsv(id: string) {
    const d = await this.detail(id);
    const cell = (v: unknown) => {
      const text = String(v ?? '');
      return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
    };
    const header = ['Name', 'Email', 'Phone', 'Profession', 'Destination', 'Registered', 'Status', 'Attended', 'Minutes watched', 'Question', 'Marketing consent', 'Source'];
    const body = d.registrations.map((r) => [
      r.name, r.email, r.phone ?? '', r.profession ?? '', r.destination ?? '', r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      r.status === 'REGISTERED' ? 'Registered' : 'Cancelled', r.attended ? 'Yes' : 'No', r.minutesWatched, r.question ?? '', r.marketingConsent ? 'Yes' : 'No', r.source ?? '',
    ].map(cell).join(','));
    return [header.map(cell).join(','), ...body].join('\n');
  }

  // ── Public ──────────────────────────────────────────────────────────────────

  private publicView(w: any) {
    const p = this.present(w);
    return {
      slug: p.slug, title: p.title, description: p.description, language: p.language, topic: p.topic,
      startAt: p.startAt, durationMinutes: p.durationMinutes, status: p.over ? 'ENDED' : p.status,
      seatsLeft: Math.max(0, p.capacity - p.registered), hosts: p.hosts.map((h: { name: string }) => h.name),
      hasReplay: w.recordingStatus === 'READY',
    };
  }

  async listPublic(language?: string) {
    const lang = language === 'fr' || language === 'en' ? language : undefined;
    const rows = await this.db.webinar.findMany({
      where: { status: { in: ['PUBLISHED', 'LIVE', 'ENDED'] }, ...(lang ? { language: lang } : {}) },
      include: this.include,
      orderBy: { startAt: 'asc' },
    });
    const all = rows.map((w) => this.publicView(w));
    return {
      upcoming: all.filter((w) => w.status !== 'ENDED'),
      replays: all.filter((w) => w.status === 'ENDED' && w.hasReplay).reverse(),
    };
  }

  async getPublic(slug: string) {
    const w = await this.db.webinar.findUnique({ where: { slug }, include: this.include });
    if (!w || w.status === 'DRAFT') throw new NotFoundException('Webinar not found.');
    return { ...this.publicView(w), cancelled: w.status === 'CANCELLED' };
  }

  /** Saves a seat. Registering twice with the same email keeps one seat and sends the link again. */
  async register(slug: string, input: RegistrationInput) {
    const w = await this.db.webinar.findUnique({ where: { slug }, include: this.include });
    if (!w || !['PUBLISHED', 'LIVE'].includes(w.status) || this.isOver(w)) throw new BadRequestException('Registration for this webinar is closed.');
    const name = clean(input.name, 100);
    const email = clean(input.email, 200).toLowerCase();
    if (name.length < 2) throw new BadRequestException(w.language === 'fr' ? 'Indiquez votre nom.' : 'Enter your name.');
    if (!EMAIL.test(email)) throw new BadRequestException(w.language === 'fr' ? 'Indiquez une adresse e-mail valide.' : 'Enter a valid email address.');
    const phone = clean(input.phone, 30).replace(/[^\d+]/g, '') || null;

    const existing = await this.db.webinarRegistration.findUnique({ where: { webinarId_email: { webinarId: w.id, email } } });
    if (existing) {
      if (existing.status !== 'REGISTERED') {
        if ((w._count?.registrations ?? 0) >= w.capacity) throw new ConflictException(w.language === 'fr' ? 'Ce webinaire est complet.' : 'This webinar is full.');
        await this.db.webinarRegistration.update({ where: { id: existing.id }, data: { status: 'REGISTERED' } });
      }
      // The link is sent again, at most every two minutes.
      if (!existing.confirmationSentAt || Date.now() - existing.confirmationSentAt.getTime() > 120000) {
        this.events.emit('webinar.registered', { registrationId: existing.id });
      }
      return { registered: true, already: true };
    }
    if ((w._count?.registrations ?? 0) >= w.capacity) throw new ConflictException(w.language === 'fr' ? 'Ce webinaire est complet.' : 'This webinar is full.');

    const { leadId, personId } = await this.linkPerson(w, { name, email, phone, profession: clean(input.profession, 60), destination: clean(input.destination, 60) });
    try {
      const reg = await this.db.webinarRegistration.create({
        data: {
          webinarId: w.id, name, email, phone,
          profession: clean(input.profession, 60) || null,
          destination: clean(input.destination, 60) || null,
          question: String(input.question ?? '').trim().slice(0, 500) || null,
          marketingConsent: input.marketingConsent === true,
          source: clean(input.source, 60) || null,
          joinToken: randomBytes(24).toString('base64url'),
          leadId, personId,
        },
      });
      this.events.emit('webinar.registered', { registrationId: reg.id });
      // The new registrant sees their own link at once, as on other webinar platforms. A repeat
      // registration never returns it, so typing someone else's email cannot reveal their link.
      return { registered: true, already: false, token: reg.joinToken };
    } catch (err: any) {
      // Two submissions at once: the first one won.
      if (err?.code === 'P2002') return { registered: true, already: true };
      throw err;
    }
  }

  /**
   * Each registrant is tied to their account if they have one, or to a lead. New leads are made
   * quietly: the registration email is the only message they get.
   */
  private async linkPerson(w: any, p: { name: string; email: string; phone: string | null; profession: string; destination: string }) {
    const person = await this.db.person.findFirst({ where: { email: { equals: p.email, mode: 'insensitive' } }, select: { id: true } });
    if (person) return { personId: person.id, leadId: null };
    const line = `Registered for webinar "${w.title}" (${w.startAt.toISOString().slice(0, 10)})`;
    const lead = await this.db.lead.findFirst({ where: { email: { equals: p.email, mode: 'insensitive' } }, orderBy: { createdAt: 'desc' } });
    if (lead) {
      await this.db.lead.update({
        where: { id: lead.id },
        data: {
          phone: lead.phone ?? p.phone, profession: lead.profession ?? (p.profession || null), destination: lead.destination ?? (p.destination || null),
          notes: lead.notes ? `${line}\n${lead.notes}`.slice(0, 4000) : line,
        },
      });
      return { personId: null, leadId: lead.id };
    }
    const created = await this.db.lead.create({
      data: {
        name: p.name, email: p.email, phone: p.phone, profession: p.profession || null, destination: p.destination || null,
        serviceInterest: w.topic ?? 'Webinar', notes: line, source: 'webinar',
      },
    });
    return { personId: null, leadId: created.id };
  }

  private async seat(token: string) {
    const reg = await this.db.webinarRegistration.findUnique({ where: { joinToken: String(token ?? '') }, include: { webinar: { include: this.include } } });
    if (!reg) throw new NotFoundException('This link is not valid. Check the email you received when you registered.');
    return reg;
  }

  /** What the personal join page shows: wait, join, replay, or cancelled. */
  async attend(token: string) {
    const reg = await this.seat(token);
    const w = reg.webinar;
    const base = { webinar: this.publicView(w), name: reg.name.split(' ')[0], seatCancelled: reg.status !== 'REGISTERED' };
    if (w.status === 'CANCELLED') return { ...base, state: 'cancelled' as const, cancelReason: w.cancelReason };
    if (this.isOver(w)) return { ...base, state: 'ended' as const };
    if (reg.status !== 'REGISTERED') return { ...base, state: 'seat_cancelled' as const };
    const opensAt = new Date(w.startAt.getTime() - OPENS_BEFORE_MIN * 60000);
    if (Date.now() < opensAt.getTime()) return { ...base, state: 'early' as const, opensAt };
    if (!w.roomName || !w.roomUrl) return { ...base, state: 'early' as const, opensAt };
    const pass = await this.daily.webinarToken(w.roomName, { host: false, userName: reg.name.split(' ')[0], expiresAt: this.closesAt(w) });
    return { ...base, state: 'open' as const, live: w.status === 'LIVE', roomUrl: w.roomUrl, token: pass };
  }

  /** Called about once a minute while the person has the room open. */
  async heartbeat(token: string) {
    const reg = await this.seat(token);
    const w = reg.webinar;
    const now = Date.now();
    const inWindow = ['PUBLISHED', 'LIVE'].includes(w.status) && now >= w.startAt.getTime() - OPENS_BEFORE_MIN * 60000 && now <= this.closesAt(w).getTime();
    if (!inWindow || reg.status !== 'REGISTERED') return { counted: false };
    // Two tabs open at once still count one minute per minute.
    if (reg.lastSeenAt && now - reg.lastSeenAt.getTime() < 45000) return { counted: false };
    await this.db.webinarRegistration.update({
      where: { id: reg.id },
      data: { lastSeenAt: new Date(now), firstJoinedAt: reg.firstJoinedAt ?? new Date(now), minutesWatched: { increment: 1 } },
    });
    return { counted: true };
  }

  async cancelSeat(token: string) {
    const reg = await this.seat(token);
    if (reg.status === 'REGISTERED') await this.db.webinarRegistration.update({ where: { id: reg.id }, data: { status: 'CANCELLED' } });
    return { cancelled: true };
  }

  async calendar(token: string) {
    const reg = await this.seat(token);
    return calendarFile(this.info(reg.webinar), { name: reg.name, joinToken: reg.joinToken }, reg.id);
  }

  /** A short-lived address to play the replay from. Replays are public. */
  async replay(slug: string) {
    const w = await this.db.webinar.findUnique({ where: { slug }, select: { id: true, recordingId: true, recordingStatus: true, status: true } });
    if (!w || w.recordingStatus !== 'READY' || !w.recordingId) throw new NotFoundException('There is no replay for this webinar yet.');
    const cached = this.replayLinks.get(w.id);
    if (cached && cached.expiresAt.getTime() - Date.now() > 30 * 60000) return { url: cached.url };
    const link = await this.daily.recordingLink(w.recordingId);
    this.replayLinks.set(w.id, link);
    return { url: link.url };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async prepareRoom(w: any) {
    const name = w.roomName ?? `mjn-webinar-${w.id}`;
    const room = await this.daily.upsertWebinarRoom(name, { closesAt: this.closesAt(w), capacity: w.capacity, lang: w.language });
    if (w.roomName !== room.name || w.roomUrl !== room.url) {
      await this.db.webinar.update({ where: { id: w.id }, data: { roomName: room.name, roomUrl: room.url } });
    }
  }

  /** Reminders a day and an hour before. A reminder for an old time finds the time changed and does nothing. */
  private async scheduleReminders(w: { id: string; startAt: Date }) {
    const start = w.startAt.getTime();
    for (const [when, before] of [['24h', 24 * 60], ['1h', 60]] as const) {
      const delay = start - before * 60000 - Date.now();
      if (delay <= 0) continue;
      await this.queue.add('reminder', { webinarId: w.id, when, startAt: w.startAt.toISOString() }, {
        delay, jobId: `webinar:${w.id}:${when}:${start}`, removeOnComplete: true, removeOnFail: true,
      });
    }
  }

  private log(actor: Actor, id: string, action: string, metadata: Record<string, unknown>) {
    return this.db.auditLog.create({ data: { actorId: actor.id, action, resourceType: 'Webinar', resourceId: id, metadata: metadata as any } });
  }
}
