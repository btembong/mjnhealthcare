import type { TourDef, TourLabels } from '@mjn/ui';

export type TourLocale = 'en' | 'fr';

export const WELCOME_TOUR = 'portal.welcome';

const PAGE_TOURS: Record<string, string> = {
  '/': 'portal.dashboard',
  '/case': 'portal.case',
  '/documents': 'portal.documents',
  '/checkout': 'portal.checkout',
  '/payments': 'portal.payments',
  '/messages': 'portal.messages',
  '/tickets': 'portal.tickets',
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
    'portal.messages': {
      title: "Messages",
      steps: [
        {
          target: 'msg-header',
          skipIfMissing: true,
          title: "Who you are writing to",
          body: "The people working on your case. They usually reply within one working day, and you are emailed when they do.",
        },
        {
          target: 'msg-thread',
          skipIfMissing: true,
          title: "One conversation",
          body: "Everything said between you and your team, including the updates they send about your case.",
        },
        {
          target: 'msg-compose',
          skipIfMissing: true,
          title: "Write or send a file",
          body: "Type your message, or use the paperclip to send a photo or file. A file sent here stays in this conversation; to submit a document for your case, use My documents.",
        },
        {
          title: "For other problems",
          body: "If something is wrong with the portal or a payment, Get Help in the menu reaches our support team directly.",
        },
      ],
    },
    'portal.tickets': {
      title: "Get help",
      steps: [
        {
          target: 'help-quick',
          skipIfMissing: true,
          title: "Quick answers",
          body: "The four things people most often need. Each takes you straight to the page that solves it.",
        },
        {
          target: 'help-ask',
          title: "Ask for help",
          body: "For a problem with the portal, a payment, your account or a session. Say what happened and add a screenshot if you can. Questions about your case or licence go to your team in Messages.",
        },
        {
          target: 'help-requests',
          title: "Your requests",
          body: "Each request shows whose turn it is: waiting for us, we replied, or solved. You are emailed when we reply.",
        },
        {
          title: "When it is fixed",
          body: "Mark a request as solved once your problem is fixed. If it comes back, reply within 14 days to reopen the same request.",
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
      title: "Payments",
      steps: [
        {
          target: 'pay-due',
          title: "What you owe now",
          body: "Anything to pay appears here with what it is for and one Pay button. After you pay, this card tells you while we confirm it, so you do not pay twice.",
        },
        {
          target: 'pay-plan',
          skipIfMissing: true,
          title: "Your plan",
          body: "When your consultant has agreed a plan with you, its stages are listed here with what is paid, what is due and what comes later.",
        },
        {
          target: 'pay-invoices',
          title: "Payments and receipts",
          body: "Everything you have been asked to pay. Open a row to see its items, and download a receipt for anything paid.",
        },
        {
          target: 'pay-consults',
          skipIfMissing: true,
          title: "Consultations",
          body: "What you paid for each consultation, and any refund.",
        },
        {
          target: 'pay-stats',
          skipIfMissing: true,
          title: "Summary",
          body: "What you have paid so far against the total agreed.",
        },
      ],
    },
    'portal.bookings': {
      title: "My sessions",
      steps: [
        {
          target: 'bookings-header',
          title: "Book a session",
          body: "Book time with a consultant whenever you need it. Choose a time that suits you.",
        },
        {
          target: 'bookings-next',
          skipIfMissing: true,
          title: "Your next session",
          body: "When it is, who it is with, and the Join button. Join opens 10 minutes before the start. Times are shown in your own time zone.",
        },
        {
          target: 'bookings-list',
          title: "Upcoming and past",
          body: "Your other sessions. From an upcoming one you can add it to your calendar, move it or cancel it. Past sessions show how they ended and any refund.",
        },
        {
          target: 'bookings-rules',
          skipIfMissing: true,
          title: "Moving and cancelling",
          body: "A session can be moved once, free, when it is more than 24 hours away. Before you cancel you are shown exactly what will be refunded.",
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
      title: "Settings",
      steps: [
        {
          target: 'settings-profile',
          title: "Your profile",
          body: "Your name and profession. Some prices depend on your profession, so once your case has started it can only be changed by your team.",
        },
        {
          target: 'settings-contact',
          title: "Contact details",
          body: "The email you sign in with and the phone number we use for WhatsApp reminders. Changing your email needs a code sent to the new address.",
        },
        {
          target: 'settings-language',
          title: "Language",
          body: "Choose English or French. Emails, guides and the main pages follow your choice.",
        },
        {
          target: 'settings-notifications',
          title: "Notifications",
          body: "Messages about your case are always emailed. You can turn off the WhatsApp copies, and choose whether to receive news and offers.",
        },
        {
          target: 'settings-privacy',
          title: "Privacy and data",
          body: "Ask for a copy of the information we hold about you, or ask us to delete your account. A person on our team handles each request.",
        },
        {
          target: 'settings-signin',
          title: "Sign-in",
          body: "Sign out here. If you signed in on a device that is not yours, sign out on all devices.",
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
    'portal.messages': {
      title: "Messages",
      steps: [
        {
          target: 'msg-header',
          skipIfMissing: true,
          title: "À qui vous écrivez",
          body: "Les personnes qui travaillent sur votre dossier. Elles répondent généralement sous un jour ouvré, et vous recevez un e-mail à chaque réponse.",
        },
        {
          target: 'msg-thread',
          skipIfMissing: true,
          title: "Une seule conversation",
          body: "Tout ce qui s'est dit entre vous et votre équipe, y compris les nouvelles qu'elle vous envoie sur votre dossier.",
        },
        {
          target: 'msg-compose',
          skipIfMissing: true,
          title: "Écrire ou envoyer un fichier",
          body: "Saisissez votre message, ou utilisez le trombone pour envoyer une photo ou un fichier. Un fichier envoyé ici reste dans cette conversation ; pour fournir un document à votre dossier, passez par « Mes documents ».",
        },
        {
          title: "Pour tout autre problème",
          body: "En cas de souci avec le portail ou un paiement, « Get Help » dans le menu vous met directement en contact avec notre équipe d'assistance.",
        },
      ],
    },
    'portal.tickets': {
      title: "Obtenir de l’aide",
      steps: [
        {
          target: 'help-quick',
          skipIfMissing: true,
          title: "Réponses rapides",
          body: "Les quatre besoins les plus fréquents. Chacun vous mène directement à la page qui règle le problème.",
        },
        {
          target: 'help-ask',
          title: "Demander de l’aide",
          body: "Pour un problème avec le portail, un paiement, votre compte ou une séance. Dites ce qui s'est passé et ajoutez une capture d'écran si possible. Les questions sur votre dossier ou votre autorisation d'exercer vont à votre équipe dans « Messages ».",
        },
        {
          target: 'help-requests',
          title: "Vos demandes",
          body: "Chaque demande indique à qui c'est le tour : en attente de notre réponse, nous avons répondu, ou résolue. Vous recevez un e-mail à chacune de nos réponses.",
        },
        {
          title: "Quand c’est réglé",
          body: "Marquez une demande comme résolue une fois votre problème réglé. S'il revient, répondez dans les 14 jours pour rouvrir la même demande.",
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
      title: "Paiements",
      steps: [
        {
          target: 'pay-due',
          title: "Ce que vous devez maintenant",
          body: "Tout montant à régler apparaît ici avec son détail et un seul bouton pour payer. Après votre paiement, cette carte vous indique que nous le confirmons, pour éviter de payer deux fois.",
        },
        {
          target: 'pay-plan',
          skipIfMissing: true,
          title: "Votre plan",
          body: "Lorsque votre consultant a convenu d'un plan avec vous, ses étapes sont listées ici : ce qui est payé, ce qui est à régler et ce qui viendra plus tard.",
        },
        {
          target: 'pay-invoices',
          title: "Paiements et reçus",
          body: "Tout ce qui vous a été demandé. Ouvrez une ligne pour en voir le détail, et téléchargez un reçu pour tout ce qui est payé.",
        },
        {
          target: 'pay-consults',
          skipIfMissing: true,
          title: "Consultations",
          body: "Ce que vous avez payé pour chaque consultation, et tout remboursement.",
        },
        {
          target: 'pay-stats',
          skipIfMissing: true,
          title: "Résumé",
          body: "Ce que vous avez payé à ce jour par rapport au total convenu.",
        },
      ],
    },
    'portal.bookings': {
      title: "Mes séances",
      steps: [
        {
          target: 'bookings-header',
          title: "Réserver une séance",
          body: "Réservez un moment avec un consultant quand vous en avez besoin. Choisissez le créneau qui vous convient.",
        },
        {
          target: 'bookings-next',
          skipIfMissing: true,
          title: "Votre prochaine séance",
          body: "La date, l'heure, la personne que vous rencontrez et le bouton « Rejoindre ». Il s'active 10 minutes avant le début. Les heures sont affichées dans votre fuseau horaire.",
        },
        {
          target: 'bookings-list',
          title: "À venir et passées",
          body: "Vos autres séances. Pour une séance à venir, vous pouvez l'ajouter à votre calendrier, la déplacer ou l'annuler. Les séances passées indiquent leur issue et tout remboursement.",
        },
        {
          target: 'bookings-rules',
          skipIfMissing: true,
          title: "Déplacer et annuler",
          body: "Une séance peut être déplacée une fois, gratuitement, si elle a lieu dans plus de 24 heures. Avant d'annuler, le montant exact du remboursement vous est indiqué.",
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
      title: "Paramètres",
      steps: [
        {
          target: 'settings-profile',
          title: "Votre profil",
          body: "Votre nom et votre profession. Certains prix dépendent de votre profession : une fois votre dossier commencé, seule votre équipe peut la modifier.",
        },
        {
          target: 'settings-contact',
          title: "Coordonnées",
          body: "L'e-mail avec lequel vous vous connectez et le numéro utilisé pour les rappels WhatsApp. Changer d'e-mail demande un code envoyé à la nouvelle adresse.",
        },
        {
          target: 'settings-language',
          title: "Langue",
          body: "Choisissez l'anglais ou le français. Les e-mails, les guides et les pages principales suivent votre choix.",
        },
        {
          target: 'settings-notifications',
          title: "Notifications",
          body: "Les messages concernant votre dossier sont toujours envoyés par e-mail. Vous pouvez désactiver les copies WhatsApp, et choisir de recevoir ou non les actualités et les offres.",
        },
        {
          target: 'settings-privacy',
          title: "Confidentialité et données",
          body: "Demandez une copie des informations que nous conservons à votre sujet, ou la suppression de votre compte. Chaque demande est traitée par une personne de notre équipe.",
        },
        {
          target: 'settings-signin',
          title: "Connexion",
          body: "Déconnectez-vous ici. Si vous vous êtes connecté sur un appareil qui n'est pas le vôtre, déconnectez-vous de tous les appareils.",
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
