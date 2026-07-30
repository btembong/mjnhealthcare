'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, Skeleton } from '@mjn/ui';
import {
  WarningCircle, CircleNotch, Play, Lock, Clock, TrendUp, Medal, CaretRight,
  X, PaperPlaneTilt, Robot, Warning,
  CheckCircle, CheckSquare, Square, ArrowRight, Brain,
  ListChecks, ChartBar, CalendarBlank, BookOpen,
  Lightning, Flame, Star, ArrowUp, ArrowDown, Minus,
  Timer, ArrowCounterClockwise, Eye,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';
import { toast } from 'sonner';

const EXAM_BADGES: Record<string, { cls: string; gradient: string }> = {
  NCLEX: { cls: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-400' },
  HAAD:  { cls: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-teal-400' },
  DHA:   { cls: 'bg-violet-100 text-violet-700', gradient: 'from-violet-500 to-purple-400' },
  CBT:   { cls: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-400' },
  DA:    { cls: 'bg-rose-100 text-rose-700', gradient: 'from-rose-500 to-pink-400' },
};

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ── AI Study Assistant Panel ──────────────────────────────────────────────────
// inline=true → sticky side panel; inline=false → slide-over drawer

function StudyAssistantPanel({
  personId,
  locale,
  weakAreas,
  onClose,
  inline,
}: {
  personId: string;
  locale: 'en' | 'fr';
  weakAreas: any[];
  onClose: () => void;
  inline: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        locale === 'fr'
          ? "Bonjour ! Je suis votre assistant d'etude IA. Posez-moi des questions sur le NCLEX, HAAD, DHA, CBT ou DA."
          : "Hi! I'm your AI Study Assistant. Ask me anything about NCLEX, HAAD, DHA, CBT, or DA exam prep.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    try {
      const res = await api.studyChat(personId, newMessages, locale);
      const content = res.content?.type === 'text' ? res.content.text : String(res.content ?? '');
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  const quickChips = [
    ...weakAreas.slice(0, 2).map((w) => ({
      label: w.topic,
      prompt: `Explain the key concepts of "${w.topic}" and give me a practice question.`,
    })),
    { label: 'Random question', prompt: 'Give me a random practice question for my exam.' },
    { label: 'Study tips', prompt: 'Give me 3 high-yield study tips for nursing licensure exams.' },
  ];

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
            <Robot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Study Assistant</p>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
              <p className="text-xs text-white/60">Powered by Claude</p>
            </div>
          </div>
        </div>
        {!inline && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Guardrail */}
      <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-3 py-2 shrink-0">
        <Warning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700 leading-snug">
          Study content only. For licensing or visa questions, speak with your consultant.
        </p>
      </div>

      {/* Quick action chips */}
      {messages.length <= 1 && (
        <div className="px-3 py-2.5 border-b border-border shrink-0">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Lightning className="h-3 w-3 text-amber-500" /> Suggested topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.prompt)}
                disabled={sending}
                className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                <Robot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-muted/70 text-foreground rounded-bl-sm border border-border/50'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Robot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-muted/70 border border-border/50 px-3.5 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/30 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-primary/30 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-primary/30 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white p-3 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={locale === 'fr' ? 'Posez une question...' : 'Ask a study question...'}
          disabled={sending}
          className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white disabled:opacity-60 transition"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40 active:scale-95"
        >
          <PaperPlaneTilt className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div
        className="rounded-2xl border border-border bg-white shadow-md overflow-hidden flex flex-col sticky top-6"
        style={{ height: 'calc(100vh - 8rem)' }}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ height: '100dvh' }}
      >
        {panelContent}
      </div>
    </div>
  );
}

// ── Practice Modal ────────────────────────────────────────────────────────────

function PracticeModal({ bank, personId, onClose }: { bank: any; personId: string; onClose: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getQuestions(bank.id)
      .then((qs) => { setQuestions(qs ?? []); setAnswers(new Array((qs ?? []).length).fill(null)); })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [bank.id]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !done) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, done, questions.length]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleSelect(idx: number) {
    if (answered) return;
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[current].correctIndex) setScore((s) => s + 1);
  }

  async function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
      setSubmitting(true);
      try {
        await api.submitPractice(personId, bank.examType ?? bank.title, score, questions.length);
      } catch { /* non-critical */ } finally {
        setSubmitting(false);
      }
    }
  }

  function handleRestart() {
    setCurrent(0); setScore(0); setSelected(null); setAnswered(false);
    setDone(false); setReviewing(false); setElapsed(0);
    setAnswers(new Array(questions.length).fill(null));
  }

  const q = questions[current];
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  // ── Review mode ──
  if (reviewing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-5 py-4 shrink-0">
            <div>
              <p className="text-sm font-semibold text-white">Answer Review — {bank.title}</p>
              <p className="text-xs text-white/60">{score}/{questions.length} correct · {formatTime(elapsed)}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {questions.map((question, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === question.correctIndex;
              return (
                <div key={question.id ?? idx} className={`rounded-xl border p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      {isCorrect
                        ? <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-600" />
                        : <X className="h-3 w-3 text-rose-600" />}
                    </div>
                    <div className="flex-1">
                      {question.topic && (
                        <span className="mb-1 inline-block rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                      )}
                      <p className="text-sm font-semibold text-foreground leading-snug">{question.stem}</p>
                    </div>
                  </div>
                  <div className="space-y-1 ml-7">
                    {(question.options ?? []).map((opt: string, optIdx: number) => {
                      const isCorrectOpt = optIdx === question.correctIndex;
                      const isUserOpt = optIdx === userAnswer;
                      let cls = 'text-muted-foreground';
                      if (isCorrectOpt) cls = 'text-emerald-700 font-semibold';
                      else if (isUserOpt && !isCorrect) cls = 'text-rose-600 line-through';
                      return (
                        <p key={optIdx} className={`text-xs ${cls}`}>
                          <span className="font-bold mr-1">{String.fromCharCode(65 + optIdx)}.</span>{opt}
                          {isCorrectOpt && <CheckCircle weight="fill" className="inline ml-1 h-3 w-3 text-emerald-500" />}
                        </p>
                      );
                    })}
                  </div>
                  {question.explanation && (
                    <div className="ml-7 mt-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary/80 leading-relaxed">
                      <span className="font-semibold">Explanation: </span>{question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-5 py-3 shrink-0 flex justify-between">
            <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
              <ArrowCounterClockwise className="h-4 w-4" /> Try again
            </button>
            <button onClick={onClose} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{bank.title}</p>
            <p className="text-xs text-white/60">{bank.examType} · {loading ? '…' : `${questions.length} questions`}</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && !done && questions.length > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                <Timer className="h-3.5 w-3.5" /> {formatTime(elapsed)}
              </div>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <CircleNotch className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Questions for this bank are being added by your tutor.</p>
              <button onClick={onClose} className="mt-5 text-sm font-semibold text-primary hover:underline">Close</button>
            </div>
          ) : done ? (
            // Score screen
            <div className="py-6 text-center">
              <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}`}>
                {pct}%
              </div>
              <p className="text-xl font-bold text-foreground">
                {pct >= 70 ? 'Excellent work!' : pct >= 50 ? 'Keep practising!' : 'Needs more review'}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {score} of {questions.length} correct · {formatTime(elapsed)}
              </p>
              {submitting && <p className="mt-2 text-xs text-muted-foreground">Saving results...</p>}
              <div className="mt-6 flex gap-2.5 justify-center flex-wrap">
                <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  <ArrowCounterClockwise className="h-4 w-4" /> Try again
                </button>
                <button onClick={() => setReviewing(true)} className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                  <Eye className="h-4 w-4" /> Review answers
                </button>
                <button onClick={onClose} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Quiz
            <>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                  <span>Question {current + 1} of {questions.length}</span>
                  <span className="font-semibold text-foreground">{score} correct</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${(current / questions.length) * 100}%` }} />
                </div>
              </div>

              {q.topic && (
                <span className="mb-3 inline-block rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{q.topic}</span>
              )}

              <p className="text-sm font-semibold text-foreground mb-5 leading-relaxed">{q.stem}</p>

              <div className="space-y-2 mb-5">
                {(q.options ?? []).map((opt: string, idx: number) => {
                  const isCorrect = idx === q.correctIndex;
                  const isSelected = idx === selected;
                  let cls = 'border border-border bg-white hover:bg-muted/30 hover:border-primary/30';
                  if (answered) {
                    if (isCorrect) cls = 'border-2 border-emerald-500 bg-emerald-50';
                    else if (isSelected) cls = 'border-2 border-rose-400 bg-rose-50';
                    else cls = 'border border-border bg-muted/20 opacity-50';
                  } else if (isSelected) {
                    cls = 'border-2 border-primary bg-primary/5';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={answered}
                      className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all ${cls}`}
                    >
                      <span className="font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                      {answered && isCorrect && <CheckCircle weight="fill" className="inline ml-2 h-4 w-4 text-emerald-500" />}
                      {answered && isSelected && !isCorrect && <X className="inline ml-2 h-4 w-4 text-rose-500" />}
                    </button>
                  );
                })}
              </div>

              {answered && q.explanation && (
                <div className="mb-4 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary/80 leading-relaxed">
                  <span className="font-semibold">Explanation: </span>{q.explanation}
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={!answered}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors active:scale-[0.99]"
              >
                {current < questions.length - 1 ? 'Next question' : 'Finish'} <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Study Plan Section ────────────────────────────────────────────────────────

function StudyPlanSection({ plan, onMarkComplete }: { plan: any; onMarkComplete: (itemId: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const items = plan?.items ?? [];
  const done = items.filter((i: any) => i.completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Study Plan</p>
            <p className="text-xs text-muted-foreground">{done} of {items.length} complete · {pct}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <CaretRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Your study plan will appear once your consultant sets it up.</p>
            </div>
          ) : items.map((item: any) => (
            <div key={item.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/10 transition-colors">
              <button
                onClick={() => !item.completed && onMarkComplete(item.id)}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                disabled={item.completed}
              >
                {item.completed
                  ? <CheckSquare weight="fill" className="h-5 w-5 text-primary" />
                  : <Square className="h-5 w-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {item.topic}
                </p>
                {item.notes && <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>}
                {item.dueDate && (
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarBlank className="h-3 w-3" />
                    Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              {item.priority === 'HIGH' && !item.completed && (
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">High</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AcademySkeleton() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-5">
        <div><Skeleton className="h-7 w-40 mb-2" /><Skeleton className="h-4 w-72" /></div>
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      </div>
      <div className="hidden xl:block w-[340px] shrink-0">
        <Skeleton className="rounded-2xl" style={{ height: 'calc(100vh - 8rem)' }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const router = useRouter();
  const { me, loading: userLoading } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [practiceBank, setPracticeBank] = useState<any | null>(null);
  const [tab, setTab] = useState<'courses' | 'plan' | 'progress'>('courses');

  useEffect(() => {
    if (userLoading || !me) return;
    load();
  }, [userLoading, me]);

  // Auto-open practice modal when navigated to with ?practice=<bankId>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const bankId = params.get('practice');
    if (!bankId) return;
    api.getQuestionBanks().then((banks) => {
      const b = (banks ?? []).find((bank: any) => bank.id === bankId);
      if (b) setPracticeBank(b);
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [coursesData, enrollmentsData, plan, weak, history] = await Promise.allSettled([
        api.getCourses(me!.locale ?? 'en'),
        api.getEnrollments(me!.id),
        api.getStudyPlan(me!.id),
        api.getWeakAreas(me!.id),
        api.getPracticeHistory(me!.id),
      ]);

      const enrollments: any[] = enrollmentsData.status === 'fulfilled' ? (enrollmentsData.value ?? []) : [];

      if (coursesData.status === 'fulfilled') {
        const raw = coursesData.value ?? [];
        // Merge enrollment data into each course
        const merged = raw.map((c: any) => {
          const enr = enrollments.find((e: any) => e.courseId === c.id);
          return enr ? { ...c, enrolled: true, enrollment: enr, progressPct: enr.progressPct ?? 0 } : c;
        });
        setCourses(merged);
        // Fetch upcoming sessions for enrolled courses
        const enrolledIds = merged.filter((x: any) => x.enrolled).map((x: any) => x.id);
        if (enrolledIds.length > 0) {
          const sessions = await api.getUpcomingLiveSessions(enrolledIds).catch(() => []);
          setUpcomingSessions(sessions ?? []);
        }
      }
      if (plan.status === 'fulfilled') setStudyPlan(plan.value);
      if (weak.status === 'fulfilled') setWeakAreas(weak.value ?? []);
      if (history.status === 'fulfilled') setPracticeHistory(history.value ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(courseId: string) {
    if (!me) return;
    setEnrollingId(courseId);
    try {
      await api.enrollCourse(me.id, courseId);
      toast.success('Enrolled successfully!');
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Enrollment failed. Please contact your consultant.');
    } finally {
      setEnrollingId(null);
    }
  }

  async function handleMarkComplete(itemId: string) {
    try {
      await api.markStudyItemComplete(itemId);
      setStudyPlan((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, completed: true } : i),
      }));
      toast.success('Item marked complete!');
    } catch {
      toast.error('Could not update study plan.');
    }
  }

  if (userLoading || loading) return <AcademySkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <WarningCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <p className="text-sm text-rose-700">{error}</p>
          <Button className="mt-4" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => c.enrolled);
  const lastActive = enrolledCourses.find((c) => (c.progressPct ?? 0) > 0) ?? enrolledCourses[0];
  const totalHours = courses.reduce((acc: number, c: any) => acc + (c.durationHours ?? 0), 0);
  const avgScore = practiceHistory.length
    ? Math.round(practiceHistory.reduce((s, h) => s + (h.percentage ?? 0), 0) / practiceHistory.length)
    : null;
  const planRemaining = studyPlan?.items?.filter((i: any) => !i.completed).length ?? 0;

  // Score trend: compare last 3 vs previous 3
  const recentScores = practiceHistory.slice(-3).map((h) => h.percentage ?? 0);
  const prevScores = practiceHistory.slice(-6, -3).map((h) => h.percentage ?? 0);
  const recentAvg = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : null;
  const prevAvg = prevScores.length ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : null;
  const trend = recentAvg !== null && prevAvg !== null ? recentAvg - prevAvg : null;

  return (
    <>
      <div className="flex gap-6">
        {/* ── LEFT: Main content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Header + mobile AI button */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PageHeader
              title="Academy"
              subtitle="Exam prep, practice questions, and study resources for your licensing journey."
            />
            <Button
              size="sm"
              onClick={() => setChatOpen(true)}
              className="shrink-0 xl:hidden"
            >
              <Robot className="h-4 w-4" /> Ask AI
            </Button>
          </div>

          {/* ── Hero: Continue Learning ───────────────────────────────── */}
          {lastActive && (() => {
            const examTag = lastActive.examType ?? lastActive.tags?.[0];
            const badge = examTag ? EXAM_BADGES[examTag] : null;
            const gradient = badge?.gradient ?? 'from-primary to-primary/70';
            return (
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-md text-white`}>
                {/* Decorative ring */}
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative">
                  <div className="mb-1 flex items-center gap-2">
                    <Play weight="fill" className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/80">Continue learning</span>
                  </div>
                  <h2 className="text-lg font-bold leading-tight">{lastActive.title ?? lastActive.name}</h2>
                  {examTag && (
                    <span className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-white/70">{examTag}</span>
                  )}

                  <div className="mt-4 mb-1 flex items-center justify-between text-xs text-white/80">
                    <span>Progress</span>
                    <span className="font-bold text-white">{lastActive.progressPct ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/20">
                    <div
                      className="h-2 rounded-full bg-white transition-all duration-700"
                      style={{ width: `${lastActive.progressPct ?? 0}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/academy/${lastActive.id}`)}
                      className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-foreground hover:bg-white/90 transition-colors active:scale-[0.98]">
                      <Play weight="fill" className="h-3.5 w-3.5" />
                      {(lastActive.progressPct ?? 0) > 0 ? 'Continue' : 'Start now'}
                    </button>
                    {lastActive.questionBanks?.length > 0 && (
                      <button
                        onClick={() => setPracticeBank(lastActive.questionBanks[0])}
                        className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                      >
                        <Brain className="h-3.5 w-3.5" /> Practice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Stat strip ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BookOpen, value: courses.length, label: 'Courses', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Medal, value: enrolledCourses.length, label: 'Enrolled', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Clock, value: `${totalHours}h`, label: 'Content', color: 'text-muted-foreground', bg: 'bg-muted/60' },
              {
                icon: ChartBar,
                value: avgScore != null ? `${avgScore}%` : '--',
                label: 'Avg. Score',
                color: 'text-primary',
                bg: 'bg-primary/10',
                badge: trend !== null
                  ? trend > 2 ? <ArrowUp className="h-3 w-3 text-primary" />
                  : trend < -2 ? <ArrowDown className="h-3 w-3 text-rose-500" />
                  : <Minus className="h-3 w-3 text-muted-foreground" />
                  : null,
              },
            ].map(({ icon: Icon, value, label, color, bg, badge }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                    {badge}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Weak areas banner ─────────────────────────────────────── */}
          {weakAreas.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Flame className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800">Focus areas</p>
                <p className="text-xs text-amber-700 truncate">
                  {weakAreas.slice(0, 4).map((w) => `${w.topic} (${Math.round(w.avgPercentage ?? 0)}%)`).join(' · ')}
                </p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white/60 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-white transition-colors"
              >
                <Robot className="h-3.5 w-3.5" /> Ask AI
              </button>
            </div>
          )}

          {/* ── Tabs ─────────────────────────────────────────────────── */}
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
            {([
              { key: 'courses' as const, label: 'Courses', icon: BookOpen },
              { key: 'plan' as const, label: 'Study Plan', icon: ListChecks, count: planRemaining > 0 ? planRemaining : null },
              { key: 'progress' as const, label: 'Progress', icon: TrendUp },
            ]).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {count != null && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Courses ─────────────────────────────────────────── */}
          {tab === 'courses' && (
            <div className="space-y-5">
              {courses.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">No courses available yet</h3>
                  <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
                    Your consultant will assign exam prep courses based on your licensing pathway.
                  </p>
                  <Button size="sm" className="mt-5" onClick={() => router.push('/bookings')}>
                    <CalendarBlank className="h-4 w-4" /> Book a consultation
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.map((course: any) => {
                    const isEnrolled = !!course.enrolled;
                    const examTag = course.examType ?? course.tags?.[0];
                    const badge = examTag ? EXAM_BADGES[examTag] : null;
                    const isEnrolling = enrollingId === course.id;

                    return (
                      <div
                        key={course.id}
                        className="group rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {/* Accent top strip */}
                        {badge && (
                          <div className={`h-1.5 w-full bg-gradient-to-r ${badge.gradient}`} />
                        )}

                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              {examTag && badge && (
                                <span className={`inline-block mb-2 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
                                  {examTag}
                                </span>
                              )}
                              <h3 className="text-sm font-semibold text-foreground leading-snug">{course.title ?? course.name}</h3>
                            </div>
                            {isEnrolled ? (
                              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary shrink-0">
                                <Star weight="fill" className="h-3 w-3" /> Enrolled
                              </span>
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {course.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {course.durationHours != null && (
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.durationHours}h</span>
                            )}
                            {course.questionBanks?.length > 0 && (
                              <span className="flex items-center gap-1"><Brain className="h-3.5 w-3.5" />{course.questionBanks.length} Q&A bank{course.questionBanks.length > 1 ? 's' : ''}</span>
                            )}
                          </div>

                          {isEnrolled && course.progressPct != null && (
                            <div className="mt-4">
                              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span className="font-semibold text-foreground">{course.progressPct}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all duration-700"
                                  style={{ width: `${course.progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {isEnrolled && course.questionBanks?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {course.questionBanks.map((bank: any) => (
                                <button
                                  key={bank.id}
                                  onClick={() => setPracticeBank(bank)}
                                  className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Brain className="h-3.5 w-3.5 text-muted-foreground" /> {bank.title}
                                  </span>
                                  <span className="text-primary font-semibold flex items-center gap-0.5">
                                    Practice <ArrowRight className="h-3 w-3" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-border px-5 py-3 bg-muted/10">
                          {isEnrolled ? (
                            <button
                              onClick={() => router.push(`/academy/${course.id}`)}
                              className="flex w-full items-center justify-between text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                              <span className="flex items-center gap-2">
                                <Play weight="fill" className="h-4 w-4" />
                                {(course.progressPct ?? 0) > 0 ? 'Continue learning' : 'Start course'}
                              </span>
                              <CaretRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course.id)}
                              disabled={isEnrolling}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.98]"
                            >
                              {isEnrolling ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                              {isEnrolling ? 'Enrolling...' : 'Enrol now'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Upcoming Live Sessions</p>
                  {upcomingSessions.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{upcomingSessions.length}</span>
                  )}
                </div>
                {upcomingSessions.length === 0 ? (
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                      <CalendarBlank className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">No upcoming sessions</p>
                      <p className="text-xs text-muted-foreground">Live classes will appear here when scheduled.</p>
                    </div>
                  </div>
                ) : (
                  upcomingSessions.map((s: any) => {
                    const dt = s.scheduledAt ? new Date(s.scheduledAt) : null;
                    const isLive = s.status === 'LIVE';
                    return (
                      <div key={s.id} className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm ${isLive ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-border'}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isLive ? 'bg-emerald-100' : 'bg-primary/10'}`}>
                          <CalendarBlank className={`h-5 w-5 ${isLive ? 'text-emerald-600' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                            {isLive && (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 animate-pulse">Live now</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.course?.title && <span className="font-medium text-foreground">{s.course.title} · </span>}
                            {dt ? dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            {s.durationMins ? ` · ${s.durationMins} min` : ''}
                          </p>
                        </div>
                        {s.meetingUrl && (
                          <a href={s.meetingUrl} target="_blank" rel="noreferrer"
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-colors ${isLive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}>
                            <Play className="h-3.5 w-3.5" /> {isLive ? 'Join now' : 'Join'}
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Study Plan ──────────────────────────────────────── */}
          {tab === 'plan' && (
            <>
              {!studyPlan ? (
                <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <ListChecks className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">No study plan yet</h3>
                  <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
                    Your consultant will create a personalised study plan based on your exam target and results.
                  </p>
                </div>
              ) : (
                <StudyPlanSection plan={studyPlan} onMarkComplete={handleMarkComplete} />
              )}
            </>
          )}

          {/* ── Tab: Progress ────────────────────────────────────────── */}
          {tab === 'progress' && (
            <div className="space-y-5">
              {practiceHistory.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <TrendUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">No practice history yet</h3>
                  <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
                    Complete a question bank session to track your scores here.
                  </p>
                  <Button size="sm" className="mt-5" onClick={() => setTab('courses')}>
                    Browse courses
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Practice History</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{practiceHistory.length} sessions · avg {avgScore ?? '--'}%</p>
                    </div>
                    {trend !== null && (
                      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${trend > 2 ? 'bg-primary/10 text-primary' : trend < -2 ? 'bg-rose-100 text-rose-700' : 'bg-muted/50 text-muted-foreground'}`}>
                        {trend > 2 ? <ArrowUp className="h-3.5 w-3.5" /> : trend < -2 ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        {trend > 0 ? '+' : ''}{Math.round(trend)}% trend
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {practiceHistory.slice().reverse().map((h: any, i: number) => {
                      const pct = h.percentage ?? (h.totalQuestions ? Math.round((h.correctAnswers / h.totalQuestions) * 100) : 0);
                      return (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}`}>
                            {pct}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{h.topic}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {h.correctAnswers ?? '?'}/{h.totalQuestions ?? '?'} correct
                              {h.createdAt && ` · ${new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            </p>
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-1">
                            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {pct >= 70 ? 'Passing' : pct >= 50 ? 'Near pass' : 'Needs work'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {weakAreas.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-600" />
                    <div>
                      <h3 className="font-semibold text-amber-800">Weak Areas</h3>
                      <p className="text-xs text-amber-700">Focus on these to boost your score</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {weakAreas.map((w: any) => {
                      const pct = Math.round(w.avgPercentage ?? 0);
                      return (
                        <div key={w.topic} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{w.topic}</p>
                            <p className="text-xs text-muted-foreground">{w.attempts ?? 1} attempt{(w.attempts ?? 1) !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right text-sm font-bold text-rose-600">{pct}%</span>
                            <button
                              onClick={() => { setChatOpen(true); }}
                              className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Robot className="h-3 w-3" /> Study
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: AI Study Assistant (desktop only) ──────────────── */}
        <aside className="hidden xl:block w-[340px] shrink-0">
          {me && (
            <StudyAssistantPanel
              personId={me.id}
              locale={me.locale ?? 'en'}
              weakAreas={weakAreas}
              onClose={() => {}}
              inline
            />
          )}
        </aside>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {chatOpen && me && (
        <StudyAssistantPanel
          personId={me.id}
          locale={me.locale ?? 'en'}
          weakAreas={weakAreas}
          onClose={() => setChatOpen(false)}
          inline={false}
        />
      )}

      {/* ── Practice modal ────────────────────────────────────────────── */}
      {practiceBank && me && (
        <PracticeModal bank={practiceBank} personId={me.id} onClose={() => setPracticeBank(null)} />
      )}
    </>
  );
}
