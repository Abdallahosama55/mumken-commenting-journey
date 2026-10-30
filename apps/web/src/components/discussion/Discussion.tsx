'use client';

import type { Comment } from '@commenting/core';
import { useDiscussion, useI18n } from '@commenting/core/react';
import { useRef, useState } from 'react';
import { useAnnounce } from '../Announcer';
import { StatePanel } from '../StatePanel';
import { CommentComposer } from './CommentComposer';
import { DiscussionSkeleton } from './DiscussionSkeleton';
import styles from './Discussion.module.css';
import { Thread } from './Thread';

/**
 * The client island of the record page. States, in order of precedence:
 * data (empty S-3 or threads J-1) → load failure S-4 → loading S-1.
 * If a background refetch fails while data is on screen, the data stays (stale beats blank).
 */
export function Discussion({ recordId }: { recordId: string }) {
  const { t } = useI18n();
  const announce = useAnnounce();
  const { data, isError, isFetching, refetch } = useDiscussion(recordId);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);

  const handleCommentPosted = (comment: Comment) => {
    setFreshId(comment.id);
    announce(t('announce.commentPosted'));
  };

  const handleReplyPosted = (reply: Comment) => {
    setOpenReplyId(null);
    setFreshId(reply.id);
    announce(t('announce.replyPosted'));
  };

  let content;
  if (data) {
    content =
      data.total === 0 ? (
        <StatePanel
          title={t('state.empty.title')}
          body={t('state.empty.body')}
          action={
            <button type="button" className="button button-secondary" onClick={() => composerRef.current?.focus()}>
              {t('state.empty.action')}
            </button>
          }
        />
      ) : (
        <ol className={styles.threads} aria-label={t('discussion.listLabel')}>
          {data.threads.map((thread) => (
            <li key={thread.comment.id} className={styles.thread}>
              <Thread
                recordId={recordId}
                thread={thread}
                replyOpen={openReplyId === thread.comment.id}
                freshId={freshId}
                onOpenReply={setOpenReplyId}
                onCloseReply={() => setOpenReplyId(null)}
                onReplyPosted={handleReplyPosted}
              />
            </li>
          ))}
        </ol>
      );
  } else if (isError) {
    content = (
      <StatePanel
        tone="danger"
        role="alert"
        title={t('state.loadError.title')}
        body={t('state.loadError.body')}
        action={
          <button
            type="button"
            className="button button-secondary"
            aria-disabled={isFetching || undefined}
            onClick={() => {
              if (!isFetching) void refetch();
            }}
          >
            {isFetching ? <span className="spinner" aria-hidden="true" /> : null}
            {t('state.retry')}
          </button>
        }
      />
    );
  } else {
    content = <DiscussionSkeleton label={t('state.loading')} />;
  }

  return (
    <section className={`card ${styles.discussion}`} aria-labelledby="discussion-title">
      <div className={styles.header}>
        <h2 id="discussion-title" className={styles.title}>
          {t('discussion.title')}
        </h2>
        {data ? <p className={styles.count}>{t('discussion.count', { count: data.total })}</p> : null}
      </div>
      {/* Writing can start while comments load; it is hidden only when the discussion failed to load. */}
      {data || !isError ? (
        <CommentComposer recordId={recordId} textareaRef={composerRef} onPosted={handleCommentPosted} />
      ) : null}
      {content}
    </section>
  );
}
