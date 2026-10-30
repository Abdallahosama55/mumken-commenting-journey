'use client';

import type { Comment, CommentThread } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { useId, useRef } from 'react';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import styles from './Discussion.module.css';

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

interface ThreadProps {
  readonly recordId: string;
  readonly thread: CommentThread;
  /** Name shown in "Replying to …" while this thread's composer is open, otherwise `null`. */
  readonly replyingTo: string | null;
  readonly freshId: string | null;
  /** The reply to focus after posting (A-3). */
  readonly focusId: string | null;
  readonly onOpenReply: (threadId: string, to: string) => void;
  readonly onCloseReply: () => void;
  readonly onReplyPosted: (reply: Comment) => void;
}

/**
 * A top-level comment and its replies (J-3). Replies are one level deep: "Reply" on a reply answers in the
 * same thread, addressed to that reply's author — so every comment offers Reply, as in the design.
 */
export function Thread({
  recordId,
  thread,
  replyingTo,
  freshId,
  focusId,
  onOpenReply,
  onCloseReply,
  onReplyPosted,
}: ThreadProps) {
  const { t } = useI18n();
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const composerId = useId();
  const { comment, replies } = thread;
  const replyOpen = replyingTo !== null;

  // Cancel / Esc returns focus to the Reply button that opened the composer (A-3).
  const closeReply = () => {
    openerRef.current?.focus();
    onCloseReply();
  };

  const replyButton = (target: Comment) => (
    <button
      type="button"
      className="button-link"
      aria-expanded={replyOpen}
      aria-controls={replyOpen ? composerId : undefined}
      aria-label={t('comment.replyTo', { name: target.author.name })}
      onClick={(event) => {
        openerRef.current = event.currentTarget;
        onOpenReply(comment.id, firstName(target.author.name));
      }}
    >
      {t('comment.reply')}
    </button>
  );

  return (
    <>
      <CommentItem comment={comment} fresh={freshId === comment.id}>
        {replyButton(comment)}
      </CommentItem>

      {replies.length > 0 ? (
        <ol className={styles.replies} aria-label={t('comment.replies', { count: replies.length })}>
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem comment={reply} nested fresh={freshId === reply.id} focusOnMount={focusId === reply.id}>
                {replyButton(reply)}
              </CommentItem>
            </li>
          ))}
        </ol>
      ) : null}

      {replyOpen ? (
        <div className={styles.replyComposer}>
          <CommentComposer
            id={composerId}
            recordId={recordId}
            parentId={comment.id}
            replyTo={replyingTo}
            autoFocus
            onCancel={closeReply}
            onPosted={onReplyPosted}
          />
        </div>
      ) : null}
    </>
  );
}
