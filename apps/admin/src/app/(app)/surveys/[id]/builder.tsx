'use client';

import { useState } from 'react';
import {
  Switch, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Plus, Trash, Copy, ArrowUp, ArrowDown, X, type SurveyQuestionType,
} from '@mjn/ui';
import {
  Question, QUESTION_TYPES, CHOICE_TYPES, CONDITION_TYPES, blankQuestion, conditionValues, newId, typeLabel,
} from '../shared';

const fieldClass =
  'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';
const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30';

/** Drops conditions that no longer point at an earlier question or a value it still offers. */
export function sanitizeQuestions(questions: Question[]): Question[] {
  const earlier = new Map<string, Question>();
  return questions.map((q) => {
    let next = q;
    if (q.showIf) {
      const parent = earlier.get(q.showIf.questionId);
      const valid = parent && conditionValues(parent).some((v) => v.value === q.showIf!.value);
      if (!valid) next = { ...q, showIf: null };
    }
    earlier.set(q.id, next);
    return next;
  });
}

type Props = {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  /** Show the French translation fields. */
  french: boolean;
};

export function QuestionBuilder({ questions, onChange, french }: Props) {
  const [openId, setOpenId] = useState<string | null>(questions[0]?.id ?? null);

  const commit = (next: Question[]) => onChange(sanitizeQuestions(next));
  const patch = (id: string, changes: Partial<Question>) =>
    commit(questions.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  function add(type: SurveyQuestionType) {
    const q = blankQuestion(type);
    commit([...questions, q]);
    setOpenId(q.id);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function duplicate(index: number) {
    const source = questions[index];
    const copy: Question = {
      ...source,
      id: newId('q'),
      label: source.label ? `${source.label} (copy)` : '',
      options: source.options?.map((o) => ({ ...o, id: newId('o') })) ?? null,
    };
    const next = [...questions];
    next.splice(index + 1, 0, copy);
    commit(next);
    setOpenId(copy.id);
  }

  function changeType(q: Question, type: SurveyQuestionType) {
    const needsOptions = CHOICE_TYPES.includes(type);
    patch(q.id, {
      type,
      options: needsOptions
        ? (q.options?.length ? q.options : blankQuestion(type).options)
        : null,
    });
  }

  const addMenu = (label: string, className: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className}><Plus className="h-4 w-4" /> {label}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
        {QUESTION_TYPES.map((t) => (
          <DropdownMenuItem key={t.value} onSelect={() => add(t.value)} className="flex-col items-start gap-0">
            <span className="text-sm font-semibold text-foreground">{t.label}</span>
            <span className="text-xs text-muted-foreground">{t.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center">
        <p className="font-semibold text-foreground">No questions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Add your first question to get started.</p>
        <div className="mt-5 flex justify-center">
          {addMenu('Add a question', 'inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q, index) => {
        const open = openId === q.id;
        const candidates = questions.slice(0, index).filter((c) => CONDITION_TYPES.includes(c.type) && conditionValues(c).length > 0);
        const parent = q.showIf ? questions.find((c) => c.id === q.showIf!.questionId) : undefined;
        return (
          <div key={q.id} className={`rounded-2xl border bg-white shadow-sm transition-colors ${open ? 'border-primary/40' : 'border-border'}`}>
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">{index + 1}</span>
              <button type="button" onClick={() => setOpenId(open ? null : q.id)} aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${q.label ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {q.label || 'Untitled question'}
                </span>
                <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">{typeLabel(q.type)}</span>
                {q.required && <span className="hidden shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 sm:inline">Required</span>}
                {q.showIf && <span className="hidden shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 sm:inline">Conditional</span>}
              </button>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className={iconButton}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === questions.length - 1} aria-label="Move down" className={iconButton}><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => duplicate(index)} aria-label="Duplicate question" className={iconButton}><Copy className="h-4 w-4" /></button>
              <button type="button" onClick={() => commit(questions.filter((c) => c.id !== q.id))} aria-label="Delete question"
                className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}><Trash className="h-4 w-4" /></button>
            </div>

            {open && (
              <div className="space-y-4 border-t border-border px-4 py-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Question</label>
                    <input value={q.label} onChange={(e) => patch(q.id, { label: e.target.value })} autoFocus={!q.label}
                      placeholder="e.g. How satisfied were you with your consultation?" className={fieldClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Answer type</label>
                    <select value={q.type} onChange={(e) => changeType(q, e.target.value as SurveyQuestionType)} className={fieldClass}>
                      {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                {french && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Question in French</label>
                    <input value={q.labelFr ?? ''} onChange={(e) => patch(q.id, { labelFr: e.target.value })}
                      placeholder="Traduction française" className={fieldClass} />
                  </div>
                )}

                <div className={french ? 'grid gap-3 sm:grid-cols-2' : ''}>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Help text <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <input value={q.helpText ?? ''} onChange={(e) => patch(q.id, { helpText: e.target.value })}
                      placeholder="A short hint shown under the question" className={fieldClass} />
                  </div>
                  {french && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">Help text in French</label>
                      <input value={q.helpTextFr ?? ''} onChange={(e) => patch(q.id, { helpTextFr: e.target.value })} className={fieldClass} />
                    </div>
                  )}
                </div>

                {CHOICE_TYPES.includes(q.type) && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Choices</label>
                    <div className="space-y-2">
                      {(q.options ?? []).map((o, i) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <input value={o.label} aria-label={`Choice ${i + 1}`}
                            onChange={(e) => patch(q.id, { options: q.options!.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })}
                            placeholder={`Choice ${i + 1}`} className={fieldClass} />
                          {french && (
                            <input value={o.labelFr ?? ''} aria-label={`Choice ${i + 1} in French`}
                              onChange={(e) => patch(q.id, { options: q.options!.map((x) => (x.id === o.id ? { ...x, labelFr: e.target.value } : x)) })}
                              placeholder="En français" className={fieldClass} />
                          )}
                          <button type="button" aria-label={`Remove choice ${i + 1}`} disabled={(q.options?.length ?? 0) <= 2}
                            onClick={() => patch(q.id, { options: q.options!.filter((x) => x.id !== o.id) })} className={iconButton}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => patch(q.id, { options: [...(q.options ?? []), { id: newId('o'), label: `Option ${(q.options?.length ?? 0) + 1}` }] })}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40">
                      <Plus className="h-3.5 w-3.5" /> Add choice
                    </button>
                  </div>
                )}

                <label className="flex cursor-pointer items-center gap-3">
                  <Switch checked={q.required} onCheckedChange={(v) => patch(q.id, { required: v })} />
                  <span className="text-sm font-medium text-foreground">Required</span>
                </label>

                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <Switch
                      checked={!!q.showIf}
                      disabled={candidates.length === 0}
                      onCheckedChange={(v) => {
                        if (!v) { patch(q.id, { showIf: null }); return; }
                        const first = candidates[candidates.length - 1];
                        patch(q.id, { showIf: { questionId: first.id, operator: 'equals', value: conditionValues(first)[0].value } });
                      }}
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Only show this question to some people</span>
                      <span className="block text-xs text-muted-foreground">
                        {candidates.length === 0
                          ? 'Needs an earlier choice, yes/no, rating or scale question to depend on.'
                          : 'Show it depending on an earlier answer.'}
                      </span>
                    </span>
                  </label>
                  {q.showIf && parent && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem_1fr]">
                      <select value={q.showIf.questionId} aria-label="Depends on question" className={fieldClass}
                        onChange={(e) => {
                          const next = candidates.find((c) => c.id === e.target.value)!;
                          patch(q.id, { showIf: { questionId: next.id, operator: q.showIf!.operator, value: conditionValues(next)[0].value } });
                        }}>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>{questions.indexOf(c) + 1}. {c.label || 'Untitled question'}</option>
                        ))}
                      </select>
                      <select value={q.showIf.operator} aria-label="Condition" className={fieldClass}
                        onChange={(e) => patch(q.id, { showIf: { ...q.showIf!, operator: e.target.value as 'equals' | 'not_equals' } })}>
                        <option value="equals">is</option>
                        <option value="not_equals">is not</option>
                      </select>
                      <select value={q.showIf.value} aria-label="Answer" className={fieldClass}
                        onChange={(e) => patch(q.id, { showIf: { ...q.showIf!, value: e.target.value } })}>
                        {conditionValues(parent).map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {addMenu('Add question', 'inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5')}
    </div>
  );
}
