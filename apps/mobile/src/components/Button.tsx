import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useLocaleState } from '@/lib/locale';
import { colors, fontWeight, radius, space, touchTarget } from '@/lib/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'link';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly label: string;
  readonly variant?: Variant;
  /** In flight: shows progress, ignores presses, announces "busy" (S-6). */
  readonly busy?: boolean;
  readonly busyLabel?: string;
  readonly icon?: ComponentProps<typeof Ionicons>['name'];
  /** Mirror the icon in RTL (back arrows, reply arrows). */
  readonly iconDirectional?: boolean;
  readonly fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  busy = false,
  busyLabel,
  icon,
  iconDirectional = false,
  fullWidth = false,
  disabled,
  onPress,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const { isRTL } = useLocaleState();
  const foreground = variant === 'primary' ? colors.onInk : variant === 'link' ? colors.textMuted : colors.text;
  const text = busy && busyLabel ? busyLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ disabled: Boolean(disabled), busy }}
      disabled={disabled}
      onPress={busy ? undefined : onPress}
      hitSlop={variant === 'link' ? 8 : undefined}
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
        {busy ? (
          <ActivityIndicator size="small" color={foreground} />
        ) : icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={foreground}
            style={iconDirectional && isRTL ? styles.mirrored : undefined}
          />
        ) : null}
        <AppText variant="label" style={[styles.label, { color: foreground }]} numberOfLines={1}>
          {text}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
  },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  link: { minHeight: 32, paddingHorizontal: space.xs, alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  label: { fontWeight: fontWeight.semibold },
  mirrored: { transform: [{ scaleX: -1 }] },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.inkPressed },
  secondary: { backgroundColor: colors.surfaceSunken },
  link: { opacity: 0.6 },
});
