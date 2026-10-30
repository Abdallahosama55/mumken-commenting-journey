import { directionOf, type ContentLanguage } from '@commenting/core';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import type { ReactNode } from 'react';
import { useLocaleState } from '@/lib/locale';
import { colors, type } from '@/lib/theme';

type Variant = keyof typeof type;
type Tone = 'default' | 'muted' | 'danger' | 'onInk';

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

export function AppText({ variant = 'body', tone = 'default', contentLanguage, style, children, ...props }: AppTextProps) {
  const { dir } = useLocaleState();
  const contentDir = contentLanguage ? directionOf(contentLanguage) : dir;
  return (
    <Text
      accessibilityLanguage={contentLanguage}
      {...props}
      style={[
        type[variant],
        tones[tone],
        { textAlign: contentDir === dir ? 'start' : 'end', writingDirection: contentDir },
        style,
      ]}
    >
      {contentDir === 'rtl' ? embedRtl(children) : children}
    </Text>
  );
}

/**
 * Android lays out every paragraph with the native (LTR) base direction and ignores `writingDirection`, so
 * a mixed line such as "منشور · record-001" would come out in LTR run order. An explicit right-to-left
 * embedding (RLE … PDF) fixes the order without affecting iOS, which already honours `writingDirection`.
 */
function embedRtl(children: ReactNode): ReactNode {
  if (Platform.OS !== 'android') return children;
  const parts = Array.isArray(children) ? children : [children];
  if (!parts.every((part) => typeof part === 'string' || typeof part === 'number')) return children;
  return `\u202B${parts.join('')}\u202C`;
}

const tones = StyleSheet.create({
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  danger: { color: colors.danger },
  onInk: { color: colors.onInk },
});
