import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { WebinarService } from './webinar.service';

/**
 * What happens inside a running webinar: questions with votes, polls, the host's offer button,
 * and the short survey afterwards.
 *
 * Viewers look for changes every few seconds. Each webinar's state is read from the database at
 * most once every two seconds and shared by everyone watching, so 100 viewers cost the same as one.
 */

type Actor = { id: string; role?: string };
type RawQuestion = { id: string; authorName: string; registrationId: string | null; text: string; status: string; pinned: boolean; createdAt: Date; answeredAt: Date | null; voters: Set<string> };
type RawPoll = { id: string; question: string; options: string[]; status: string; showResults: boolean; createdAt: Date; openedAt: Date | null; closedAt: Date | null; votes: Map<string, number> };
type Raw = {
  at: number;
  webinar: { id: string; status: string; startAt: Date; durationMinutes: number; language: string; offerVisible: boolean; offerLabel: string | null; offerUrl: string | null };
  questions: RawQuestion[];
  polls: RawPoll[];
};

const SNAPSHOT_MS = 2000;
const SEAT_MS = 60000;
const OPENS_BEFORE_MIN = 15;
const OVERRUN_MIN = 90;
const MAX_QUESTIONS_EACH = 10;
const QUESTION_GAP_MS = 10000;

const clean = (v: unknown, max: number) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

/** The offer can only send people to our own site. */
function safeOfferUrl(url: string): string | null {
  const value = String(url ?? '').trim();
  if (/^\/[^/\\]/.test(value) || value === '/') return value;
  try {
    const u = new URL(value);
    const own = new URL(process.env.WEB_URL ?? 'http://localhost:3001').host;
    const portal = new URL(process.env.PORTAL_URL ?? 'http://localhost:3002').host;
    return u.protocol === 'https:' && (u.host === own || u.host === portal) ? u.toString() : null;
  } catch {
    return null;
  }
}

