'use client';

import type { Comment, CommentThread } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { useId, useRef } from 'react';
import { ReplyIcon } from '../icons';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import styles from './Discussion.module.css';

interface ThreadProps {
  readonly recordId: string;
  readonly thread: CommentThread;
  readonly replyOpen: boolean;
  readonly freshId: string | null;
  /** The reply to focus after posting (A-3). */
  readonly focusId: string | null;
  readonly onOpenReply: (commentId: string) => void;
  readonly onCloseReply: () => void;
  readonly onReplyPosted: (reply: Comment) => void;
}

/** A top-level comment, its replies (one level, J-3), and an inline reply composer when open. */
export function Thread({
  recordId,
  thread,
  replyOpen,
  freshId,
  focusId,
  onOpenReply,
  onCloseReply,
  onReplyPosted,
}: ThreadProps) {
  const { t } = useI18n();
  const replyButtonRef = useRef<HTMLButtonElement>(null);
  const composerId = useId();
  const { comment, replies } = thread;

  // Cancel / Esc returns focus to the button that opened the composer (A-3).
  const closeReply = () => {
    replyButtonRef.current?.focus();
    onCloseReply();
  };

  return (
    <>
      <CommentItem comment={comment} fresh={freshId === comment.id}>
        <button
          ref={replyButtonRef}
          type="button"
          className="button button-link"
          aria-expanded={replyOpen}
          aria-controls={replyOpen ? composerId : undefined}
          aria-label={t('comment.replyTo', { name: comment.author.name })}
          onClick={() => (replyOpen ? closeReply() : onOpenReply(comment.id))}
        >
          <ReplyIcon />
          {t('comment.reply')}
        </button>
      </CommentItem>

      {replies.length > 0 || replyOpen ? (
        <div className={styles.replies}>
          {replies.length > 0 ? (
            <ol aria-label={t('comment.replies', { count: replies.length })}>
              {replies.map((reply) => (
                <li key={reply.id}>
                  <CommentItem comment={reply} nested fresh={freshId === reply.id} focusOnMount={focusId === reply.id} />
                </li>
              ))}
            </ol>
          ) : null}
          {replyOpen ? (
            <CommentComposer
              id={composerId}
              recordId={recordId}
              parentId={comment.id}
              replyTo={comment.author.name}
              autoFocus
              onCancel={closeReply}
              onPosted={onReplyPosted}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
