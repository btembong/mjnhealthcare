'use client';

import { useEffect, useRef, useState } from 'react';
import { X as XIcon, ChatCircle, ArrowRight, CalendarCheck, CaretLeft, CircleNotch } from '@phosphor-icons/react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

type Message = { role: 'user' | 'assistant'; content: string; time: string };

type BookingStep = null | 'type' | 'consultant' | 'slot' | 'name' | 'phone' | 'email' | 'note' | 'confirm' | 'booking' | 'done';

interface BookingData {
  category: string;
  consultant: any;
  slot: any;
  name: string;
  phone: string;
  email: string;
  note: string;
  consent: boolean;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtSlot(slot: any) {
  if (!slot?.startsAt) return '';
  const d = new Date(slot.startsAt);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm here to help with any questions about MJN Healthcare's services — licensing support, exam prep, placements, and more. What can I help you with today?",
  time: now(),
};

const QUICK_ACTIONS = [
  { label: 'Services & pricing', icon: '💼' },
  { label: 'UAE licensing', icon: '🇦🇪' },
  { label: 'NCLEX prep', icon: '📚' },
  { label: 'Book a consultation', icon: '📅' },
];

const CONSULT_TYPES = [
  { value: 'HEALTH', label: 'Health & Licensing', desc: 'UAE/UK/US licensing, DataFlow, visa support', icon: '🏥' },
  { value: 'CAREER', label: 'Career & Placement', desc: 'Job opportunities, salary negotiation, CV review', icon: '💼' },
  { value: 'BOTH', label: 'Both', desc: 'Comprehensive session covering health and career', icon: '🎯' },
];

function BotBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] shadow-sm">
        <span className="text-[9px] font-extrabold text-white">MJ</span>
      </div>
      <div className="max-w-[78%] flex flex-col items-start">
        <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-800 shadow-sm" style={{ border: '1px solid rgba(15,76,129,0.08)' }}>
          {content}
        </div>
        <span className="mt-1 px-1 text-[10px] text-gray-400">{now()}</span>
      </div>
    </div>
  );
}

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState<{ name?: string; email?: string; profession?: string; destination?: string }>({});
  const [captureEmail, setCaptureEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [unread, setUnread] = useState(false);

  // Booking wizard state
  const [bookingStep, setBookingStep] = useState<BookingStep>(null);
  const [bookingData, setBookingData] = useState<BookingData>({ category: '', consultant: null, slot: null, name: '', phone: '', email: '', note: '', consent: true });
  const [consultants, setConsultants] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [fieldInput, setFieldInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(false);
    }
  }, [messages, open, bookingStep]);

  function addBotMsg(content: string) {
    setMessages((prev) => [...prev, { role: 'assistant', content, time: now() }]);
  }

  function startBooking() {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: 'Book a consultation', time: now() },
      { role: 'assistant', content: "Great! Let's get you booked in. What type of consultation do you need?", time: now() },
    ]);
    setBookingStep('type');
    setBookingData({ category: '', consultant: null, slot: null, name: '', phone: '', email: '', note: '', consent: true });
    setFieldInput('');
  }

  async function selectType(category: string) {
    const label = CONSULT_TYPES.find((t) => t.value === category)?.label ?? category;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: label, time: now() },
    ]);
    setBookingData((prev) => ({ ...prev, category }));
    setBookingStep('consultant');
    setLoadingConsultants(true);
    try {
      const res = await fetch(`${API_BASE}/consultations/consultants?category=${category}`);
      const data = await res.json();
      setConsultants(data ?? []);
      if ((data ?? []).length === 0) {
        addBotMsg("Sorry, no consultants are available for that category right now. Please try again later or email us at hello@mjnhealthcare.com.");
        setBookingStep(null);
      } else {
        addBotMsg(`We have ${data.length} consultant${data.length > 1 ? 's' : ''} available. Pick the one you'd like to book:`);
      }
    } catch {
      addBotMsg("Couldn't load consultants right now. Please try again.");
      setBookingStep(null);
    } finally {
      setLoadingConsultants(false);
    }
  }

  async function selectConsultant(consultant: any) {
    setMessages((prev) => [...prev, { role: 'user', content: consultant.name, time: now() }]);
    setBookingData((prev) => ({ ...prev, consultant }));
    setBookingStep('slot');
    setLoadingSlots(true);
    try {
      const res = await fetch(`${API_BASE}/consultations/slots/${consultant.id}`);
      const data = await res.json();
      const upcoming = (data ?? []).slice(0, 8);
      setSlots(upcoming);
      if (upcoming.length === 0) {
        addBotMsg(`${consultant.name} has no available slots right now. Would you like to pick a different consultant?`);
        setBookingStep('consultant');
      } else {
        addBotMsg('Pick a time that works for you:');
      }
    } catch {
      addBotMsg("Couldn't load slots. Please try again.");
      setBookingStep('consultant');
    } finally {
      setLoadingSlots(false);
    }
  }

  function selectSlot(slot: any) {
    setMessages((prev) => [...prev, { role: 'user', content: fmtSlot(slot), time: now() }]);
    setBookingData((prev) => ({ ...prev, slot }));
    setFieldInput(lead.name ?? '');
    addBotMsg("Perfect! What's your full name?");
    setBookingStep('name');
  }

  function submitName() {
    const name = fieldInput.trim();
    if (!name) return;
    setMessages((prev) => [...prev, { role: 'user', content: name, time: now() }]);
    setBookingData((prev) => ({ ...prev, name }));
    setFieldInput('');
    addBotMsg("Got it. What's your WhatsApp/phone number?");
    setBookingStep('phone');
  }

  function submitPhone() {
    const phone = fieldInput.trim();
    if (!phone) return;
    setMessages((prev) => [...prev, { role: 'user', content: phone, time: now() }]);
    setBookingData((prev) => ({ ...prev, phone }));
    setFieldInput(lead.email ?? '');
    addBotMsg("And your email address?");
    setBookingStep('email');
  }

  function submitEmail_booking() {
    const email = fieldInput.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setMessages((prev) => [...prev, { role: 'user', content: email, time: now() }]);
    setLead((prev) => ({ ...prev, email, name: bookingData.name }));
    setBookingData((prev) => ({ ...prev, email }));
    setFieldInput('');
    addBotMsg("Anything specific you'd like to discuss? (Optional — type or skip)");
    setBookingStep('note');
  }

  function submitNote(skip = false) {
    const note = skip ? '' : fieldInput.trim();
    if (!skip && note) {
      setMessages((prev) => [...prev, { role: 'user', content: note, time: now() }]);
    }
    setBookingData((prev) => ({ ...prev, note }));
    setFieldInput('');
    addBotMsg("Here's your booking summary. Please confirm:");
    setBookingStep('confirm');
  }

  async function confirmBooking() {
    setBookingStep('booking');
    try {
      const res = await fetch(`${API_BASE}/consultations/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: bookingData.slot.id,
          clientName: bookingData.name,
          clientEmail: bookingData.email,
          clientPhone: bookingData.phone,
          consultationCategory: bookingData.category,
          recordingConsent: bookingData.consent,
          preSessionNote: bookingData.note || undefined,
          returnUrl: `${window.location.origin}/consult/confirmed`,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
        addBotMsg(`Your booking is confirmed! 🎉 A payment link has opened in a new tab. Once paid, you'll receive a calendar invite and join link at ${bookingData.email}.`);
      } else {
        addBotMsg(`Booking created! You'll receive a confirmation at ${bookingData.email} shortly.`);
      }
      setBookingStep('done');
    } catch (err: any) {
      addBotMsg("Something went wrong processing the booking. Please try again or visit our website to book directly.");
      setBookingStep('confirm');
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    // Intercept booking trigger
    if (content.toLowerCase().includes('book') && bookingStep === null) {
      startBooking();
      setInput('');
      return;
    }

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

  function submitEmailCapture(e: React.FormEvent) {
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

  const inBooking = bookingStep !== null && bookingStep !== 'done';

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
        {!open && <span className="bot-ping pointer-events-none absolute h-14 w-14 rounded-full bg-[#0F4C81]/40" />}
        {unread && !open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">1</span>
        )}
        {open ? <XIcon weight="bold" className="h-5 w-5 text-white" /> : <ChatCircle weight="fill" className="h-6 w-6 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="bot-panel fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ width: '420px', maxWidth: 'calc(100vw - 2rem)', maxHeight: '600px', border: '1px solid rgba(15,76,129,0.12)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 shrink-0" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
              <span className="text-xs font-extrabold text-white leading-none">MJ</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">MJN Assistant</p>
              <p className="text-[11px] text-white/70 mt-0.5">
                {inBooking ? (
                  <span className="flex items-center gap-1.5"><CalendarCheck weight="fill" className="h-3 w-3" /> Booking consultation</span>
                ) : sending ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-flex gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '120ms' }} />
                      <span className="h-1 w-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '240ms' }} />
                    </span>
                    Typing…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> AI assistant · Online</span>
                )}
              </p>
            </div>
            {inBooking && (
              <button onClick={() => setBookingStep(null)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white" title="Cancel booking">
                <CaretLeft weight="bold" className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
              <XIcon weight="bold" className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0, background: '#f7f9fc' }}>
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
            {(sending || loadingConsultants || loadingSlots || bookingStep === 'booking') && (
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

          {/* ── Booking wizard panels ── */}

          {/* Step: type selection */}
          {bookingStep === 'type' && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-2 shrink-0">
              {CONSULT_TYPES.map((t) => (
                <button key={t.value} onClick={() => selectType(t.value)}
                  className="flex w-full items-start gap-3 rounded-xl border border-[#0F4C81]/15 bg-[#0F4C81]/5 px-4 py-3 text-left transition hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/10">
                  <span className="text-lg shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F4C81]">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step: consultant selection */}
          {bookingStep === 'consultant' && !loadingConsultants && consultants.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-2 max-h-52 overflow-y-auto shrink-0">
              {consultants.map((c) => (
                <button key={c.id} onClick={() => selectConsultant(c)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F4C81] to-[#00A896] text-sm font-bold text-white">
                    {c.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.bio ? c.bio.slice(0, 60) + (c.bio.length > 60 ? '…' : '') : c.category}</p>
                  </div>
                  {c.hourlyRate && <p className="text-xs font-bold text-[#0F4C81] shrink-0">${c.hourlyRate}/hr</p>}
                </button>
              ))}
            </div>
          )}

          {/* Step: slot selection */}
          {bookingStep === 'slot' && !loadingSlots && slots.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {slots.map((slot) => (
                  <button key={slot.id} onClick={() => selectSlot(slot)}
                    className="rounded-xl border border-[#0F4C81]/15 bg-[#0F4C81]/5 px-3 py-2.5 text-left transition hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/10">
                    <p className="text-xs font-semibold text-[#0F4C81] leading-snug">{fmtSlot(slot)}</p>
                    {slot.durationMinutes && <p className="text-[11px] text-gray-400 mt-0.5">{slot.durationMinutes} min</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: name / phone / email / note inputs */}
          {(bookingStep === 'name' || bookingStep === 'phone' || bookingStep === 'email' || bookingStep === 'note') && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
              <div className="flex gap-2">
                <input
                  type={bookingStep === 'email' ? 'email' : bookingStep === 'phone' ? 'tel' : 'text'}
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (bookingStep === 'name') submitName();
                      else if (bookingStep === 'phone') submitPhone();
                      else if (bookingStep === 'email') submitEmail_booking();
                      else if (bookingStep === 'note') submitNote();
                    }
                  }}
                  placeholder={
                    bookingStep === 'name' ? 'Your full name…' :
                    bookingStep === 'phone' ? '+237 6xx xxx xxx' :
                    bookingStep === 'email' ? 'your@email.com' :
                    'Any topics, questions, or context…'
                  }
                  autoFocus
                  className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#0F4C81] focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/10 transition"
                />
                <button
                  onClick={() => {
                    if (bookingStep === 'name') submitName();
                    else if (bookingStep === 'phone') submitPhone();
                    else if (bookingStep === 'email') submitEmail_booking();
                    else if (bookingStep === 'note') submitNote();
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}
                >
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </button>
                {bookingStep === 'note' && (
                  <button onClick={() => submitNote(true)}
                    className="h-10 rounded-full border border-gray-200 px-3 text-xs text-gray-500 transition hover:text-gray-700">
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step: confirm */}
          {bookingStep === 'confirm' && (
            <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-3 shrink-0">
              <div className="rounded-xl border border-[#0F4C81]/15 bg-[#0F4C81]/5 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-800">{CONSULT_TYPES.find((t) => t.value === bookingData.category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Consultant</span><span className="font-medium text-gray-800">{bookingData.consultant?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium text-gray-800">{fmtSlot(bookingData.slot)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-gray-800">{bookingData.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800 truncate max-w-[55%] text-right">{bookingData.email}</span></div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={bookingData.consent} onChange={(e) => setBookingData((prev) => ({ ...prev, consent: e.target.checked }))}
                  className="mt-0.5 rounded border-gray-300 text-[#0F4C81]" />
                <span className="text-[11px] text-gray-500 leading-snug">I consent to this session being recorded for quality and training purposes.</span>
              </label>
              <button onClick={confirmBooking}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
                <CalendarCheck weight="bold" className="h-4 w-4" /> Confirm &amp; Pay
              </button>
            </div>
          )}

          {/* Step: processing */}
          {bookingStep === 'booking' && (
            <div className="border-t border-gray-100 bg-white px-4 py-5 flex items-center justify-center gap-3 shrink-0">
              <CircleNotch className="h-5 w-5 animate-spin text-[#0F4C81]" />
              <span className="text-sm text-gray-600">Processing your booking…</span>
            </div>
          )}

          {/* ── Normal mode panels ── */}

          {/* Quick actions — only on first message, not in booking */}
          {messages.length === 1 && !inBooking && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3 shrink-0">
              {QUICK_ACTIONS.map(({ label, icon }) => (
                <button key={label}
                  onClick={() => label === 'Book a consultation' ? startBooking() : sendMessage(label)}
                  className="flex items-center gap-1.5 rounded-full border border-[#0F4C81]/15 bg-[#0F4C81]/5 px-3 py-1.5 text-xs font-medium text-[#0F4C81] transition hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/10">
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Email capture */}
          {captureEmail && !inBooking && (
            <div className="border-t border-[#0F4C81]/10 bg-blue-50/60 px-4 py-4 shrink-0">
              <p className="mb-3 text-xs font-medium text-gray-700">Want a consultant to follow up with more details?</p>
              <form onSubmit={submitEmailCapture} className="flex flex-col gap-2">
                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Your email address" required
                  className="h-9 w-full rounded-xl border border-[#0F4C81]/20 bg-white px-3 text-sm outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/10 transition" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-xl bg-[#0F4C81] py-2 text-xs font-semibold text-white transition hover:bg-[#0F4C81]/90">Send my email</button>
                  <button type="button" onClick={() => setCaptureEmail(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 transition hover:text-gray-700">Skip</button>
                </div>
              </form>
            </div>
          )}

          {/* Normal input — hide during active booking steps */}
          {!inBooking && (
            <div className="border-t border-gray-100 bg-white px-3 py-3 flex items-center gap-2 shrink-0">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything…" disabled={sending}
                className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#0F4C81] focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/10 transition disabled:opacity-60" />
              <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
                <ArrowRight weight="bold" className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
