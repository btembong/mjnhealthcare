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
      title: "My Case",
      steps: [
        {
          target: 'case-title',
          title: "Your case in one place",
          body: "This page follows your case from signing to completion. The line under the title shows your destination, your case reference and its status.",
        },
        {
          target: 'case-pipeline',
          skipIfMissing: true,
          title: "Your journey",
          body: "Every stage of your case, in order. Completed stages are ticked and the highlighted one is where you are now.",
        },
        {
          target: 'case-todo',
          skipIfMissing: true,
          title: "What you need to do",
          body: "Everything waiting on you, each with its own button: a letter to sign, a document to upload or replace, a form to return, or a payment. When it is empty, nothing is needed from you.",
        },
        {
          target: 'case-doing',
          skipIfMissing: true,
          title: "What we are doing",
          body: "The latest submission your team made to a licensing body, and their most recent update to you.",
        },
        {
          target: 'case-tabs',
          skipIfMissing: true,
          title: "The details",
          body: "Stages shows what your current stage needs. Updates and Submissions list everything your team has sent and filed. History shows what has happened so far.",
        },
        {
          target: 'case-team',
          skipIfMissing: true,
          title: "Your team",
          body: "The consultant and processing officer on your case. Message them or book a call from here.",
        },
        {
          target: 'case-letter',
          skipIfMissing: true,
          title: "Engagement letter",
          body: "This sets out the agreed scope and fees. It must be signed before any payment can be taken. Once signed, you can download a copy here.",
        },
        {
          target: 'case-bot',
          skipIfMissing: true,
          title: "Quick status questions",
          body: "Ask where your case stands or which documents are still needed. Questions about eligibility or outcomes go to your consultant.",
        },
      ],
    },
    'portal.documents': {
      title: "My documents",
      steps: [
        {
          target: 'page-actions',
          title: "Upload a document",
          body: "Start here. Choose the file, say what the document is, and add the expiry date if it has one. You can add several files at once.",
        },
        {
          target: 'docs-checklist',
          skipIfMissing: true,
          title: "Needed now",
          body: "The documents your current stage requires, with the state of each. Use the button on a row to upload exactly that document.",
        },
        {
          target: 'docs-forms',
          skipIfMissing: true,
          title: "Forms to complete",
          body: "Forms your team has sent you. Download the form, complete it, then return it here.",
        },
        {
          target: 'docs-filters',
          title: "Find a document",
          body: "Show only what needs replacing, what is being checked, what is ready, or what expires within 30 days.",
        },
        {
          target: 'docs-list',
          skipIfMissing: true,
          title: "Your documents",
          body: "Each document with its status. If one is not accepted you see the reason and can upload a new copy. You can remove a document until our team has checked it.",
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
      title: "Mon dossier",
      steps: [
        {
          target: 'case-title',
          title: "Votre dossier au même endroit",
          body: "Cette page suit votre dossier de la signature jusqu'à la fin. La ligne sous le titre indique votre destination, la référence de votre dossier et son statut.",
        },
        {
          target: 'case-pipeline',
          skipIfMissing: true,
          title: "Votre parcours",
          body: "Toutes les étapes de votre dossier, dans l'ordre. Les étapes terminées sont cochées et celle qui est mise en avant est celle où vous vous trouvez.",
        },
        {
          target: 'case-todo',
          skipIfMissing: true,
          title: "Ce que vous devez faire",
          body: "Tout ce qui dépend de vous, chacun avec son bouton : une lettre à signer, un document à déposer ou à remplacer, un formulaire à renvoyer, ou un paiement. Si la liste est vide, rien n'est attendu de vous.",
        },
        {
          target: 'case-doing',
          skipIfMissing: true,
          title: "Ce que nous faisons",
          body: "Le dernier dépôt effectué par votre équipe auprès d'un organisme, et la dernière nouvelle qu'elle vous a envoyée.",
        },
        {
          target: 'case-tabs',
          skipIfMissing: true,
          title: "Le détail",
          body: "« Étapes » indique ce que demande votre étape actuelle. « Nouvelles » et « Dépôts » listent tout ce que votre équipe a envoyé et déposé. « Historique » retrace ce qui s'est passé jusqu'ici.",
        },
        {
          target: 'case-team',
          skipIfMissing: true,
          title: "Votre équipe",
          body: "Le consultant et l'agent de traitement de votre dossier. Écrivez-leur ou réservez un appel d'ici.",
        },
        {
          target: 'case-letter',
          skipIfMissing: true,
          title: "Lettre d'engagement",
          body: "Elle précise le périmètre et les frais convenus. Elle doit être signée avant tout paiement. Une fois signée, vous pouvez en télécharger une copie ici.",
        },
        {
          target: 'case-bot',
          skipIfMissing: true,
          title: "Questions rapides sur votre dossier",
          body: "Demandez où en est votre dossier ou quels documents manquent encore. Les questions d'admissibilité ou de résultat sont traitées par votre consultant.",
        },
      ],
    },
    'portal.documents': {
      title: "Mes documents",
      steps: [
        {
          target: 'page-actions',
          title: "Déposer un document",
          body: "Commencez ici. Choisissez le fichier, indiquez de quel document il s'agit et ajoutez la date d'expiration s'il en a une. Vous pouvez ajouter plusieurs fichiers à la fois.",
        },
        {
          target: 'docs-checklist',
          skipIfMissing: true,
          title: "À fournir maintenant",
          body: "Les documents demandés pour votre étape actuelle, avec l'état de chacun. Utilisez le bouton d'une ligne pour déposer précisément ce document.",
        },
        {
          target: 'docs-forms',
          skipIfMissing: true,
          title: "Formulaires à remplir",
          body: "Les formulaires que votre équipe vous a envoyés. Téléchargez le formulaire, remplissez-le, puis renvoyez-le ici.",
        },
        {
          target: 'docs-filters',
          title: "Trouver un document",
          body: "Affichez uniquement ce qui est à remplacer, ce qui est en vérification, ce qui est prêt, ou ce qui expire dans les 30 jours.",
        },
        {
          target: 'docs-list',
          skipIfMissing: true,
          title: "Vos documents",
          body: "Chaque document avec son statut. Si l'un d'eux n'est pas accepté, vous en voyez la raison et pouvez en déposer une nouvelle copie. Vous pouvez retirer un document tant que notre équipe ne l'a pas vérifié.",
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
