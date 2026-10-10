import type { TourDef, TourLabels } from '@mjn/ui';

export type TourLocale = 'en' | 'fr';

export const WELCOME_TOUR = 'portal.welcome';

const PAGE_TOURS: Record<string, string> = {
  '/': 'portal.dashboard',
  '/case': 'portal.case',
  '/documents': 'portal.documents',
  '/checkout': 'portal.checkout',
  '/payments': 'portal.payments',
  '/bookings': 'portal.bookings',
  '/academy': 'portal.academy',
  '/settings': 'portal.settings',
};

export function tourKeyForPath(pathname: string): string | null {
  return PAGE_TOURS[pathname] ?? null;
}

const LABELS: Record<TourLocale, TourLabels> = {
  en: {
    next: 'Next',
    back: 'Back',
    done: 'Got it',
    skip: 'Skip tour',
    stepOf: (current, total) => `Step ${current} of ${total}`,
    help: 'Help and guided tours',
    helpTitle: 'Help for this page',
    startPageTour: 'Show me around this page',
    walkthrough: 'Replay the portal walkthrough',
    noGuide: 'There is no guide for this page yet. You can replay the portal walkthrough or message us below.',
  },
  fr: {
    next: 'Suivant',
    back: 'Retour',
    done: 'Compris',
    skip: 'Passer la visite',
    stepOf: (current, total) => `Étape ${current} sur ${total}`,
    help: 'Aide et visites guidées',
    helpTitle: 'Aide pour cette page',
    startPageTour: 'Faire la visite de cette page',
    walkthrough: 'Revoir la visite du portail',
    noGuide: "Il n'y a pas encore de guide pour cette page. Vous pouvez revoir la visite du portail ou nous écrire ci-dessous.",
  },
};

export const SUPPORT_LABEL: Record<TourLocale, string> = {
  en: 'Message your consultant',
  fr: 'Écrire à votre consultant',
};

