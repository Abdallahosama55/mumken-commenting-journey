import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/lib/theme';
import { AppText } from './AppText';

interface StatePanelProps {
  readonly tone?: 'neutral' | 'danger';
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
}

/** Empty, unavailable and error states (S-2, S-3, S-4), matching the design's state cards. */
export function StatePanel({ tone = 'neutral', title, body, action }: StatePanelProps) {
  const danger = tone === 'danger';
  return (
    <View style={[styles.panel, danger && styles.danger]} accessibilityLiveRegion={danger ? 'polite' : 'none'}>
      <View style={styles.row} accessible accessibilityRole={danger ? 'alert' : 'summary'}>
        <Ionicons
          name={danger ? 'alert-circle-outline' : 'chatbubble-ellipses-outline'}
          size={22}
          color={danger ? colors.danger : colors.textMuted}
        />
        <View style={styles.text}>
          <AppText variant="label" tone={danger ? 'danger' : 'default'} style={styles.title}>
            {title}
          </AppText>
          <AppText variant="label" tone="muted" style={styles.body}>
            {body}
          </AppText>
        </View>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  danger: { borderStyle: 'solid', borderColor: colors.dangerBorder, backgroundColor: colors.dangerSoft },
  row: { flexDirection: 'row', gap: space.md },
  text: { flex: 1, gap: space.xs },
  title: { fontSize: 16 },
  body: { fontWeight: '400' },
  action: { alignItems: 'flex-start' },
});
