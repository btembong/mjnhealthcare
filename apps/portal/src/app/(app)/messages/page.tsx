'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  PaperPlaneTilt, ChatCircle, ArrowDown, CheckCircle,
  Check, Paperclip, X, ArrowSquareOut, Image as ImageIcon,
  FileText, FilePdf, CircleNotch, Camera,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function initials(name?: string) {
  if (!name) return 'MJN';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Message content parsers ───────────────────────────────────────────────────

function parseMessageContent(content: string) {
  // New upload format: [IMG]:filename:url  or  [FILE]:filename:url
  const imgMatch = content.match(/^\[IMG\]:([^:]+):([\s\S]+)$/);
  if (imgMatch) return { type: 'image' as const, name: imgMatch[1], url: imgMatch[2].trim(), text: '' };

  const fileMatch = content.match(/^\[FILE\]:([^:]+):([\s\S]+)$/);
  if (fileMatch) return { type: 'file' as const, name: fileMatch[1], url: fileMatch[2].trim(), text: '' };

  // Mixed: text + image/file
  const mixedImg = content.match(/^([\s\S]+?)\n\[IMG\]:([^:]+):([\s\S]+)$/);
  if (mixedImg) return { type: 'image' as const, name: mixedImg[2], url: mixedImg[3].trim(), text: mixedImg[1] };

  const mixedFile = content.match(/^([\s\S]+?)\n\[FILE\]:([^:]+):([\s\S]+)$/);
  if (mixedFile) return { type: 'file' as const, name: mixedFile[2], url: mixedFile[3].trim(), text: mixedFile[1] };

  // Legacy vault attachment format
  if (content.includes('📎 Attached document:')) {
    const [textPart, attPart] = content.split('\n\n📎');
    const attContent = '📎' + (attPart ?? '');
    const docName = attContent.split('📎 Attached document: ')[1]?.split(' — ')[0] ?? 'Attachment';
    const docUrl = attContent.split('— ')[1]?.trim() ?? '';
    return { type: 'vault' as const, name: docName, url: docUrl, text: textPart ?? '' };
  }

  return { type: 'text' as const, name: '', url: '', text: content };
}

// ── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "What's the status of my case?",
  "I've uploaded the requested documents.",
  'Can we schedule a callback?',
  'I need urgent assistance.',
];

// ── Bubble content renderer ───────────────────────────────────────────────────

function BubbleContent({ content, isMe }: { content: string; isMe: boolean }) {
  const parsed = parseMessageContent(content);

  const linkClass = isMe
    ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
    : 'border-border bg-muted/60 text-foreground hover:bg-muted';

  return (
    <div>
      {/* Lead text */}
      {parsed.text && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{parsed.text}</p>
      )}

      {/* Image */}
      {parsed.type === 'image' && parsed.url && (
        <a href={parsed.url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={parsed.url}
            alt={parsed.name}
            className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
          {parsed.name && (
            <p className={`mt-1 text-[10px] ${isMe ? 'text-white/50' : 'text-muted-foreground/60'}`}>
              {parsed.name}
            </p>
          )}
        </a>
      )}

      {/* File card */}
      {(parsed.type === 'file' || parsed.type === 'vault') && parsed.url && (
        <a
          href={parsed.url}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${linkClass}`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isMe ? 'bg-white/15' : 'bg-primary/10'}`}>
            {/pdf/i.test(parsed.name)
              ? <FilePdf className={`h-5 w-5 ${isMe ? 'text-white' : 'text-rose-500'}`} />
              : <FileText className={`h-5 w-5 ${isMe ? 'text-white' : 'text-primary'}`} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{parsed.name}</p>
            <p className={`text-[10px] ${isMe ? 'text-white/50' : 'text-muted-foreground/60'}`}>
              Tap to open
            </p>
          </div>
          <ArrowSquareOut className={`h-4 w-4 shrink-0 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`} />
        </a>
      )}

      {/* Plain text */}
      {parsed.type === 'text' && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
      )}
    </div>
  );
}

// ── Media preview strip (above compose) ──────────────────────────────────────

interface MediaAttachment {
  file: File;
  previewUrl: string; // object URL for local preview
  isImage: boolean;
}

