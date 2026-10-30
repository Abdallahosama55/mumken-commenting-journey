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
  const [openReplyId, setOpenReplyIdState] = useState<string | null>(null);
  // Mirrors `openReplyId` for callbacks that resolve later (a reply can land after its composer was closed).
  const openReplyRef = useRef<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const setOpenReplyId = (commentId: string | null) => {
    openReplyRef.current = commentId;
    setOpenReplyIdState(commentId);
  };

  const handleCommentPosted = (comment: Comment) => {
    setFreshId(comment.id);
    announce(t('announce.commentPosted'));
  };

  const handleReplyPosted = (reply: Comment) => {
    setFreshId(reply.id);
    announce(t('announce.replyPosted'));
    // Only close and move focus if this reply's composer is still the open one — never steal focus from a
    // composer the user opened while the request was in flight (A-3).
    if (openReplyRef.current === reply.parentId) {
      setOpenReplyId(null);
      setFocusId(reply.id);
    }
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
                focusId={focusId}
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
