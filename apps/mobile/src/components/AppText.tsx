import { directionOf, type ContentLanguage } from '@commenting/core';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useLocaleState } from '@/lib/locale';
import { colors, fontSize, fontWeight } from '@/lib/theme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'meta';
type Tone = 'default' | 'muted' | 'danger' | 'onInk' | 'accent';

interface AppTextProps extends TextProps {
  readonly variant?: Variant;
  readonly tone?: Tone;
  /**
   * Set for user content (I-3). The text is laid out in its own direction: React Native resolves
   * `start`/`end` against the Yoga layout direction on both platforms, so content that runs against the
   * UI direction aligns to `end`. `accessibilityLanguage` makes VoiceOver use the right voice (A-2).
   */
  readonly contentLanguage?: ContentLanguage;
}

export function AppText({ variant = 'body', tone = 'default', contentLanguage, style, ...props }: AppTextProps) {
  const { dir } = useLocaleState();
  const contentDir = contentLanguage ? directionOf(contentLanguage) : dir;
  return (
    <Text
      accessibilityLanguage={contentLanguage}
      {...props}
      style={[
        styles[variant],
        tones[tone],
        { textAlign: contentDir === dir ? 'start' : 'end', writingDirection: contentDir },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: 28 },
  heading: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, lineHeight: 24 },
  body: { fontSize: fontSize.md, lineHeight: 24 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, lineHeight: 20 },
  meta: { fontSize: fontSize.xs, lineHeight: 16 },
});

const tones = StyleSheet.create({
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  danger: { color: colors.danger },
  onInk: { color: colors.onInk },
  accent: { color: colors.accentInk },
});
