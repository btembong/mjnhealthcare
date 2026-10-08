import type { SurveyQuestionType } from '@mjn/ui';

export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? 'https://mjnhealthcare.com').replace(/\/$/, '');

export function publicUrl(slug: string, lang?: 'fr') {
  return `${WEB_URL}/survey/${slug}${lang ? `?lang=${lang}` : ''}`;
}

export type Option = { id: string; label: string; labelFr?: string | null };
export type ShowIf = { questionId: string; operator: 'equals' | 'not_equals'; value: string };

export type Question = {
  id: string;
  type: SurveyQuestionType;
  label: string;
  labelFr?: string | null;
  helpText?: string | null;
  helpTextFr?: string | null;
  required: boolean;
  options?: Option[] | null;
  showIf?: ShowIf | null;
};

export const QUESTION_TYPES: { value: SurveyQuestionType; label: string; hint: string }[] = [
  { value: 'SINGLE_CHOICE', label: 'Single choice', hint: 'Pick one option' },
  { value: 'MULTI_CHOICE', label: 'Multiple choice', hint: 'Pick any that apply' },
  { value: 'DROPDOWN', label: 'Dropdown', hint: 'Pick one from a long list' },
  { value: 'YES_NO', label: 'Yes / No', hint: 'A simple yes or no' },
  { value: 'RATING', label: 'Star rating', hint: '1 to 5 stars' },
  { value: 'SCALE', label: 'Scale 0–10', hint: 'e.g. how likely to recommend' },
  { value: 'SHORT_TEXT', label: 'Short answer', hint: 'One line of text' },
  { value: 'LONG_TEXT', label: 'Long answer', hint: 'A paragraph' },
  { value: 'DATE', label: 'Date', hint: 'Pick a date' },
  { value: 'EMAIL', label: 'Email', hint: 'An email address' },
  { value: 'PHONE', label: 'Phone', hint: 'A phone number' },
];

export const CHOICE_TYPES: SurveyQuestionType[] = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'];
/** Types whose answers a later question's condition can test. */
export const CONDITION_TYPES: SurveyQuestionType[] = [...CHOICE_TYPES, 'YES_NO', 'RATING', 'SCALE'];

export const typeLabel = (type: string) => QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;

export function newId(prefix: 'q' | 'o') {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function blankQuestion(type: SurveyQuestionType): Question {
  return {
    id: newId('q'),
    type,
    label: '',
    required: false,
    options: CHOICE_TYPES.includes(type)
      ? [{ id: newId('o'), label: 'Option 1' }, { id: newId('o'), label: 'Option 2' }]
      : null,
    showIf: null,
  };
}

/** The values a condition on `question` can be compared against. */
export function conditionValues(question: Question): { value: string; label: string }[] {
  if (CHOICE_TYPES.includes(question.type)) return (question.options ?? []).map((o) => ({ value: o.id, label: o.label }));
  if (question.type === 'YES_NO') return [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
  if (question.type === 'RATING') return [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }));
  if (question.type === 'SCALE') return Array.from({ length: 11 }, (_, n) => ({ value: String(n), label: String(n) }));
  return [];
}

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  LIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-700',
};

export const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', LIVE: 'Live', CLOSED: 'Closed' };

export function formatDate(ts: string | Date) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(ts: string | Date) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** A stored answer as readable text, for tables and exports. */
export function answerText(question: Question | undefined, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (!question) return String(value);
  const label = (id: string) => question.options?.find((o) => o.id === id)?.label ?? id;
  if (Array.isArray(value)) return value.map((v) => label(String(v))).join(', ');
  if (CHOICE_TYPES.includes(question.type)) return label(String(value));
  if (question.type === 'YES_NO') return value === 'yes' ? 'Yes' : 'No';
  return String(value);
}
