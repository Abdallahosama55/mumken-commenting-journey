export const MAX_COMMENT_LENGTH = 1000;
/** The character counter appears once this many characters remain (S-7). */
export const COUNTER_THRESHOLD = 100;

export type ValidationIssue = 'empty' | 'too_long';

export type ValidationResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly issue: ValidationIssue };

/** Counts user-perceived characters closely enough for a limit: code points, not UTF-16 units. */
export function characterCount(text: string): number {
  let count = 0;
  for (const _ of text) count++;
  return count;
}

/** Shared by the composer (client) and the repository (server side), so both enforce the same rules (S-7). */
export function validateCommentBody(raw: string): ValidationResult {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, issue: 'empty' };
  if (characterCount(value) > MAX_COMMENT_LENGTH) return { ok: false, issue: 'too_long' };
  return { ok: true, value };
}
