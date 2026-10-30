import type { PublishedRecord } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { StyleSheet, View } from 'react-native';
import { colors, common, fontWeight, radius, space } from '@/lib/theme';
import { AppText } from './AppText';

/** The published record (J-1). `source` exists only in English, so it keeps its own direction (I-3). */
export function RecordCard({ record, compact = false }: { record: PublishedRecord; compact?: boolean }) {
  const { t, locale, formatDate } = useI18n();
  return (
    <View style={[common.card, styles.card]}>
      <View style={styles.topline}>
        <AppText variant="meta" tone="muted" contentLanguage="en" style={styles.source}>
          {record.source.toUpperCase()}
        </AppText>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <AppText variant="meta" tone="accent" style={styles.badgeText}>
            {t('record.published')}
          </AppText>
        </View>
      </View>
      <AppText variant={compact ? 'heading' : 'title'} accessibilityRole="header">
        {record.title[locale]}
      </AppText>
      <AppText tone="muted" numberOfLines={compact ? 2 : undefined}>
        {record.summary[locale]}
      </AppText>
      <AppText variant="meta" tone="muted">
        {t('record.publishedOn', { date: formatDate(record.publishedAt) })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  source: { flexShrink: 1, fontWeight: fontWeight.semibold, letterSpacing: 0.4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  badgeText: { fontWeight: fontWeight.bold },
});
