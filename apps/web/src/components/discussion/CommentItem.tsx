'use client';

import { directionOf, type Comment } from '@commenting/core';
import { useCommenting, useI18n, useNow } from '@commenting/core/react';
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Discussion.module.css';

interface CommentItemProps {
  readonly comment: Comment;
  readonly nested?: boolean;
  /** Briefly highlights a comment the user just posted. */
  readonly fresh?: boolean;
  /** After posting a reply, focus lands on it (A-3). */
  readonly focusOnMount?: boolean;
  readonly children?: ReactNode;
}

export function CommentItem({ comment, nested = false, fresh = false, focusOnMount = false, children }: CommentItemProps) {
  const { t } = useI18n();
  const { repository } = useCommenting();
  const ref = useRef<HTMLElement>(null);
  const authorId = `${comment.id}-author`;
  const isOwn = comment.author.id === repository.getCurrentUser().id;

  useEffect(() => {
    if (focusOnMount) ref.current?.focus();
  }, [focusOnMount]);

  return (
    <article
      ref={ref}
      id={comment.id}
      tabIndex={-1}
      aria-labelledby={authorId}
      className={styles.comment}
      data-nested={nested || undefined}
      data-fresh={fresh || undefined}
    >
      <div className={styles.meta}>
        <span className={styles.avatar} aria-hidden="true">
          {comment.author.initials}
        </span>
        <div className={styles.metaText}>
          <p id={authorId} className={styles.author}>
            <bdi>{comment.author.name}</bdi>
            {isOwn ? <span className={styles.you}>{t('comment.you')}</span> : null}
          </p>
          <p className={styles.time}>
            <RelativeTime iso={comment.createdAt} />
            {comment.updatedAt ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{t('comment.edited')}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      {/* Each body is rendered in its own language and direction, whatever the UI language (I-3). */}
      <p className={styles.body} lang={comment.language} dir={directionOf(comment.language)}>
        {comment.body}
      </p>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </article>
  );
}

/** Only this text re-renders when the shared clock ticks — not the comment around it. */
function RelativeTime({ iso }: { iso: string }) {
  const now = useNow();
  const { formatRelativeTime, formatDateTime } = useI18n();
  return (
    <time dateTime={iso} title={formatDateTime(iso)}>
      {formatRelativeTime(iso, now)}
    </time>
  );
}
