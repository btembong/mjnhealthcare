// Creates the "MJN Healthcare Client Feedback Survey" as a DRAFT. Safe to run twice.
const { randomBytes } = require('crypto');
const { PrismaClient } = require('../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');

const id = (prefix) => `${prefix}_${randomBytes(9).toString('hex')}`;
const options = (labels) => labels.map((label) => ({ id: id('o'), label }));

const SURVEY = {
  slug: 'client-feedback',
  title: 'MJN Healthcare Client Feedback Survey',
  description:
    'Thank you for choosing MJN Healthcare. Your feedback will help us improve our services and better support future clients. This survey should take less than two minutes.',
  layout: 'ALL_ON_ONE',
  thankYouMessage:
    'Thank you for helping MJN Healthcare improve and continue serving healthcare professionals and students across Africa and beyond.',
};

const QUESTIONS = [
  { type: 'SHORT_TEXT', required: true, label: 'Full Name' },
  { type: 'MONTH_YEAR', required: true, label: 'When was the service provided?' },
  { type: 'DROPDOWN', required: true, label: 'Which service did you receive?',
    options: options(['DHA DataFlow', 'DOH DataFlow', 'MOH DataFlow', 'NCLEX–US', 'UK CBT', 'Student Support']) },
  { type: 'RATING', required: true, label: 'How would you rate your overall experience with MJN Healthcare?' },
  { type: 'LONG_TEXT', required: true, label: 'Please share your experience or review.',
    helpText: 'You may describe the service you received, the support provided, your outcome, and any recommendations for improvement.' },
  { type: 'SINGLE_CHOICE', required: true, label: 'May MJN Healthcare publish your review as a testimonial?',
    options: options([
      'Yes, with my full name',
      'Yes, but use only my first name and last initial',
      'No, please keep my feedback private',
    ]) },
];

module.exports = { SURVEY, QUESTIONS };

if (require.main === module) {
  const db = new PrismaClient();
  (async () => {
    if (await db.survey.findUnique({ where: { slug: SURVEY.slug } })) {
      console.log(`A survey with the link name "${SURVEY.slug}" already exists. Nothing was changed.`);
      return;
    }
    const admin = await db.person.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    if (!admin) throw new Error('No admin user found to own the survey.');

    const survey = await db.survey.create({
      data: {
        ...SURVEY,
        status: 'DRAFT',
        createdById: admin.id,
        questions: { create: QUESTIONS.map((q, order) => ({ id: id('q'), order, ...q })) },
      },
      include: { _count: { select: { questions: true } } },
    });
    await db.auditLog.create({
      data: { actorId: admin.id, action: 'survey.created', resourceType: 'survey', resourceId: survey.id, metadata: { title: survey.title, source: 'seed script' } },
    });
    console.log(`Created draft survey "${survey.title}" with ${survey._count.questions} questions (owner: ${admin.name ?? admin.email}).`);
    console.log('Open Admin -> Surveys to review and publish it.');
  })()
    .catch((err) => { console.error('Failed:', err.message); process.exitCode = 1; })
    .finally(() => db.$disconnect());
}
