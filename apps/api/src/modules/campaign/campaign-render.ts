import { shell } from '../notification/email-templates';

export interface CampaignEmailInput {
  subject: string;
  body: string;
  /** Recipient's name; falls back to "there". */
  name?: string | null;
  unsubscribeUrl: string;
  useBrandTemplate: boolean;
  isTest?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAME_TAG = /\{\{\s*name\s*\}\}/gi;

/** Builds the exact subject and HTML delivered to one recipient. */
export function renderCampaignEmail(input: CampaignEmailInput): { subject: string; html: string } {
  const name = input.name?.trim() || 'there';
  const subject = (input.isTest ? '[TEST] ' : '') + input.subject.replace(NAME_TAG, name);

  const isHtml = /<[a-z][\s\S]*>/i.test(input.body);
  let content: string;
  if (isHtml) {
    content = input.body.replace(NAME_TAG, escapeHtml(name));
  } else {
    const text = escapeHtml(input.body).replace(NAME_TAG, escapeHtml(name));
    content = input.useBrandTemplate
      // Blank lines separate paragraphs; single line breaks are kept.
      ? text
          .split(/\r?\n\s*\r?\n/)
          .filter((para) => para.trim())
          .map((para) => `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3D4A5C;">${para.trim().replace(/\r?\n/g, '<br>')}</p>`)
          .join('')
      : text.replace(/\r?\n/g, '<br>');
  }

  if (input.useBrandTemplate) {
    const footerNote =
      `You are receiving this email from MJN Healthcare. ` +
      `<a href="${input.unsubscribeUrl}" style="color:#9AA3B0;text-decoration:underline;">Unsubscribe</a>`;
    return { subject, html: shell(content, footerNote) };
  }

  const footer =
    `<p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">` +
    `You are receiving this email from MJN Healthcare. ` +
    `<a href="${input.unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a></p>`;
  // A base font so plain content does not fall back to the mail client's serif default.
  return {
    subject,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111827;">${content}${footer}</div>`,
  };
}
