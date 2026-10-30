import { colors, radius, touchTarget } from '@commenting/core';
import { StyleSheet, type TextStyle } from 'react-native';

export { colors, radius, touchTarget };

/** Cairo per weight. React Native picks custom fonts by family name, so weight maps to a family. */
export const fonts = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
} as const;

/**
 * Type scale measured from the Expo frames in Figma (02 Discussion, 03 Reply, 04 Arabic RTL).
 * Sizes and weights were solved from the exported frames against Cairo's real glyph advances.
 */
export const type = StyleSheet.create({
  headerTitle: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
  stateTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  name: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  button: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  summary: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  avatar: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
}) satisfies Record<string, TextStyle>;

/** Screen and card spacing from the Expo frames: 18pt screen margins, cards padded 18 × 20. */
export const layout = {
  screenPadding: 18,
  cardPaddingV: 18,
  cardPaddingH: 20,
  cardGap: 18,
} as const;

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: layout.cardPaddingV,
    paddingHorizontal: layout.cardPaddingH,
  },
});
