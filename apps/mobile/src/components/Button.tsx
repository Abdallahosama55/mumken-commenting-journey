import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { colors, radius, touchTarget } from '@/lib/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'link';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly label: string;
  readonly variant?: Variant;
  /** In flight: shows progress, ignores presses, announces "busy" (S-6). */
  readonly busy?: boolean;
  readonly busyLabel?: string;
  readonly fullWidth?: boolean;
}

/**
 * Buttons from the design: 44pt dark primary (radius 6), white outlined secondary, and the small grey text
 * action ("Reply") whose hit area is enlarged with `hitSlop` rather than padding, so it keeps its place.
 */
export function Button({
  label,
  variant = 'primary',
  busy = false,
  busyLabel,
  fullWidth = false,
  disabled,
  onPress,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const text = busy && busyLabel ? busyLabel : label;

  if (variant === 'link') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? text}
        onPress={onPress}
        hitSlop={{ top: 13, bottom: 13, left: 8, right: 8 }}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        {...props}
      >
        <AppText variant="small" tone="muted">
          {text}
        </AppText>
      </Pressable>
    );
  }

  const foreground = variant === 'primary' ? colors.onInk : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ disabled: Boolean(disabled), busy }}
      disabled={disabled}
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !busy && pressedStyles[variant],
        disabled && styles.disabled,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {busy ? <ActivityIndicator size="small" color={foreground} /> : null}
        <AppText variant="button" style={{ color: foreground }} numberOfLines={1}>
          {text}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    minWidth: 120,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: 21,
  },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderField },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  link: { alignSelf: 'flex-start' },
  linkPressed: { opacity: 0.6 },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.inkPressed },
  secondary: { backgroundColor: colors.surfaceSunken },
});
