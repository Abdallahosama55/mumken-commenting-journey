import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/lib/theme';

/**
 * Placeholder rows shaped like comments (S-1). Pulses unless the user prefers reduced motion (A-4).
 * The container carries the spoken label; the shapes are hidden from assistive tech.
 */
export function Skeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
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
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} testID="skeleton">
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View key={index} style={[styles.row, { opacity }]} importantForAccessibility="no-hide-descendants">
          <View style={styles.avatar} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '35%' }]} />
            <View style={[styles.line, { width: '90%' }]} />
            <View style={[styles.line, { width: index === 1 ? '55%' : '70%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.lg },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.skeleton },
  lines: { flex: 1, gap: space.sm },
  line: { height: 12, borderRadius: radius.sm, backgroundColor: colors.skeleton },
});
