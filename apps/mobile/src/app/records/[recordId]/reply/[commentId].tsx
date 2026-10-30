import { useDiscussion, useI18n } from '@commenting/core/react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { CommentCard } from '@/components/CommentCard';
import { Composer } from '@/components/Composer';
import { Skeleton } from '@/components/Skeleton';
import { StatePanel } from '@/components/StatePanel';
import { useFreshComment } from '@/lib/fresh-comment';
import { common, space } from '@/lib/theme';

/**
 * Reply screen (design frame 03, J-3). The parent is read from the discussion cache, so opening it costs
 * no request. Success pops back to the discussion, where the reply is highlighted. Failure stays here with
 * the text kept. Going back without posting keeps the draft for next time (S-5a).
 */
export default function ReplyScreen() {
  const { recordId, commentId } = useLocalSearchParams<{ recordId: string; commentId: string }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const discussion = useDiscussion(recordId);
  const [, setFreshId] = useFreshComment();
  const thread = discussion.data?.threads.find((candidate) => candidate.comment.id === commentId);

  if (discussion.isPending) {
    return (
      <View style={[common.screen, styles.padded]}>
        <Skeleton label={t('state.loading')} rows={1} />
      </View>
    );
  }

  if (!thread) {
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
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <View style={common.card}>
        <CommentCard comment={thread.comment} />
      </View>
      <View style={common.card}>
        <Composer
          recordId={recordId}
          parentId={thread.comment.id}
          replyTo={thread.comment.author.name}
          autoFocus
          onPosted={(reply) => {
            setFreshId(reply.id);
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  padded: { padding: space.lg },
  content: { padding: space.lg, gap: space.lg },
});
