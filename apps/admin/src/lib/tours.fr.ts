import type { TourDef, TourLabels, TourStep } from '@mjn/ui';

// French guides for the staff console. Same keys, steps and targets as the English set in tours.ts.
// Page and tab names are quoted in English because the console's own labels are in English.

export const TOUR_LABELS_FR: TourLabels = {
  next: 'Suivant',
  back: 'Retour',
  done: 'Compris',
  skip: 'Passer la visite',
  stepOf: (current, total) => `Étape ${current} sur ${total}`,
  help: 'Aide et visites guidées',
  helpTitle: 'Aide pour cette page',
  startPageTour: 'Faire la visite de cette page',
  walkthrough: 'Revoir la visite de la console',
  noGuide: "Il n'y a pas encore de guide pour cette page. Vous pouvez revoir la visite de la console ci-dessous.",
};

const HELP_STEP: TourStep = {
  target: 'help-button',
  title: "L'aide est toujours ici",
  body: "Ouvrez ce bouton sur n'importe quelle page pour lire un court guide de la page ou revoir sa visite.",
};

const AI_RULE =
  "Les messages rédigés par l'IA ne sont jamais envoyés automatiquement. Un membre de l'équipe relit, corrige si nécessaire et approuve chacun d'eux avant l'envoi.";

const EMAIL_MATCH =
  "Un consultant ne voit ses dossiers, ses approbations et ses escalades que si son compte utilise la même adresse e-mail que son profil de consultant.";

