import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException, HttpException, HttpStatus,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '@mjn/database';
import {
  AnswerValue, CHOICE_TYPES, LogicQuestion, QuestionType, ShowIf, validateSubmission,
} from './survey-logic';

export interface QuestionInput {
  id: string;
  type: QuestionType;
  label: string;
  labelFr?: string | null;
  helpText?: string | null;
  helpTextFr?: string | null;
  required?: boolean;
  options?: { id: string; label: string; labelFr?: string | null }[] | null;
  showIf?: ShowIf | null;
}

export interface SubmissionInput {
  answers: Record<string, unknown>;
  name?: string;
  email?: string;
  locale?: string;
  consent?: boolean;
  /** Honeypot — real visitors never fill this. */
  website?: string;
}

type Unavailable = 'not_open' | 'closed' | 'full';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['new', 'preview']);

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_SUBMISSIONS = 8;

const META_FIELDS = [
  'title', 'titleFr', 'description', 'descriptionFr', 'layout', 'identified', 'onePerPerson',
  'captureLead', 'showInPortal', 'maxResponses', 'consentText', 'consentTextFr', 'thankYouTitle',
  'thankYouTitleFr', 'thankYouMessage', 'thankYouMessageFr', 'ctaLabel', 'ctaLabelFr', 'ctaUrl',
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'survey';
}

@Injectable()
export class SurveyService {
  /** Recent submission timestamps per IP. The API runs as a single instance. */
  private readonly submissionsByIp = new Map<string, number[]>();

  private readonly logger = new Logger(SurveyService.name);

  constructor(private readonly db: DatabaseService) {}

