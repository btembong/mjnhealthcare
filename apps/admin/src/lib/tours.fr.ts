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
      { target: 'nav:/officer', title: 'Mon travail (« My Work »)', body: "Commencez ici chaque jour. Vous y trouvez ce qui vous attend en priorité, ce qui arrive cette semaine et ce qui dépend de quelqu'un d'autre." },
      { target: 'nav:/officer/caseload', title: 'Mes dossiers (« My Caseload »)', body: 'Tous les dossiers qui vous sont attribués, avec leur étape, leur dernier dépôt et la prochaine relance. Ouvrez-en un pour y travailler.' },
      { target: 'nav:/officer/escalations', title: 'Escalades (« Escalations »)', body: "Les dossiers que vous avez transmis à un consultant, et ce qu'il a décidé." },
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
      { target: 'page-header', title: 'Votre file de travail', body: "Tous les dossiers que vous pouvez voir, avec le nombre de ceux qui demandent une action et de ceux sans consultant. Les consultants voient leurs dossiers et ceux qui ne sont pas attribués." },
      { target: 'caseload-chips', skipIfMissing: true, title: 'Commencer par ce qui attend', body: "Ces filtres montrent ce qui attend : dossiers demandant une action, non attribués, en attente de signature ou en pause. « Needs attention » est le point de départ de chaque journée." },
      { target: 'caseload-filters', title: 'Rechercher, filtrer et changer de vue', body: "Retrouvez un client, filtrez par consultant ou par statut, ou passez à la vue en colonnes, qui regroupe les dossiers selon qui doit agir." },
      { target: 'caseload-table', skipIfMissing: true, title: "Lire un dossier d'un coup d'œil", body: "Chaque dossier indique son étape, ce qu'il attend et la date de sa dernière activité. Un point orange signale un dossier inactif depuis trop longtemps. Sélectionnez un élément en attente pour ouvrir directement cette partie du dossier." },
      { target: 'page-actions', skipIfMissing: true, title: 'Créer un dossier', body: "Créez d'ici un dossier pour un client." },
    ],
  },
  'admin.case': {
    title: 'Espace de travail du dossier',
    steps: [
      { target: 'case-header', title: 'Un dossier, tout ce qui le concerne', body: "Le client, la référence et le statut du dossier. Écrivez au client ou envoyez une liste de documents d'ici ; les autres actions se trouvent sous les trois points." },
      { target: 'case-next', title: 'Que faire ensuite', body: "L'action la plus utile à faire maintenant sur ce dossier, par exemple vérifier des documents, répondre au client ou envoyer la lettre d'engagement." },
      { target: 'case-tabs', title: 'Les parties du dossier', body: "« Overview » contient les étapes. « Documents », « Payments » et « Messages » ont chacun leur onglet, et « Activity » retrace tout l'historique. Un repère sur un onglet indique que quelque chose y attend." },
      { target: 'case-rail', title: 'Client, équipe et points clés', body: "Les coordonnées, les personnes qui suivent le dossier, et l'essentiel : lettre, paiements, documents et dernière activité." },
      { title: 'Les étapes sont visibles du client', body: "Marquer une étape comme terminée s'affiche aussitôt dans le portail du client : une confirmation vous est donc demandée. Mettre un dossier en pause ou le clôturer demande un motif." },
      { title: "L'aide de l'IA sur cette page", body: "Vous pouvez demander à l'IA de résumer le dossier ou de rédiger un message. Le brouillon est placé dans la zone de message pour que vous le corrigiez ; rien n'est envoyé tant que vous ne l'envoyez pas." },
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
      { target: 'msg-list', title: 'Vos conversations', body: "Une conversation par dossier. Les clients qui attendent une réponse apparaissent en premier, signalés par un point orange ; « Needs reply » n'affiche que ceux-là. Utilisez la recherche pour trouver un client." },
      { target: 'msg-chat', title: 'Lire et répondre', body: "Sélectionnez une conversation pour la lire et y répondre. Le client voit votre réponse dans son portail. Une coche indique qu'il l'a lue." },
      { title: 'Fichiers', body: "Utilisez le trombone pour envoyer un fichier PDF, image ou Word. Lorsqu'un client envoie un justificatif ici, utilisez « Save to client’s documents » pour qu'il passe en vérification ; un fichier envoyé dans la conversation n'est pas classé automatiquement." },
    ],
  },
  'admin.sessions': {
    title: 'Séances',
    steps: [
      { target: 'page-title', title: 'Vos séances', body: "Les consultations réservées avec vous. Un consultant voit les siennes ; un administrateur voit celles de tous et peut filtrer par consultant." },
      { target: 'sessions-stats', title: "En un coup d'œil", body: "Le nombre de séances aujourd'hui et cette semaine, et celles qui attendent encore une note. Les heures sont affichées dans votre fuseau horaire." },
      { target: 'sessions-next', skipIfMissing: true, title: 'Votre prochaine séance', body: "La personne que vous recevez, ce dont elle souhaite parler, et le bouton « Join as host ». Il s'active 15 minutes avant le début." },
      { target: 'sessions-filters', title: 'Trouver une séance', body: "« Upcoming », « Needs a note », « Past » et « Cancelled & missed ». « Needs a note » liste les séances terminées qui n'ont pas encore été rédigées." },
      { title: 'Déplacer ou annuler', body: "Ouvrez une séance pour la déplacer vers un autre de vos créneaux libres, ou pour l'annuler en indiquant un motif. Le client est prévenu dans les deux cas. Si vous annulez, il est remboursé intégralement." },
      { title: 'Clôturer une séance', body: "Marquez-la comme terminée et rédigez une courte note pour l'équipe. Si le client ne s'est pas présenté, utilisez « Client did not attend » à partir de 10 minutes après le début ; une séance manquée n'est pas remboursée." },
    ],
  },
  'admin.approvals': {
    title: 'Approbations en attente',
    steps: [
      { target: 'page-title', title: "Messages d'agents en attente d'accord", body: "Lorsqu'un agent de traitement rédige un message sensible pour un client, il attend ici votre accord." },
      { title: 'Approuver ou refuser', body: "Lisez le projet. L'approuver le transmet au client. Le refuser empêche son envoi ; vous indiquez un motif, que l'agent voit dans le dossier." },
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
    title: 'Mon travail',
    steps: [
      { target: 'page-title', title: "Votre journée en un coup d'œil", body: 'Le nombre de dossiers ouverts que vous suivez, et le nombre de relances et de formulaires renvoyés qui vous attendent.' },
      { target: 'work-first', title: 'À faire en premier (« Do first »)', body: "Ce qui vous attend aujourd'hui : les relances arrivées à échéance, les formulaires renvoyés par un client, et les messages au client qu'un consultant n'a pas approuvés. Un élément quitte cette liste dès que vous enregistrez quelque chose dans le dossier concerné." },
      { target: 'work-coming', title: 'À venir (« Coming up »)', body: "Les dates de relance des sept prochains jours, pour vous organiser à l'avance." },
      { target: 'work-waiting', title: 'En attente des autres (« Waiting on others »)', body: "Ce que vous avez transmis : les messages en attente d'accord d'un consultant, les escalades ouvertes et les formulaires que les clients n'ont pas encore renvoyés. Rien ici ne demande votre intervention." },
      { target: 'work-summary', title: 'Vos chiffres', body: 'Les dépôts de vos dossiers ouverts par statut, et ce que vous avez enregistré cette semaine.' },
    ],
  },
  'admin.officer.caseload': {
    title: 'Mes dossiers',
    steps: [
      { target: 'page-title', title: 'Dossiers qui vous sont attribués', body: "Vous ne voyez que les dossiers qui vous sont attribués. Un administrateur ou un consultant vous les attribue, et vous recevez un e-mail à chaque nouveau dossier." },
      { target: 'ocl-chips', title: 'Filtres rapides', body: "« Needs me » affiche les dossiers où vous avez quelque chose à faire. Les autres filtres affichent les dossiers dont une relance est due, ceux sans dépôt enregistré, et ceux sans activité récente." },
      { target: 'ocl-list', skipIfMissing: true, title: 'Une ligne par dossier', body: "L'étape atteinte, le dernier dépôt et la date de la prochaine relance. Un point orange signale ce qui est dû. Sélectionnez un dossier pour l'ouvrir." },
    ],
  },
  'admin.officer.case': {
    title: 'Traiter un dossier',
    steps: [
      { target: 'page-title', title: 'Ce dossier', body: "Tout ce qu'il vous faut pour traiter ce client se trouve sur cette page. Rien ne vous en éloigne." },
      { target: 'ocase-actions', title: 'Vos actions principales', body: "Enregistrez un dépôt auprès d'un organisme de réglementation, envoyez un formulaire à remplir au client, ou escaladez vers un consultant. Chaque action s'ouvre par-dessus cette page." },
      { target: 'ocase-next', title: 'Prochaine étape (« Next step »)', body: 'La chose la plus utile à faire sur ce dossier en ce moment.' },
      { target: 'ocase-tabs', title: 'Sections', body: "« Overview » présente les étapes et la note de passation. « Submissions », « Documents » et « Notes » regroupent votre travail quotidien. « Activity » retrace tout l'historique. Un point orange sur un onglet signale que quelque chose vous y attend." },
      { title: 'Dépôts et relances', body: "Donnez une date de relance à chaque dépôt. Ce jour-là, le dossier apparaît dans « Do first » jusqu'à ce que vous mettiez le dépôt à jour. Un dépôt approuvé ou rejeté ne demande plus de relance." },
      { title: 'Notes et messages au client', body: "Une note interne reste dans l'équipe. Un message au client est envoyé par e-mail et sur WhatsApp. Cochez « Needs consultant approval first » pour tout ce qui concerne l'éligibilité, les résultats ou les délais : rien n'est envoyé tant qu'un consultant n'a pas donné son accord." },
      { title: 'Marquer une étape comme terminée', body: "Dans « Overview », marquez l'étape en cours comme terminée lorsque le travail est fait. Le client le voit dans son portail ; une confirmation vous est donc demandée." },
      { target: 'ocase-rail', title: 'Client et informations clés', body: "Les coordonnées, les autres personnes sur le dossier, les paiements, les documents, et ce qui dépend de quelqu'un d'autre." },
    ],
  },
  'admin.officer.escalations': {
    title: 'Escalades',
    steps: [
      { target: 'page-title', title: 'Dossiers que vous avez escaladés', body: "Chaque escalade que vous avez lancée et la réponse du consultant une fois donnée. Pour en lancer une, ouvrez le dossier et choisissez « Escalate »." },
      { target: 'oesc-tabs', title: 'Ouvertes et résolues', body: "Les escalades ouvertes attendent un consultant. Les escalades résolues indiquent ce qui a été décidé." },
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
      { target: 'page-header', title: 'Tous les paiements', body: 'Chaque commande et chaque consultation payante, payée, en attente ou annulée.' },
      { target: 'pay-stats', title: 'Les trois chiffres', body: "L'argent reçu ce mois-ci après remboursements, l'argent encore en attente de paiement, et les paiements qu'une personne doit vérifier." },
      { target: 'pay-filters', title: 'Trouver un paiement', body: "« Needs checking » liste les paiements qu'un client a commencés il y a plus de 15 minutes et qui n'ont jamais été confirmés. Vous pouvez aussi rechercher par nom, e-mail ou référence de paiement." },
      { target: 'pay-table', title: 'Ouvrir un paiement', body: "Voyez à quoi il correspond, chaque tentative de paiement et ce que l'équipe a fait. « Check with Tranzak » demande au prestataire ce qui s'est passé et ne modifie rien." },
      { title: 'Enregistrer un paiement', body: "Si Tranzak indique que c'est payé, un administrateur peut l'enregistrer en un clic. Un paiement reçu autrement exige une note précisant comment. Dans les deux cas, le client reçoit son reçu ou sa confirmation, comme pour un paiement normal." },
      { title: 'Annulations et remboursements', body: "Une commande ou une réservation non payée peut être annulée avec un motif. Sur une commande payée, « Record a refund » note le montant et prévient le client par e-mail — cela n'envoie pas l'argent : remboursez d'abord via Tranzak ou la banque. L'équipe Finance peut seulement consulter, vérifier et exporter." },
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
    title: 'Consultations gratuites',
    steps: [
      { target: 'page-header', title: 'Consultations gratuites', body: "Toutes les personnes qui ont réservé une consultation gratuite sur le site, et les horaires encore ouverts à la réservation. Toutes les heures sont à l'heure de Douala." },
      { target: 'fc-tabs', title: 'Deux sections', body: '« Bookings » affiche les personnes qui ont réservé. « Availability » sert à ajouter et retirer les horaires proposés.' },
      { target: 'fc-filters', title: 'Trouver une réservation', body: "« Upcoming » montre ce qui arrive. « Needs an outcome » liste les consultations passées pour lesquelles vous devez indiquer si la personne est venue. « Past » conserve l'historique." },
      { title: 'Pendant et après', body: "« Join as host » ouvre la salle vidéo ici, à partir de 15 minutes avant le début. Ensuite, choisissez « Attended » ou « Did not attend ». « Manage » permet de déplacer une réservation vers un autre horaire ouvert ou de l'annuler — la personne est prévenue par e-mail dans les deux cas." },
      { title: 'Ajouter des horaires', body: "Dans « Availability », « Add times » permet de choisir les jours de la semaine, les heures et le nombre de semaines à répéter. Les horaires déjà existants, ou qui chevauchent une séance payante, sont ignorés et vous en êtes informé avant d'enregistrer." },
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
      { target: 'page-title', title: 'Votre équipe de traitement', body: "Les membres de l'équipe qui traitent les dossiers au quotidien, avec le nombre d'agents disponibles et de dossiers ouverts qu'ils suivent." },
      { target: 'officers-banner', skipIfMissing: true, title: 'Dossiers sans agent', body: "Les dossiers ouverts que personne ne traite. « Assign cases » propose pour chacun l'agent le moins chargé ; rien ne change tant que vous n'avez pas confirmé." },
      { target: 'officers-grid', skipIfMissing: true, title: 'Comparer la charge de travail', body: "Chaque agent avec ses dossiers ouverts, ceux qui attendent une action de votre équipe et ceux qui sont inactifs. Sélectionnez un agent pour voir ses dossiers et en transférer à un collègue." },
      { title: 'Absence et départ', body: "Indiquez qu'un agent est indisponible pour qu'il ne reçoive plus de nouveaux dossiers. Il peut garder ses dossiers pour une courte absence, ou vous pouvez les transférer. Un agent désactivé ne peut plus se connecter et peut être réactivé plus tard." },
    ],
  },
  'admin.catalog': {
    title: 'Services et prix',
    steps: [
      { target: 'page-header', title: 'Services et prix', body: "Tous les services que les clients peuvent payer, regroupés par catégorie, dans l'ordre affiché au moment du paiement." },
      { target: 'catalog-filters', title: 'Trouver un service', body: 'Recherchez par nom, ou affichez seulement les services proposés ou seulement les services masqués.' },
      { target: 'catalog-list', title: 'Catégories et services', body: "Utilisez les flèches pour changer l'ordre. Cliquez sur un service pour l'ouvrir. Les frais d'engagement sont verrouillés, car le paiement en dépend." },
      { title: 'Modifier un prix', body: "Ouvrez un service, changez le montant et enregistrez. Une confirmation vous est demandée, et le changement est consigné avec votre nom. Un nouveau prix ne s'applique qu'aux nouvelles commandes — les reçus déjà émis conservent le prix payé." },
      { title: 'Prix selon la profession', body: "Un service peut avoir un prix différent pour les infirmiers, les médecins ou une reprise d'examen. Dans ce cas, le client paie le prix qui lui correspond." },
      { title: 'Masquer ou supprimer', body: "Un service déjà commandé, ou requis par une étape d'un parcours, ne peut pas être supprimé. Masquez-le : les clients ne le voient plus et son historique est conservé." },
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
      { target: 'page-header', title: "Demandes d'assistance des clients", body: "Les questions et les problèmes que les clients signalent depuis la page « Obtenir de l'aide » de leur portail. La ligne sous le titre indique combien attendent et depuis quand." },
      { target: 'tix-filters', title: 'À qui le tour', body: "« Needs reply » signifie que le client a écrit en dernier. « Waiting on client » signifie que c'est nous. Vous pouvez aussi filtrer par sujet, ou n'afficher que les demandes qui vous sont attribuées." },
      { target: 'tix-list', title: "La plus longue attente d'abord", body: "Les clients qui attendent depuis le plus longtemps sont en haut, les demandes urgentes au-dessus. Un point orange signifie plus de 24 heures. Les consultants et les agents voient leurs propres clients ; les demandes de confidentialité sont réservées aux administrateurs." },
      { target: 'tix-thread', title: 'Répondre, ou laisser une note', body: "« Reply to client » envoie un e-mail au client ; vous pouvez joindre un fichier. « Note for staff » n'est visible que par l'équipe — le client ne la voit jamais et n'en est pas informé. Répondre à une demande sans responsable vous l'attribue." },
      { title: 'Terminer', body: "« Send and mark solved » clôt la demande avec votre réponse. Le client peut la rouvrir en répondant dans les 14 jours. Utilisez « Urgent » pour faire remonter une demande, et « Assigned to » pour la confier à un collègue." },
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
