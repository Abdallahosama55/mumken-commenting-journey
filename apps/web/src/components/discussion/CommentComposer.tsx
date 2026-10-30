'use client';

import type { Comment } from '@commenting/core';
import { useCommentComposer, useI18n } from '@commenting/core/react';
import { useEffect, useId, useRef, type FormEvent, type KeyboardEvent, type RefObject } from 'react';
import styles from './CommentComposer.module.css';

interface CommentComposerProps {
  readonly recordId: string;
  /** Set for replies (J-3); omitted for top-level comments (J-2). */
  readonly parentId?: string | null;
  /** Parent author's name, for the reply label. */
  readonly replyTo?: string;
  readonly id?: string;
  readonly autoFocus?: boolean;
  readonly textareaRef?: RefObject<HTMLTextAreaElement | null>;
  readonly onPosted?: (comment: Comment) => void;
  /** Replies only. Closing keeps the draft — text is only ever cleared by a successful post (S-5a). */
  readonly onCancel?: () => void;
}

/**
 * The composer UI over the shared state machine (`useCommentComposer`). On failure the form turns into the
 * design's red "wasn't posted" panel, keeps the text editable, and the primary action becomes Retry (S-5).
 */
export function CommentComposer({
  recordId,
  parentId = null,
  replyTo = '',
  id,
  autoFocus = false,
  textareaRef,
  onPosted,
  onCancel,
}: CommentComposerProps) {
  const { t } = useI18n();
  const composer = useCommentComposer({ recordId, parentId, onPosted });
  const localRef = useRef<HTMLTextAreaElement>(null);
  const fieldRef = textareaRef ?? localRef;
  const uid = useId();
  const ids = { field: `${uid}-field`, hint: `${uid}-hint`, error: `${uid}-error`, counter: `${uid}-counter`, alert: `${uid}-alert` };

  const isReply = parentId !== null;
  const submitting = composer.status === 'submitting';
  const failed = composer.status === 'failed' && composer.submitError !== null;

  // Opening a reply moves focus into its field (A-3).
  useEffect(() => {
    if (autoFocus) fieldRef.current?.focus();
  }, [autoFocus, fieldRef]);

  const issueMessage =
    composer.validationIssue === 'empty'
      ? t('validation.empty')
      : composer.validationIssue === 'too_long'
        ? t('validation.too_long', { max: composer.maxLength })
        : null;

  const describedBy = [failed && ids.alert, issueMessage ? ids.error : !failed && ids.hint, composer.showCounter && ids.counter]
    .filter(Boolean)
    .join(' ');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcome = await composer.submit();
    if (outcome.status === 'invalid') fieldRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    } else if (event.key === 'Escape' && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  const submitLabel = failed ? t('composer.retry') : isReply ? t('reply.submit') : t('composer.submit');

  return (
    <form
      id={id}
      className={styles.composer}
      data-state={failed ? 'failed' : undefined}
      data-variant={isReply ? 'reply' : 'comment'}
      onSubmit={handleSubmit}
      noValidate
    >
      {failed ? (
        // The design's "Comment wasn't posted" panel: title, "Draft preserved", message, the kept text, Retry.
        <div id={ids.alert} role="alert" className={styles.alert}>
          <div className={styles.alertHead}>
            <p className={styles.alertTitle}>{isReply ? t('submitError.replyTitle') : t('submitError.title')}</p>
            <p className={styles.alertTag}>{t('submitError.draftPreserved')}</p>
          </div>
          <p className={styles.alertBody}>
            {composer.submitError?.retryable ? t('submitError.body') : t('submitError.rejected')}
          </p>
        </div>
      ) : null}

      <label htmlFor={ids.field} className={isReply ? styles.label : 'visually-hidden'}>
        {isReply ? t('reply.replyingTo', { name: replyTo }) : t('composer.label')}
      </label>
      <textarea
        id={ids.field}
        ref={fieldRef}
        className={styles.field}
        value={composer.value}
        onChange={(event) => composer.setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isReply ? t('reply.placeholder') : t('composer.placeholder')}
        rows={3}
        // Typed text takes its own direction; while empty, inherit the UI direction so the placeholder
        // sits on the correct side (an empty `dir="auto"` resolves to LTR).
        dir={composer.value.trim() ? 'auto' : undefined}
        readOnly={submitting}
        aria-invalid={issueMessage ? true : undefined}
        aria-describedby={describedBy}
        aria-keyshortcuts="Control+Enter Meta+Enter"
      />

      <div className={styles.footer}>
        <div className={styles.meta}>
          {issueMessage ? (
            <p id={ids.error} className={styles.error}>
              {issueMessage}
            </p>
          ) : failed ? null : (
            <p id={ids.hint} className={styles.hint}>
              {t('composer.hint')}
            </p>
          )}
          {composer.showCounter ? (
            <p id={ids.counter} className={styles.counter} data-over={composer.remaining < 0 || undefined}>
              {composer.remaining >= 0
                ? t('composer.remaining', { count: composer.remaining })
                : t('composer.overLimit', { count: -composer.remaining })}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          {onCancel ? (
            <button type="button" className="button button-secondary" onClick={onCancel}>
              {t('reply.cancel')}
            </button>
          ) : null}
          <button type="submit" className="button button-primary" aria-disabled={submitting || undefined}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                {t('composer.submitting')}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
