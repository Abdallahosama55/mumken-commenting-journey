import { isNotFound, type Comment, type CommentThread } from '@commenting/core';
import { useDiscussion, useI18n, useRecord } from '@commenting/core/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Composer, type ComposerHandle } from '@/components/Composer';
import { RecordCard } from '@/components/RecordCard';
import { Skeleton } from '@/components/Skeleton';
import { StatePanel } from '@/components/StatePanel';
import { ThreadItem } from '@/components/ThreadItem';
import { useFreshComment } from '@/lib/fresh-comment';
import { colors, common, layout, radius } from '@/lib/theme';

/**
 * Record + discussion (design frame 02, J-1). A virtualised `FlatList` of threads; its header holds the record
 * card and the top of the discussion card (title + composer), rows and footer complete the card. States: record
 * loading / unavailable (S-2) / failed, then discussion loading (S-1) / failed (S-4) / empty (S-3) / threads.
 */
export default function DiscussionScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const record = useRecord(recordId);
  const discussion = useDiscussion(recordId);
  const [freshId, setFreshId] = useFreshComment();
  const composerRef = useRef<ComposerHandle>(null);
  const [refreshing, setRefreshing] = useState(false);

  const openReply = useCallback(
    (threadId: string, to: Comment) =>
      router.push({
        pathname: '/records/[recordId]/reply/[commentId]',
        params: { recordId, commentId: threadId, target: to.id },
      }),
    [recordId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await discussion.refetch();
    setRefreshing(false);
  };

  if (record.isPending) {
    return (
      <View style={[common.screen, styles.padded]}>
        <Skeleton title={t('state.loadingTitle')} label={t('state.loadingRecord')} />
      </View>
    );
  }

  if (record.isError) {
    return (
      <View style={[common.screen, styles.padded]}>
        {isNotFound(record.error) ? (
          <StatePanel
            title={t('state.unavailable.title')}
            body={t('state.unavailable.body')}
            action={<Button label={t('state.unavailable.action')} onPress={() => router.dismissTo('/')} />}
          />
        ) : (
          <StatePanel
            tone="danger"
            title={t('state.recordError.title')}
            body={t('state.loadError.body')}
            action={<Button variant="secondary" label={t('state.retry')} onPress={() => void record.refetch()} />}
          />
        )}
      </View>
    );
  }

  const { data, isError } = discussion;
  const threads = data?.threads ?? [];

  const header = (
    <View>
      <RecordCard record={record.data} />
      <View style={styles.sectionTop}>
        <AppText variant="title" accessibilityRole="header">
          {t('discussion.title')}
        </AppText>
        {data || !isError ? (
          <View style={styles.composer}>
            <Composer ref={composerRef} recordId={recordId} onPosted={(comment) => setFreshId(comment.id)} />
          </View>
        ) : null}
      </View>
    </View>
  );

  const empty = isError ? (
    <StatePanel
      tone="danger"
      title={t('state.loadError.title')}
      body={t('state.loadError.body')}
      action={
        <Button
          variant="secondary"
          label={t('state.retry')}
          busy={discussion.isFetching}
          onPress={() => void discussion.refetch()}
        />
      }
    />
  ) : data ? (
    <StatePanel
      title={t('state.empty.title')}
      body={t('state.empty.body')}
      action={<Button label={t('state.empty.action')} onPress={() => composerRef.current?.focus()} />}
    />
  ) : (
    <Skeleton title={t('state.loadingTitle')} label={t('state.loading')} />
  );

  const renderItem = ({ item, index }: { item: CommentThread; index: number }) => (
    <View style={styles.row}>
      {/* Only the row holding the fresh comment gets its id, so other memoised rows skip re-rendering. */}
      <ThreadItem
        thread={item}
        freshId={containsComment(item, freshId) ? freshId : null}
        last={index === threads.length - 1}
        onReply={openReply}
      />
    </View>
  );

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      data={threads}
      keyExtractor={(thread) => thread.comment.id}
      renderItem={renderItem}
      extraData={freshId}
      ListHeaderComponent={header}
      ListEmptyComponent={<View style={[styles.row, styles.emptyRow]}>{empty}</View>}
      ListFooterComponent={<View style={styles.sectionBottom} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      initialNumToRender={8}
      windowSize={7}
    />
  );
}

const containsComment = (thread: CommentThread, id: string | null) =>
  id !== null && (thread.comment.id === id || thread.replies.some((reply) => reply.id === id));

const styles = StyleSheet.create({
  padded: { padding: layout.screenPadding },
  content: { padding: layout.screenPadding },
  // The discussion reads as one card: header (top corners), rows (sides), footer (bottom corners).
  sectionTop: {
    marginTop: layout.cardGap,
    paddingTop: layout.cardPaddingV,
    paddingBottom: 15,
    paddingHorizontal: layout.cardPaddingH,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  composer: { marginTop: 14 },
  row: {
    paddingHorizontal: layout.cardPaddingH,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  emptyRow: { paddingTop: 1 },
  sectionBottom: {
    height: layout.cardPaddingV,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
});
