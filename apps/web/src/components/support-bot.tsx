'use client';

import { useEffect, useRef, useState } from 'react';
import { X as XIcon, ChatCircle, ArrowRight } from '@phosphor-icons/react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

type Message = { role: 'user' | 'assistant'; content: string; time: string };

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm here to help with any questions about MJN Health Academy's services — licensing support, exam prep, placements, and more. What can I help you with today?",
  time: now(),
};

const QUICK_ACTIONS = [
  { label: 'Services & pricing', icon: '💼' },
  { label: 'UAE licensing', icon: '🇦🇪' },
  { label: 'NCLEX prep', icon: '📚' },
  { label: 'Book a consultation', icon: '📅' },
];

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState<{ name?: string; email?: string; profession?: string; destination?: string }>({});
  const [captureEmail, setCaptureEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(false);
    }
  }, [messages, open]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    const userMsg: Message = { role: 'user', content, time: now() };
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    const updatedLead = { ...lead };
    const emailMatch = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) updatedLead.email = emailMatch[0];

    try {
      const res = await fetch(`${API_BASE}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          lead: updatedLead,
        }),
      });
      const data = await res.json();
      const reply: Message = {
        role: 'assistant',
        content: data.content ?? 'Sorry, I could not respond.',
        time: now(),
      };
      setMessages((prev) => [...prev, reply]);
      setLead(updatedLead);
      if (!open) setUnread(true);

      if (newMessages.length >= 5 && !updatedLead.email) {
        setCaptureEmail(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again or email us directly.', time: now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLead((prev) => ({ ...prev, email: emailInput.trim() }));
    setCaptureEmail(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `Thank you! I've saved your email (${emailInput.trim()}). A consultant may follow up. Is there anything else I can help you with?`,
        time: now(),
      },
    ]);
    setEmailInput('');
  }

  return (
    <>
      <style>{`
        @keyframes bot-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .bot-panel { animation: bot-slide-up 0.2s ease both; }
        @keyframes bot-ping {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%       { transform: scale(1.5); opacity: 0; }
        }
        .bot-ping { animation: bot-ping 2s ease-in-out infinite; }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F4C81] shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
        style={{ boxShadow: '0 8px 32px rgba(15,76,129,0.4)' }}
      >
        {/* Pulse ring — only when closed */}
        {!open && (
          <span
            className="bot-ping pointer-events-none absolute h-14 w-14 rounded-full bg-[#0F4C81]/40"
          />
        )}
        {/* Unread badge */}
        {unread && !open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            1
          </span>
        )}
        {open ? (
          <XIcon weight="bold" className="h-5 w-5 text-white" />
        ) : (
          <ChatCircle weight="fill" className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="bot-panel fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ width: '420px', maxWidth: 'calc(100vw - 2rem)', maxHeight: '560px', border: '1px solid rgba(15,76,129,0.12)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
              <span className="text-xs font-extrabold text-white leading-none">MJ</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">MJN Assistant</p>
              <p className="text-[11px] text-white/70 mt-0.5">
                {sending ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-flex gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '120ms' }} />
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '240ms' }} />
                    </span>
                    Typing…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    AI assistant · Online
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <XIcon weight="bold" className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ minHeight: 0, height: '320px', background: '#f7f9fc' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] shadow-sm">
                    <span className="text-[9px] font-extrabold text-white">MJ</span>
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[78%]`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#0F4C81] text-white rounded-br-sm shadow-md shadow-[#0F4C81]/20'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                    style={msg.role === 'assistant' ? { border: '1px solid rgba(15,76,129,0.08)' } : undefined}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-gray-400">{msg.time}</span>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] shadow-sm">
                  <span className="text-[9px] font-extrabold text-white">MJ</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm" style={{ border: '1px solid rgba(15,76,129,0.08)' }}>
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F4C81]/50" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F4C81]/50" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F4C81]/50" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions — only on first message */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3">
              {QUICK_ACTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  className="flex items-center gap-1.5 rounded-full border border-[#0F4C81]/15 bg-[#0F4C81]/5 px-3 py-1.5 text-xs font-medium text-[#0F4C81] transition hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/10"
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Email capture */}
          {captureEmail && (
            <div className="border-t border-[#0F4C81]/10 bg-blue-50/60 px-4 py-4">
              <p className="mb-3 text-xs font-medium text-gray-700">Want a consultant to follow up with more details?</p>
              <form onSubmit={submitEmail} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="h-9 w-full rounded-xl border border-[#0F4C81]/20 bg-white px-3 text-sm outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/10 transition"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#0F4C81] py-2 text-xs font-semibold text-white transition hover:bg-[#0F4C81]/90"
                  >
                    Send my email
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptureEmail(false)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 transition hover:text-gray-700"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 bg-white px-3 py-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything…"
              disabled={sending}
              className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#0F4C81] focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/10 transition disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}
            >
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
