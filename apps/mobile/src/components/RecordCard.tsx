import type { PublishedRecord } from '@commenting/core';
import { useI18n } from '@commenting/core/react';
import { StyleSheet, View } from 'react-native';
import { common } from '@/lib/theme';
import { AppText } from './AppText';

/**
 * The published record (J-1), per the Expo frame: "<reference> · <status>", title, summary.
 * `compact` (record list) also shows the source and date, which the discussion screen omits as in the design.
 */
export function RecordCard({ record, compact = false }: { record: PublishedRecord; compact?: boolean }) {
  const { t, locale, formatDate } = useI18n();
  return (
    <View style={common.card}>
      <AppText variant="meta" tone="muted">
        {t('record.metaLine', { reference: `\u2068${record.id}\u2069`, status: t('record.published') })}
      </AppText>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {record.title[locale]}
      </AppText>
      <AppText variant="summary" tone="muted" numberOfLines={compact ? 2 : undefined} style={styles.summary}>
        {record.summary[locale]}
      </AppText>
      {compact ? (
        <AppText variant="small" tone="muted" style={styles.summary}>
          {t('record.sourceLine', { source: `\u2068${record.source}\u2069`, date: formatDate(record.publishedAt) })}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8 },
  summary: { marginTop: 8 },
});
