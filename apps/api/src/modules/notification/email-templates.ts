/**
 * MJN Healthcare — Email templates.
 *
 * Design language: clean, minimal professional services (Clio / Stripe aesthetic).
 *  • Thin gradient accent bar at card top
 *  • White card on #F4F6F9 background
 *  • Table-based layout (Outlook-safe); inline styles only
 *  • Brand gradient on all CTA buttons
 *  • Short, action-first copy — no padding paragraphs
 */

const PORTAL = () => process.env.PORTAL_URL ?? 'http://localhost:3002';
const WEB    = () => process.env.WEB_URL    ?? 'http://localhost:3001';
const ADMIN  = () => process.env.ADMIN_URL  ?? 'http://localhost:3004';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY   = '#0F4C81';
const TEAL   = '#00A896';
const MID    = '#1565C0';
const GRAD   = `linear-gradient(135deg,${NAVY} 0%,${MID} 55%,${TEAL} 100%)`;
const BG     = '#F4F6F9';
const BORDER = '#E4E9F0';
const TEXT   = '#1A2433';
const MUTED  = '#6B7A90';

// ── Shell ─────────────────────────────────────────────────────────────────────

export function shell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>MJN Healthcare</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:48px 16px 64px;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

    <!-- Gradient accent bar -->
    <tr>
      <td bgcolor="${NAVY}" height="4" style="background:${GRAD};border-radius:8px 8px 0 0;font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- Logo row -->
    <tr>
      <td style="background:#ffffff;padding:28px 40px 24px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:${NAVY};">MJN</span><span style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:${TEAL};"> Healthcare</span>
            </td>
            <td align="right">
              <span style="font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:${MUTED};">Academy &amp; Professional Services</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Thin rule -->
    <tr>
      <td style="background:#ffffff;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};padding:0 40px;">
        <div style="height:1px;background:${BORDER};"></div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="background:#ffffff;padding:36px 40px 40px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
        ${body}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#F8FAFB;border:1px solid ${BORDER};border-top:none;border-radius:0 0 8px 8px;padding:20px 40px;">
        <p style="margin:0;font-size:11px;color:#9AA3B0;line-height:1.8;text-align:center;">
          MJN Healthcarecare Academy and Professional Services Ltd &nbsp;·&nbsp;
          <a href="${WEB()}" style="color:#9AA3B0;text-decoration:none;">mjnhealthcare.com</a><br>
          Sent because of your engagement with MJN Healthcarecare. Reply to this email with any questions.
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Primitives ────────────────────────────────────────────────────────────────

export function label(text: string): string {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${TEAL};">${text}</p>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:24px;font-weight:800;color:${TEXT};letter-spacing:-0.5px;line-height:1.25;">${text}</h1>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3D4A5C;">${text}</p>`;
}

export function pSmall(text: string): string {
  return `<p style="margin:0;font-size:12px;line-height:1.7;color:${MUTED};">${text}</p>`;
}

export function greeting(name: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;color:#3D4A5C;">Hi <strong style="color:${TEXT};">${name}</strong>,</p>`;
}