  /** Records an admin action in the shared audit trail. Never blocks the action itself. */
  private async audit(actorId: string, action: string, surveyId: string, metadata?: Record<string, unknown>) {
    try {
      await this.db.auditLog.create({
        data: { actorId, action, resourceType: 'survey', resourceId: surveyId, metadata: (metadata ?? {}) as any },
      });
    } catch (err) {
      this.logger.warn(`Audit log write failed for ${action} on survey ${surveyId}: ${err}`);
    }
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async list() {
    const surveys = await this.db.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { responses: true, questions: true } } },
    });
    return surveys.map(({ _count, ...s }) => ({
      ...s, responseCount: _count.responses, questionCount: _count.questions,
    }));
  }

  async create(data: { title: string; createdById: string }) {
    const title = data.title?.trim();
    if (!title) throw new BadRequestException('Give the survey a title');
    const survey = await this.db.survey.create({
      data: { title, slug: await this.uniqueSlug(slugify(title)), createdById: data.createdById },
    });
    await this.audit(data.createdById, 'survey.created', survey.id, { title });
    return survey;
  }

  /** Copies a survey's settings and questions into a new draft. Responses are not copied. */
  async duplicate(id: string, actorId: string) {
    const source = await this.get(id);
    const { id: _id, slug: _slug, status: _status, viewCount: _views, createdAt: _c, updatedAt: _u,
      createdById: _by, questions, responseCount: _count, ...settings } = source;
    const title = `${source.title} (copy)`;

    // Fresh question ids, with skip-logic references remapped to the copies.
    const idMap = new Map(questions.map((q) => [q.id, `q_${randomBytes(9).toString('hex')}`]));
    const copy = await this.db.survey.create({
      data: {
        ...settings,
        title,
        slug: await this.uniqueSlug(slugify(title)),
        createdById: actorId,
        questions: {
          create: questions.map((q) => {
            const rule = q.showIf as ShowIf | null;
            return {
              id: idMap.get(q.id)!,
              order: q.order, type: q.type, label: q.label, labelFr: q.labelFr,
              helpText: q.helpText, helpTextFr: q.helpTextFr, required: q.required,
              options: (q.options ?? undefined) as any,
              showIf: (rule && idMap.has(rule.questionId)
                ? { ...rule, questionId: idMap.get(rule.questionId) }
                : undefined) as any,
            };
          }),
        },
      },
    });
    await this.audit(actorId, 'survey.duplicated', copy.id, { from: id });
    return copy;
  }

  async get(id: string) {
    const survey = await this.db.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Survey not found');
    const { _count, ...rest } = survey;
    return { ...rest, responseCount: _count.responses };
  }

  async update(id: string, data: Record<string, any>, actorId: string) {
    const survey = await this.get(id);
    const update: Record<string, any> = {};

    for (const field of META_FIELDS) {
      if (data[field] !== undefined) update[field] = data[field] === '' ? null : data[field];
    }
    if (update.title === null) throw new BadRequestException('Give the survey a title');
    if (update.layout && !['ONE_PER_PAGE', 'ALL_ON_ONE'].includes(update.layout)) {
      throw new BadRequestException('Unknown layout');
    }
    if (update.ctaUrl && !/^(https?:\/\/|\/)/.test(update.ctaUrl)) {
      throw new BadRequestException('The button link must start with https:// or /');
    }
    if (update.maxResponses != null && !(Number.isInteger(update.maxResponses) && update.maxResponses > 0)) {
      throw new BadRequestException('The response limit must be a whole number above zero');
    }
    for (const flag of ['identified', 'onePerPerson', 'captureLead', 'showInPortal']) {
      if (update[flag] !== undefined) update[flag] = update[flag] === true;
    }
    if (data.opensAt !== undefined) update.opensAt = data.opensAt ? new Date(data.opensAt) : null;
    if (data.closesAt !== undefined) update.closesAt = data.closesAt ? new Date(data.closesAt) : null;

    const opensAt = update.opensAt !== undefined ? update.opensAt : survey.opensAt;
    const closesAt = update.closesAt !== undefined ? update.closesAt : survey.closesAt;
    if (opensAt && closesAt && closesAt <= opensAt) {
      throw new BadRequestException('The closing date must be after the opening date');
    }

    if (data.slug !== undefined && data.slug !== survey.slug) {
      const slug = String(data.slug).trim().toLowerCase();
      if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) {
        throw new BadRequestException('The link name can only use lowercase letters, numbers and dashes');
      }
      if (await this.db.survey.findUnique({ where: { slug } })) {
        throw new ConflictException('Another survey already uses that link name');
      }
      update.slug = slug;
    }

    if (data.status !== undefined && data.status !== survey.status) {
      if (!['DRAFT', 'LIVE', 'CLOSED'].includes(data.status)) throw new BadRequestException('Unknown status');
      if (data.status === 'LIVE' && survey.questions.length === 0) {
        throw new BadRequestException('Add at least one question before publishing');
      }
      update.status = data.status;
    }

    await this.db.survey.update({ where: { id }, data: update });
    if (update.status) {
      await this.audit(actorId, `survey.${String(update.status).toLowerCase()}`, id, { from: survey.status });
    } else if (Object.keys(update).length > 0) {
      await this.audit(actorId, 'survey.settings_updated', id, { fields: Object.keys(update) });
    }
    return this.get(id);
  }

  /** Replaces the survey's question set. Questions left out are deleted with their answers. */
  async saveQuestions(id: string, questions: QuestionInput[], actorId: string) {
    const survey = await this.get(id);
    if (!Array.isArray(questions)) throw new BadRequestException('Questions must be a list');

    const seen = new Set<string>();
    const rows = questions.map((q, index) => {
      const position = `Question ${index + 1}`;
      if (!ID_RE.test(q.id ?? '') || seen.has(q.id)) throw new BadRequestException(`${position} has an invalid id`);
      if (!q.label?.trim()) throw new BadRequestException(`${position} needs a question text`);

      let options: QuestionInput['options'] = null;
      if (CHOICE_TYPES.includes(q.type)) {
        options = (q.options ?? [])
          .filter((o) => o?.label?.trim())
          .map((o) => ({ id: o.id, label: o.label.trim(), labelFr: o.labelFr?.trim() || null }));
        if (options.length < 2) throw new BadRequestException(`${position} needs at least two choices`);
        const optionIds = new Set(options.map((o) => o.id));
        if (optionIds.size !== options.length || options.some((o) => !ID_RE.test(o.id ?? ''))) {
          throw new BadRequestException(`${position} has invalid choices`);
        }
      }

      let showIf: ShowIf | null = null;
      if (q.showIf?.questionId) {
        // Skip logic may only look back at an earlier question.
        if (!seen.has(q.showIf.questionId)) {
          throw new BadRequestException(`${position}: its condition must refer to an earlier question`);
        }
        showIf = {
          questionId: q.showIf.questionId,
          operator: q.showIf.operator === 'not_equals' ? 'not_equals' : 'equals',
          value: String(q.showIf.value ?? ''),
        };
      }

      seen.add(q.id);
      return {
        id: q.id,
        order: index,
        type: q.type,
        label: q.label.trim(),
        labelFr: q.labelFr?.trim() || null,
        helpText: q.helpText?.trim() || null,
        helpTextFr: q.helpTextFr?.trim() || null,
        required: !!q.required,
        options: options as any,
        showIf: showIf as any,
      };
    });

    // An id sent by the client must not belong to another survey.
    const clashes = await this.db.surveyQuestion.count({
      where: { id: { in: [...seen] }, surveyId: { not: id } },
    });
    if (clashes > 0) throw new BadRequestException('A question id is already in use');

    const existingIds = new Set(survey.questions.map((q) => q.id));
    await this.db.$transaction([
      this.db.surveyQuestion.deleteMany({ where: { surveyId: id, id: { notIn: [...seen] } } }),
      ...rows.map((row) =>
        existingIds.has(row.id)
          ? this.db.surveyQuestion.update({ where: { id: row.id }, data: row })
          : this.db.surveyQuestion.create({ data: { ...row, surveyId: id } }),
      ),
    ]);
    const removed = survey.questions.filter((q) => !seen.has(q.id)).length;
    await this.audit(actorId, 'survey.questions_saved', id, { questions: rows.length, removed });
    return this.get(id);
  }

  async remove(id: string, actorId: string) {
    const survey = await this.get(id);
    await this.db.survey.delete({ where: { id } });
    await this.audit(actorId, 'survey.deleted', id, { title: survey.title, responses: survey.responseCount });
    return { deleted: true };
  }

  /** Erases one person's response, e.g. for a data-deletion request. */
  async removeResponse(id: string, responseId: string, actorId: string) {
    const { count } = await this.db.surveyResponse.deleteMany({ where: { id: responseId, surveyId: id } });
    if (count === 0) throw new NotFoundException('Response not found');
    await this.audit(actorId, 'survey.response_deleted', id, { responseId });
    return { deleted: true };
  }

  async logExport(id: string, actorId: string, format: string) {
    await this.get(id);
    await this.audit(actorId, 'survey.exported', id, { format });
    return { logged: true };
  }

  async results(id: string) {
    const survey = await this.get(id);
    const responses = await this.db.surveyResponse.findMany({
      where: { surveyId: id },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      include: { answers: { select: { questionId: true, value: true } } },
    });

    const byQuestion = new Map<string, AnswerValue[]>();
    for (const response of responses) {
      for (const answer of response.answers) {
        const list = byQuestion.get(answer.questionId) ?? [];
        list.push(answer.value as AnswerValue);
        byQuestion.set(answer.questionId, list);
      }
    }

    const questions = survey.questions.map((q) => {
      const values = byQuestion.get(q.id) ?? [];
      const base = { id: q.id, type: q.type, label: q.label, answered: values.length };

      if (CHOICE_TYPES.includes(q.type as QuestionType)) {
        const options = ((q.options as any[]) ?? []).map((o) => ({
          id: o.id as string,
          label: o.label as string,
          count: values.filter((v) => (Array.isArray(v) ? v.includes(o.id) : v === o.id)).length,
        }));
        return { ...base, options };
      }
      if (q.type === 'YES_NO') {
        return {
          ...base,
          options: [
            { id: 'yes', label: 'Yes', count: values.filter((v) => v === 'yes').length },
            { id: 'no', label: 'No', count: values.filter((v) => v === 'no').length },
          ],
        };
      }
      if (q.type === 'RATING' || q.type === 'SCALE') {
        const [min, max] = q.type === 'RATING' ? [1, 5] : [0, 10];
        const numbers = values.filter((v): v is number => typeof v === 'number');
        const distribution = Array.from({ length: max - min + 1 }, (_, i) => ({
          value: min + i,
          count: numbers.filter((n) => n === min + i).length,
        }));
        const average = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
        return { ...base, distribution, average };
      }
      return { ...base, samples: values.slice(0, 100).map(String) };
    });

    return {
      survey: {
        id: survey.id, title: survey.title, slug: survey.slug, status: survey.status,
        identified: survey.identified, viewCount: survey.viewCount,
      },
      total: survey.responseCount,
      questions,
      responses: responses.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        name: r.respondentName,
        email: r.respondentEmail,
        locale: r.locale,
        consentAt: r.consentAt,
        answers: Object.fromEntries(r.answers.map((a) => [a.questionId, a.value])),
      })),
    };
  }

  // ── Public ────────────────────────────────────────────────────────────────

  private unavailableReason(
    survey: { status: string; opensAt: Date | null; closesAt: Date | null; maxResponses: number | null },
    responseCount: number,
  ): Unavailable | null {
    const now = new Date();
    if (survey.status === 'CLOSED') return 'closed';
    if (survey.opensAt && survey.opensAt > now) return 'not_open';
    if (survey.closesAt && survey.closesAt <= now) return 'closed';
    if (survey.maxResponses && responseCount >= survey.maxResponses) return 'full';
    return null;
  }

  private async findPublished(slug: string) {
    const survey = await this.db.survey.findUnique({
      where: { slug },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    // Drafts are not public.
    if (!survey || survey.status === 'DRAFT') throw new NotFoundException('Survey not found');
    return survey;
  }

  async getPublic(slug: string) {
    const survey = await this.findPublished(slug);
    const unavailable = this.unavailableReason(survey, survey._count.responses);

    const head = {
      slug: survey.slug, title: survey.title, titleFr: survey.titleFr,
      description: survey.description, descriptionFr: survey.descriptionFr,
    };
    if (unavailable) return { ...head, available: false, unavailable };

    await this.db.survey.update({ where: { id: survey.id }, data: { viewCount: { increment: 1 } } });
    return { ...head, available: true, ...this.publicBody(survey) };
  }

  private publicBody(survey: any) {
    return {
      layout: survey.layout,
      identified: survey.identified,
      consentText: survey.consentText, consentTextFr: survey.consentTextFr,
      thankYouTitle: survey.thankYouTitle, thankYouTitleFr: survey.thankYouTitleFr,
      thankYouMessage: survey.thankYouMessage, thankYouMessageFr: survey.thankYouMessageFr,
      ctaLabel: survey.ctaLabel, ctaLabelFr: survey.ctaLabelFr, ctaUrl: survey.ctaUrl,
      questions: survey.questions.map((q: any) => ({
        id: q.id, type: q.type, label: q.label, labelFr: q.labelFr,
        helpText: q.helpText, helpTextFr: q.helpTextFr,
        required: q.required, options: q.options, showIf: q.showIf,
      })),
    };
  }

  private checkRateLimit(ip: string) {
    const now = Date.now();
    const recent = (this.submissionsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX_SUBMISSIONS) {
      throw new HttpException('Too many submissions. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.submissionsByIp.set(ip, recent);
    if (this.submissionsByIp.size > 5000) {
      for (const [key, times] of this.submissionsByIp) {
        if (times.every((t) => now - t >= RATE_WINDOW_MS)) this.submissionsByIp.delete(key);
      }
    }
  }

  async submit(slug: string, input: SubmissionInput, ip: string) {
    // Bots fill hidden fields; pretend it worked so they do not retry.
    if (input.website) return { submitted: true };
    this.checkRateLimit(ip);

    const survey = await this.findPublished(slug);
    const unavailable = this.unavailableReason(survey, survey._count.responses);
    if (unavailable) throw new BadRequestException('This survey is not accepting responses');

    let name: string | null = null;
    let email: string | null = null;
    if (survey.identified) {
      name = String(input.name ?? '').trim().slice(0, 120) || null;
      email = String(input.email ?? '').trim().toLowerCase() || null;
      if (!name) throw new BadRequestException({ message: 'Please enter your name', field: 'name' });
      if (!email || !EMAIL_RE.test(email)) {
        throw new BadRequestException({ message: 'Please enter a valid email address', field: 'email' });
      }
      if (survey.onePerPerson) {
        const already = await this.db.surveyResponse.count({ where: { surveyId: survey.id, respondentEmail: email } });
        if (already > 0) throw new ConflictException('You have already answered this survey. Thank you!');
      }
    }
    if (survey.consentText && input.consent !== true) {
      throw new BadRequestException({ message: 'Please tick the consent box to continue', field: 'consent' });
    }

    const { answers, errors } = validateSubmission(survey.questions as unknown as LogicQuestion[], input.answers ?? {});
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Some answers are missing or not valid', errors });
    }

    await this.db.surveyResponse.create({
      data: {
        surveyId: survey.id,
        respondentName: name,
        respondentEmail: email,
        locale: input.locale === 'fr' ? 'fr' : 'en',
        consentAt: survey.consentText ? new Date() : null,
        answers: { create: Object.entries(answers).map(([questionId, value]) => ({ questionId, value: value as any })) },
      },
    });

    if (survey.captureLead && name && email) {
      const phoneQuestion = survey.questions.find((q) => q.type === 'PHONE' && answers[q.id]);
      await this.captureLead(name, email, phoneQuestion ? String(answers[phoneQuestion.id]) : null, survey.title);
    }
    return { submitted: true };
  }

  private async captureLead(name: string, email: string, phone: string | null, surveyTitle: string) {
    const existing = await this.db.lead.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existing) return;
    await this.db.lead.create({
      data: { name, email, phone, notes: `Came in through the survey "${surveyTitle}".` },
    });
  }

  // ── Portal ────────────────────────────────────────────────────────────────

  /** Open surveys a logged-in client is invited to and has not answered yet. */
  async activeForPortal(email?: string | null) {
    const surveys = await this.db.survey.findMany({
      where: { status: 'LIVE', showInPortal: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { responses: true } } },
    });
    const open = surveys.filter((s) => !this.unavailableReason(s, s._count.responses));
    if (open.length === 0) return [];

    const answered = email
      ? await this.db.surveyResponse.findMany({
          where: { surveyId: { in: open.map((s) => s.id) }, respondentEmail: email.toLowerCase() },
          select: { surveyId: true },
        })
      : [];
    const answeredIds = new Set(answered.map((r) => r.surveyId));
    return open
      .filter((s) => !answeredIds.has(s.id))
      .map((s) => ({ slug: s.slug, title: s.title, titleFr: s.titleFr, description: s.description, descriptionFr: s.descriptionFr }));
  }

  private async uniqueSlug(base: string): Promise<string> {
    const root = RESERVED_SLUGS.has(base) ? `${base}-survey` : base;
    for (let n = 1; n < 100; n++) {
      const candidate = n === 1 ? root : `${root}-${n}`;
      if (!(await this.db.survey.findUnique({ where: { slug: candidate } }))) return candidate;
    }
    return `${root}-${Date.now().toString(36)}`;
  }
}
