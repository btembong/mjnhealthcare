import type { TourDef, TourLabels, TourStep } from '@mjn/ui';

// ── Which guide belongs to which page ─────────────────────────────────────────

const PAGE_TOURS: Record<string, string> = {
  '/caseload': 'admin.caseload',
  '/caseload/new': 'admin.case.new',
  '/clients': 'admin.clients',
  '/documents': 'admin.documents',
  '/drafts': 'admin.drafts',
  '/messages': 'admin.messages',
  '/sessions': 'admin.sessions',
  '/approvals': 'admin.approvals',
  '/escalations': 'admin.escalations',
  '/earnings': 'admin.earnings',
  '/templates': 'admin.templates',
  '/settings': 'admin.settings',
  '/officer': 'admin.officer.dashboard',
  '/officer/caseload': 'admin.officer.caseload',
  '/officer/documents': 'admin.officer.documents',
  '/officer/stages': 'admin.officer.stages',
  '/officer/notes': 'admin.officer.notes',
  '/officer/escalations': 'admin.officer.escalations',
  '/finance': 'admin.finance',
  '/payments': 'admin.payments',
  '/reports': 'admin.reports',
  '/referrals': 'admin.referrals',
  '/audit': 'admin.audit',
  '/courses': 'admin.courses',
  '/leads': 'admin.leads',
  '/free-slots': 'admin.freeslots',
  '/consultants': 'admin.consultants',
  '/jobs': 'admin.jobs',
  '/partners': 'admin.partners',
  '/staff': 'admin.staff',
  '/officers': 'admin.officers',
  '/catalog': 'admin.catalog',
  '/bookings': 'admin.bookings',
  '/blog': 'admin.blog',
  '/campaigns': 'admin.campaigns',
  '/surveys': 'admin.surveys',
  '/tickets': 'admin.tickets',
  '/pathways': 'admin.pathways',
};

const DETAIL_TOURS: [RegExp, string][] = [
  [/^\/caseload\/[^/]+$/, 'admin.case'],
  [/^\/clients\/[^/]+$/, 'admin.client'],
  [/^\/courses\/[^/]+$/, 'admin.course'],
  [/^\/officer\/cases\/[^/]+\/tracking$/, 'admin.officer.tracking'],
  [/^\/officer\/cases\/[^/]+\/escalate$/, 'admin.officer.escalate'],
  [/^\/officer\/cases\/[^/]+$/, 'admin.officer.case'],
];

const DASHBOARD_BY_ROLE: Record<string, string> = {
  CONSULTANT: 'admin.dashboard.consultant',
  COMPLIANCE: 'admin.dashboard.compliance',
};

export function tourKeyForPath(pathname: string, role: string): string | null {
  if (pathname === '/') return DASHBOARD_BY_ROLE[role] ?? 'admin.dashboard.admin';
  if (PAGE_TOURS[pathname]) return PAGE_TOURS[pathname];
  return DETAIL_TOURS.find(([pattern]) => pattern.test(pathname))?.[1] ?? null;
}

const WELCOME_BY_ROLE: Record<string, string> = {
  ADMIN: 'admin.welcome.admin',
  CONSULTANT: 'admin.welcome.consultant',
  PROCESSING_OFFICER: 'admin.welcome.officer',
  FINANCE: 'admin.welcome.finance',
  COMPLIANCE: 'admin.welcome.compliance',
};

export function welcomeKeyForRole(role: string): string | undefined {
  return WELCOME_BY_ROLE[role];
}

export const TOUR_LABELS: TourLabels = {
  next: 'Next',
  back: 'Back',
  done: 'Got it',
  skip: 'Skip tour',
  stepOf: (current, total) => `Step ${current} of ${total}`,
  help: 'Help and guided tours',
  helpTitle: 'Help for this page',
  startPageTour: 'Show me around this page',
  walkthrough: 'Replay the console walkthrough',
  noGuide: 'There is no guide for this page yet. You can replay the console walkthrough below.',
};

// ── Shared wording ────────────────────────────────────────────────────────────

const HELP_STEP: TourStep = {
  target: 'help-button',
  title: 'Help is always here',
  body: 'Open this on any page to read a short guide to that page or replay its tour.',
};

