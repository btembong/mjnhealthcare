import type { TourDef, TourLabels, TourStep } from '@mjn/ui';

const PAGE_TOURS: Record<string, string> = {
  '/caseload': 'admin.caseload',
  '/documents': 'admin.documents',
  '/drafts': 'admin.drafts',
  '/leads': 'admin.leads',
};

export function tourKeyForPath(pathname: string): string | null {
  return PAGE_TOURS[pathname] ?? null;
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

const HELP_STEP: TourStep = {
  target: 'help-button',
  title: 'Help is always here',
  body: 'Open this on any page to read a short guide or replay a walkthrough.',
};

const AI_RULE =
  'Messages drafted by AI are never sent on their own. A staff member reviews, edits if needed and approves each one first.';

export const TOURS: Record<string, TourDef> = {
  'admin.welcome.admin': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to the admin console',
        body: 'This is where the team runs every client engagement. Here is a quick look at the areas you will use most.',
      },
      {
        target: 'nav:/caseload',
        title: 'Caseload',
        body: 'Every engagement, with its consultant, status and stage. Open a case to see its full history.',
      },
      {
        target: 'nav:/documents',
        title: 'Documents',
        body: 'Client uploads waiting for review. Verify a document, or reject it with a reason so the client can replace it.',
      },
      {
        target: 'nav:/drafts',
        title: 'AI Drafts',
        body: AI_RULE,
      },
      {
        target: 'nav:/leads',
        title: 'Leads',
        body: 'Enquiries from the website and the support assistant, ready to follow up and convert.',
      },
      HELP_STEP,
    ],
  },
  'admin.welcome.consultant': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you manage the clients assigned to you. Here is a quick look around.',
      },
      {
        target: 'nav:/caseload',
        title: 'My Caseload',
        body: 'The cases assigned to you. Open one to see its stage, documents and history.',
      },
      {
        target: 'nav:/messages',
        title: 'Messages',
        body: 'Conversations with your clients.',
      },
      {
        target: 'nav:/sessions',
        title: 'Sessions',
        body: 'Your scheduled consultations.',
      },
      {
        target: 'nav:/drafts',
        title: 'AI Drafts',
        body: AI_RULE,
      },
      HELP_STEP,
    ],
  },
  'admin.welcome.officer': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you process the cases assigned to you. Here is a quick look around.',
      },
      {
        target: 'nav:/officer/caseload',
        title: 'My Caseload',
        body: 'The cases you are processing. Open one to work on it.',
      },
      {
        target: 'nav:/officer/documents',
        title: 'Documents',
        body: 'Documents for your cases.',
      },
      {
        target: 'nav:/officer/stages',
        title: 'Stage Tracker',
        body: 'Where each of your cases sits in its pathway.',
      },
      {
        target: 'nav:/officer/escalations',
        title: 'Escalations',
        body: 'Raise a case with its consultant when something needs their decision.',
      },
      HELP_STEP,
    ],
  },
  'admin.welcome.finance': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you follow revenue, payments and referral credits. Here is a quick look around.',
      },
      { target: 'nav:/finance', title: 'Finance', body: 'The financial overview.' },
      { target: 'nav:/payments', title: 'Payments', body: 'Client payments and their status.' },
      { target: 'nav:/reports', title: 'Reports', body: 'Reports across the business.' },
      HELP_STEP,
    ],
  },
  'admin.welcome.compliance': {
    title: 'Console walkthrough',
    steps: [
      {
        title: 'Welcome to your console',
        body: 'This is where you review client documents and the audit trail. Here is a quick look around.',
      },
      {
        target: 'nav:/documents',
        title: 'Documents',
        body: 'Client uploads waiting for review. Verify a document, or reject it with a reason so the client can replace it.',
      },
      {
        target: 'nav:/audit',
        title: 'Audit Log',
        body: 'A record of who did what, and when.',
      },
      HELP_STEP,
    ],
  },

  'admin.caseload': {
    title: 'Caseload',
    steps: [
      {
        target: 'page-header',
        title: 'Your caseload',
        body: 'Consultants see the cases assigned to them. Admins see every engagement.',
      },
      {
        target: 'page-actions',
        skipIfMissing: true,
        title: 'Start a new case',
        body: 'Create an engagement for a client from here.',
      },
      {
        title: 'Open a case',
        body: 'Select any case in the list to see its stage, documents, payments and notes.',
      },
    ],
  },
  'admin.documents': {
    title: 'Document review',
    steps: [
      {
        title: 'The review queue',
        body: 'Documents waiting for review are listed first. Open one to check it.',
      },
      {
        title: 'Verify or reject',
        body: 'Verify a document once you have checked it. To reject, give a reason: the client sees it and can upload a corrected copy.',
      },
    ],
  },
  'admin.drafts': {
    title: 'AI Draft Review',
    steps: [
      {
        target: 'page-header',
        title: 'Review before sending',
        body: AI_RULE,
      },
      {
        title: 'Edit, then approve',
        body: 'Change the wording where needed, then approve. Approval records your name and the time, and the consultant can then send the message.',
      },
    ],
  },
  'admin.leads': {
    title: 'Leads Pipeline',
    steps: [
      {
        target: 'page-header',
        title: 'Your leads',
        body: 'People who have enquired but are not yet clients, with a count of active, lost and converted leads.',
      },
      {
        title: 'Work the pipeline',
        body: 'Follow up each lead and update its status as it progresses, so the team can see what is still open.',
      },
    ],
  },
};
