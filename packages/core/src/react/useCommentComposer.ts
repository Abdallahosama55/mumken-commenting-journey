import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { draftKey } from '../data/draft-store';
import { RepositoryError, isRepositoryError } from '../data/errors';
import { detectLanguage } from '../domain/language';
import type { Comment } from '../domain/types';
import {
  COUNTER_THRESHOLD,
  MAX_COMMENT_LENGTH,
  characterCount,
  validateCommentBody,
  type ValidationIssue,
} from '../domain/validation';
import { useCommenting, useI18n } from './providers';
import { useCreateComment } from './queries';

export type ComposerStatus = 'idle' | 'submitting' | 'failed';

export type SubmitOutcome =
  | { readonly status: 'posted'; readonly comment: Comment }
  | { readonly status: 'invalid'; readonly issue: ValidationIssue }
  | { readonly status: 'failed'; readonly error: RepositoryError }
  | { readonly status: 'ignored' };

export interface CommentComposerOptions {
  readonly recordId: string;
  /** `null` for a top-level comment (J-2), the parent's id for a reply (J-3). */
  readonly parentId?: string | null;
  readonly onPosted?: (comment: Comment) => void;
}

export interface CommentComposer {
  readonly value: string;
  readonly setValue: (value: string) => void;
  readonly status: ComposerStatus;
  /** Set only after a submit attempt, so the user is not scolded while still typing. */
  readonly validationIssue: ValidationIssue | null;
  readonly submitError: RepositoryError | null;
  readonly length: number;
  readonly maxLength: number;
  readonly remaining: number;
  /** The counter appears near the limit (S-7). */
  readonly showCounter: boolean;
  readonly submit: () => Promise<SubmitOutcome>;
  /** Cancel: drops the draft and any error. */
  readonly discard: () => void;
}

const emptySnapshot = () => '';

/**
 * The submission state machine shared by web and mobile (see the design doc, §2):
 *
 *   idle ─submit→ submitting ─ok→ idle (draft cleared)   ·   submitting ─error→ failed (text kept)
 *
 * Guarantees: the text is never lost on failure (S-5a); a retry of unchanged text reuses its idempotency key,
 * so it cannot duplicate (S-5d); a second submit while one is in flight is ignored (S-6).
 */
export function useCommentComposer({ recordId, parentId = null, onPosted }: CommentComposerOptions): CommentComposer {
  const { drafts } = useCommenting();
  const { locale } = useI18n();
  const key = draftKey(recordId, parentId);

  const subscribe = useCallback((listener: () => void) => drafts.subscribe(key, listener), [drafts, key]);
  const getSnapshot = useCallback(() => drafts.get(key), [drafts, key]);
  // The server has no drafts; the client re-renders with its stored draft right after hydration.
  const value = useSyncExternalStore(subscribe, getSnapshot, emptySnapshot);

  const mutation = useCreateComment(recordId);
  const { mutateAsync, reset } = mutation;
  const [validationIssue, setValidationIssue] = useState<ValidationIssue | null>(null);
  const attemptRef = useRef<{ clientId: string; body: string } | null>(null);
  // `isPending` only flips on the next render; the ref blocks a double tap within the same frame.
  const inFlightRef = useRef(false);

  const setValue = useCallback(
    (next: string) => {
      drafts.set(key, next);
      // A message from the last submit disappears as soon as the text becomes valid (S-7).
      setValidationIssue((issue) => (issue && validateCommentBody(next).ok ? null : issue));
    },
    [drafts, key],
  );

  const submit = useCallback(async (): Promise<SubmitOutcome> => {
    if (inFlightRef.current) return { status: 'ignored' };

    const result = validateCommentBody(drafts.get(key));
    if (!result.ok) {
      setValidationIssue(result.issue);
      return { status: 'invalid', issue: result.issue };
    }
    setValidationIssue(null);

    // Same text → same key, so a retry after an ambiguous failure cannot create a duplicate.
    // Edited text is a new comment and gets a new key.
    if (attemptRef.current?.body !== result.value) {
      attemptRef.current = { clientId: createClientId(), body: result.value };
    }

    inFlightRef.current = true;
    try {
      const comment = await mutateAsync({
        recordId,
        parentId,
        body: result.value,
        language: detectLanguage(result.value, locale),
        clientId: attemptRef.current.clientId,
      });
      attemptRef.current = null;
      drafts.clear(key);
      reset();
      onPosted?.(comment);
      return { status: 'posted', comment };
    } catch (error) {
      return { status: 'failed', error: toRepositoryError(error) };
    } finally {
      inFlightRef.current = false;
    }
  }, [drafts, key, locale, mutateAsync, onPosted, parentId, recordId, reset]);

  const discard = useCallback(() => {
    drafts.clear(key);
    attemptRef.current = null;
    setValidationIssue(null);
    reset();
  }, [drafts, key, reset]);

  const length = characterCount(value.trim());
  const remaining = MAX_COMMENT_LENGTH - length;

  return {
    value,
    setValue,
    status: mutation.isPending ? 'submitting' : mutation.isError ? 'failed' : 'idle',
    validationIssue: validationIssue ?? (remaining < 0 ? 'too_long' : null),
    submitError: mutation.isError ? toRepositoryError(mutation.error) : null,
    length,
    maxLength: MAX_COMMENT_LENGTH,
    remaining,
    showCounter: remaining <= COUNTER_THRESHOLD,
    submit,
    discard,
  };
}

function toRepositoryError(error: unknown): RepositoryError {
  return isRepositoryError(error) ? error : new RepositoryError('network', String(error));
}

function createClientId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
