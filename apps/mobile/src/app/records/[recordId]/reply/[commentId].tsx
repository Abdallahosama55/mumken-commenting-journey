import { useDiscussion, useI18n } from '@commenting/core/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CommentCard } from '@/components/CommentCard';
import { Composer, type ComposerHandle } from '@/components/Composer';
import { Skeleton } from '@/components/Skeleton';
import { StatePanel } from '@/components/StatePanel';
import { useFreshComment } from '@/lib/fresh-comment';
import { colors, common, layout, radius } from '@/lib/theme';

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * Reply screen (design frame 03, J-3): the comment being answered, then "Replying to …", the field and Post reply,
 * with the draft promise underneath. The reply always joins the thread (one level); `target` is the comment
 * that was tapped — the thread's root or one of its replies. Read from the discussion cache: no request.
 * Success pops back to the discussion (highlighted); failure stays here with the text kept (S-5a).
 */
export default function ReplyScreen() {
  const { recordId, commentId, target } = useLocalSearchParams<{ recordId: string; commentId: string; target?: string }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const discussion = useDiscussion(recordId);
  const [, setFreshId] = useFreshComment();
  const composerRef = useRef<ComposerHandle>(null);
  const thread = discussion.data?.threads.find((candidate) => candidate.comment.id === commentId);
  const answered = thread?.replies.find((reply) => reply.id === target) ?? thread?.comment;

  if (discussion.isPending) {
    return (
      <View style={[common.screen, styles.padded]}>
        <Skeleton title={t('state.loadingTitle')} label={t('state.loading')} />
      </View>
    );
  }

  if (!thread || !answered) {
    return (
      <View style={[common.screen, styles.padded]}>
        {discussion.isError ? (
          <StatePanel
            tone="danger"
            title={t('state.loadError.title')}
            body={t('state.loadError.body')}
            action={<Button variant="secondary" label={t('state.retry')} onPress={() => void discussion.refetch()} />}
          />
        ) : (
          <StatePanel
            title={t('state.commentUnavailable.title')}
            body={t('state.commentUnavailable.body')}
            action={<Button label={t('nav.back')} onPress={() => router.back()} />}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <View style={[styles.card, styles.parentCard]}>
        <CommentCard comment={answered}>
          <Button variant="link" label={t('comment.reply')} onPress={() => composerRef.current?.focus()} />
        </CommentCard>
      </View>
      <View style={[styles.card, styles.composerCard]}>
        <Composer
          ref={composerRef}
          recordId={recordId}
          parentId={thread.comment.id}
          replyTo={firstName(answered.author.name)}
          autoFocus
          onPosted={(reply) => {
            setFreshId(reply.id);
            router.back();
          }}
        />
      </View>
      <AppText variant="small" tone="muted" style={styles.draftHint}>
        {t('reply.draftHint')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  padded: { padding: layout.screenPadding },
  content: { padding: layout.screenPadding, gap: layout.cardGap },
  card: {
    paddingHorizontal: layout.cardPaddingH,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // Frame 03: the answered comment sits lower in its card than the composer does in its own.
  parentCard: { paddingTop: 24, paddingBottom: 18 },
  composerCard: { paddingTop: 19, paddingBottom: 18 },
  draftHint: { textAlign: 'center', marginTop: 0 },
});
