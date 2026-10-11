/**
 * Stage requirements are written by staff as free text ("Passport", "Degree Certificate"),
 * while uploads may carry a fixed code ("PASSPORT_COPY") or the requirement's own name.
 * These helpers decide whether an uploaded document satisfies a requirement.
 */

const NOISE = new Set(['copy', 'valid', 'the', 'of', 'from', 'a', 'an', 'my', 'your']);

/** "PASSPORT_COPY", "Valid Passport" and "passport" all become "passport". */
export function docKey(name?: string | null): string {
  return (name ?? '')
    .toLowerCase()
    .replace(/licence/g, 'license')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !NOISE.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ');
}

// Names that mean the same document. Every entry is written as docKey() would return it.
const GROUPS: string[][] = [
  ['passport'],
  ['degree certificate', 'degree', 'diploma degree', 'bachelor degree', 'master degree'],
  ['transcript', 'diploma transcript', 'bachelor transcript', 'master transcript'],
  ['home country license', 'license home country', 'nursing license', 'medical license', 'other license', 'professional license'],
  ['good standing certificate', 'good standing', 'certificate good standing'],
  ['work experience certificate', 'experience letter', 'work experience letter', 'experience certificate'],
  ['birth certificate'],
  ['reference letter', 'reference'],
];
const GROUP_OF = new Map<string, number>();
GROUPS.forEach((names, i) => names.forEach((n) => GROUP_OF.set(n, i)));

export function docMatches(documentType?: string | null, requirement?: string | null): boolean {
  const a = docKey(documentType);
  const b = docKey(requirement);
  if (!a || !b) return false;
  if (a === b) return true;
  const ga = GROUP_OF.get(a);
  return ga !== undefined && ga === GROUP_OF.get(b);
}

const RANK = ['VERIFIED', 'PENDING', 'REJECTED'];

/** The best state among the documents that satisfy a requirement: verified beats waiting beats rejected. */
export function requirementState<T extends { type: string; status: string }>(docs: T[], requirement: string): { status: string | null; doc: T | null } {
  const mine = docs.filter((d) => docMatches(d.type, requirement));
  for (const status of RANK) {
    const doc = mine.find((d) => d.status === status);
    if (doc) return { status, doc };
  }
  return { status: null, doc: null };
}