@Injectable()
export class WebinarLiveService {
  private readonly snapshots = new Map<string, Raw>();
  private readonly seats = new Map<string, { at: number; id: string; webinarId: string; first: string; status: string }>();

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly webinars: WebinarService,
  ) {}

  // ── Loading ─────────────────────────────────────────────────────────────────

  private async raw(webinarId: string): Promise<Raw> {
    const cached = this.snapshots.get(webinarId);
    if (cached && Date.now() - cached.at < SNAPSHOT_MS) return cached;
    const [webinar, questions, polls] = await Promise.all([
      this.db.webinar.findUnique({ where: { id: webinarId }, select: { id: true, status: true, startAt: true, durationMinutes: true, language: true, offerVisible: true, offerLabel: true, offerUrl: true } }),
      this.db.webinarQuestion.findMany({ where: { webinarId }, include: { votes: { select: { registrationId: true } } }, orderBy: { createdAt: 'asc' } }),
      this.db.webinarPoll.findMany({ where: { webinarId }, include: { votes: { select: { registrationId: true, option: true } } }, orderBy: { createdAt: 'asc' } }),
    ]);
    if (!webinar) throw new NotFoundException('That webinar no longer exists.');
    const snap: Raw = {
      at: Date.now(),
      webinar: webinar as Raw['webinar'],
      questions: questions.map((q) => ({ ...q, voters: new Set(q.votes.map((v) => v.registrationId)) })),
      polls: polls.map((p) => ({ ...p, votes: new Map(p.votes.map((v) => [v.registrationId, v.option])) })),
    };
    this.snapshots.set(webinarId, snap);
    return snap;
  }

  private forget(webinarId: string) {
    this.snapshots.delete(webinarId);
  }

  private async seat(token: string) {
    const key = String(token ?? '');
    const hit = this.seats.get(key);
    if (hit && Date.now() - hit.at < SEAT_MS) return hit;
    const reg = await this.db.webinarRegistration.findUnique({ where: { joinToken: key }, select: { id: true, webinarId: true, name: true, status: true } });
    if (!reg) throw new NotFoundException('This link is not valid.');
    const seat = { at: Date.now(), id: reg.id, webinarId: reg.webinarId, first: reg.name.trim().split(/\s+/)[0] || reg.name, status: reg.status };
    this.seats.set(key, seat);
    return seat;
  }

  /** People can take part from when the room opens until it closes. */
  private open(w: Raw['webinar']) {
    const now = Date.now();
    return ['PUBLISHED', 'LIVE'].includes(w.status)
      && now >= w.startAt.getTime() - OPENS_BEFORE_MIN * 60000
      && now <= w.startAt.getTime() + (w.durationMinutes + OVERRUN_MIN) * 60000;
  }

  private sortQuestions(list: RawQuestion[]) {
    return [...list].sort((a, b) =>
      Number(b.pinned) - Number(a.pinned)
      || Number(a.status === 'ANSWERED') - Number(b.status === 'ANSWERED')
      || b.voters.size - a.voters.size
      || a.createdAt.getTime() - b.createdAt.getTime());
  }

  private counts(p: RawPoll) {
    const counts = p.options.map(() => 0);
    for (const option of p.votes.values()) if (counts[option] !== undefined) counts[option]++;
    return { counts, total: p.votes.size };
  }

  // ── Viewers ─────────────────────────────────────────────────────────────────

  /** Everything a viewer's side panel shows, from their own point of view. */
  async view(token: string) {
    const seat = await this.seat(token);
    const s = await this.raw(seat.webinarId);
    const questions = this.sortQuestions(s.questions.filter((q) => q.status !== 'HIDDEN')).map((q) => ({
      id: q.id, author: q.authorName, text: q.text, votes: q.voters.size,
      answered: q.status === 'ANSWERED', pinned: q.pinned,
      mine: q.registrationId === seat.id, voted: q.voters.has(seat.id), createdAt: q.createdAt,
    }));
    // The poll on screen: the open one, or the last closed one whose results were shared.
    const live = s.polls.find((p) => p.status === 'OPEN')
      ?? [...s.polls].reverse().find((p) => p.status === 'CLOSED' && p.showResults);
    let poll = null;
    if (live) {
      const myVote = live.votes.get(seat.id) ?? null;
      const shared = live.showResults && (live.status === 'CLOSED' || myVote !== null);
      poll = { id: live.id, question: live.question, options: live.options, status: live.status, myVote, ...(shared ? this.counts(live) : {}) };
    }
    return {
      status: s.webinar.status,
      canTakePart: this.open(s.webinar) && seat.status === 'REGISTERED',
      questions,
      poll,
      offer: s.webinar.offerVisible && s.webinar.offerUrl ? { label: s.webinar.offerLabel, url: s.webinar.offerUrl } : null,
    };
  }

  async ask(token: string, text: string) {
    const seat = await this.seat(token);
    const s = await this.raw(seat.webinarId);
    if (!this.open(s.webinar) || seat.status !== 'REGISTERED') throw new BadRequestException('Questions are open while the webinar is running.');
    const body = clean(text, 300);
    if (body.length < 3) throw new BadRequestException('Write your question first.');
    const mine = s.questions.filter((q) => q.registrationId === seat.id);
    if (mine.length >= MAX_QUESTIONS_EACH) throw new BadRequestException(`You can ask up to ${MAX_QUESTIONS_EACH} questions.`);
    const last = mine[mine.length - 1];
    if (last && Date.now() - last.createdAt.getTime() < QUESTION_GAP_MS) throw new BadRequestException('Please wait a few seconds before asking another question.');
    await this.db.webinarQuestion.create({ data: { webinarId: seat.webinarId, registrationId: seat.id, authorName: seat.first, text: body } });
    this.forget(seat.webinarId);
    return this.view(token);
  }

  /** Adds or removes this person's vote. People cannot vote for their own question. */
  async vote(token: string, questionId: string) {
    const seat = await this.seat(token);
    const s = await this.raw(seat.webinarId);
    if (!this.open(s.webinar) || seat.status !== 'REGISTERED') throw new BadRequestException('Voting is open while the webinar is running.');
    const q = s.questions.find((x) => x.id === questionId && x.status !== 'HIDDEN');
    if (!q) throw new NotFoundException('That question is no longer there.');
    if (q.registrationId === seat.id) throw new BadRequestException('You cannot vote for your own question.');
    if (q.voters.has(seat.id)) await this.db.webinarQuestionVote.deleteMany({ where: { questionId, registrationId: seat.id } });
    else await this.db.webinarQuestionVote.upsert({ where: { questionId_registrationId: { questionId, registrationId: seat.id } }, create: { questionId, registrationId: seat.id }, update: {} });
    this.forget(seat.webinarId);
    return this.view(token);
  }

  /** One answer per person; they can change it while the poll is open. */
  async answerPoll(token: string, pollId: string, option: number) {
    const seat = await this.seat(token);
    const s = await this.raw(seat.webinarId);
    if (seat.status !== 'REGISTERED') throw new BadRequestException('Your seat is no longer active.');
    const p = s.polls.find((x) => x.id === pollId);
    if (!p || p.status !== 'OPEN') throw new BadRequestException('This poll is closed.');
    const choice = Number(option);
    if (!Number.isInteger(choice) || choice < 0 || choice >= p.options.length) throw new BadRequestException('Choose one of the answers.');
    await this.db.webinarPollVote.upsert({
      where: { pollId_registrationId: { pollId, registrationId: seat.id } },
      create: { pollId, registrationId: seat.id, option: choice },
      update: { option: choice },
    });
    this.forget(seat.webinarId);
    return this.view(token);
  }

  async offerClicked(token: string) {
    const seat = await this.seat(token);
    await this.db.webinarRegistration.updateMany({ where: { id: seat.id, offerClickedAt: null }, data: { offerClickedAt: new Date() } });
    return { ok: true };
  }

  // ── Survey ──────────────────────────────────────────────────────────────────

  async survey(token: string) {
    const reg = await this.db.webinarRegistration.findUnique({
      where: { joinToken: String(token ?? '') },
      select: { name: true, surveyRating: true, surveyWantsContact: true, surveyComment: true, surveyAt: true, webinar: { select: { title: true, language: true, slug: true, startAt: true, status: true } } },
    });
    if (!reg) throw new NotFoundException('This link is not valid.');
    return {
      name: reg.name.split(' ')[0], webinar: reg.webinar,
      open: reg.webinar.startAt.getTime() <= Date.now() && reg.webinar.status !== 'CANCELLED',
      answer: reg.surveyAt ? { rating: reg.surveyRating, wantsContact: reg.surveyWantsContact, comment: reg.surveyComment } : null,
    };
  }

  /** Can be answered again; "contact me" alerts the team the first time it is said. */
  async submitSurvey(token: string, input: { rating?: number; wantsContact?: boolean; comment?: string }) {
    const reg = await this.db.webinarRegistration.findUnique({
      where: { joinToken: String(token ?? '') },
      select: { id: true, surveyWantsContact: true, webinar: { select: { startAt: true, status: true } } },
    });
    if (!reg) throw new NotFoundException('This link is not valid.');
    if (reg.webinar.status === 'CANCELLED' || reg.webinar.startAt.getTime() > Date.now()) throw new BadRequestException('The survey opens once the webinar has started.');
    const rating = Number(input?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BadRequestException('Choose a rating from 1 to 5.');
    const wantsContact = input?.wantsContact === true;
    await this.db.webinarRegistration.update({
      where: { id: reg.id },
      data: { surveyRating: rating, surveyWantsContact: wantsContact, surveyComment: String(input?.comment ?? '').trim().slice(0, 1000) || null, surveyAt: new Date() },
    });
    if (wantsContact && reg.surveyWantsContact !== true) this.events.emit('webinar.contact_requested', { registrationId: reg.id });
    return { saved: true };
  }

  // ── Hosts ───────────────────────────────────────────────────────────────────

  /** The host panel: every question (hidden ones too), every poll with its results, the offer, and who is watching. */
  async hostView(actor: Actor, id: string) {
    await this.webinars.assertCanManage(actor, id);
    const s = await this.raw(id);
    const watching = await this.db.webinarRegistration.count({ where: { webinarId: id, lastSeenAt: { gte: new Date(Date.now() - 2.5 * 60000) } } });
    return {
      status: s.webinar.status,
      watching,
      questions: this.sortQuestions(s.questions).map((q) => ({ id: q.id, author: q.authorName, text: q.text, votes: q.voters.size, status: q.status, pinned: q.pinned, createdAt: q.createdAt })),
      polls: s.polls.map((p) => ({ id: p.id, question: p.question, options: p.options, status: p.status, showResults: p.showResults, openedAt: p.openedAt, closedAt: p.closedAt, ...this.counts(p) })),
      offer: { label: s.webinar.offerLabel, url: s.webinar.offerUrl, visible: s.webinar.offerVisible },
    };
  }

  async moderate(actor: Actor, id: string, questionId: string, action: string) {
    await this.webinars.assertCanManage(actor, id);
    const q = await this.db.webinarQuestion.findFirst({ where: { id: questionId, webinarId: id } });
    if (!q) throw new NotFoundException('That question is no longer there.');
    const data: Record<string, unknown> =
      action === 'answer' ? { status: 'ANSWERED', answeredAt: new Date(), pinned: false }
      : action === 'reopen' ? { status: 'OPEN', answeredAt: null }
      : action === 'hide' ? { status: 'HIDDEN', pinned: false }
      : action === 'show' ? { status: 'OPEN' }
      : action === 'pin' ? { pinned: true }
      : action === 'unpin' ? { pinned: false }
      : (() => { throw new BadRequestException('Unknown action.'); })();
    // One question is pinned at a time: the one being answered now.
    if (action === 'pin') await this.db.webinarQuestion.updateMany({ where: { webinarId: id, pinned: true }, data: { pinned: false } });
    await this.db.webinarQuestion.update({ where: { id: questionId }, data });
    this.forget(id);
    return this.hostView(actor, id);
  }

  async createPoll(actor: Actor, id: string, input: { question?: string; options?: string[] }) {
    const w = await this.webinars.assertCanManage(actor, id);
    if (['ENDED', 'CANCELLED'].includes(w.status)) throw new BadRequestException('This webinar is over.');
    const question = clean(input?.question, 200);
    const options = (input?.options ?? []).map((o) => clean(o, 80)).filter(Boolean);
    if (question.length < 3) throw new BadRequestException('Write the poll question.');
    if (options.length < 2 || options.length > 6) throw new BadRequestException('Give between 2 and 6 answers.');
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) throw new BadRequestException('Each answer must be different.');
    await this.db.webinarPoll.create({ data: { webinarId: id, question, options } });
    this.forget(id);
    return this.hostView(actor, id);
  }

  /** open: launches it (closing any other open poll) · close · share/unshare results · delete (drafts only). */
  async pollAction(actor: Actor, id: string, pollId: string, action: string) {
    await this.webinars.assertCanManage(actor, id);
    const p = await this.db.webinarPoll.findFirst({ where: { id: pollId, webinarId: id } });
    if (!p) throw new NotFoundException('That poll is no longer there.');
    if (action === 'open') {
      if (p.status !== 'DRAFT') throw new BadRequestException('Only a poll that has not run yet can be launched.');
      await this.db.$transaction([
        this.db.webinarPoll.updateMany({ where: { webinarId: id, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } }),
        this.db.webinarPoll.update({ where: { id: pollId }, data: { status: 'OPEN', openedAt: new Date() } }),
      ]);
    } else if (action === 'close') {
      if (p.status !== 'OPEN') throw new BadRequestException('This poll is not running.');
      await this.db.webinarPoll.update({ where: { id: pollId }, data: { status: 'CLOSED', closedAt: new Date() } });
    } else if (action === 'share' || action === 'unshare') {
      await this.db.webinarPoll.update({ where: { id: pollId }, data: { showResults: action === 'share' } });
    } else if (action === 'delete') {
      if (p.status !== 'DRAFT') throw new BadRequestException('A poll that has run is kept with its results.');
      await this.db.webinarPoll.delete({ where: { id: pollId } });
    } else {
      throw new BadRequestException('Unknown action.');
    }
    this.forget(id);
    return this.hostView(actor, id);
  }

  async setOffer(actor: Actor, id: string, input: { label?: string; url?: string; visible?: boolean }) {
    const w = await this.webinars.assertCanManage(actor, id);
    const data: Record<string, unknown> = {};
    if (input?.label !== undefined) {
      const label = clean(input.label, 60);
      if (label.length < 3) throw new BadRequestException('Write the button text.');
      data.offerLabel = label;
    }
    if (input?.url !== undefined) {
      const url = safeOfferUrl(input.url);
      if (!url) throw new BadRequestException('The button can only link to a page on the MJN website or portal, for example /consult.');
      data.offerUrl = url;
    }
    // A sensible default the first time: the consultation page.
    if (!w.offerLabel && data.offerLabel === undefined) data.offerLabel = w.language === 'fr' ? 'Réserver une consultation' : 'Book a consultation';
    if (!w.offerUrl && data.offerUrl === undefined) data.offerUrl = '/consult';
    if (input?.visible !== undefined) data.offerVisible = !!input.visible;
    await this.db.webinar.update({ where: { id }, data });
    this.forget(id);
    return this.hostView(actor, id);
  }
}
