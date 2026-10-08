export type QuestionType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'DROPDOWN'
  | 'RATING' | 'SCALE' | 'YES_NO' | 'DATE' | 'MONTH_YEAR' | 'EMAIL' | 'PHONE';

export const CHOICE_TYPES: QuestionType[] = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'];

export interface ShowIf {
  questionId: string;
  operator: 'equals' | 'not_equals';
  /** Option id, "yes" / "no", or a number as a string. */
  value: string;
}

export interface LogicQuestion {
  id: string;
  type: QuestionType;
  required: boolean;
  options?: { id: string }[] | null;
  showIf?: ShowIf | null;
}

export type AnswerValue = string | number | string[];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

/** Whether a question is shown, given the answers kept so far. */
export function isVisible(question: LogicQuestion, answers: Record<string, AnswerValue>): boolean {
  const rule = question.showIf;
  if (!rule?.questionId) return true;
  const given = answers[rule.questionId];
  // A conditional question stays hidden until the question it depends on is answered.
  if (given === undefined) return false;
  const matches = Array.isArray(given) ? given.includes(rule.value) : String(given) === String(rule.value);
  return rule.operator === 'not_equals' ? !matches : matches;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null
    || (typeof value === 'string' && value.trim() === '')
    || (Array.isArray(value) && value.length === 0);
}

/** Returns the cleaned value, or an error code when it is not valid for the question. */
function cleanValue(question: LogicQuestion, raw: unknown): { value?: AnswerValue; error?: string } {
  const optionIds = new Set((question.options ?? []).map((o) => o.id));
  switch (question.type) {
    case 'SHORT_TEXT':
    case 'LONG_TEXT': {
      if (typeof raw !== 'string') return { error: 'invalid' };
      const max = question.type === 'SHORT_TEXT' ? 500 : 5000;
      return { value: raw.trim().slice(0, max) };
    }
    case 'SINGLE_CHOICE':
    case 'DROPDOWN':
      return typeof raw === 'string' && optionIds.has(raw) ? { value: raw } : { error: 'invalid' };
    case 'MULTI_CHOICE': {
      if (!Array.isArray(raw)) return { error: 'invalid' };
      const picked = [...new Set(raw.filter((v): v is string => typeof v === 'string' && optionIds.has(v)))];
      return picked.length === raw.length ? { value: picked } : { error: 'invalid' };
    }
    case 'RATING':
    case 'SCALE': {
      const n = typeof raw === 'number' ? raw : Number.NaN;
      const [min, max] = question.type === 'RATING' ? [1, 5] : [0, 10];
      return Number.isInteger(n) && n >= min && n <= max ? { value: n } : { error: 'invalid' };
    }
    case 'YES_NO':
      return raw === 'yes' || raw === 'no' ? { value: raw } : { error: 'invalid' };
    case 'DATE':
      return typeof raw === 'string' && DATE_RE.test(raw) && !Number.isNaN(Date.parse(raw))
        ? { value: raw } : { error: 'invalid' };
    case 'MONTH_YEAR':
      return typeof raw === 'string' && MONTH_RE.test(raw) ? { value: raw } : { error: 'invalid' };
    case 'EMAIL':
      return typeof raw === 'string' && EMAIL_RE.test(raw.trim())
        ? { value: raw.trim().toLowerCase() } : { error: 'invalid_email' };
    case 'PHONE':
      return typeof raw === 'string' && PHONE_RE.test(raw.trim())
        ? { value: raw.trim() } : { error: 'invalid_phone' };
    default:
      return { error: 'invalid' };
  }
}

/**
 * Validates a submission against the survey's questions (in display order).
 * Answers to questions hidden by skip logic are dropped, not rejected.
 */
export function validateSubmission(
  questions: LogicQuestion[],
  submitted: Record<string, unknown>,
): { answers: Record<string, AnswerValue>; errors: Record<string, string> } {
  const answers: Record<string, AnswerValue> = {};
  const errors: Record<string, string> = {};

  for (const question of questions) {
    if (!isVisible(question, answers)) continue;
    const raw = submitted?.[question.id];
    if (isEmpty(raw)) {
      if (question.required) errors[question.id] = 'required';
      continue;
    }
    const { value, error } = cleanValue(question, raw);
    if (error) errors[question.id] = error;
    else if (value !== undefined && !isEmpty(value)) answers[question.id] = value;
    else if (question.required) errors[question.id] = 'required';
  }
  return { answers, errors };
}
