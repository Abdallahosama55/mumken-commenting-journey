import type { CommentThread } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '@/lib/theme';
import { Button } from './Button';
import { CommentCard } from './CommentCard';

interface ThreadItemProps {
  readonly thread: CommentThread;
  readonly freshId: string | null;
  readonly onReply: (commentId: string) => void;
}

/** A `FlatList` row: a top-level comment and its one level of replies (J-1, J-3). */
export const ThreadItem = memo(function ThreadItem({ thread, freshId, onReply }: ThreadItemProps) {
  const { t } = useI18n();
  const { comment, replies } = thread;

  return (
    <View style={styles.thread}>
      <CommentCard comment={comment} fresh={freshId === comment.id}>
        <Button
          variant="link"
          icon="arrow-undo-outline"
          iconDirectional
          label={t('comment.reply')}
          accessibilityLabel={t('comment.replyTo', { name: comment.author.name })}
          onPress={() => onReply(comment.id)}
        />
      </CommentCard>
      {replies.length > 0 ? (
        <View style={styles.replies} accessibilityLabel={t('comment.replies', { count: replies.length })}>
          {replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} nested fresh={freshId === reply.id} />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  thread: {
    gap: space.md,
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  replies: { gap: space.sm, marginStart: space.xl },
});
