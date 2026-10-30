import { avatarLetter, type Comment } from '@commenting/core';
import { useCommenting, useI18n, useNow } from '@commenting/core/react';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';
import { AppText } from './AppText';

interface CommentCardProps {
  readonly comment: Comment;
  readonly nested?: boolean;
  readonly fresh?: boolean;
  readonly children?: ReactNode;
}

/**
 * One comment, per the Expo frames: 36pt avatar · 10pt · name/time; body 16pt below; actions 10pt below.
 * Memoised: list rows re-render only when their comment or highlight changes.
 */
export const CommentCard = memo(function CommentCard({ comment, nested = false, fresh = false, children }: CommentCardProps) {
  const { t, formatDateTime } = useI18n();
  const { repository } = useCommenting();
  const isOwn = comment.author.id === repository.getCurrentUser().id;

  return (
    <View style={[nested && styles.nested, fresh && styles.fresh]} testID={`comment-${comment.id}`}>
      {/* Name, time and body are read as one item by VoiceOver; actions stay separately focusable. */}
      <View accessible>
        <View style={styles.meta}>
          <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AppText variant="avatar" style={styles.initial}>
              {avatarLetter(comment.author.name)}
            </AppText>
          </View>
          <View style={styles.metaText}>
            <AppText variant="name" accessibilityHint={isOwn ? t('comment.you') : undefined}>
              {comment.author.name}
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
    <AppText variant="small" tone="muted" accessibilityHint={label}>
      {formatRelativeTime(iso, now)}
      {edited ? ` · ${t('comment.edited')}` : ''}
    </AppText>
  );
}

const styles = StyleSheet.create({
  nested: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  fresh: { backgroundColor: colors.accentSoft, borderRadius: radius.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  initial: { color: colors.accentInk, textAlign: 'center' },
  metaText: { flex: 1 },
  body: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
});
