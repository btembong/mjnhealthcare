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
              <img src="https://mjnhealthcare.com/mjnlogo.png" alt="MJN" height="36" style="display:block;height:36px;width:auto;border:0;" />
            </td>
            <td align="right" style="vertical-align:middle;">
              <div style="line-height:1.3;">
                <div><span style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:${NAVY};">MJN</span><span style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:${TEAL};"> Healthcare</span></div>
                <div><span style="font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:${MUTED};">Academy &amp; Professional Services</span></div>
              </div>
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
        <p style="margin:0 0 6px;font-size:11px;color:#9AA3B0;line-height:1.8;text-align:center;">
          MJN Health Academy and Professional Services Ltd &nbsp;·&nbsp;
          <a href="${WEB()}" style="color:#9AA3B0;text-decoration:none;">mjnhealthcare.com</a>
        </p>
        <p style="margin:0 0 6px;font-size:10px;color:#B0B8C4;text-align:center;">
          Auth. No. M032517649867P/RC/YAO/2025/B/637
        </p>
        <p style="margin:0 0 8px;font-size:11px;color:#9AA3B0;text-align:center;">
          <a href="https://www.instagram.com/mjnhealthcare" style="color:#9AA3B0;text-decoration:none;">Instagram</a>
          &nbsp;·&nbsp;
          <a href="https://www.facebook.com/mjnhealthacademy" style="color:#9AA3B0;text-decoration:none;">Facebook</a>
          &nbsp;·&nbsp;
          <a href="https://www.linkedin.com/company/mjn-health-academy" style="color:#9AA3B0;text-decoration:none;">LinkedIn</a>
          &nbsp;·&nbsp;
          <a href="https://x.com/mjnhealthcare" style="color:#9AA3B0;text-decoration:none;">X</a>
          &nbsp;·&nbsp; @mjnhealthcare
        </p>
        <p style="margin:0;font-size:10px;color:#B0B8C4;text-align:center;">
          Sent because of your engagement with MJN Healthcare. Reply to this email with any questions.
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
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${NAVY};">${text}</p>`;
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
    warning: { bg: '#EBF2FB', color: '#1A4E8C' },
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
    warning: { bg: '#EBF2FB', left: NAVY,      color: '#1A4E8C' },
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
    pSmall('Your itemised receipt is attached to this email. For any payment queries, reply here or email <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a> — or WhatsApp us at +971 50 863 8660.')
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
    pSmall('Need to discuss a payment arrangement? Reply to this email or reach us at <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a> / WhatsApp +971 50 863 8660.')
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
    pSmall('Need to discuss a payment arrangement? Reply to this email, write to <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a>, or WhatsApp us at +971 50 863 8660.')
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
    pSmall('To resolve this and reinstate your case immediately, reply to this email or contact us at <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a> / WhatsApp +971 50 863 8660.')
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
    pSmall('Need to reschedule? Contact your consultant immediately by replying to this email or via WhatsApp at +971 50 863 8660 so we can free the slot for another client.')
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
    p('One of our consultants will contact you before the session to confirm connection details. To make the most of your time, come prepared with:') +
    p('<strong>· Your target destination country</strong> (UAE, UK, US, Ireland, etc.)<br><strong>· Your profession and current registration status</strong><br><strong>· Any specific questions</strong> about licensing timelines, exam requirements, or placement') +
    btn('Explore our services', `${WEB()}/services`) +
    divider() +
    pSmall('Need to reschedule? Reply to this email or WhatsApp us at +971 50 863 8660 as soon as possible.')
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
  bookingId: string; clientName: string; consultantName: string; sessionStart: string; amountUsd: number; paymentUrl?: string;
}): string {
  const time = new Date(opts.sessionStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return shell(
    greeting(opts.clientName) +
    label('Action required') +
    h1('Complete your payment to confirm your session') +
    p(`Your session with <strong>${opts.consultantName}</strong> is reserved but <strong>not yet confirmed</strong>. Complete your payment now to secure your slot — it will be released automatically if payment is not received.`) +
    infoTable([
      row('Consultant', opts.consultantName),
      row('Date &amp; time', `<strong>${time} WAT</strong>`),
      row('Amount due', `<strong style="font-size:16px;color:${NAVY};">$${opts.amountUsd.toFixed(2)} USD</strong>`),
      row('Reference', `<span style="font-family:monospace;font-size:12px;">${opts.bookingId}</span>`, true),
    ]) +
    (opts.paymentUrl ? btn('Complete payment now', opts.paymentUrl) : '') +
    notice('Pay promptly to avoid losing your slot. Once payment clears, you will receive a separate confirmation email with your video join link.', 'info') +
    divider() +
    pSmall('Questions about payment? Reply to this email or contact us at <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a> or WhatsApp <strong>+971 50 863 8660</strong>.')
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
      `Reminders will be sent 24 h and 1 h before your session. Please join from a quiet location with a stable internet connection.${opts.recordingConsent ? ' This session may be recorded for quality assurance.' : ''} The advice provided is for general guidance only and does not constitute medical, legal, or regulatory advice. To reschedule, contact us at <a href="mailto:hello@mjnhealthcare.com" style="color:#0F4C81;">hello@mjnhealthcare.com</a> or WhatsApp +971 50 863 8660.`
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
    pSmall('This link is personal to you — do not share it. If you did not request this, contact us at hello@mjnhealthcare.com.')
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

export function tplConsultationPaymentFailed(opts: {
  clientName: string; clientEmail: string; clientPhone: string;
  consultantName: string; amountUsd: number; failReason: string;
  sessionStart: string; bookingId: string;
}): string {
  const sessionTime = opts.sessionStart
    ? new Date(opts.sessionStart).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '—';
  return shell(
    label('Payment Alert') +
    h1('Consultation payment failed') +
    p(`A client attempted to book a consultation but the payment did not complete. Follow up with them directly to help them retry.`) +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;border:1px solid #E2EBF3;border-radius:10px;overflow:hidden;">
      ${[
        ['Client', opts.clientName],
        ['Email', opts.clientEmail],
        ['Phone', opts.clientPhone || '—'],
        ['Consultant', opts.consultantName],
        ['Session', sessionTime],
        ['Amount', `$${opts.amountUsd.toFixed(2)}`],
        ['Fail reason', opts.failReason],
        ['Booking ID', opts.bookingId],
      ].map(([label, val], i) => `
        <tr style="background:${i % 2 === 0 ? '#F8FAFD' : '#FFFFFF'};">
          <td style="padding:10px 16px;font-size:13px;color:${MUTED};font-weight:600;width:38%;">${label}</td>
          <td style="padding:10px 16px;font-size:13px;color:${TEXT};font-weight:500;">${val}</td>
        </tr>`).join('')}
    </table>` +
    divider() +
    pSmall('This is an automated alert from MJN Healthcare. Log in to the admin console to view the full booking record.')
  );
}

// ── Lead admin notifications ───────────────────────────────────────────────────

export function tplLeadNewAdmin(opts: {
  name: string; email: string; phone?: string | null;
  profession?: string | null; destination?: string | null;
  serviceInterest?: string | null; source: string;
}): string {
  return shell(
    label('New Lead') +
    h1('A new lead has been captured') +
    infoTable([
      row('Name', opts.name),
      row('Email', `<a href="mailto:${opts.email}" style="color:${NAVY};text-decoration:none;">${opts.email}</a>`),
      row('Phone', opts.phone ?? '—'),
      row('Profession', opts.profession ?? '—'),
      row('Target country', opts.destination ?? '—'),
      row('Interest', opts.serviceInterest ?? '—'),
      row('Source', `<strong>${opts.source}</strong>`, true),
    ]) +
    btn('View in admin console', `${ADMIN()}/leads`) +
    divider() +
    pSmall('Assign a consultant and update the status in the admin console to begin follow-up.')
  );
}

export function tplLeadAssignedConsultant(opts: {
  consultantName: string; leadName: string; leadEmail: string;
  leadPhone?: string | null; leadProfession?: string | null;
  leadDestination?: string | null; leadNotes?: string | null;
}): string {
  return shell(
    greeting(opts.consultantName) +
    label('New assignment') +
    h1('A lead has been assigned to you') +
    p(`<strong>${opts.leadName}</strong> is now in your queue. Review their details below and reach out to qualify and book a consultation.`) +
    infoTable([
      row('Name', opts.leadName),
      row('Email', `<a href="mailto:${opts.leadEmail}" style="color:${NAVY};text-decoration:none;">${opts.leadEmail}</a>`),
      row('Phone', opts.leadPhone ?? '—'),
      row('Profession', opts.leadProfession ?? '—'),
      row('Target country', opts.leadDestination ?? '—'),
      ...(opts.leadNotes ? [row('Notes', `<em>${opts.leadNotes}</em>`, true)] : []),
    ]) +
    btn('Open admin leads', `${ADMIN()}/leads`) +
    divider() +
    pSmall('Contact the lead within 24 hours. Update the status to QUALIFIED once they are confirmed as a fit, or LOST if not proceeding.')
  );
}

export function tplLeadConvertedInvite(opts: {
  name: string; email: string;
}): string {
  return shell(
    greeting(opts.name) +
    label('Welcome') +
    h1('Your MJN Healthcare portal is ready') +
    p('Great news — your account has been set up and your case is now active. Log in to your portal to track your pipeline, upload documents, and stay in sync with your consultant.') +
    btn('Access your portal', `${PORTAL()}/login`) +
    infoTable([
      row('How to log in', 'Go to your portal and enter your email address', false),
      row('OTP code', 'A 6-digit code will be sent to this email — valid for 10 minutes', true),
    ]) +
    divider() +
    pSmall('If you have any questions, reply to this email or WhatsApp your consultant directly at +971 50 863 8660.')
  );
}

export function tplStaleLeadsAdmin(opts: {
  newLeads: { name: string; email: string; daysOld: number }[];
  contactedLeads: { name: string; email: string; daysOld: number }[];
}): string {
  const newRows = opts.newLeads.map((l) =>
    `<tr><td style="padding:8px 12px;font-size:13px;color:${TEXT};">${l.name}</td><td style="padding:8px 12px;font-size:13px;color:${MUTED};">${l.email}</td><td style="padding:8px 12px;font-size:13px;color:#C0392B;font-weight:600;">${l.daysOld}d in NEW</td></tr>`
  ).join('');
  const contactedRows = opts.contactedLeads.map((l) =>
    `<tr><td style="padding:8px 12px;font-size:13px;color:${TEXT};">${l.name}</td><td style="padding:8px 12px;font-size:13px;color:${MUTED};">${l.email}</td><td style="padding:8px 12px;font-size:13px;color:#D35400;font-weight:600;">${l.daysOld}d in CONTACTED</td></tr>`
  ).join('');

  const table = (rows: string, caption: string) => rows
    ? `<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${TEXT};">${caption}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
         <thead><tr style="background:#F4F6F9;">
           <th style="padding:8px 12px;font-size:11px;text-align:left;color:${MUTED};">Name</th>
           <th style="padding:8px 12px;font-size:11px;text-align:left;color:${MUTED};">Email</th>
           <th style="padding:8px 12px;font-size:11px;text-align:left;color:${MUTED};">Status</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>` : '';

  return shell(
    label('Action required') +
    h1('Stale leads need follow-up') +
    p(`The following leads have had no status change and may need immediate attention.`) +
    table(newRows, `🔴 New leads (no contact in >3 days)`) +
    table(contactedRows, `🟠 Contacted leads (no progress in >7 days)`) +
    btn('Manage leads now', `${ADMIN()}/leads`) +
    divider() +
    pSmall('This is an automated daily alert. Update the lead status or assign a consultant to stop receiving these alerts for specific leads.')
  );
}

export function tplOtp(opts: { otp: string }): string {
  const digitCells = opts.otp.split('').map(d =>
    `<td style="width:44px;height:54px;text-align:center;vertical-align:middle;background:#F4F8FF;border:1.5px solid #BDD0E8;border-radius:6px;font-size:26px;font-weight:700;color:${NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${d}</td>`
  ).join('<td style="width:8px;"></td>');

  return shell(
    label('Verification') +
    h1('Your sign-in code') +
    p('Enter the code below to access your MJN Healthcare account. It expires in <strong>10 minutes</strong> and is valid for one use only.') +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>${digitCells}</tr>
    </table>` +
    `<p style="margin:0 0 24px;font-size:12.5px;line-height:1.65;color:${MUTED};"><strong style="color:${TEXT};">Security notice:</strong> Never share this code with anyone. MJN Healthcare staff will never ask for your sign-in code by phone, email, or chat.</p>` +
    divider() +
    pSmall('If you did not request this code, you can safely ignore this email. Your account remains secure.')
  );
}