export function divider(): string {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

/** CTA button — uses brand gradient, works in Outlook via bgcolor fallback */
export function btn(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
    <tr>
      <td bgcolor="${NAVY}" style="background:${GRAD};border-radius:6px;">
        <a href="${href}" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;border-radius:6px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

/** Borderless key/value data row */
export function row(label: string, value: string, last = false): string {
  return `<tr>
    <td style="padding:11px 0;${last ? '' : `border-bottom:1px solid ${BORDER};`}font-size:12px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;color:${MUTED};width:36%;vertical-align:top;">${label}</td>
    <td style="padding:11px 0 11px 20px;${last ? '' : `border-bottom:1px solid ${BORDER};`}font-size:14px;font-weight:500;color:${TEXT};vertical-align:top;">${value}</td>
  </tr>`;
}

export function infoTable(rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:4px 0 28px;">
    ${rows.join('')}
  </table>`;
}

/** Inline status pill */
export function badge(text: string, type: 'success' | 'warning' | 'error' | 'info' | 'neutral'): string {
  const map = {
    success: { bg: '#E6F7F5', color: '#0A7A6E' },
    warning: { bg: '#FEF6E7', color: '#92600A' },
    error:   { bg: '#FEE9E7', color: '#991B1B' },
    info:    { bg: '#EBF2FB', color: '#1A4E8C' },
    neutral: { bg: '#EDF0F4', color: '#4A5568' },
  };
  const s = map[type];
  return `<span style="display:inline-block;background:${s.bg};color:${s.color};padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">${text}</span>`;
}

/** Subtle notice strip */
export function notice(text: string, type: 'info' | 'warning' | 'error'): string {
  const map = {
    info:    { bg: '#EBF2FB', left: NAVY,    color: '#1A4E8C' },
    warning: { bg: '#FEF6E7', left: '#D97706', color: '#78490A' },
    error:   { bg: '#FEE9E7', left: '#DC2626', color: '#7F1D1D' },
  };
  const s = map[type];
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="background:${s.bg};border-left:3px solid ${s.left};border-radius:0 4px 4px 0;padding:12px 16px;font-size:13px;line-height:1.55;color:${s.color};">${text}</td>
    </tr>
  </table>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function tplPaymentConfirmed(opts: {
  name: string; receiptId: string; orderId: string;
}): string {
  return shell(
    greeting(opts.name) +
    label('Payment') +
    h1('Payment received') +
    p('Your payment has been processed. Your consulting case is now active and a consultant will be in touch shortly.') +
    infoTable([
      row('Receipt', `<span style="font-family:monospace;font-size:13px;">${opts.receiptId}</span>`),
      row('Order', `<span style="font-family:monospace;font-size:13px;">${opts.orderId}</span>`, true),
    ]) +
    btn('Go to your portal', `${PORTAL()}/dashboard`) +
    divider() +
    pSmall('Questions about your payment? Reply to this email or contact your assigned consultant.')
  );
}

export function tplInstallmentDue(opts: {
  name: string; orderId: string; amount: number;
}): string {
  return shell(
    greeting(opts.name) +
    label('Billing') +
    h1('Instalment due') +
    infoTable([
      row('Amount due', `<strong style="font-size:16px;color:${NAVY};">$${opts.amount.toFixed(2)}</strong>`),
      row('Order', `<span style="font-family:monospace;font-size:13px;">${opts.orderId}</span>`, true),
    ]) +
    btn('Pay now', `${PORTAL()}/payments`) +
    divider() +
    pSmall('Need to discuss a payment arrangement? Reply to this email.')
  );
}

export function tplInstallmentOverdue(opts: {
  name: string; orderId: string; amount: number; daysPastDue: number; daysUntilHold: number; isWarning: boolean;
}): string {
  return shell(
    greeting(opts.name) +
    label(opts.isWarning ? 'Urgent' : 'Reminder') +
    h1(opts.isWarning ? 'Payment overdue' : 'Instalment overdue') +
    infoTable([
      row('Amount overdue', `<strong style="font-size:16px;color:#DC2626;">$${opts.amount.toFixed(2)}</strong>`),
      row('Days overdue', `${opts.daysPastDue} days`),
      row('Order', `<span style="font-family:monospace;font-size:13px;">${opts.orderId}</span>`, true),
    ]) +
    (opts.isWarning
      ? notice(`Your engagement will be placed on hold in <strong>${opts.daysUntilHold} days</strong> if payment is not received.`, 'error')
      : notice('Please complete this payment to keep your case on track.', 'warning')
    ) +
    btn('Pay now', `${PORTAL()}/payments`) +
    divider() +
    pSmall('Need to discuss a payment arrangement? Reply to this email or contact your consultant.')
  );
}

export function tplEngagementOnHold(opts: {
  name: string; engagementId: string; orderId: string; amount: number; daysPastDue: number;
}): string {
  return shell(
    greeting(opts.name) +
    label('Account') +
    h1('Engagement on hold') +
    p('Your MJN Healthcare engagement has been placed on hold due to an outstanding payment.') +
    infoTable([
      row('Amount outstanding', `<strong style="font-size:16px;color:#DC2626;">$${opts.amount.toFixed(2)}</strong>`),
      row('Days overdue', `${opts.daysPastDue} days`),
      row('Order', `<span style="font-family:monospace;font-size:13px;">${opts.orderId}</span>`, true),
    ]) +
    notice('While on hold, no active work is carried out on your case. Pay the outstanding amount to reinstate immediately.', 'error') +
    btn('Pay to reinstate', `${PORTAL()}/payments`) +
    divider() +
    pSmall('Need to discuss a payment plan? Reply to this email.')
  );
}

export function tplDocumentExpiring(opts: {
  name: string; daysLeft: number; documentType?: string;
}): string {
  const urgent = opts.daysLeft <= 14;
  return shell(
    greeting(opts.name) +
    label('Documents') +
    h1(`Document expiring in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`) +
    p(`Your${opts.documentType ? ` <strong>${opts.documentType}</strong>` : ''} document on file will expire soon. Please upload a renewal to avoid delays to your licensing or placement process.`) +
    (urgent
      ? notice(`Expired documents can stall DataFlow verification or your licensing application.`, 'error')
      : notice(`Upload a renewal now to keep your case moving forward.`, 'warning')
    ) +
    btn('Upload renewal', `${PORTAL()}/documents`) +
    divider() +
    pSmall('Already uploaded? Allow up to 24 hours for verification.')
  );
}

export function tplLicensingStageChanged(opts: {
  name: string; stageLabel: string;
}): string {
  return shell(
    greeting(opts.name) +
    label('Case update') +
    h1('Your case has advanced') +
    infoTable([
      row('New stage', `${badge(opts.stageLabel, 'info')}`, true),
    ]) +
    btn('View your case', `${PORTAL()}/case`) +
    divider() +
    pSmall('Your consultant will be in touch if any documents or actions are required at this stage.')
  );
}

export function tplSessionReminder(opts: {
  name: string; sessionType: string; slotStart: string; portalLink?: string;
}): string {
  return shell(
    greeting(opts.name) +
    label('Reminder') +
    h1('Your session is starting soon') +
    infoTable([
      row('Session', opts.sessionType),
      row('Time', `<strong>${opts.slotStart}</strong>`, true),
    ]) +
    btn('Join session', opts.portalLink ?? `${PORTAL()}/dashboard`) +
    divider() +
    pSmall('Need to reschedule? Contact your consultant as soon as possible.')
  );
}

export function tplLeadConsultationBooked(opts: {
  name: string; slotStart: string;
}): string {
  const time = new Date(opts.slotStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return shell(
    greeting(opts.name) +
    label('Consultation') +
    h1('Your free consultation is confirmed') +
    infoTable([
      row('Date &amp; time', `<strong>${time} WAT</strong>`, true),
    ]) +
    p('A consultant will reach out to confirm your call details before the session. Come prepared with any questions about licensing, placement, or exam preparation.') +
    btn('Explore our services', `${WEB()}/services`) +
    divider() +
    pSmall('Need to reschedule? Reply to this email.')
  );
}

export function tplLeadConsultationBookedAdmin(opts: {
  name: string; email: string; phone?: string | null; profession?: string | null; destination?: string | null; slotStart: string;
}): string {
  const time = new Date(opts.slotStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return shell(
    label('New lead') +
    h1('Consultation booked') +
    infoTable([
      row('Name', opts.name),
      row('Email', `<a href="mailto:${opts.email}" style="color:${NAVY};text-decoration:none;">${opts.email}</a>`),
      row('Phone', opts.phone ?? '—'),
      row('Profession', opts.profession ?? '—'),
      row('Destination', opts.destination ?? '—'),
      row('Slot', `<strong>${time} WAT</strong>`, true),
    ]) +
    btn('Open admin console', `${ADMIN()}/leads`)
  );
}

export function tplConsultationInitiated(opts: {
  bookingId: string; clientName: string; consultantName: string; sessionStart: string; amountUsd: number;
}): string {
  const time = new Date(opts.sessionStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return shell(
    greeting(opts.clientName) +
    label('Booking') +
    h1('Complete your payment to confirm') +
    infoTable([
      row('Consultant', opts.consultantName),
      row('Date &amp; time', `<strong>${time} WAT</strong>`),
      row('Amount', `<strong style="font-size:16px;color:${NAVY};">$${opts.amountUsd}</strong>`),
      row('Reference', `<span style="font-family:monospace;font-size:12px;">${opts.bookingId}</span>`, true),
    ]) +
    notice('Your slot is reserved but <strong>not yet confirmed</strong>. It will be released if payment is not received.', 'warning') +
    divider() +
    pSmall('Once payment clears, you will receive a confirmation email with your join link.')
  );
}

export function tplConsultationConfirmed(opts: {
  bookingId: string; clientName: string; consultantName: string; sessionStart: string;
  durationMins: number; roomUrl: string; categoryLabel: string; recordingConsent: boolean;
}): string {
  const time = new Date(opts.sessionStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return shell(
    greeting(opts.clientName) +
    label('Confirmed') +
    h1(`${opts.categoryLabel} session confirmed`) +
    infoTable([
      row('Consultant', opts.consultantName),
      row('Date &amp; time', `<strong>${time} WAT</strong>`),
      row('Duration', `${opts.durationMins} min`),
      row('Reference', `<span style="font-family:monospace;font-size:12px;">${opts.bookingId}</span>`, true),
    ]) +
    btn('Join session', opts.roomUrl) +
    divider() +
    pSmall(
      `Reminders will be sent 24 h and 1 h before your session.${opts.recordingConsent ? ' This session may be recorded for quality assurance.' : ''} For general guidance only — not medical or legal advice.`
    )
  );
}

export function tplConsultationCancelled(opts: {
  clientName: string; refundAmount: number; refundPercent: number; reason: string;
}): string {
  const refund = opts.refundAmount > 0
    ? `$${opts.refundAmount.toFixed(2)} (${opts.refundPercent}%) will be refunded within 5–7 business days.`
    : 'No refund applies per our cancellation policy (cancelled less than 4 hours before session).';

  return shell(
    greeting(opts.clientName) +
    label('Cancellation') +
    h1('Consultation cancelled') +
    infoTable([
      row('Refund', opts.refundAmount > 0 ? `$${opts.refundAmount.toFixed(2)} (${opts.refundPercent}%)` : 'None applicable', true),
    ]) +
    notice(refund, opts.refundAmount > 0 ? 'info' : 'warning') +
    btn('Book another session', `${WEB()}/consult`) +
    divider() +
    pSmall('Questions about the cancellation? Reply to this email.')
  );
}

export function tplApplicationReviewed(opts: {
  applicantName: string; approved: boolean; reviewNote?: string;
}): string {
  if (opts.approved) {
    return shell(
      greeting(opts.applicantName) +
      label('Application') +
      h1('Application approved') +
      p('Your application to join the MJN Healthcare consultant network has been approved. Your profile will be activated and you will receive access credentials shortly.') +
      btn('Learn more', `${WEB()}/become-a-consultant`) +
      divider() +
      pSmall('Welcome to the MJN Healthcare team.')
    );
  }
  return shell(
    greeting(opts.applicantName) +
    label('Application') +
    h1('Application update') +
    p(`Thank you for your interest in joining our consultant network. After careful review, we are unable to proceed with your application at this time.${opts.reviewNote ? ` <em>${opts.reviewNote}</em>` : ''}`) +
    p('You are welcome to reapply in the future.') +
    divider() +
    pSmall('We appreciate your interest in MJN Healthcare and wish you the very best.')
  );
}

export function tplEngagementSignRequest(opts: { name: string; signUrl: string }): string {
  return shell(
    greeting(opts.name) +
    label('Action required') +
    h1('Sign your engagement letter') +
    p('Your MJN Healthcare consulting engagement is ready. Please sign your engagement letter to activate your case. The letter covers scope, fees, and key disclaimers — it takes about 2 minutes to review.') +
    btn('Read &amp; sign letter', opts.signUrl) +
    divider() +
    pSmall('This link is personal to you — do not share it. If you did not request this, contact us at support@mjnhealth.com.')
  );
}

export function tplEngagementLetterSigned(opts: { name: string }): string {
  return shell(
    greeting(opts.name) +
    label('Engagement') +
    h1('Your case is now active') +
    p('Your engagement letter has been signed. A consultant will be in touch shortly to introduce themselves and outline your next steps.') +
    infoTable([
      row('Status', badge('Active', 'success'), true),
    ]) +
    btn('View your case', `${PORTAL()}/case`) +
    divider() +
    pSmall('Your signed letter is available in your portal under Documents.')
  );
}

// ── Staffing / Job applications ───────────────────────────────────────────────

export function tplApplicationSubmittedAdmin(opts: {
  applicantName: string; applicantEmail: string; applicantPhone?: string | null;
  opportunityTitle: string; opportunityCountry: string; applicationId: string;
}): string {
  return shell(
    label('Staffing') +
    h1('New application received') +
    infoTable([
      row('Candidate', opts.applicantName),
      row('Email', `<a href="mailto:${opts.applicantEmail}" style="color:${NAVY};text-decoration:none;">${opts.applicantEmail}</a>`),
      row('Phone', opts.applicantPhone ?? '—'),
      row('Opportunity', `<strong>${opts.opportunityTitle}</strong>`),
      row('Country', opts.opportunityCountry),
      row('Application', `<span style="font-family:monospace;font-size:12px;">${opts.applicationId}</span>`, true),
    ]) +
    btn('Review in admin console', `${ADMIN()}/jobs`)
  );
}

export function tplApplicationStatusChanged(opts: {
  applicantName: string; status: string; opportunityTitle: string; opportunityCountry: string; notes?: string | null;
}): string {
  const map: Record<string, { label: string; badge: 'success' | 'info' | 'warning' | 'error' | 'neutral'; tag: string; body: string }> = {
    SHORTLISTED: { label: 'Shortlisted',            badge: 'info',    tag: 'Good news',   body: 'You have been shortlisted for this opportunity. Your consultant will follow up with next steps.' },
    INTERVIEW:   { label: 'Interview stage',         badge: 'info',    tag: 'Next step',   body: 'You have progressed to the interview stage. Your consultant will be in touch with timing and format details.' },
    OFFERED:     { label: 'Offer extended',          badge: 'success', tag: 'Offer',       body: 'An offer has been extended for this position. Log in to your portal to review it and respond.' },
    REJECTED:    { label: 'Application unsuccessful', badge: 'neutral', tag: 'Update',     body: 'Thank you for applying. After careful review, we are unable to progress your application at this time. We encourage you to check other open opportunities.' },
    WITHDRAWN:   { label: 'Application withdrawn',   badge: 'neutral', tag: 'Withdrawn',   body: 'Your application has been marked as withdrawn. If this was in error, please contact your consultant.' },
  };

  const s = map[opts.status] ?? { label: opts.status, badge: 'neutral' as const, tag: 'Update', body: 'The status of your application has been updated. Log in to your portal for details.' };

  return shell(
    greeting(opts.applicantName) +
    label(s.tag) +
    h1(s.label) +
    p(s.body) +
    infoTable([
      row('Opportunity', `<strong>${opts.opportunityTitle}</strong>`),
      row('Location', opts.opportunityCountry),
      row('Status', badge(s.label, s.badge), !opts.notes),
      ...(opts.notes ? [row('Note', `<em style="color:#3D4A5C;">${opts.notes}</em>`, true)] : []),
    ]) +
    btn('View my applications', `${PORTAL()}/opportunities`) +
    divider() +
    pSmall('Questions about your application? Reply to this email or contact your consultant directly.')
  );
}

// ── OTP / verification ────────────────────────────────────────────────────────

export function tplOtp(opts: { otp: string }): string {
  return shell(
    label('Verification') +
    h1('Your sign-in code') +
    p('Use the code below to sign in to MJN Healthcare. It expires in <strong>10 minutes</strong> and can only be used once.') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 28px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:#F0F4F9;border:1px solid ${BORDER};border-radius:8px;padding:20px 44px;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;letter-spacing:14px;color:${NAVY};line-height:1;">${opts.otp}</span>
          </div>
        </td>
      </tr>
    </table>` +
    notice('Do not share this code. MJN Healthcare staff will never ask for your OTP.', 'warning') +
    divider() +
    pSmall('If you did not request this code, you can safely ignore this email.')
  );
}