function MediaPreview({ media, onRemove }: { media: MediaAttachment; onRemove: () => void }) {
  return (
    <div className="relative inline-flex shrink-0">
      {media.isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.previewUrl}
          alt={media.file.name}
          className="h-20 w-20 rounded-xl object-cover border border-border"
        />
      ) : (
        <div className="flex h-20 w-40 items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3">
          <FilePdf className="h-7 w-7 text-rose-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{media.file.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(media.file.size)}</p>
          </div>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white hover:bg-foreground/80 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Consultant header ─────────────────────────────────────────────────────────

function ConsultantHeader({ engagement }: { engagement: any }) {
  const consultant = engagement?.assignedConsultant ?? engagement?.consultant;

  return (
    <div className="shrink-0 flex items-center gap-3 border-b border-[#0d3d6a] bg-[#0F4C81] px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
        {consultant?.name ? initials(consultant.name) : 'MJN'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm leading-tight">
          {consultant?.name ?? 'MJN Healthcare Team'}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Online · Replies within 24h</span>
        </div>
      </div>
      <div className="hidden sm:block shrink-0 text-right">
        <p className="text-xs text-white/60">{consultant?.specialty ?? 'Your consultant'}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { engagement, me } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);
  const [mediaAttachment, setMediaAttachment] = useState<MediaAttachment | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const engagementId = engagement?.id;
  const personId = me?.id;

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    if (!engagementId) { setLoading(false); return; }
    try {
      const msgs = await api.getMessages(engagementId);
      setMessages((prev) => {
        const latestNew = msgs[msgs.length - 1]?.id;
        if (latestNew && latestNew !== latestIdRef.current && prev.length > 0) {
          if (!atBottom) setNewBanner(true);
        }
        latestIdRef.current = latestNew ?? '';
        return msgs;
      });
      if (!silent) api.markMessagesRead(engagementId).catch(() => {});
    } catch (err: any) {
      if (!silent) toast.error(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [engagementId, atBottom]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!engagementId) return;
    pollRef.current = setInterval(() => load(true), 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [engagementId, load]);

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, atBottom]);

  // ── Scroll ────────────────────────────────────────────────────────────────

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(isBottom);
    if (isBottom) setNewBanner(false);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewBanner(false);
    setAtBottom(true);
  }

  // ── Textarea auto-resize ──────────────────────────────────────────────────

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  // ── File picker handlers ──────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, forceImage = false) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = forceImage || file.type.startsWith('image/');
    const previewUrl = URL.createObjectURL(file);
    setMediaAttachment({ file, previewUrl, isImage });
    // reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeMedia() {
    if (mediaAttachment) URL.revokeObjectURL(mediaAttachment.previewUrl);
    setMediaAttachment(null);
  }

  // ── Upload file to R2 ────────────────────────────────────────────────────

  async function uploadMedia(attachment: MediaAttachment): Promise<string | null> {
    if (!personId) return null;
    setUploading(true);
    try {
      const docType = attachment.isImage ? 'CHAT_IMAGE' : 'CHAT_FILE';
      const { url, key } = await api.getUploadUrl(personId, docType, attachment.file.name);
      // PUT directly to R2 presigned URL
      const putRes = await fetch(url, {
        method: 'PUT',
        body: attachment.file,
        headers: { 'Content-Type': attachment.file.type },
      });
      if (!putRes.ok) throw new Error('Upload failed');
      // Confirm to get public URL
      const doc = await api.confirmUpload(personId, docType, key);
      return doc.fileUrl ?? null;
    } catch (err: any) {
      toast.error('Failed to upload file: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = content.trim();
    if (!text && !mediaAttachment) return;
    if (!engagementId) return;

    setSending(true);
    try {
      let messageContent = text;

      if (mediaAttachment) {
        const fileUrl = await uploadMedia(mediaAttachment);
        if (!fileUrl) { setSending(false); return; }

        const prefix = mediaAttachment.isImage ? '[IMG]' : '[FILE]';
        const fileRef = `${prefix}:${mediaAttachment.file.name}:${fileUrl}`;
        messageContent = text ? `${text}\n${fileRef}` : fileRef;
        removeMedia();
      }

      const msg = await api.sendMessage(engagementId, messageContent);
      setMessages((prev) => [...prev, msg]);
      setContent('');
      latestIdRef.current = msg.id;
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Message grouping ──────────────────────────────────────────────────────

  const grouped = messages.map((msg, i) => {
    const isMe = msg.senderId === me?.id;
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameSenderAsPrev = prev && prev.senderId === msg.senderId;
    const sameSenderAsNext = next && next.senderId === msg.senderId;
    const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt);
    const showAvatar = !isMe && (!sameSenderAsNext || !next || !isSameDay(msg.createdAt, next.createdAt));
    const isLastInGroup = !sameSenderAsNext || (next && !isSameDay(msg.createdAt, next.createdAt));
    return { msg, isMe, showAvatar, showDate, isLastInGroup };
  });

  const isBusy = sending || uploading;
  const canSend = !isBusy && (content.trim().length > 0 || !!mediaAttachment);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="pb-4 shrink-0">
        <PageHeader title="Messages" subtitle="Direct thread with your assigned consultant" />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, true)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e)}
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : !engagementId ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-white shadow-sm p-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <ChatCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No active engagement</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Messages are available once your engagement is signed and active. Contact us at{' '}
            <a href="mailto:hello@mjnhealthcare.com" className="text-primary hover:underline">
              hello@mjnhealthcare.com
            </a>
          </p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border shadow-sm">

          {/* Consultant header */}
          <ConsultantHeader engagement={engagement} />

          {/* New messages banner */}
          {newBanner && (
            <button
              onClick={scrollToBottom}
              className="absolute left-1/2 top-16 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-[#0d3d6a] transition-colors"
            >
              <ArrowDown className="h-3.5 w-3.5" /> New messages
            </button>
          )}

          {/* Message list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ background: '#f0f2f5' }}
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <ChatCircle className="h-7 w-7 text-primary/60" weight="fill" />
                </div>
                <p className="font-semibold text-foreground">Start the conversation</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Your consultant is ready. Ask about your case, documents, or next steps.
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              {grouped.map(({ msg, isMe, showAvatar, showDate, isLastInGroup }, i) => (
                <div key={msg.id ?? i}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="rounded-full bg-white/90 border border-black/5 px-3 py-1 text-[11px] text-muted-foreground font-medium shadow-sm">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message row */}
                  <div className={`flex items-end gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Consultant avatar placeholder */}
                    {!isMe && (
                      <div className="h-7 w-7 shrink-0">
                        {showAvatar && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A896] text-[11px] font-bold text-white">
                            {initials(msg.sender?.name)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`relative max-w-[72%] ${
                        isMe
                          ? 'bg-[#0F4C81] text-white rounded-2xl rounded-br-sm'
                          : 'bg-white text-foreground rounded-2xl rounded-bl-sm'
                      } ${!isLastInGroup ? (isMe ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}
                      shadow-sm px-3.5 py-2.5`}
                    >
                      <BubbleContent content={msg.content} isMe={isMe} />

                      {/* Timestamp + read receipt (last in group only) */}
                      {isLastInGroup && (
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${isMe ? 'text-white/50' : 'text-muted-foreground/50'}`}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            msg.readAt
                              ? <CheckCircle className="h-3 w-3 text-white/60" weight="fill" />
                              : <Check className="h-3 w-3 text-white/40" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Scroll-to-bottom FAB */}
          {!atBottom && !newBanner && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-border shadow-md hover:bg-muted transition-colors"
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Quick replies */}
          <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2 bg-white border-t border-border/50 scrollbar-hide">
            {QUICK_REPLIES.map((text) => (
              <button
                key={text}
                onClick={() => { setContent(text); textareaRef.current?.focus(); }}
                className="whitespace-nowrap shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Media preview strip */}
          {mediaAttachment && (
            <div className="shrink-0 flex items-center gap-3 border-t border-border bg-white px-4 py-3">
              <MediaPreview media={mediaAttachment} onRemove={removeMedia} />
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CircleNotch className="h-4 w-4 animate-spin" /> Uploading…
                </div>
              )}
            </div>
          )}

          {/* Compose bar */}
          <form onSubmit={handleSend} className="shrink-0 flex items-end gap-2 border-t border-border bg-white px-4 py-3">

            {/* Image capture */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Send photo"
            >
              <Camera className="h-5 w-5" />
            </button>

            {/* File attach */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => { setContent(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="w-full resize-none rounded-full border border-border bg-[#f0f2f5] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-[120px] leading-relaxed"
              />
              {content.length > 300 && (
                <span className={`absolute bottom-2 right-4 text-[10px] ${content.length > 1000 ? 'text-rose-500' : 'text-muted-foreground/50'}`}>
                  {content.length}/1000
                </span>
              )}
            </div>

            {/* Send */}
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] text-white hover:bg-[#0d3d6a] disabled:opacity-40 transition-colors shadow-sm"
            >
              {isBusy
                ? <CircleNotch className="h-4 w-4 animate-spin" />
                : <PaperPlaneTilt className="h-4 w-4" weight="fill" />
              }
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
