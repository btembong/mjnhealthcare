// Creates the sample "Consultation Feedback" survey as a DRAFT. Safe to run twice.
const { randomBytes } = require('crypto');
const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');

const db = new PrismaClient();
const id = (prefix) => `${prefix}_${randomBytes(9).toString('hex')}`;
const options = (pairs) => pairs.map(([label, labelFr]) => ({ id: id('o'), label, labelFr }));

(async () => {
  const slug = 'consultation-feedback';
  if (await db.survey.findUnique({ where: { slug } })) {
    console.log(`A survey with the link name "${slug}" already exists. Nothing was changed.`);
    return;
  }
  const admin = await db.person.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('No admin user found to own the survey.');

  const clear = id('q');   // "Was your consultant clear?"
  const abroad = id('q');  // "Planning to work or study abroad?"

  const questions = [
    { type: 'RATING', required: true,
      label: 'How would you rate your consultation overall?',
      labelFr: "Comment évaluez-vous votre consultation dans l'ensemble ?" },
    { type: 'SINGLE_CHOICE', required: true,
      label: 'What did you come to us for?',
      labelFr: 'Pour quelle raison nous avez-vous consultés ?',
      options: options([
        ['Licensing support', 'Aide à la licence'],
        ['Exam preparation', 'Préparation aux examens'],
        ['Job placement abroad', "Placement à l'étranger"],
        ['Study abroad', "Études à l'étranger"],
        ['General health advice', 'Conseils de santé généraux'],
      ]) },
    { id: clear, type: 'YES_NO', required: true,
      label: 'Was your consultant clear and easy to understand?',
      labelFr: 'Votre consultant était-il clair et facile à comprendre ?' },
    { type: 'LONG_TEXT', required: false,
      label: 'What could your consultant have explained better?',
      labelFr: "Qu'est-ce que votre consultant aurait pu mieux expliquer ?",
      showIf: { questionId: clear, operator: 'equals', value: 'no' } },
    { id: abroad, type: 'YES_NO', required: true,
      label: 'Are you planning to work or study abroad?',
      labelFr: "Envisagez-vous de travailler ou d'étudier à l'étranger ?" },
    { type: 'SINGLE_CHOICE', required: true,
      label: 'Which country interests you most?',
      labelFr: 'Quel pays vous intéresse le plus ?',
      options: options([
        ['United Arab Emirates', 'Émirats arabes unis'],
        ['United Kingdom', 'Royaume-Uni'],
        ['United States', 'États-Unis'],
        ['Ireland', 'Irlande'],
        ['Canada', 'Canada'],
        ['Other', 'Autre'],
      ]),
      showIf: { questionId: abroad, operator: 'equals', value: 'yes' } },
    { type: 'MULTI_CHOICE', required: false,
      label: 'Which of our services would you like to hear more about?',
      labelFr: 'Sur quels services souhaitez-vous en savoir plus ?',
      options: options([
        ['DataFlow / licensing', 'DataFlow / licence'],
        ['NCLEX preparation', 'Préparation au NCLEX'],
        ['DHA / HAAD preparation', 'Préparation DHA / HAAD'],
        ['Job placement', 'Placement'],
        ['University applications', 'Candidatures universitaires'],
      ]) },
    { type: 'SCALE', required: true,
      label: 'How likely are you to recommend MJN Healthcare to a friend or colleague?',
      labelFr: 'Recommanderiez-vous MJN Healthcare à un ami ou un collègue ?' },
    { type: 'LONG_TEXT', required: false,
      label: 'What is the main reason for your score?',
      labelFr: 'Quelle est la principale raison de votre note ?' },
    { type: 'PHONE', required: false,
      label: 'What is the best phone number to reach you on?',
      labelFr: 'Quel est le meilleur numéro pour vous joindre ?',
      helpText: 'Optional. Include your country code.',
      helpTextFr: "Facultatif. Indiquez l'indicatif du pays." },
  ];

  const survey = await db.survey.create({
    data: {
      slug,
      status: 'DRAFT',
      title: 'Consultation Feedback',
      titleFr: 'Votre avis sur la consultation',
      description: 'Thank you for your consultation with MJN Healthcare. Your answers help us improve. It takes about two minutes.',
      descriptionFr: "Merci pour votre consultation avec MJN Healthcare. Vos réponses nous aident à nous améliorer. Cela prend environ deux minutes.",
      layout: 'ONE_PER_PAGE',
      identified: true,
      onePerPerson: true,
      captureLead: true,
      showInPortal: true,
      consentText: 'I agree that MJN Healthcare may store my answers and contact me about them.',
      consentTextFr: "J'accepte que MJN Healthcare conserve mes réponses et me contacte à leur sujet.",
      thankYouMessage: 'Thank you. Your feedback helps us serve you better.',
      thankYouMessageFr: 'Merci. Votre avis nous aide à mieux vous servir.',
      ctaLabel: 'Book another consultation',
      ctaLabelFr: 'Réserver une autre consultation',
      ctaUrl: 'https://mjnhealthcare.com/consult',
      createdById: admin.id,
      questions: {
        create: questions.map((q, order) => ({ id: q.id ?? id('q'), order, ...q })),
      },
    },
    include: { _count: { select: { questions: true } } },
  });

  await db.auditLog.create({
    data: { actorId: admin.id, action: 'survey.created', resourceType: 'survey', resourceId: survey.id, metadata: { title: survey.title, source: 'sample script' } },
  });
  console.log(`Created draft survey "${survey.title}" with ${survey._count.questions} questions (owner: ${admin.name ?? admin.email}).`);
  console.log('Open Admin -> Surveys to review and publish it.');
})()
  .catch((err) => { console.error('Failed:', err.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
