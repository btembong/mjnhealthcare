'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, CheckCircle, X, ArrowRight,
  CircleNotch, Timer, ArrowCounterClockwise, Eye,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '../../../../../lib/api';
import { useUser } from '../../../../../contexts/user-context';

export default function PracticePage() {
  const { bankId } = useParams<{ bankId: string }>();
  const router = useRouter();
  const { me } = useUser();

  const [bank, setBank] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const load = useCallback(async () => {
    try {
      const [banks, qs] = await Promise.all([
        api.getQuestionBanks(),
        api.getQuestions(bankId),
      ]);
      const b = (banks ?? []).find((x: any) => x.id === bankId);
      setBank(b ?? { id: bankId, title: 'Practice Session', examType: '' });
      setQuestions(qs ?? []);
      setAnswers(new Array((qs ?? []).length).fill(null));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => { load(); }, [load]);

  // Timer — runs while quiz is active
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
      if (me) {
        setSubmitting(true);
        try {
          await api.submitPractice(me.id, bank?.examType ?? bank?.title ?? 'Practice', score, questions.length);
        } catch { /* non-critical */ } finally { setSubmitting(false); }
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

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <CircleNotch className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <WarningCircle className="h-10 w-10 text-rose-400 mb-3" />
        <p className="font-semibold text-foreground">{error}</p>
        <button
          onClick={() => router.push('/academy')}
          className="mt-5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Back to Academy
        </button>
      </div>
    );
  }

  // ── Empty ──
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Brain className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">No questions yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Questions for this bank are being added by your tutor.</p>
        <button
          onClick={() => router.back()}
          className="mt-5 text-sm font-semibold text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Review mode ──
  if (reviewing) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/academy')}
            className="rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">Answer Review</h1>
            <p className="text-xs text-muted-foreground">{bank?.title} · {score}/{questions.length} correct · {formatTime(elapsed)}</p>
          </div>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            <ArrowCounterClockwise className="h-4 w-4" /> Try again
          </button>
        </div>

        {/* Score summary bar */}
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5 flex items-center gap-5">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}`}>
            {pct}%
          </div>
          <div>
            <p className="font-semibold text-foreground">{pct >= 70 ? 'Excellent work!' : pct >= 50 ? 'Keep practising!' : 'Needs more review'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{score} of {questions.length} correct · {formatTime(elapsed)}</p>
          </div>
        </div>

        {/* Question-by-question review */}
        <div className="space-y-3">
          {questions.map((question, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === question.correctIndex;
            return (
              <div
                key={question.id ?? idx}
                className={`rounded-2xl border bg-white shadow-sm p-5 ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {isCorrect
                      ? <CheckCircle weight="fill" className="h-4 w-4 text-emerald-600" />
                      : <X className="h-3.5 w-3.5 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-muted-foreground">Q{idx + 1}</span>
                      {question.topic && (
                        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{question.stem}</p>
                  </div>
                </div>

                <div className="space-y-1.5 ml-9">
                  {(question.options ?? []).map((opt: string, optIdx: number) => {
                    const isCorrectOpt = optIdx === question.correctIndex;
                    const isUserOpt = optIdx === userAnswer;
                    let cls = 'text-muted-foreground';
                    if (isCorrectOpt) cls = 'text-emerald-700 font-semibold';
                    else if (isUserOpt && !isCorrect) cls = 'text-rose-600 line-through';
                    return (
                      <p key={optIdx} className={`text-xs ${cls}`}>
                        <span className="font-bold mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                        {isCorrectOpt && <CheckCircle weight="fill" className="inline ml-1 h-3 w-3 text-emerald-500" />}
                      </p>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="ml-9 mt-3 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary/80 leading-relaxed">
                    <span className="font-semibold">Explanation: </span>{question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push('/academy')}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  // ── Score / done screen ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className={`flex h-32 w-32 items-center justify-center rounded-full text-4xl font-bold text-white shadow-xl ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}`}>
          {pct}%
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {pct >= 70 ? 'Excellent work!' : pct >= 50 ? 'Keep practising!' : 'Needs more review'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {score} of {questions.length} correct · {formatTime(elapsed)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{bank?.title}{bank?.examType ? ` · ${bank.examType}` : ''}</p>
          {submitting && <p className="mt-2 text-xs text-muted-foreground">Saving results...</p>}
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowCounterClockwise className="h-4 w-4" /> Try again
          </button>
          <button
            onClick={() => setReviewing(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Eye className="h-4 w-4" /> Review answers
          </button>
          <button
            onClick={() => router.push('/academy')}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Active quiz ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{bank?.title}</h1>
          <p className="text-xs text-muted-foreground">{bank?.examType ? `${bank.examType} · ` : ''}{questions.length} questions</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground shrink-0 shadow-sm">
          <Timer className="h-4 w-4 text-muted-foreground" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {current + 1} of {questions.length}</span>
          <span className="font-semibold text-foreground">{score} correct</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl border border-border bg-white shadow-sm p-6 md:p-8">
          {q.topic && (
            <span className="mb-3 inline-block rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {q.topic}
            </span>
          )}
          <p className="text-base font-semibold text-foreground leading-relaxed mb-6">{q.stem}</p>

          <div className="space-y-2.5">
            {(q.options ?? []).map((opt: string, idx: number) => {
              const isCorrect = idx === q.correctIndex;
              const isSelected = idx === selected;
              let cls = 'border border-border bg-white hover:bg-muted/30 hover:border-primary/30 cursor-pointer';
              if (answered) {
                if (isCorrect) cls = 'border-2 border-emerald-500 bg-emerald-50 cursor-default';
                else if (isSelected) cls = 'border-2 border-rose-400 bg-rose-50 cursor-default';
                else cls = 'border border-border bg-muted/20 opacity-50 cursor-default';
              } else if (isSelected) {
                cls = 'border-2 border-primary bg-primary/5';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={`w-full text-left rounded-xl px-4 py-3.5 text-sm transition-all ${cls}`}
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
            <div className="mt-5 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary/80 leading-relaxed">
              <span className="font-semibold">Explanation: </span>{q.explanation}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {answered
              ? selected === q.correctIndex
                ? '✓ Correct'
                : `✗ Correct answer: ${String.fromCharCode(65 + q.correctIndex)}`
              : 'Select an answer to continue'}
          </span>
          <button
            onClick={handleNext}
            disabled={!answered}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors active:scale-[0.99]"
          >
            {current < questions.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
