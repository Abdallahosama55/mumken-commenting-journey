import type { Comment, CommentThread } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/lib/theme';
import { Button } from './Button';
import { CommentCard } from './CommentCard';

interface ThreadItemProps {
  readonly thread: CommentThread;
  readonly freshId: string | null;
  /** The last row has no bottom padding: the card's own padding follows. */
  readonly last?: boolean;
  /** Reply always goes to the thread (one level, J-3), addressed to the comment that was tapped. */
  readonly onReply: (threadId: string, to: Comment) => void;
}

/** A `FlatList` row: a top-level comment and its replies (J-1, J-3). Rows are separated by a 1pt divider. */
export const ThreadItem = memo(function ThreadItem({ thread, freshId, last = false, onReply }: ThreadItemProps) {
  const { t } = useI18n();
  const { comment, replies } = thread;

  const replyButton = (target: Comment) => (
    <Button
      variant="link"
      label={t('comment.reply')}
      accessibilityLabel={t('comment.replyTo', { name: target.author.name })}
      onPress={() => onReply(comment.id, target)}
    />
  );

  return (
    <View style={[styles.thread, last && styles.last]}>
      <CommentCard comment={comment} fresh={freshId === comment.id}>
        {replyButton(comment)}
      </CommentCard>
      {replies.length > 0 ? (
        <View style={styles.replies} accessibilityLabel={t('comment.replies', { count: replies.length })}>
          {replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} nested fresh={freshId === reply.id}>
              {replyButton(reply)}
            </CommentCard>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  thread: {
    paddingTop: 20,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  last: { paddingBottom: 0 },
  replies: { gap: 12, marginTop: 16 },
});
