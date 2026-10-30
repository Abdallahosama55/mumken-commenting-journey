import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';
import { AppText } from './AppText';

interface StatePanelProps {
  readonly title: string;
  readonly body?: string;
  /** Error copy is red, as in the design's "Couldn't load discussion" card. */
  readonly tone?: 'neutral' | 'danger';
  readonly action?: ReactNode;
  readonly children?: ReactNode;
}

/** The design's state card (S-1…S-4): sunken surface, 1pt border, bold title, message, one action. */
export function StatePanel({ title, body, tone = 'neutral', action, children }: StatePanelProps) {
  const danger = tone === 'danger';
  return (
    <View style={styles.panel} accessibilityLiveRegion={danger ? 'polite' : 'none'}>
      <View accessible accessibilityRole={danger ? 'alert' : 'summary'}>
        <AppText variant="stateTitle">{title}</AppText>
        {body ? (
          <AppText tone={danger ? 'danger' : 'default'} style={styles.body}>
            {body}
          </AppText>
        ) : null}
      </View>
      {children}
      {action ? <View style={danger ? styles.actionAfterError : styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  body: { marginTop: 8 },
  action: { marginTop: 16 },
  actionAfterError: { marginTop: 12 },
});
