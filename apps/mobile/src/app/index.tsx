import type { PublishedRecord } from '@commenting/core';
import { useI18n, useRecords } from '@commenting/core/react';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { RecordCard } from '@/components/RecordCard';
import { Skeleton } from '@/components/Skeleton';
import { StatePanel } from '@/components/StatePanel';
import { common, layout } from '@/lib/theme';

/** Record list (J-4). */
export default function RecordsScreen() {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const records = useRecords();

  const renderItem = ({ item }: { item: PublishedRecord }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title[locale]}
      accessibilityHint={t('records.open')}
      onPress={() => router.push({ pathname: '/records/[recordId]', params: { recordId: item.id } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <RecordCard record={item} compact />
    </Pressable>
  );

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      data={records.data ?? []}
      keyExtractor={(record) => record.id}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <View style={styles.intro}>
          <AppText variant="title" accessibilityRole="header">
            {t('records.title')}
          </AppText>
          <AppText variant="summary" tone="muted">
            {t('records.subtitle')}
          </AppText>
        </View>
      }
      ListEmptyComponent={
        records.data ? (
          <StatePanel title={t('records.empty')} />
        ) : records.isError ? (
          <StatePanel
            tone="danger"
            title={t('state.generic.title')}
            body={t('state.generic.body')}
            action={<Button variant="secondary" label={t('state.retry')} onPress={() => void records.refetch()} />}
          />
        ) : (
          <Skeleton title={t('state.loadingTitle')} label={t('state.loadingRecord')} />
        )
      }
    />
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding },
  intro: { gap: 4, marginBottom: layout.cardGap },
  separator: { height: layout.cardGap },
  pressed: { opacity: 0.85 },
});
