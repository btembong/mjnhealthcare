'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, CircleNotch, Check } from '@mjn/ui';
import { api } from '../lib/api';

// Shared by the staff chat screens: message text plus any file sent with it.

const DOCUMENT_TYPES: [string, string][] = [
  ['PASSPORT_COPY', 'Passport'], ['NURSING_LICENSE', 'Nursing licence'], ['MEDICAL_LICENSE', 'Medical licence'],
  ['DIPLOMA_DEGREE', 'Diploma certificate'], ['BACHELORS_DEGREE', 'Bachelor’s degree'], ['DIPLOMA_TRANSCRIPT', 'Transcript'],
  ['GOOD_STANDING_CERTIFICATE', 'Good standing certificate'], ['WORK_EXPERIENCE_CERTIFICATE', 'Work experience certificate'],
  ['BIRTH_CERTIFICATE', 'Birth certificate'], ['PHOTO_ID', 'Photo ID'], ['OTHER', 'Other document'],
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|docx?)$/i;
export const CHAT_FILE_ACCEPT = 'image/jpeg,image/png,.pdf,.doc,.docx';

/** Why a file cannot be sent, or an empty string when it can. */
export function chatFileProblem(file: File): string {
  if (file.size > MAX_FILE_SIZE) return 'That file is larger than 20 MB.';
  if (!ALLOWED_EXT.test(file.name)) return 'Only PDF, JPG, PNG and Word files can be sent.';
  return '';
}

/** Uploads a file for this conversation and returns what to send with the message. */
export async function uploadChatFile(engagementId: string, file: File) {
  const { url, key } = await api.getMessageUploadUrl(engagementId, file.name);
  const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
  if (!put.ok) throw new Error('The file could not be uploaded. Please try again.');
  return { key, name: file.name, type: file.type };
}

/** Older client messages carried the file as a code inside the text. Show those as a plain link. */
function parseLegacy(content: string): { text: string; name: string; url: string } {
  const m = content.match(/^([\s\S]*?)\n?\[(?:IMG|FILE)\]:([^:]+):([\s\S]+)$/);
  if (m) return { text: m[1].trim(), name: m[2], url: m[3].trim() };
  return { text: content, name: '', url: '' };
}

async function openInNewTab(getUrl: () => Promise<string>) {
  // Opened before the request so the browser does not treat it as a pop-up.
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  try {
    const url = await getUrl();
    if (win) win.location.href = url; else window.location.href = url;
  } catch (e: any) {
    win?.close();
    toast.error(e.message ?? 'The file could not be opened.');
  }
}

export function MessageBody({ msg, onDark }: { msg: any; onDark: boolean }) {
  const legacy = parseLegacy(msg.content ?? '');
  const attachment = msg.attachment as { name: string; isImage: boolean } | null;
  const fromClient = msg.senderType === 'CLIENT';
  const [thumb, setThumb] = useState('');
  const [saving, setSaving] = useState<'closed' | 'choosing' | 'busy' | 'done'>('closed');
  const [docType, setDocType] = useState('');

  useEffect(() => {
    let live = true;
    if (attachment?.isImage) api.getMessageAttachmentUrl(msg.id).then((r) => { if (live) setThumb(r.url); }).catch(() => {});
    return () => { live = false; };
  }, [msg.id, attachment?.isImage]);

  async function save() {
    if (!docType) return;
    setSaving('busy');
    try {
      const r = await api.saveMessageAttachment(msg.id, docType);
      toast.success(r.alreadySaved ? 'This file is already in the client’s documents.' : 'Saved to the client’s documents. It is now in the review queue.');
      setSaving('done');
    } catch (e: any) {
      toast.error(e.message ?? 'The file was not saved.');
      setSaving('choosing');
    }
  }

  const chip = `flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${onDark ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-border bg-white text-foreground hover:bg-muted/60'}`;
  const open = () => openInNewTab(async () => (await api.getMessageAttachmentUrl(msg.id)).url);

  return (
    <div className="space-y-2">
      {legacy.text && <p className="whitespace-pre-wrap break-words">{legacy.text}</p>}

      {legacy.url && (
        <a href={legacy.url} target="_blank" rel="noreferrer" className={chip}>
          <FileText className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1 truncate">{legacy.name}</span>
        </a>
      )}

      {attachment && (
        <div className="space-y-1.5">
          {attachment.isImage && thumb ? (
            <button onClick={open} className="block" aria-label={`Open ${attachment.name}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt={attachment.name} className="max-h-56 max-w-full rounded-xl object-cover" />
            </button>
          ) : (
            <button onClick={open} className={chip}>
              <FileText className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            </button>
          )}

          {/* A credential sent in chat only reaches review when staff file it. */}
          {fromClient && saving === 'closed' && (
            <button onClick={() => setSaving('choosing')} className="text-xs font-bold text-primary hover:underline">Save to client’s documents</button>
          )}
          {fromClient && (saving === 'choosing' || saving === 'busy') && (
            <div className="flex flex-wrap items-center gap-1.5">
              <select aria-label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-white px-2 text-xs text-foreground outline-none focus:border-primary">
                <option value="">What is this document?</option>
                {DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button onClick={save} disabled={!docType || saving === 'busy'} className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-bold text-white disabled:opacity-40">
                {saving === 'busy' && <CircleNotch className="h-3 w-3 animate-spin" />} Save
              </button>
              <button onClick={() => setSaving('closed')} className="h-8 rounded-lg border border-border bg-white px-2.5 text-xs font-bold text-foreground">Cancel</button>
            </div>
          )}
          {saving === 'done' && <p className="flex items-center gap-1 text-xs font-semibold text-foreground"><Check className="h-3.5 w-3.5 text-secondary" /> In the client’s documents</p>}
        </div>
      )}
    </div>
  );
}
