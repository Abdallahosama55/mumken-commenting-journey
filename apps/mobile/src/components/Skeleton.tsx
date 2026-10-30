import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';
import { AppText } from './AppText';

/**
 * The design's loading card: title, two text bars and a block (S-1). Pulses unless the user prefers
 * reduced motion (A-4). The container carries the spoken label; the shapes are hidden from assistive tech.
 */
export function Skeleton({ title, label }: { title: string; label: string }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <View
      style={styles.panel}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      testID="skeleton"
    >
      <AppText variant="stateTitle" importantForAccessibility="no">
        {title}
      </AppText>
      <Animated.View style={{ opacity }} importantForAccessibility="no-hide-descendants">
        <View style={styles.bar} />
        <View style={[styles.bar, styles.barShort]} />
        <View style={styles.block} />
      </Animated.View>
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
  bar: { height: 14, marginTop: 16, borderRadius: 7, backgroundColor: colors.skeleton },
  barShort: { width: '81%' },
  block: { width: '93%', height: 62, marginTop: 16, borderRadius: radius.md, backgroundColor: colors.skeleton },
});