const AI_RULE =
  'Messages drafted by AI are never sent on their own. A staff member reviews, edits if needed and approves each one first.';

const EMAIL_MATCH =
  'A consultant sees their cases, approvals and escalations only when their staff login uses the same email as their consultant profile.';

// ── Guides ────────────────────────────────────────────────────────────────────

export const TOURS: Record<string, TourDef> = {
  // Role walkthroughs (first login)
  'admin.welcome.admin': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to the admin console',
        body: 'This is where the team runs every client engagement. Here is a quick look at the areas you will use most. Each page also has its own short guide.',
      },
      { target: 'nav:/caseload', title: 'Caseload', body: 'Every engagement, with its consultant, status and stage. Open a case to see its full history.' },
      { target: 'nav:/documents', title: 'Documents', body: 'Client uploads waiting for review. Verify a document, or reject it with a reason so the client can replace it.' },
      { target: 'nav:/drafts', title: 'AI Drafts', body: AI_RULE },
      { target: 'nav:/leads', title: 'Leads', body: 'Enquiries from the website and the support assistant, ready to follow up and convert.' },
      { target: 'nav:/payments', title: 'Payments', body: 'Every payment, with tools to check, validate or cancel one.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.consultant': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you manage the clients assigned to you. Here is a quick look around. Each page also has its own short guide.',
      },
      { target: 'nav:/caseload', title: 'My Caseload', body: 'The cases assigned to you. Open one to see its stage, documents, payments and messages.' },
      { target: 'nav:/messages', title: 'Messages', body: 'Conversations with your clients. You are emailed when a client writes to you.' },
      { target: 'nav:/sessions', title: 'Sessions', body: 'Your scheduled consultations, with the link to host each one.' },
      { target: 'nav:/drafts', title: 'AI Drafts', body: AI_RULE },
      { target: 'nav:/approvals', title: 'Approvals', body: 'Client updates written by processing officers that need your sign-off before they are sent.' },
      { target: 'nav:/escalations', title: 'Escalations', body: 'Cases a processing officer has flagged for your decision.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.officer': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you process the cases assigned to you. Here is a quick look around. Each page also has its own short guide.',
      },
      { target: 'nav:/officer/caseload', title: 'My Caseload', body: 'The cases you are processing. Open one to work on it.' },
      { target: 'nav:/officer/documents', title: 'Documents', body: 'Documents belonging to your assigned cases.' },
      { target: 'nav:/officer/stages', title: 'Stage Tracker', body: 'Milestone progress across all your cases in one view.' },
      { target: 'nav:/officer/notes', title: 'Case Notes', body: 'Every note you and others have added across your cases.' },
      { target: 'nav:/officer/escalations', title: 'Escalations', body: 'Cases you have raised with a consultant, and how each was resolved.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.finance': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you follow revenue, payments and referral credits. Here is a quick look around. Each page also has its own short guide.',
      },
      { target: 'nav:/finance', title: 'Finance', body: 'Revenue, outstanding balances, payouts, tax, receipts and payroll.' },
      { target: 'nav:/payments', title: 'Payments', body: 'Every payment, with tools to check, validate or cancel one.' },
      { target: 'nav:/reports', title: 'Reports', body: 'Revenue, placements and pipeline figures across the business.' },
      { target: 'nav:/referrals', title: 'Referrals & Credits', body: 'Referral codes, credit wallets and affiliate payouts.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.compliance': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you review client documents and the audit trail. Here is a quick look around. Each page also has its own short guide.',
      },
      { target: 'nav:/documents', title: 'Documents', body: 'Client uploads waiting for review. Verify a document, or reject it with a reason so the client can replace it.' },
      { target: 'nav:/caseload', title: 'Caseload', body: 'Every engagement and its current status.' },
      { target: 'nav:/audit', title: 'Audit Log', body: 'A record of who did what, and when.' },
      HELP_STEP,
    ],
  },

  // Dashboards
  'admin.dashboard.admin': {
    title: 'Admin dashboard',
    steps: [
      { target: 'page-title', title: 'Your operations overview', body: 'What needs attention across the business today, in one place.' },
      { target: 'dash-kpis', title: 'Key numbers', body: 'The headline figures for clients, cases and revenue.' },
      { target: 'dash-actions', title: 'Quick actions', body: 'Shortcuts to the tasks you do most often.' },
      { target: 'dash-inbox', title: 'Priority inbox', body: 'Items waiting on someone, such as AI drafts awaiting review and engagement letters not yet signed. Work from the top.' },
      { target: 'dash-pipeline', title: 'Client pipeline', body: 'How many cases are pending signature, active, on hold and completed.' },
    ],
  },
  'admin.dashboard.consultant': {
    title: 'Your dashboard',
    steps: [
      { target: 'page-title', title: 'Your day at a glance', body: 'What needs you today across your own cases.' },
      { target: 'dash-kpis', title: 'Your numbers', body: 'A summary of your caseload and activity.' },
      { target: 'dash-inbox', title: 'Priority inbox', body: 'Items waiting on you, such as AI drafts to review and clients who have not signed their engagement letter. Work from the top.' },
      { target: 'dash-caseload', title: 'My caseload', body: 'Your cases with their current status. Select one to open it.' },
      { target: 'dash-drafts', skipIfMissing: true, title: 'AI drafts', body: AI_RULE },
    ],
  },
  'admin.dashboard.compliance': {
    title: 'Compliance dashboard',
    steps: [
      { target: 'page-title', title: 'Your review overview', body: 'What is waiting for compliance review today.' },
      { target: 'dash-kpis', title: 'Key numbers', body: 'How many documents are waiting and how many cases need attention.' },
      { target: 'dash-queue', title: 'Document queue and cases on hold', body: 'Start with the documents waiting longest. Cases on hold are listed alongside.' },
    ],
  },

  // Cases and clients
  'admin.caseload': {
    title: 'Caseload',
    steps: [
      { target: 'page-header', title: 'Your caseload', body: 'Consultants see the cases assigned to them, plus cases with no consultant yet. Admins see every engagement.' },
      { target: 'caseload-filters', title: 'Filter and switch view', body: 'Narrow the list by status or consultant, and switch between a table and a board grouped by status.' },
      { target: 'page-actions', skipIfMissing: true, title: 'Start a new case', body: 'Create an engagement for a client from here.' },
      { title: 'Open a case', body: 'Select any case to see its stage, documents, payments, notes and messages.' },
    ],
  },
  'admin.case': {
    title: 'Case detail',
    steps: [
      { target: 'case-header', title: 'One case, everything about it', body: 'This page holds the full record for this client engagement.' },
      { target: 'case-profile', title: 'Client profile', body: 'Who the client is and how to reach them.' },
      { target: 'case-engagement', title: 'Engagement', body: 'Whether the engagement letter is signed, who the consultant is, and the case status. The client cannot pay until the letter is signed.' },
      { target: 'case-milestones', title: 'Milestones', body: 'The steps of this case. Mark each one complete as the client progresses; the client sees this on their dashboard.' },
      { target: 'case-orders', skipIfMissing: true, title: 'Orders and payments', body: 'What the client has ordered and what has been paid.' },
      { target: 'case-officer', skipIfMissing: true, title: 'Officer activity', body: 'Notes, submissions and escalations from the processing officer on this case.' },
      { target: 'case-messages', skipIfMissing: true, title: 'Messages', body: 'Chat with the client here. You can attach a document or ask them to upload one.' },
      { title: 'AI help on this page', body: 'You can ask AI to draft a client update or summarise the case. ' + AI_RULE },
    ],
  },
  'admin.case.new': {
    title: 'New engagement',
    steps: [
      { target: 'new-client', title: 'Choose the client', body: 'Search for the person and select them. They need an account first.' },
      { target: 'new-consultant', title: 'Assign a consultant', body: 'Optional at this point. A case with no consultant stays visible to all consultants until one is assigned.' },
      { title: 'What happens next', body: 'The client is asked to sign their engagement letter. They cannot pay for services until it is signed.' },
    ],
  },
  'admin.clients': {
    title: 'Clients',
    steps: [
      { target: 'page-header', title: 'Your clients', body: 'Everyone with a client account.' },
      { target: 'clients-search', title: 'Find a client', body: 'Search by name or contact detail.' },
      { title: 'Open a client', body: 'Select a client to see their profile, engagements and documents.' },
    ],
  },
  'admin.client': {
    title: 'Client profile',
    steps: [
      { target: 'client-identity', title: 'Who they are', body: 'Contact details, profession and language.' },
      { target: 'client-engagements', title: 'Engagements', body: 'Every case this client has with us. Select one to open it.' },
      { target: 'client-documents', title: 'Documents', body: 'What the client has uploaded and the status of each.' },
    ],
  },
  'admin.documents': {
    title: 'Document verification',
    steps: [
      { target: 'page-title', title: 'Review client documents', body: 'Every upload is checked by a person before it counts towards a case.' },
      { target: 'docs-kpis', title: 'Where things stand', body: 'How many documents are pending review, verified, rejected, or expiring within 30 days.' },
      { target: 'docs-filters', title: 'Tabs and filters', body: 'Pending shows what is waiting for you. Switch tabs to see verified or rejected documents.' },
      { target: 'docs-table', title: 'Open, then verify or reject', body: 'Open a document to check it. To reject, give a reason: the client sees it and can upload a corrected copy.' },
      { title: 'AI pre-screen', body: 'You can ask AI to flag likely problems before you review. It assists; the decision to verify or reject is yours.' },
    ],
  },
  'admin.drafts': {
    title: 'AI draft review',
    steps: [
      { target: 'page-header', title: 'Review before sending', body: AI_RULE },
      { target: 'drafts-rule', title: 'Why this matters', body: 'Anything touching licensing, visas or exams must be checked by a person. Wrong information can cost a client months.' },
      { title: 'Edit, then approve', body: 'Change the wording where needed, then approve. Approval records your name and the time, and the consultant can then send the message.' },
    ],
  },
  'admin.messages': {
    title: 'Messages',
    steps: [
      { target: 'msg-list', title: 'Your conversations', body: 'One conversation per case. Search to find a client.' },
      { target: 'msg-chat', title: 'Read and reply', body: 'Select a conversation to read it and reply. The client sees your reply in their portal.' },
    ],
  },
  'admin.sessions': {
    title: 'Sessions',
    steps: [
      { target: 'page-title', title: 'Consultation sessions', body: 'Booked consultations, past and upcoming.' },
      { target: 'sessions-stats', title: 'At a glance', body: 'Upcoming, confirmed and completed sessions, and the revenue from them.' },
      { target: 'sessions-filters', title: 'Filter and switch view', body: 'Filter by status, and switch between a calendar and a list.' },
      { title: 'Hosting and completing', body: 'Join a session as host from here. When you mark it complete you are asked for a short case note.' },
    ],
  },
  'admin.approvals': {
    title: 'Pending approvals',
    steps: [
      { target: 'page-title', title: 'Officer updates awaiting sign-off', body: 'When a processing officer writes a sensitive update for a client, it waits here for you.' },
      { title: 'Approve or reject', body: 'Read the draft. Approving releases it to the client. Rejecting stops it from being sent.' },
    ],
  },
  'admin.escalations': {
    title: 'Escalation inbox',
    steps: [
      { target: 'page-title', title: 'Cases flagged for you', body: 'Processing officers escalate a case when it needs a consultant decision, such as a compliance issue or a client dispute.' },
      { title: 'Resolve with a note', body: 'Write what you decided and resolve it. The officer is told the outcome. You can open an escalated case while it is open, even if it is not one of yours.' },
    ],
  },
  'admin.earnings': {
    title: 'My earnings',
    steps: [
      { target: 'page-title', title: 'Your earnings', body: 'What you have earned from consultation sessions.' },
      { target: 'earn-kpis', title: 'Totals', body: 'Your totals for the period.' },
      { target: 'earn-table', title: 'Session by session', body: 'Each session with its amount and whether the payout has been made.' },
    ],
  },
  'admin.templates': {
    title: 'Message templates',
    steps: [
      { target: 'page-title', title: 'Reusable messages', body: 'Save wording you send often, so replies are quick and consistent.' },
      { target: 'tpl-filters', title: 'Find a template', body: 'Filter to find the one you need.' },
      { target: 'tpl-grid', title: 'Use, edit or add', body: 'Create a template, or edit an existing one.' },
    ],
  },
  'admin.settings': {
    title: 'Settings',
    steps: [
      { target: 'page-header', title: 'Settings', body: 'Your own account, and for admins the staff list, notifications and system options.' },
      { target: 'settings-tabs', title: 'Sections', body: 'The tabs you see depend on your role. My Account is where you change your name and password.' },
    ],
  },

  // Processing officer
  'admin.officer.dashboard': {
    title: 'Officer dashboard',
    steps: [
      { target: 'page-title', title: 'Your day at a glance', body: 'What needs you today across your assigned cases.' },
      { target: 'off-kpis', title: 'Your numbers', body: 'Overdue items, what is due today, and your activity this week.' },
      { target: 'off-actions', title: 'Quick actions', body: 'Jump to your caseload, post a note, or open escalations, the stage tracker and documents.' },
      { target: 'off-caseload', title: 'My caseload', body: 'Your cases with their current stage. Select one to work on it.' },
    ],
  },
  'admin.officer.caseload': {
    title: 'My caseload',
    steps: [
      { target: 'page-title', title: 'Cases assigned to you', body: 'Select a case to see its milestones, submissions, documents and notes.' },
    ],
  },
  'admin.officer.case': {
    title: 'Working a case',
    steps: [
      { target: 'page-title', title: 'This case', body: 'Everything you need to process this client is on this page.' },
      { target: 'ocase-milestones', title: 'Milestones', body: 'The steps of this case and which are complete.' },
      { target: 'ocase-tracking', title: 'Application tracking', body: 'Record each submission you make to a licensing body, and when to follow up.' },
      { target: 'ocase-sendform', title: 'Send a form to the client', body: 'Send a form for the client to complete and return. It appears in their document area.' },
      { target: 'ocase-notes', title: 'Case notes', body: 'Internal notes stay with the team. A note sent to the client can be marked as needing consultant approval first.' },
      { title: 'When to escalate', body: 'If the case needs a consultant decision, such as a compliance issue or a client dispute, use Escalate. The consultant is notified.' },
    ],
  },
  'admin.officer.tracking': {
    title: 'Application tracking',
    steps: [
      { target: 'track-form', title: 'Record a submission', body: 'Add what was submitted, to which body, and when to follow up.' },
      { target: 'track-history', title: 'Submission history', body: 'Everything recorded so far. Edit an entry when its status changes.' },
    ],
  },
  'admin.officer.escalate': {
    title: 'Escalate a case',
    steps: [
      { title: 'When to escalate', body: 'Use this for a compliance issue, a client dispute, or anything that needs a consultant to decide.' },
      { title: 'Choose who and say why', body: 'The consultant on this case is selected for you. Give a clear reason; they are emailed and the case appears in their escalation inbox.' },
    ],
  },
  'admin.officer.documents': {
    title: 'Documents',
    steps: [
      { target: 'page-title', title: 'Documents for your cases', body: 'Documents belonging to the cases assigned to you, with the status of each.' },
    ],
  },
  'admin.officer.stages': {
    title: 'Stage tracker',
    steps: [
      { target: 'page-title', title: 'Progress across your cases', body: 'Milestones for every case assigned to you, so you can see which are moving and which are stuck.' },
    ],
  },
  'admin.officer.notes': {
    title: 'Case notes',
    steps: [
      { target: 'page-title', title: 'All your case notes', body: 'Notes across your assigned cases in one list. Notes are added from the case itself.' },
    ],
  },
  'admin.officer.escalations': {
    title: 'My escalations',
    steps: [
      { target: 'page-title', title: 'Cases you escalated', body: 'Each escalation you raised, whether it is still open, and the consultant’s resolution once given.' },
    ],
  },

  // Finance
  'admin.finance': {
    title: 'Finance dashboard',
    steps: [
      { target: 'page-title', title: 'The money picture', body: 'Revenue and what is owed, in and out.' },
      { target: 'fin-kpis', title: 'Headline figures', body: 'The key totals for the period.' },
      { target: 'fin-tabs', title: 'Sections', body: 'Overview, Outstanding, Payouts, Tax, Receipts, Payroll, Credits and the Client Ledger. Receipts and tax can be exported.' },
    ],
  },
  'admin.payments': {
    title: 'Payments',
    steps: [
      { target: 'page-header', title: 'All payment activity', body: 'Payments for orders and for consultation bookings.' },
      { target: 'pay-stats', title: 'Totals', body: 'A summary of payments by status.' },
      { target: 'pay-filters', title: 'Search and filter', body: 'Find a payment by client, status, type or date.' },
      { target: 'pay-table', title: 'Act on a payment', body: 'Open one for its full detail. You can check it with the payment provider, validate it, or cancel it with a reason.' },
    ],
  },
  'admin.reports': {
    title: 'Reports and analytics',
    steps: [
      { target: 'page-header', title: 'How the business is doing', body: 'Revenue, placements, exam pass rates and pipeline.' },
      { target: 'rep-kpis', title: 'Key figures', body: 'The headline numbers.' },
      { target: 'rep-revenue', title: 'Revenue', body: 'Revenue over time and by service category.' },
      { target: 'rep-pipeline', skipIfMissing: true, title: 'Pipeline and clients', body: 'How cases move through the pipeline, and clients by profession.' },
    ],
  },
  'admin.referrals': {
    title: 'Referrals and credits',
    steps: [
      { target: 'page-title', title: 'Referrals and credits', body: 'Client referral codes, credit wallets and public affiliates.' },
      { target: 'ref-stats', title: 'Totals', body: 'Codes issued, successful referrals, affiliate conversions and affiliate payouts due.' },
      { target: 'ref-tabs', title: 'Codes, wallets and affiliates', body: 'Void a code, adjust a client’s credits with a reason, or mark an affiliate payout as paid.' },
    ],
  },
  'admin.audit': {
    title: 'Audit log',
    steps: [
      { target: 'page-header', title: 'Who did what, and when', body: 'System actions are recorded here for compliance and security review.' },
      { target: 'audit-filters', title: 'Narrow it down', body: 'Filter by the kind of record or a specific item.' },
      { target: 'audit-table', title: 'The record', body: 'Each line shows the action, who took it and when.' },
    ],
  },

  // Operations and content (admin)
  'admin.courses': {
    title: 'Academy courses',
    steps: [
      { target: 'page-header', title: 'Courses', body: 'Every course in the Academy.' },
      { title: 'Create and publish', body: 'Add a course, then open it to build its content. Clients only see a course once it is published.' },
    ],
  },
  'admin.course': {
    title: 'Course editor',
    steps: [
      { target: 'page-title', title: 'This course', body: 'Build and manage one course here.' },
      { target: 'course-tabs', title: 'Sections', body: 'Content for modules and lessons, Questions for practice banks, Students for enrolments, Sessions for live classes, and Settings.' },
    ],
  },
  'admin.leads': {
    title: 'Leads pipeline',
    steps: [
      { target: 'page-header', title: 'Your leads', body: 'People who have enquired but are not yet clients, with a count of active, lost and converted.' },
      { target: 'leads-view', title: 'Table or board', body: 'Switch between a list and a board that groups leads by stage, from New through to Converted or Lost.' },
      { target: 'leads-filters', skipIfMissing: true, title: 'Filter', body: 'Narrow the list to the leads you want to work on.' },
      { title: 'Work a lead', body: 'Open a lead to see its details, move it to the next stage, and convert it once the person becomes a client.' },
    ],
  },
  'admin.freeslots': {
    title: 'Free consultation slots',
    steps: [
      { target: 'page-header', title: 'Free consultation times', body: 'These are the times visitors can book on the website’s get-started page.' },
      { target: 'slots-form', title: 'Add slots', body: 'Choose the consultant, the date and the times.' },
      { target: 'slots-list', title: 'Current slots', body: 'Which times are still available and which are booked.' },
    ],
  },
  'admin.consultants': {
    title: 'Consultants',
    steps: [
      { target: 'page-header', title: 'Your consultants', body: 'Staff and partner consultants who take paid consultations and cases.' },
      { target: 'cons-tabs', title: 'Sections', body: 'Consultants for profiles, Availability and Slots for when they can be booked, Payouts for what they are owed, and Applications from people who want to join.' },
      { title: 'Logins and profiles', body: EMAIL_MATCH },
    ],
  },
  'admin.jobs': {
    title: 'Jobs and opportunities',
    steps: [
      { target: 'page-header', title: 'Opportunities', body: 'Job openings clients can apply to from their portal.' },
      { target: 'jobs-tabs', title: 'Opportunities and applications', body: 'Post and edit openings in one tab; review who has applied and update their status in the other.' },
    ],
  },
  'admin.partners': {
    title: 'Partners',
    steps: [
      { target: 'page-header', title: 'Partner organisations', body: 'Hospitals, universities and agencies we work with.' },
      { target: 'partners-stats', title: 'Totals', body: 'How many partners are verified and how many are pending.' },
      { target: 'partners-list', title: 'Verify before access', body: 'Add a partner, then verify them once checked. A partner should not see candidate information before they are verified.' },
    ],
  },
  'admin.staff': {
    title: 'Staff',
    steps: [
      { target: 'page-header', title: 'Your team', body: 'Everyone with a staff login, and their role.' },
      { title: 'Manage a staff member', body: 'Add a staff member or reset a password from here. A person’s role decides which pages and data they can reach.' },
      { title: 'Consultant profiles', body: 'A consultant needs a consultant profile as well as a login. ' + EMAIL_MATCH },
    ],
  },
  'admin.officers': {
    title: 'Processing officers',
    steps: [
      { target: 'page-title', title: 'Your processing officers', body: 'The staff who process cases day to day.' },
      { target: 'officers-stats', title: 'Workload', body: 'How many officers are active and how cases are spread across them.' },
      { target: 'officers-grid', title: 'Manage an officer', body: 'Edit an officer, or set them as unavailable and move their cases to someone else.' },
      { title: 'Unassigned cases', body: 'Active cases with no officer are flagged on this page so none is left waiting.' },
    ],
  },
  'admin.catalog': {
    title: 'Service catalog',
    steps: [
      { target: 'page-header', title: 'Services and prices', body: 'The categories and items clients choose from at checkout.' },
      { title: 'Changing a price', body: 'A new price applies to new orders only. Receipts already issued keep the price that was paid.' },
    ],
  },
  'admin.bookings': {
    title: 'Bookings',
    steps: [
      { target: 'page-header', title: 'All bookings', body: 'Sessions booked by clients and leads, with their status.' },
    ],
  },
  'admin.blog': {
    title: 'Blog and articles',
    steps: [
      { target: 'page-title', title: 'Website articles', body: 'Articles shown on the public website.' },
      { target: 'blog-stats', title: 'Totals', body: 'A summary of your articles.' },
      { target: 'blog-table', title: 'Write and manage', body: 'Create an article, edit or delete one, or view a published article on the site.' },
    ],
  },
  'admin.campaigns': {
    title: 'Campaigns',
    steps: [
      { target: 'page-header', title: 'Email campaigns', body: 'Email your leads and clients, once or on a repeating schedule.' },
      { title: 'Before you send', body: 'Choose who receives it, then send yourself a test. A campaign can be paused, resumed or cancelled, and its send history is kept.' },
    ],
  },
  'admin.surveys': {
    title: 'Surveys',
    steps: [
      { target: 'page-header', title: 'Surveys', body: 'Collect feedback from leads, clients and the public.' },
      { title: 'Build, share, read', body: 'Create a survey, add its questions, then open it to see the results. Duplicate one to reuse it.' },
    ],
  },
  'admin.tickets': {
    title: 'Support tickets',
    steps: [
      { target: 'page-title', title: 'Client support requests', body: 'Questions and problems clients have raised from their portal.' },
      { target: 'tix-stats', title: 'By status', body: 'Counts by status. Select one to filter the list.' },
      { target: 'tix-list', title: 'Tickets', body: 'Select a ticket to open its conversation.' },
      { target: 'tix-thread', skipIfMissing: true, title: 'Reply and update', body: 'Reply to the client, and set the status and priority as you work on it.' },
    ],
  },
  'admin.pathways': {
    title: 'Licensing pathways',
    steps: [
      { target: 'page-header', title: 'Pathways', body: 'The sequence of stages for each country and regulatory body. Clients are tracked against these stages.' },
      { target: 'path-filters', title: 'Find a pathway', body: 'Filter to the country or body you need.' },
      { title: 'Change with care', body: 'Clients already on a pathway are following its stages, so check who is affected before removing one.' },
    ],
  },
};
