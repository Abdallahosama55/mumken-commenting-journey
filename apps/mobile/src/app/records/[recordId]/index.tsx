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
import { colors, common, radius, space } from '@/lib/theme';

/**
 * Record + discussion (J-1). A virtualised `FlatList` of threads; its header holds the record and the
 * composer (design frame 02). States: record loading / unavailable (S-2) / failed, then discussion
 * loading (S-1) / failed (S-4) / empty (S-3) / threads.
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
    (commentId: string) =>
      router.push({ pathname: '/records/[recordId]/reply/[commentId]', params: { recordId, commentId } }),
    [recordId],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([discussion.refetch(), record.isError ? record.refetch() : null]);
    setRefreshing(false);
  };

  if (record.isPending) {
    return (
      <View style={[common.screen, styles.padded]}>
        <Skeleton label={t('state.loadingRecord')} rows={4} />
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
            body={t('state.generic.body')}
            action={<Button variant="secondary" label={t('state.retry')} onPress={() => void record.refetch()} />}
          />
        )}
      </View>
    );
  }

  const { data, isError } = discussion;

  const header = (
    <View>
      <RecordCard record={record.data} />
      <View style={styles.sectionTop}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading" accessibilityRole="header">
            {t('discussion.title')}
          </AppText>
          {data ? (
            <AppText variant="label" tone="muted">
              {t('discussion.count', { count: data.total })}
            </AppText>
          ) : null}
        </View>
        {data || !isError ? (
          <Composer ref={composerRef} recordId={recordId} onPosted={(comment: Comment) => setFreshId(comment.id)} />
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
      action={<Button variant="secondary" label={t('state.empty.action')} onPress={() => composerRef.current?.focus()} />}
    />
  ) : (
    <Skeleton label={t('state.loading')} />
  );

  const renderItem = ({ item }: { item: CommentThread }) => (
    <View style={styles.row}>
      <ThreadItem thread={item} freshId={freshId} onReply={openReply} />
    </View>
  );

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      data={data?.threads ?? []}
      keyExtractor={(thread) => thread.comment.id}
      renderItem={renderItem}
      extraData={freshId}
      ListHeaderComponent={header}
      ListEmptyComponent={<View style={styles.row}>{empty}</View>}
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

const styles = StyleSheet.create({
  padded: { padding: space.lg },
  content: { padding: space.lg },
  // The discussion reads as one card: header (top corners), rows (sides), footer (bottom corners).
  sectionTop: {
    marginTop: space.lg,
    padding: space.lg,
    paddingBottom: space.lg,
    gap: space.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
  row: { paddingHorizontal: space.lg, backgroundColor: colors.surface },
  sectionBottom: {
    height: space.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
});
