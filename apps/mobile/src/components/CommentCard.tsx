import type { Comment } from '@commenting/core';
import { useCommenting, useI18n, useNow } from '@commenting/core/react';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, fontWeight, radius, space } from '@/lib/theme';
import { AppText } from './AppText';

interface CommentCardProps {
  readonly comment: Comment;
  readonly nested?: boolean;
  readonly fresh?: boolean;
  readonly children?: ReactNode;
}

/** One comment. Memoised: list rows re-render only when their comment or highlight changes. */
export const CommentCard = memo(function CommentCard({ comment, nested = false, fresh = false, children }: CommentCardProps) {
  const { t, formatDateTime } = useI18n();
  const { repository } = useCommenting();
  const isOwn = comment.author.id === repository.getCurrentUser().id;

  return (
    <View style={[styles.card, nested && styles.nested, fresh && styles.fresh]} testID={`comment-${comment.id}`}>
      {/* Name, time and body are read as one item by VoiceOver; actions stay separately focusable. */}
      <View accessible style={styles.content}>
        <View style={styles.meta}>
          <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AppText variant="meta" tone="accent" style={styles.initials}>
              {comment.author.initials}
            </AppText>
          </View>
          <View style={styles.metaText}>
            <AppText variant="label">
              {comment.author.name}
              {isOwn ? <AppText variant="meta" tone="muted">{`  ${t('comment.you')}`}</AppText> : null}
            </AppText>
            <RelativeTime iso={comment.createdAt} label={formatDateTime(comment.createdAt)} edited={comment.updatedAt !== null} />
          </View>
        </View>
        <AppText contentLanguage={comment.language} style={styles.body}>
          {comment.body}
        </AppText>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
});

/** Subscribes to the shared clock on its own, so a tick re-renders only the timestamp text. */
function RelativeTime({ iso, label, edited }: { iso: string; label: string; edited: boolean }) {
  const now = useNow();
  const { t, formatRelativeTime } = useI18n();
  return (
    <AppText variant="meta" tone="muted" accessibilityHint={label}>
      {formatRelativeTime(iso, now)}
      {edited ? ` · ${t('comment.edited')}` : ''}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm, borderRadius: radius.md },
  nested: {
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  fresh: { backgroundColor: colors.accentSoft },
  content: { gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  initials: { fontWeight: fontWeight.bold, textAlign: 'center' },
  metaText: { flex: 1 },
  body: { lineHeight: 24 },
  actions: { flexDirection: 'row', gap: space.sm },
});
