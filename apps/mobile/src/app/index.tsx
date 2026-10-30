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
import { common, space } from '@/lib/theme';

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
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      data={records.data ?? []}
      keyExtractor={(record) => record.id}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <View style={styles.intro}>
          <AppText variant="title" accessibilityRole="header">
            {t('records.title')}
          </AppText>
          <AppText tone="muted">{t('records.subtitle')}</AppText>
        </View>
      }
      ListEmptyComponent={
        records.isError ? (
          <StatePanel
            tone="danger"
            title={t('state.generic.title')}
            body={t('state.generic.body')}
            action={<Button variant="secondary" label={t('state.retry')} onPress={() => void records.refetch()} />}
          />
        ) : (
          <Skeleton label={t('state.loadingRecord')} rows={2} />
        )
      }
    />
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  content: { padding: space.lg },
  intro: { gap: space.xs, marginBottom: space.xl },
  separator: { height: space.md },
  pressed: { opacity: 0.85 },
});