const TOURS: Record<TourLocale, Record<string, TourDef>> = {
  en: {
    'portal.welcome': {
      title: 'Portal walkthrough',
      steps: [
        {
          title: 'Welcome to your MJN portal',
          body: 'This is where you follow your case, send us your documents, pay for services and reach your consultant. Here is a one-minute look around.',
        },
        {
          target: 'nav:/case',
          title: 'My Case',
          body: 'Your engagement letter, the stages of your pathway and updates from your consultant are all here.',
        },
        {
          target: 'nav:/documents',
          title: 'Documents',
          body: 'Upload your passport, licences and certificates here. We check each one and tell you if anything needs replacing.',
        },
        {
          target: 'nav:/payments',
          title: 'Payments',
          body: 'See what you owe, pay securely and download your receipts. New services are chosen under Checkout, just below.',
        },
        {
          target: 'help-button',
          title: 'Help is always here',
          body: 'Open this on any page for a short guide to that page, to replay a tour, or to message your consultant.',
        },
      ],
    },
    'portal.dashboard': {
      title: 'Your dashboard',
      steps: [
        {
          target: 'dash-hero',
          title: 'Where you stand',
          body: 'Your current stage, what comes next, and four key figures. Select any figure to open that part of the portal.',
        },
        {
          target: 'dash-pipeline',
          title: 'Your licensing pipeline',
          body: 'Every stage of your pathway in order. Completed stages are marked done and the one in progress is marked active.',
        },
        {
          target: 'dash-rail',
          title: 'What needs you, and who to ask',
          body: 'Anything waiting on you appears here with a button to deal with it, followed by your next session, your consultant and your document status.',
        },
      ],
    },
    'portal.case': {
      title: 'My Case',
      steps: [
        {
          target: 'case-title',
          title: 'Your case in one place',
          body: 'This page follows your engagement from signing to completion. Once a consultant is assigned you can message them from here.',
        },
        {
          target: 'case-letter',
          skipIfMissing: true,
          title: 'Engagement letter',
          body: 'This sets out the agreed scope and fees. It must be signed before any payment can be taken, so sign it here first.',
        },
        {
          target: 'case-pipeline',
          skipIfMissing: true,
          title: 'Your stages',
          body: 'The stages of your pathway, in order. Your consultant moves you forward as each one is completed.',
        },
        {
          target: 'case-bot',
          skipIfMissing: true,
          title: 'Quick status questions',
          body: 'Ask where your case stands or which documents are still needed. Questions about eligibility or outcomes go to your consultant.',
        },
      ],
    },
    'portal.documents': {
      title: 'Document Vault',
      steps: [
        {
          target: 'page-actions',
          title: 'Upload a document',
          body: 'Start here. Choose the file, tell us what type of document it is, and add the expiry date if it has one.',
        },
        {
          target: 'docs-checklist',
          skipIfMissing: true,
          title: 'What your current stage needs',
          body: 'The documents required for the stage you are on. Uploading these keeps your case moving.',
        },
        {
          target: 'docs-stats',
          title: 'Where your documents stand',
          body: 'After upload a document is reviewed by our team. It is then verified, or rejected with a reason so you can upload a corrected copy.',
        },
        {
          target: 'docs-filters',
          title: 'Find a document',
          body: 'Filter by status to see only what is still in review or needs replacing. Documents close to expiry are flagged so you can renew in time.',
        },
      ],
    },
    'portal.checkout': {
      title: 'Checkout',
      steps: [
        {
          target: 'checkout-steps',
          title: 'Three steps',
          body: 'Select your services, review your cart, then pay. Your engagement letter must be signed before you can pay.',
        },
        {
          target: 'checkout-main',
          title: 'Choose your services',
          body: 'Pick the services you need. Prices that depend on your profession are set from your profile. The engagement fee and tax are added for you and shown as separate lines.',
        },
        {
          title: 'Paying in instalments',
          body: 'Where a service is split into instalments, only the first is charged now. We send you the next one when it falls due.',
        },
      ],
    },
    'portal.payments': {
      title: 'Payments',
      steps: [
        {
          target: 'pay-due',
          skipIfMissing: true,
          title: 'Payment due',
          body: 'When something is outstanding it appears here with a button to pay.',
        },
        {
          target: 'pay-stats',
          title: 'Your totals',
          body: 'What you have paid so far and what is still to come.',
        },
        {
          target: 'pay-plan',
          skipIfMissing: true,
          title: 'Your service plan',
          body: 'The services in your plan, stage by stage, and which ones are already paid.',
        },
        {
          target: 'pay-invoices',
          title: 'Invoices and receipts',
          body: 'Every order you have placed. Download a PDF receipt for any payment from this list.',
        },
      ],
    },
    'portal.bookings': {
      title: 'Bookings',
      steps: [
        {
          target: 'bookings-header',
          title: 'Book a session',
          body: 'Schedule time with your consultant or join an academy class. Choose a slot that suits you.',
        },
        {
          target: 'bookings-list',
          title: 'Upcoming and past sessions',
          body: 'Your sessions are listed here. When a session is about to start you can join it from this page, and upcoming sessions can be cancelled.',
        },
      ],
    },
    'portal.academy': {
      title: 'Academy',
      steps: [
        {
          target: 'page-header',
          title: 'Exam preparation',
          body: 'Courses, practice questions and study resources for your licensing exams.',
        },
        {
          target: 'academy-stats',
          title: 'Your progress at a glance',
          body: 'How many courses you have and how your practice is going.',
        },
        {
          target: 'academy-tabs',
          title: 'Courses, study plan and progress',
          body: 'Switch between your courses, your study plan and your practice results. Topics where you score low are highlighted so you know what to revise.',
        },
        {
          target: 'academy-assistant',
          title: 'Study Assistant',
          body: 'Ask it to explain a question or a topic in plain language. On a phone, use the Ask AI button. It helps you study; it cannot tell you whether you will pass or qualify.',
        },
      ],
    },
    'portal.settings': {
      title: 'Settings',
      steps: [
        {
          target: 'settings-profile',
          title: 'Your profile',
          body: 'Keep your name and profession up to date, as some prices depend on your profession. You can also choose English or French here.',
        },
        {
          target: 'settings-notifications',
          title: 'Notifications',
          body: 'Choose which reminders and updates you want to receive.',
        },
      ],
    },
  },

  fr: {
    'portal.welcome': {
      title: 'Visite du portail',
      steps: [
        {
          title: 'Bienvenue sur votre portail MJN',
          body: "C'est ici que vous suivez votre dossier, nous envoyez vos documents, réglez vos services et contactez votre consultant. Voici un tour d'horizon d'une minute.",
        },
        {
          target: 'nav:/case',
          title: 'Mon dossier',
          body: "Votre lettre d'engagement, les étapes de votre parcours et les nouvelles de votre consultant se trouvent ici.",
        },
        {
          target: 'nav:/documents',
          title: 'Documents',
          body: "Déposez ici votre passeport, vos licences et vos certificats. Nous vérifions chaque document et vous prévenons si l'un d'eux doit être remplacé.",
        },
        {
          target: 'nav:/payments',
          title: 'Paiements',
          body: 'Consultez ce que vous devez, payez en toute sécurité et téléchargez vos reçus. Les nouveaux services se choisissent dans Checkout, juste en dessous.',
        },
        {
          target: 'help-button',
          title: "L'aide est toujours ici",
          body: 'Ouvrez ce bouton sur n’importe quelle page pour lire un court guide, revoir une visite ou écrire à votre consultant.',
        },
      ],
    },
    'portal.dashboard': {
      title: 'Votre tableau de bord',
      steps: [
        {
          target: 'dash-hero',
          title: 'Où vous en êtes',
          body: "Votre étape actuelle, la suivante et quatre chiffres clés. Sélectionnez un chiffre pour ouvrir la partie du portail correspondante.",
        },
        {
          target: 'dash-pipeline',
          title: 'Votre parcours de licence',
          body: "Toutes les étapes de votre parcours, dans l'ordre. Les étapes terminées sont marquées comme telles et celle en cours est indiquée comme active.",
        },
        {
          target: 'dash-rail',
          title: 'Ce qui vous attend, et à qui demander',
          body: 'Tout ce qui nécessite une action de votre part apparaît ici avec un bouton pour la traiter, suivi de votre prochaine séance, de votre consultant et de l’état de vos documents.',
        },
      ],
    },
    'portal.case': {
      title: 'Mon dossier',
      steps: [
        {
          target: 'case-title',
          title: 'Votre dossier au même endroit',
          body: "Cette page suit votre engagement de la signature jusqu'à la fin. Dès qu'un consultant vous est attribué, vous pouvez lui écrire d'ici.",
        },
        {
          target: 'case-letter',
          skipIfMissing: true,
          title: "Lettre d'engagement",
          body: "Elle précise le périmètre et les frais convenus. Elle doit être signée avant tout paiement : signez-la ici en premier.",
        },
        {
          target: 'case-pipeline',
          skipIfMissing: true,
          title: 'Vos étapes',
          body: "Les étapes de votre parcours, dans l'ordre. Votre consultant vous fait avancer à mesure que chacune est terminée.",
        },
        {
          target: 'case-bot',
          skipIfMissing: true,
          title: 'Questions rapides sur votre dossier',
          body: "Demandez où en est votre dossier ou quels documents manquent encore. Les questions d'admissibilité ou de résultat sont traitées par votre consultant.",
        },
      ],
    },
    'portal.documents': {
      title: 'Coffre-fort de documents',
      steps: [
        {
          target: 'page-actions',
          title: 'Déposer un document',
          body: "Commencez ici. Choisissez le fichier, indiquez de quel type de document il s'agit et ajoutez la date d'expiration s'il en a une.",
        },
        {
          target: 'docs-checklist',
          skipIfMissing: true,
          title: 'Ce que demande votre étape actuelle',
          body: "Les documents requis pour l'étape en cours. Les déposer permet à votre dossier d'avancer.",
        },
        {
          target: 'docs-stats',
          title: 'Où en sont vos documents',
          body: 'Après le dépôt, notre équipe examine le document. Il est ensuite vérifié, ou refusé avec un motif afin que vous puissiez déposer une version corrigée.',
        },
        {
          target: 'docs-filters',
          title: 'Retrouver un document',
          body: "Filtrez par statut pour ne voir que ce qui est en cours d'examen ou à remplacer. Les documents proches de l'expiration sont signalés pour que vous puissiez les renouveler à temps.",
        },
      ],
    },
    'portal.checkout': {
      title: 'Checkout',
      steps: [
        {
          target: 'checkout-steps',
          title: 'Trois étapes',
          body: "Sélectionnez vos services, vérifiez votre panier, puis payez. Votre lettre d'engagement doit être signée avant de pouvoir payer.",
        },
        {
          target: 'checkout-main',
          title: 'Choisir vos services',
          body: "Choisissez les services dont vous avez besoin. Les prix qui dépendent de votre profession sont déterminés à partir de votre profil. Les frais d'engagement et la taxe sont ajoutés pour vous et affichés sur des lignes séparées.",
        },
        {
          title: 'Paiement en plusieurs versements',
          body: "Lorsqu'un service est réparti en versements, seul le premier est facturé maintenant. Nous vous envoyons le suivant à son échéance.",
        },
      ],
    },
    'portal.payments': {
      title: 'Paiements',
      steps: [
        {
          target: 'pay-due',
          skipIfMissing: true,
          title: 'Paiement à régler',
          body: "Lorsqu'un montant est dû, il apparaît ici avec un bouton pour payer.",
        },
        {
          target: 'pay-stats',
          title: 'Vos totaux',
          body: "Ce que vous avez payé jusqu'ici et ce qui reste à venir.",
        },
        {
          target: 'pay-plan',
          skipIfMissing: true,
          title: 'Votre plan de services',
          body: 'Les services de votre plan, étape par étape, et ceux qui sont déjà réglés.',
        },
        {
          target: 'pay-invoices',
          title: 'Factures et reçus',
          body: 'Toutes vos commandes. Téléchargez depuis cette liste le reçu PDF de chaque paiement.',
        },
      ],
    },
    'portal.bookings': {
      title: 'Réservations',
      steps: [
        {
          target: 'bookings-header',
          title: 'Réserver une séance',
          body: "Planifiez un moment avec votre consultant ou rejoignez un cours de l'académie. Choisissez le créneau qui vous convient.",
        },
        {
          target: 'bookings-list',
          title: 'Séances à venir et passées',
          body: "Vos séances sont listées ici. Lorsqu'une séance est sur le point de commencer, vous pouvez la rejoindre depuis cette page ; les séances à venir peuvent être annulées.",
        },
      ],
    },
    'portal.academy': {
      title: 'Académie',
      steps: [
        {
          target: 'page-header',
          title: 'Préparation aux examens',
          body: "Cours, questions d'entraînement et ressources d'étude pour vos examens de licence.",
        },
        {
          target: 'academy-stats',
          title: "Vos progrès en un coup d'œil",
          body: 'Le nombre de cours que vous suivez et vos résultats aux entraînements.',
        },
        {
          target: 'academy-tabs',
          title: "Cours, plan d'étude et progrès",
          body: "Passez de vos cours à votre plan d'étude et à vos résultats. Les sujets où vos scores sont faibles sont mis en évidence pour vous indiquer quoi réviser.",
        },
        {
          target: 'academy-assistant',
          title: "Assistant d'étude",
          body: "Demandez-lui d'expliquer une question ou un sujet en termes simples. Sur téléphone, utilisez le bouton Ask AI. Il vous aide à étudier ; il ne peut pas vous dire si vous réussirez ou serez admissible.",
        },
      ],
    },
    'portal.settings': {
      title: 'Paramètres',
      steps: [
        {
          target: 'settings-profile',
          title: 'Votre profil',
          body: "Gardez votre nom et votre profession à jour, car certains prix dépendent de votre profession. Vous pouvez aussi choisir ici l'anglais ou le français.",
        },
        {
          target: 'settings-notifications',
          title: 'Notifications',
          body: 'Choisissez les rappels et les nouvelles que vous souhaitez recevoir.',
        },
      ],
    },
  },
};

export function getTours(locale: TourLocale): Record<string, TourDef> {
  return TOURS[locale];
}

export function getTourLabels(locale: TourLocale): TourLabels {
  return LABELS[locale];
}
