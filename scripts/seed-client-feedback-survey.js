// Creates the "MJN Healthcare Client Feedback Survey" as a DRAFT.
// If it already exists, adds the "Other" service option and its follow-up question when missing.
// Safe to run more than once.
const { randomBytes } = require('crypto');

const id = (prefix) => `${prefix}_${randomBytes(9).toString('hex')}`;
const options = (labels) => labels.map((label) => ({ id: id('o'), label }));

const SERVICE_LABEL = 'Which service did you receive?';
const OTHER_LABEL = 'Other';
const FOLLOW_UP = {
  type: 'SHORT_TEXT',
  required: true,
  label: 'Please tell us which service you received.',
};

const SURVEY = {
  slug: 'client-feedback',
  title: 'MJN Healthcare Client Feedback Survey',
  description:
    'Thank you for choosing MJN Healthcare. Your feedback will help us improve our services and better support future clients. This survey should take less than two minutes.',
  layout: 'ALL_ON_ONE',
  thankYouMessage:
    'Thank you for helping MJN Healthcare improve and continue serving healthcare professionals and students across Africa and beyond.',
};

function buildQuestions() {
  const serviceId = id('q');
  const serviceOptions = options(['DHA DataFlow', 'DOH DataFlow', 'MOH DataFlow', 'NCLEX–US', 'UK CBT', 'Student Support', OTHER_LABEL]);
  const other = serviceOptions[serviceOptions.length - 1];
  return [
    { type: 'SHORT_TEXT', required: true, label: 'Full Name' },
    { type: 'MONTH_YEAR', required: true, label: 'When was the service provided?' },
    { id: serviceId, type: 'DROPDOWN', required: true, label: SERVICE_LABEL, options: serviceOptions },
    { ...FOLLOW_UP, showIf: { questionId: serviceId, operator: 'equals', value: other.id } },
    { type: 'RATING', required: true, label: 'How would you rate your overall experience with MJN Healthcare?' },
    { type: 'LONG_TEXT', required: true, label: 'Please share your experience or review.',
      helpText: 'You may describe the service you received, the support provided, your outcome, and any recommendations for improvement.' },
    { type: 'SINGLE_CHOICE', required: true, label: 'May MJN Healthcare publish your review as a testimonial?',
      options: options([
        'Yes, with my full name',
        'Yes, but use only my first name and last initial',
        'No, please keep my feedback private',
      ]) },
  ].map((q, order) => ({ id: q.id ?? id('q'), order, ...q }));
}

/** Adds the "Other" option and its follow-up to an existing survey. Returns what it changed. */
async function addOtherOption(db, survey) {
  const service = survey.questions.find((q) => q.label === SERVICE_LABEL);
  if (!service) return { skipped: `No question titled "${SERVICE_LABEL}" was found. Add the option in the survey builder instead.` };

  const changes = [];
  const current = Array.isArray(service.options) ? service.options : [];
  let other = current.find((o) => String(o.label).trim().toLowerCase() === OTHER_LABEL.toLowerCase());

  await db.$transaction(async (tx) => {
    if (!other) {
      other = { id: id('o'), label: OTHER_LABEL };
      await tx.surveyQuestion.update({ where: { id: service.id }, data: { options: [...current, other] } });
      changes.push('added the "Other" choice');
    }
    const hasFollowUp = survey.questions.some((q) => q.showIf?.questionId === service.id && q.showIf?.value === other.id);
    if (!hasFollowUp) {
      // Make room directly after the service question.
      await tx.surveyQuestion.updateMany({
        where: { surveyId: survey.id, order: { gt: service.order } },
        data: { order: { increment: 1 } },
      });
      await tx.surveyQuestion.create({
        data: {
          id: id('q'), surveyId: survey.id, order: service.order + 1, ...FOLLOW_UP,
          showIf: { questionId: service.id, operator: 'equals', value: other.id },
        },
      });
      changes.push('added the "please specify" follow-up question');
    }
  });
  return { changes };
}

module.exports = { SURVEY, buildQuestions, addOtherOption, SERVICE_LABEL };

if (require.main === module) {
  const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
  const db = new PrismaClient();
  (async () => {
    const admin = await db.person.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    if (!admin) throw new Error('No admin user found to own the survey.');
    const audit = (surveyId, action, metadata) => db.auditLog.create({
      data: { actorId: admin.id, action, resourceType: 'survey', resourceId: surveyId, metadata: { ...metadata, source: 'seed script' } },
    });

    const existing = await db.survey.findUnique({
      where: { slug: SURVEY.slug },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (existing) {
      const result = await addOtherOption(db, existing);
      if (result.skipped) { console.log(result.skipped); return; }
      if (result.changes.length === 0) { console.log('The survey already has the "Other" option and follow-up. Nothing was changed.'); return; }
      await audit(existing.id, 'survey.questions_saved', { changes: result.changes });
      console.log(`Updated "${existing.title}": ${result.changes.join(', ')}.`);
      return;
    }

    const survey = await db.survey.create({
      data: { ...SURVEY, status: 'DRAFT', createdById: admin.id, questions: { create: buildQuestions() } },
      include: { _count: { select: { questions: true } } },
    });
    await audit(survey.id, 'survey.created', { title: survey.title });
    console.log(`Created draft survey "${survey.title}" with ${survey._count.questions} questions (owner: ${admin.name ?? admin.email}).`);
    console.log('Open Admin -> Surveys to review and publish it.');
  })()
    .catch((err) => { console.error('Failed:', err.message); process.exitCode = 1; })
    .finally(() => db.$disconnect());
}
