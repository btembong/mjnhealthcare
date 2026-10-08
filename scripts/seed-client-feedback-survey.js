// Creates the "MJN Healthcare Client Feedback Survey" as a DRAFT.
// If it already exists, adds whichever of the questions below are missing, in the right position.
// Existing questions, their answers, and any questions added by hand are left as they are.
// Safe to run more than once.
const { randomBytes } = require('crypto');

const id = (prefix) => `${prefix}_${randomBytes(9).toString('hex')}`;

const SERVICE_LABEL = 'Which service did you receive?';
const SERVICE_FOLLOW_UP_LABEL = 'Please tell us which service you received.';
const OTHER_LABEL = 'Other';

const SURVEY = {
  slug: 'client-feedback',
  title: 'MJN Healthcare Client Feedback Survey',
  description:
    'Thank you for choosing MJN Healthcare. Your feedback will help us improve our services and better support future clients. This survey should take less than two minutes.',
  layout: 'ALL_ON_ONE',
  thankYouMessage:
    'Thank you for helping MJN Healthcare improve and continue serving healthcare professionals and students across Africa and beyond.',
};

/** The survey's questions in display order. `choices` become options; labels identify a question. */
const QUESTIONS = [
  { type: 'SHORT_TEXT', required: true, label: 'Full Name' },
  { type: 'EMAIL', required: true, label: 'Email address' },
  { type: 'PHONE', required: false, label: 'Phone or WhatsApp number', helpText: 'Optional. Include your country code.' },
  { type: 'SHORT_TEXT', required: true, label: 'Country of residence' },
  { type: 'DROPDOWN', required: true, label: 'What is your profession?',
    choices: ['Nurse', 'Midwife', 'Physician', 'Allied health professional', 'Student', OTHER_LABEL] },
  { type: 'MONTH_YEAR', required: true, label: 'When was the service provided?' },
  { type: 'DROPDOWN', required: true, label: SERVICE_LABEL,
    choices: ['DHA DataFlow', 'DOH DataFlow', 'MOH DataFlow', 'NCLEX–US', 'UK CBT', 'Student Support', OTHER_LABEL] },
  { type: 'SHORT_TEXT', required: true, label: SERVICE_FOLLOW_UP_LABEL },
  { type: 'RATING', required: true, label: 'How would you rate your overall experience with MJN Healthcare?' },
  { type: 'SCALE', required: true, label: 'How likely are you to recommend MJN Healthcare to a friend or colleague?' },
  { type: 'LONG_TEXT', required: true, label: 'Please share your experience or review.',
    helpText: 'You may describe the service you received, the support provided, your outcome, and any recommendations for improvement.' },
  { type: 'SINGLE_CHOICE', required: false, label: 'How did you hear about MJN Healthcare?',
    choices: ['Friend or colleague', 'Facebook', 'Instagram', 'LinkedIn', 'WhatsApp', 'Google search', 'Event or webinar', OTHER_LABEL] },
  { type: 'SINGLE_CHOICE', required: true, label: 'May MJN Healthcare publish your review as a testimonial?',
    choices: [
      'Yes, with my full name',
      'Yes, but use only my first name and last initial',
      'No, please keep my feedback private',
    ] },
];

const sameLabel = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/**
 * Works out the full question list for the survey, reusing `existing` questions (matched by label)
 * and creating the missing ones. Returns the ordered rows plus a description of what is new.
 */
function planQuestions(existing = []) {
  const added = [];
  const used = new Set();

  const planned = QUESTIONS.map(({ choices, ...spec }) => {
    const match = existing.find((q) => !used.has(q.id) && sameLabel(q.label, spec.label));
    if (match) { used.add(match.id); return { ...match, isNew: false, changed: false }; }
    added.push(`"${spec.label}"`);
    return {
      id: id('q'), ...spec,
      options: choices ? choices.map((label) => ({ id: id('o'), label })) : null,
      showIf: null, isNew: true, changed: false,
    };
  });

  // The service question needs an "Other" choice for its follow-up to hang off.
  const service = planned.find((q) => sameLabel(q.label, SERVICE_LABEL));
  const followUp = planned.find((q) => sameLabel(q.label, SERVICE_FOLLOW_UP_LABEL));
  const serviceOptions = Array.isArray(service.options) ? service.options : [];
  let other = serviceOptions.find((o) => sameLabel(o.label, OTHER_LABEL));
  if (!other) {
    other = { id: id('o'), label: OTHER_LABEL };
    service.options = [...serviceOptions, other];
    if (!service.isNew) { service.changed = true; added.push(`the "Other" choice on "${service.label}"`); }
  }
  if (followUp.isNew) followUp.showIf = { questionId: service.id, operator: 'equals', value: other.id };

  // Questions added by hand in the builder stay, after the standard ones.
  const extras = existing.filter((q) => !used.has(q.id)).map((q) => ({ ...q, isNew: false, changed: false }));
  const rows = [...planned, ...extras].map((q, order) => ({ ...q, newOrder: order }));
  return { rows, added };
}

const toData = ({ isNew, changed, newOrder, order, surveyId, ...q }) => ({ ...q, order: newOrder });

/** Brings an existing survey up to date. Returns the list of things it added. */
async function upgradeSurvey(db, survey) {
  const { rows, added } = planQuestions(survey.questions);
  const reorder = rows.filter((q) => !q.isNew && (q.order !== q.newOrder || q.changed));
  if (added.length === 0 && reorder.length === 0) return [];

  await db.$transaction(async (tx) => {
    for (const q of rows.filter((r) => r.isNew)) {
      await tx.surveyQuestion.create({ data: { ...toData(q), surveyId: survey.id } });
    }
    for (const q of reorder) {
      await tx.surveyQuestion.update({
        where: { id: q.id },
        data: q.changed ? { order: q.newOrder, options: q.options } : { order: q.newOrder },
      });
    }
  });
  return added;
}

module.exports = { SURVEY, QUESTIONS, planQuestions, upgradeSurvey, SERVICE_LABEL, SERVICE_FOLLOW_UP_LABEL };

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
      const added = await upgradeSurvey(db, existing);
      if (added.length === 0) { console.log('The survey already has every question. Nothing was changed.'); return; }
      await audit(existing.id, 'survey.questions_saved', { added });
      console.log(`Updated "${existing.title}". Added:`);
      for (const item of added) console.log(`  - ${item}`);
      return;
    }

    const { rows } = planQuestions();
    const survey = await db.survey.create({
      data: { ...SURVEY, status: 'DRAFT', createdById: admin.id, questions: { create: rows.map(toData) } },
      include: { _count: { select: { questions: true } } },
    });
    await audit(survey.id, 'survey.created', { title: survey.title });
    console.log(`Created draft survey "${survey.title}" with ${survey._count.questions} questions (owner: ${admin.name ?? admin.email}).`);
    console.log('Open Admin -> Surveys to review and publish it.');
  })()
    .catch((err) => { console.error('Failed:', err.message); process.exitCode = 1; })
    .finally(() => db.$disconnect());
}