export const TOURS_FR: Record<string, TourDef> = {
  // Visites par rôle (première connexion)
  'admin.welcome.admin': {
    title: 'Visite de la console',
    steps: [
      {
        title: "Bienvenue dans la console d'administration",
        body: "C'est ici que l'équipe gère chaque dossier client. Voici un aperçu des espaces que vous utiliserez le plus. Chaque page a aussi son propre guide.",
      },
      { target: 'nav:/caseload', title: 'Dossiers (« Caseload »)', body: "Tous les dossiers, avec leur consultant, leur statut et leur étape. Ouvrez un dossier pour voir tout son historique." },
      { target: 'nav:/documents', title: 'Documents', body: "Les documents déposés par les clients et en attente de vérification. Validez un document, ou refusez-le avec un motif pour que le client puisse le remplacer." },
      { target: 'nav:/drafts', title: 'Brouillons IA (« AI Drafts »)', body: AI_RULE },
      { target: 'nav:/leads', title: 'Prospects (« Leads »)', body: "Les demandes venues du site et de l'assistant, à relancer et à convertir." },
      { target: 'nav:/payments', title: 'Paiements', body: 'Tous les paiements, avec les outils pour en vérifier, valider ou annuler un.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.consultant': {
    title: 'Visite de la console',
    steps: [
      {
        title: 'Bienvenue dans votre console',
        body: "C'est ici que vous gérez les clients qui vous sont confiés. Voici un rapide tour d'horizon. Chaque page a aussi son propre guide.",
      },
      { target: 'nav:/caseload', title: 'Mes dossiers (« My Caseload »)', body: 'Les dossiers qui vous sont attribués. Ouvrez-en un pour voir son étape, ses documents, ses paiements et ses messages.' },
      { target: 'nav:/messages', title: 'Messages', body: "Vos conversations avec vos clients. Vous recevez un e-mail lorsqu'un client vous écrit." },
      { target: 'nav:/sessions', title: 'Séances (« Sessions »)', body: 'Vos consultations planifiées, avec le lien pour animer chacune.' },
      { target: 'nav:/drafts', title: 'Brouillons IA (« AI Drafts »)', body: AI_RULE },
      { target: 'nav:/approvals', title: 'Approbations (« Approvals »)', body: "Les messages aux clients rédigés par les agents de traitement, qui attendent votre accord avant l'envoi." },
      { target: 'nav:/escalations', title: 'Escalades (« Escalations »)', body: "Les dossiers qu'un agent de traitement vous a signalés pour décision." },
      HELP_STEP,
    ],
  },
  'admin.welcome.officer': {
    title: 'Visite de la console',
    steps: [
      {
        title: 'Bienvenue dans votre console',
        body: "C'est ici que vous traitez les dossiers qui vous sont attribués. Voici un rapide tour d'horizon. Chaque page a aussi son propre guide.",
      },
      { target: 'nav:/officer/caseload', title: 'Mes dossiers (« My Caseload »)', body: 'Les dossiers que vous traitez. Ouvrez-en un pour y travailler.' },
      { target: 'nav:/officer/documents', title: 'Documents', body: 'Les documents de vos dossiers.' },
      { target: 'nav:/officer/stages', title: 'Suivi des étapes (« Stage Tracker »)', body: "L'avancement des jalons de tous vos dossiers, sur une seule vue." },
      { target: 'nav:/officer/notes', title: 'Notes de dossier (« Case Notes »)', body: 'Toutes les notes ajoutées, par vous et par les autres, sur vos dossiers.' },
      { target: 'nav:/officer/escalations', title: 'Escalades (« Escalations »)', body: 'Les dossiers que vous avez transmis à un consultant, et la suite donnée à chacun.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.finance': {
    title: 'Visite de la console',
    steps: [
      {
        title: 'Bienvenue dans votre console',
        body: "C'est ici que vous suivez les revenus, les paiements et les crédits de parrainage. Voici un rapide tour d'horizon. Chaque page a aussi son propre guide.",
      },
      { target: 'nav:/finance', title: 'Finance', body: 'Revenus, soldes impayés, versements, taxes, reçus et paie.' },
      { target: 'nav:/payments', title: 'Paiements', body: 'Tous les paiements, avec les outils pour en vérifier, valider ou annuler un.' },
      { target: 'nav:/reports', title: 'Rapports (« Reports »)', body: "Les chiffres de revenus, de placements et de pipeline pour l'ensemble de l'activité." },
      { target: 'nav:/referrals', title: 'Parrainages et crédits', body: "Les codes de parrainage, les portefeuilles de crédits et les versements aux affiliés." },
      HELP_STEP,
    ],
  },
  'admin.welcome.compliance': {
    title: 'Visite de la console',
    steps: [
      {
        title: 'Bienvenue dans votre console',
        body: "C'est ici que vous vérifiez les documents des clients et le journal d'audit. Voici un rapide tour d'horizon. Chaque page a aussi son propre guide.",
      },
      { target: 'nav:/documents', title: 'Documents', body: "Les documents déposés par les clients et en attente de vérification. Validez un document, ou refusez-le avec un motif pour que le client puisse le remplacer." },
      { target: 'nav:/caseload', title: 'Dossiers (« Caseload »)', body: 'Tous les dossiers et leur statut actuel.' },
      { target: 'nav:/audit', title: "Journal d'audit (« Audit Log »)", body: 'Qui a fait quoi, et quand.' },
      HELP_STEP,
    ],
  },

  // Tableaux de bord
  'admin.dashboard.admin': {
    title: "Tableau de bord d'administration",
    steps: [
      { target: 'page-title', title: "Votre vue d'ensemble", body: "Ce qui demande de l'attention aujourd'hui dans toute l'activité, au même endroit." },
      { target: 'dash-kpis', title: 'Chiffres clés', body: 'Les principaux chiffres sur les clients, les dossiers et les revenus.' },
      { target: 'dash-actions', title: 'Actions rapides', body: 'Des raccourcis vers les tâches que vous faites le plus souvent.' },
      { target: 'dash-inbox', title: 'Boîte prioritaire', body: "Ce qui attend quelqu'un, par exemple des brouillons IA à relire ou des lettres d'engagement non signées. Commencez par le haut." },
      { target: 'dash-pipeline', title: 'Pipeline des clients', body: 'Le nombre de dossiers en attente de signature, actifs, en pause et terminés.' },
    ],
  },
  'admin.dashboard.consultant': {
    title: 'Votre tableau de bord',
    steps: [
      { target: 'page-title', title: "Votre journée en un coup d'œil", body: "Ce qui vous attend aujourd'hui sur vos propres dossiers." },
      { target: 'dash-kpis', title: 'Vos chiffres', body: 'Un résumé de vos dossiers et de votre activité.' },
      { target: 'dash-inbox', title: 'Boîte prioritaire', body: "Ce qui vous attend, par exemple des brouillons IA à relire ou des clients qui n'ont pas signé leur lettre d'engagement. Commencez par le haut." },
      { target: 'dash-caseload', title: 'Mes dossiers', body: 'Vos dossiers et leur statut actuel. Sélectionnez-en un pour l\'ouvrir.' },
      { target: 'dash-drafts', skipIfMissing: true, title: 'Brouillons IA', body: AI_RULE },
    ],
  },
  'admin.dashboard.compliance': {
    title: 'Tableau de bord conformité',
    steps: [
      { target: 'page-title', title: 'Votre vue des vérifications', body: "Ce qui attend une vérification de conformité aujourd'hui." },
      { target: 'dash-kpis', title: 'Chiffres clés', body: 'Le nombre de documents en attente et de dossiers à surveiller.' },
      { target: 'dash-queue', title: 'File de documents et dossiers en pause', body: 'Commencez par les documents qui attendent depuis le plus longtemps. Les dossiers en pause sont listés à côté.' },
    ],
  },

  // Dossiers et clients
  'admin.caseload': {
    title: 'Dossiers',
    steps: [
      { target: 'page-header', title: 'Vos dossiers', body: "Les consultants voient les dossiers qui leur sont attribués, ainsi que ceux qui n'ont pas encore de consultant. Les administrateurs voient tous les dossiers." },
      { target: 'caseload-filters', title: 'Filtrer et changer de vue', body: 'Affinez la liste par statut ou par consultant, et passez du tableau à une vue en colonnes regroupée par statut.' },
      { target: 'page-actions', skipIfMissing: true, title: 'Créer un dossier', body: "Créez d'ici un dossier pour un client." },
      { title: 'Ouvrir un dossier', body: "Sélectionnez un dossier pour voir son étape, ses documents, ses paiements, ses notes et ses messages." },
    ],
  },
  'admin.case': {
    title: 'Détail du dossier',
    steps: [
      { target: 'case-header', title: 'Un dossier, tout ce qui le concerne', body: 'Cette page réunit tout le dossier de ce client.' },
      { target: 'case-profile', title: 'Profil du client', body: 'Qui est le client et comment le joindre.' },
      { target: 'case-engagement', title: 'Engagement', body: "Si la lettre d'engagement est signée, qui est le consultant, et le statut du dossier. Le client ne peut pas payer tant que la lettre n'est pas signée." },
      { target: 'case-milestones', title: 'Jalons', body: 'Les étapes de ce dossier. Marquez chacune comme terminée au fil de la progression ; le client le voit sur son tableau de bord.' },
      { target: 'case-orders', skipIfMissing: true, title: 'Commandes et paiements', body: 'Ce que le client a commandé et ce qui a été payé.' },
      { target: 'case-officer', skipIfMissing: true, title: "Activité de l'agent", body: "Les notes, les dépôts de dossier et les escalades de l'agent de traitement sur ce dossier." },
      { target: 'case-messages', skipIfMissing: true, title: 'Messages', body: 'Échangez ici avec le client. Vous pouvez joindre un document ou lui demander d\'en déposer un.' },
      { title: "L'aide de l'IA sur cette page", body: "Vous pouvez demander à l'IA de rédiger un message au client ou de résumer le dossier. " + AI_RULE },
    ],
  },
  'admin.case.new': {
    title: 'Nouveau dossier',
    steps: [
      { target: 'new-client', title: 'Choisir le client', body: "Recherchez la personne et sélectionnez-la. Elle doit d'abord avoir un compte." },
      { target: 'new-consultant', title: 'Attribuer un consultant', body: "Facultatif à ce stade. Un dossier sans consultant reste visible de tous les consultants jusqu'à son attribution." },
      { title: 'Et ensuite', body: "Le client est invité à signer sa lettre d'engagement. Il ne peut payer aucun service tant qu'elle n'est pas signée." },
    ],
  },
  'admin.clients': {
    title: 'Clients',
    steps: [
      { target: 'page-header', title: 'Vos clients', body: 'Toutes les personnes qui ont un compte client.' },
      { target: 'clients-search', title: 'Trouver un client', body: 'Recherchez par nom ou par coordonnées.' },
      { title: 'Ouvrir un client', body: 'Sélectionnez un client pour voir son profil, ses dossiers et ses documents.' },
    ],
  },
  'admin.client': {
    title: 'Profil du client',
    steps: [
      { target: 'client-identity', title: 'Qui il est', body: 'Coordonnées, profession et langue.' },
      { target: 'client-engagements', title: 'Dossiers', body: "Tous les dossiers de ce client chez nous. Sélectionnez-en un pour l'ouvrir." },
      { target: 'client-documents', title: 'Documents', body: 'Ce que le client a déposé et le statut de chaque document.' },
    ],
  },
  'admin.documents': {
    title: 'Vérification des documents',
    steps: [
      { target: 'page-title', title: 'Vérifier les documents des clients', body: "Chaque document déposé est contrôlé par une personne avant de compter pour un dossier. La ligne ci-dessous indique combien sont en attente et l'attente la plus longue." },
      { target: 'docs-modes', title: 'Deux façons de travailler', body: "« Review » sert à traiter la file, un document après l'autre. « All documents » est une liste avec recherche pour retrouver un document précis." },
      { target: 'docs-queue', skipIfMissing: true, title: "La file d'attente", body: "Les documents en attente de vérification, regroupés par client, les plus anciens en haut." },
      { target: 'docs-viewer', skipIfMissing: true, title: 'Le document', body: "Agrandissez et faites pivoter pour le lire. Au-dessus figurent le client, son étape actuelle, et si ce document est nécessaire pour cette étape. Chaque ouverture d'un document est enregistrée dans le journal d'audit." },
      { target: 'docs-decision', skipIfMissing: true, title: 'Valider ou refuser', body: "Appuyez sur V pour valider ou R pour refuser, ou utilisez les boutons. Pour refuser, choisissez un motif courant ou rédigez le vôtre : le client le voit. Le document suivant s'ouvre automatiquement, et « Undo » apparaît quelques secondes." },
      { title: 'Que vérifier', body: "Vous pouvez demander à l'IA ce qu'il faut contrôler sur ce type de document. Elle se base uniquement sur le type et les dates, sans avoir vu le fichier : la décision vous revient." },
    ],
  },
  'admin.drafts': {
    title: 'Relecture des brouillons IA',
    steps: [
      { target: 'page-header', title: "Relire avant d'envoyer", body: AI_RULE },
      { target: 'drafts-rule', title: "Pourquoi c'est important", body: "Tout ce qui touche aux licences, aux visas ou aux examens doit être vérifié par une personne. Une information erronée peut coûter des mois à un client." },
      { title: 'Corriger, puis approuver', body: "Modifiez la formulation si nécessaire, puis approuvez. L'approbation enregistre votre nom et l'heure, et le consultant peut alors envoyer le message." },
    ],
  },
  'admin.messages': {
    title: 'Messages',
    steps: [
      { target: 'msg-list', title: 'Vos conversations', body: 'Une conversation par dossier. Utilisez la recherche pour trouver un client.' },
      { target: 'msg-chat', title: 'Lire et répondre', body: 'Sélectionnez une conversation pour la lire et y répondre. Le client voit votre réponse dans son portail.' },
    ],
  },
  'admin.sessions': {
    title: 'Séances',
    steps: [
      { target: 'page-title', title: 'Séances de consultation', body: 'Les consultations réservées, passées et à venir.' },
      { target: 'sessions-stats', title: "En un coup d'œil", body: 'Les séances à venir, confirmées et terminées, et les revenus correspondants.' },
      { target: 'sessions-filters', title: 'Filtrer et changer de vue', body: "Filtrez par statut, et passez du calendrier à la liste." },
      { title: 'Animer et clôturer', body: "Rejoignez une séance en tant qu'hôte depuis cette page. Lorsque vous la marquez comme terminée, une courte note de dossier vous est demandée." },
    ],
  },
  'admin.approvals': {
    title: 'Approbations en attente',
    steps: [
      { target: 'page-title', title: "Messages d'agents en attente d'accord", body: "Lorsqu'un agent de traitement rédige un message sensible pour un client, il attend ici votre accord." },
      { title: 'Approuver ou refuser', body: "Lisez le projet. L'approuver le transmet au client. Le refuser empêche son envoi." },
    ],
  },
  'admin.escalations': {
    title: "Boîte d'escalades",
    steps: [
      { target: 'page-title', title: 'Dossiers qui vous sont signalés', body: "Les agents de traitement escaladent un dossier lorsqu'il faut la décision d'un consultant, par exemple pour un problème de conformité ou un litige avec un client." },
      { title: 'Résoudre avec une note', body: "Indiquez votre décision et résolvez l'escalade. L'agent est informé du résultat. Tant qu'elle est ouverte, vous pouvez ouvrir le dossier concerné, même s'il n'est pas le vôtre." },
    ],
  },
  'admin.earnings': {
    title: 'Mes revenus',
    steps: [
      { target: 'page-title', title: 'Vos revenus', body: 'Ce que vous avez gagné grâce aux séances de consultation.' },
      { target: 'earn-kpis', title: 'Totaux', body: 'Vos totaux pour la période.' },
      { target: 'earn-table', title: 'Séance par séance', body: 'Chaque séance avec son montant et si le versement a été effectué.' },
    ],
  },
  'admin.templates': {
    title: 'Modèles de messages',
    steps: [
      { target: 'page-title', title: 'Messages réutilisables', body: 'Enregistrez les formulations que vous envoyez souvent, pour répondre vite et de façon cohérente.' },
      { target: 'tpl-filters', title: 'Trouver un modèle', body: 'Filtrez pour trouver celui dont vous avez besoin.' },
      { target: 'tpl-grid', title: 'Utiliser, modifier ou ajouter', body: 'Créez un modèle, ou modifiez-en un existant.' },
    ],
  },
  'admin.settings': {
    title: 'Paramètres',
    steps: [
      { target: 'page-header', title: 'Paramètres', body: "Votre propre compte et, pour les administrateurs, la liste du personnel, les notifications et les options du système." },
      { target: 'settings-tabs', title: 'Sections', body: "Les onglets affichés dépendent de votre rôle. « My Account » vous permet de changer votre nom, votre langue et votre mot de passe." },
    ],
  },

  // Agent de traitement
  'admin.officer.dashboard': {
    title: "Tableau de bord de l'agent",
    steps: [
      { target: 'page-title', title: "Votre journée en un coup d'œil", body: "Ce qui vous attend aujourd'hui sur les dossiers qui vous sont attribués." },
      { target: 'off-kpis', title: 'Vos chiffres', body: "Les éléments en retard, ce qui est dû aujourd'hui, et votre activité de la semaine." },
      { target: 'off-actions', title: 'Actions rapides', body: "Accédez à vos dossiers, ajoutez une note, ou ouvrez les escalades, le suivi des étapes et les documents." },
      { target: 'off-caseload', title: 'Mes dossiers', body: 'Vos dossiers et leur étape actuelle. Sélectionnez-en un pour y travailler.' },
    ],
  },
  'admin.officer.caseload': {
    title: 'Mes dossiers',
    steps: [
      { target: 'page-title', title: 'Dossiers qui vous sont attribués', body: 'Sélectionnez un dossier pour voir ses jalons, ses dépôts, ses documents et ses notes.' },
    ],
  },
  'admin.officer.case': {
    title: 'Traiter un dossier',
    steps: [
      { target: 'page-title', title: 'Ce dossier', body: 'Tout ce qu\'il vous faut pour traiter ce client se trouve sur cette page.' },
      { target: 'ocase-milestones', title: 'Jalons', body: 'Les étapes de ce dossier et celles qui sont terminées.' },
      { target: 'ocase-tracking', title: 'Suivi des demandes', body: "Enregistrez chaque dépôt que vous faites auprès d'un organisme de réglementation, et la date de relance." },
      { target: 'ocase-sendform', title: 'Envoyer un formulaire au client', body: "Envoyez un formulaire que le client doit remplir et renvoyer. Il apparaît dans son espace documents." },
      { target: 'ocase-notes', title: 'Notes de dossier', body: "Les notes internes restent dans l'équipe. Une note destinée au client peut être marquée comme nécessitant d'abord l'accord du consultant." },
      { title: 'Quand escalader', body: "Si le dossier demande la décision d'un consultant, par exemple pour un problème de conformité ou un litige, utilisez « Escalate ». Le consultant est prévenu." },
    ],
  },
  'admin.officer.tracking': {
    title: 'Suivi des demandes',
    steps: [
      { target: 'track-form', title: 'Enregistrer un dépôt', body: 'Indiquez ce qui a été déposé, auprès de quel organisme, et quand relancer.' },
      { target: 'track-history', title: 'Historique des dépôts', body: "Tout ce qui a été enregistré jusqu'ici. Modifiez une entrée lorsque son statut change." },
    ],
  },
  'admin.officer.escalate': {
    title: 'Escalader un dossier',
    steps: [
      { title: 'Quand escalader', body: "Utilisez cette page pour un problème de conformité, un litige avec un client, ou toute situation qui demande la décision d'un consultant." },
      { title: 'Choisir à qui et dire pourquoi', body: "Le consultant de ce dossier est déjà sélectionné. Donnez un motif clair ; il reçoit un e-mail et le dossier apparaît dans sa boîte d'escalades." },
    ],
  },
  'admin.officer.documents': {
    title: 'Documents',
    steps: [
      { target: 'page-title', title: 'Documents de vos dossiers', body: 'Les documents des dossiers qui vous sont attribués, avec le statut de chacun.' },
    ],
  },
  'admin.officer.stages': {
    title: 'Suivi des étapes',
    steps: [
      { target: 'page-title', title: "L'avancement de vos dossiers", body: 'Les jalons de chaque dossier qui vous est attribué, pour voir ceux qui avancent et ceux qui sont bloqués.' },
    ],
  },
  'admin.officer.notes': {
    title: 'Notes de dossier',
    steps: [
      { target: 'page-title', title: 'Toutes vos notes de dossier', body: "Les notes de vos dossiers réunies dans une seule liste. Les notes s'ajoutent depuis le dossier lui-même." },
    ],
  },
  'admin.officer.escalations': {
    title: 'Mes escalades',
    steps: [
      { target: 'page-title', title: 'Dossiers que vous avez escaladés', body: "Chaque escalade que vous avez lancée, si elle est encore ouverte, et la décision du consultant une fois rendue." },
    ],
  },

  // Finance
  'admin.finance': {
    title: 'Tableau de bord financier',
    steps: [
      { target: 'page-title', title: 'La situation financière', body: 'Les revenus et ce qui est dû, en entrée comme en sortie.' },
      { target: 'fin-kpis', title: 'Chiffres principaux', body: 'Les totaux clés de la période.' },
      { target: 'fin-tabs', title: 'Sections', body: "« Overview », « Outstanding », « Payouts », « Tax », « Receipts », « Payroll », « Credits » et « Client Ledger ». Les reçus et les taxes peuvent être exportés." },
    ],
  },
  'admin.payments': {
    title: 'Paiements',
    steps: [
      { target: 'page-header', title: 'Toute l\'activité de paiement', body: 'Les paiements des commandes et des réservations de consultation.' },
      { target: 'pay-stats', title: 'Totaux', body: 'Un résumé des paiements par statut.' },
      { target: 'pay-filters', title: 'Rechercher et filtrer', body: 'Retrouvez un paiement par client, statut, type ou date.' },
      { target: 'pay-table', title: 'Agir sur un paiement', body: "Ouvrez-en un pour voir tout son détail. Vous pouvez le vérifier auprès du prestataire de paiement, le valider, ou l'annuler en indiquant un motif." },
    ],
  },
  'admin.reports': {
    title: 'Rapports et analyses',
    steps: [
      { target: 'page-header', title: "Comment se porte l'activité", body: "Revenus, placements, taux de réussite aux examens et pipeline." },
      { target: 'rep-kpis', title: 'Chiffres clés', body: 'Les principaux chiffres.' },
      { target: 'rep-revenue', title: 'Revenus', body: 'Les revenus dans le temps et par catégorie de service.' },
      { target: 'rep-pipeline', skipIfMissing: true, title: 'Pipeline et clients', body: 'La progression des dossiers dans le pipeline, et les clients par profession.' },
    ],
  },
  'admin.referrals': {
    title: 'Parrainages et crédits',
    steps: [
      { target: 'page-title', title: 'Parrainages et crédits', body: 'Les codes de parrainage des clients, les portefeuilles de crédits et les affiliés publics.' },
      { target: 'ref-stats', title: 'Totaux', body: 'Codes émis, parrainages réussis, conversions des affiliés et versements dus aux affiliés.' },
      { target: 'ref-tabs', title: 'Codes, portefeuilles et affiliés', body: "Annulez un code, ajustez les crédits d'un client en indiquant un motif, ou marquez un versement à un affilié comme payé." },
    ],
  },
  'admin.audit': {
    title: "Journal d'audit",
    steps: [
      { target: 'page-header', title: 'Qui a fait quoi, et quand', body: 'Les actions effectuées dans le système sont enregistrées ici, pour les contrôles de conformité et de sécurité.' },
      { target: 'audit-filters', title: 'Affiner', body: "Filtrez par type d'enregistrement ou par élément précis." },
      { target: 'audit-table', title: 'Le registre', body: "Chaque ligne indique l'action, son auteur et le moment." },
    ],
  },

  // Opérations et contenu (administrateur)
  'admin.courses': {
    title: "Cours de l'académie",
    steps: [
      { target: 'page-header', title: 'Cours', body: "Tous les cours de l'académie." },
      { title: 'Créer et publier', body: "Ajoutez un cours, puis ouvrez-le pour construire son contenu. Les clients ne voient un cours qu'une fois publié." },
    ],
  },
  'admin.course': {
    title: 'Éditeur de cours',
    steps: [
      { target: 'page-title', title: 'Ce cours', body: 'Construisez et gérez un cours ici.' },
      { target: 'course-tabs', title: 'Sections', body: "« Content » pour les modules et les leçons, « Questions » pour les banques d'entraînement, « Students » pour les inscriptions, « Sessions » pour les cours en direct, et « Settings »." },
    ],
  },
  'admin.leads': {
    title: 'Pipeline des prospects',
    steps: [
      { target: 'page-header', title: 'Vos prospects', body: "Les personnes qui ont pris contact sans être encore clientes, avec le nombre de prospects actifs, perdus et convertis." },
      { target: 'leads-view', title: 'Tableau ou colonnes', body: "Passez d'une liste à une vue en colonnes qui regroupe les prospects par étape, de « New » jusqu'à « Converted » ou « Lost »." },
      { target: 'leads-filters', skipIfMissing: true, title: 'Filtrer', body: 'Affinez la liste pour ne garder que les prospects à traiter.' },
      { title: 'Traiter un prospect', body: "Ouvrez un prospect pour voir ses détails, le faire passer à l'étape suivante, et le convertir lorsque la personne devient cliente." },
    ],
  },
  'admin.freeslots': {
    title: 'Créneaux de consultation gratuite',
    steps: [
      { target: 'page-header', title: 'Horaires de consultation gratuite', body: 'Ce sont les horaires que les visiteurs peuvent réserver sur la page « get-started » du site.' },
      { target: 'slots-form', title: 'Ajouter des créneaux', body: 'Choisissez le consultant, la date et les heures.' },
      { target: 'slots-list', title: 'Créneaux actuels', body: 'Les horaires encore disponibles et ceux qui sont réservés.' },
    ],
  },
  'admin.consultants': {
    title: 'Consultants',
    steps: [
      { target: 'page-header', title: 'Vos consultants', body: 'Les consultants internes et partenaires qui assurent les consultations payantes et suivent des dossiers.' },
      { target: 'cons-tabs', title: 'Sections', body: "« Consultants » pour les profils, « Availability » et « Slots » pour leurs disponibilités, « Payouts » pour ce qui leur est dû, et « Applications » pour les candidatures." },
      { title: 'Comptes et profils', body: EMAIL_MATCH },
    ],
  },
  'admin.jobs': {
    title: "Offres d'emploi et opportunités",
    steps: [
      { target: 'page-header', title: 'Opportunités', body: "Les offres auxquelles les clients peuvent postuler depuis leur portail." },
      { target: 'jobs-tabs', title: 'Offres et candidatures', body: "Publiez et modifiez les offres dans un onglet ; dans l'autre, examinez les candidatures et mettez à jour leur statut." },
    ],
  },
  'admin.partners': {
    title: 'Partenaires',
    steps: [
      { target: 'page-header', title: 'Organisations partenaires', body: 'Les hôpitaux, universités et agences avec lesquels nous travaillons.' },
      { target: 'partners-stats', title: 'Totaux', body: 'Le nombre de partenaires vérifiés et en attente.' },
      { target: 'partners-list', title: "Vérifier avant de donner l'accès", body: "Ajoutez un partenaire, puis vérifiez-le une fois les contrôles faits. Un partenaire ne doit pas voir d'informations sur les candidats avant d'être vérifié." },
    ],
  },
  'admin.staff': {
    title: 'Personnel',
    steps: [
      { target: 'page-header', title: 'Votre équipe', body: 'Toutes les personnes qui ont un compte du personnel, et leur rôle.' },
      { title: "Gérer un membre de l'équipe", body: "Ajoutez un membre ou réinitialisez un mot de passe d'ici. Le rôle d'une personne détermine les pages et les données auxquelles elle a accès." },
      { title: 'Profils de consultant', body: "Un consultant a besoin d'un profil de consultant en plus de son compte. " + EMAIL_MATCH },
    ],
  },
  'admin.officers': {
    title: 'Agents de traitement',
    steps: [
      { target: 'page-title', title: 'Vos agents de traitement', body: "Les membres de l'équipe qui traitent les dossiers au quotidien." },
      { target: 'officers-stats', title: 'Charge de travail', body: 'Le nombre d\'agents actifs et la répartition des dossiers entre eux.' },
      { target: 'officers-grid', title: 'Gérer un agent', body: "Modifiez un agent, ou indiquez qu'il est indisponible et transférez ses dossiers à quelqu'un d'autre." },
      { title: 'Dossiers non attribués', body: "Les dossiers actifs sans agent sont signalés sur cette page, pour qu'aucun ne reste en attente." },
    ],
  },
  'admin.catalog': {
    title: 'Catalogue de services',
    steps: [
      { target: 'page-header', title: 'Services et prix', body: 'Les catégories et les services que les clients choisissent au moment de payer.' },
      { title: 'Modifier un prix', body: "Un nouveau prix ne s'applique qu'aux nouvelles commandes. Les reçus déjà émis conservent le prix payé." },
    ],
  },
  'admin.bookings': {
    title: 'Réservations',
    steps: [
      { target: 'page-header', title: 'Toutes les réservations', body: 'Les séances réservées par les clients et les prospects, avec leur statut.' },
    ],
  },
  'admin.blog': {
    title: 'Blog et articles',
    steps: [
      { target: 'page-title', title: 'Articles du site', body: 'Les articles affichés sur le site public.' },
      { target: 'blog-stats', title: 'Totaux', body: 'Un résumé de vos articles.' },
      { target: 'blog-table', title: 'Rédiger et gérer', body: "Créez un article, modifiez-en ou supprimez-en un, ou consultez un article publié sur le site." },
    ],
  },
  'admin.campaigns': {
    title: 'Campagnes',
    steps: [
      { target: 'page-header', title: 'Campagnes e-mail', body: 'Écrivez à vos prospects et à vos clients, une seule fois ou selon un calendrier répété.' },
      { title: "Avant d'envoyer", body: "Choisissez les destinataires, puis envoyez-vous un test. Une campagne peut être mise en pause, reprise ou annulée, et l'historique de ses envois est conservé." },
    ],
  },
  'admin.surveys': {
    title: 'Enquêtes',
    steps: [
      { target: 'page-header', title: 'Enquêtes', body: 'Recueillez les avis des prospects, des clients et du public.' },
      { title: 'Créer, diffuser, lire', body: "Créez une enquête, ajoutez ses questions, puis ouvrez-la pour voir les résultats. Dupliquez-en une pour la réutiliser." },
    ],
  },
  'admin.tickets': {
    title: "Demandes d'assistance",
    steps: [
      { target: 'page-title', title: "Demandes d'assistance des clients", body: 'Les questions et les problèmes signalés par les clients depuis leur portail.' },
      { target: 'tix-stats', title: 'Par statut', body: 'Le nombre de demandes par statut. Sélectionnez-en un pour filtrer la liste.' },
      { target: 'tix-list', title: 'Demandes', body: 'Sélectionnez une demande pour ouvrir sa conversation.' },
      { target: 'tix-thread', skipIfMissing: true, title: 'Répondre et mettre à jour', body: 'Répondez au client, et réglez le statut et la priorité au fil du traitement.' },
    ],
  },
  'admin.pathways': {
    title: 'Parcours de licence',
    steps: [
      { target: 'page-header', title: 'Parcours', body: "La suite d'étapes pour chaque pays et chaque organisme de réglementation. Les clients sont suivis selon ces étapes." },
      { target: 'path-filters', title: 'Trouver un parcours', body: "Filtrez par pays ou par organisme." },
      { title: 'Modifier avec prudence', body: "Les clients déjà engagés dans un parcours suivent ses étapes : vérifiez qui est concerné avant d'en supprimer un." },
    ],
  },
};
