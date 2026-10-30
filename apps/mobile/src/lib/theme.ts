import { colors, fontSize, fontWeight, radius, space, touchTarget } from '@commenting/core';
import { StyleSheet } from 'react-native';

export { colors, fontSize, fontWeight, radius, space, touchTarget };

/** Shared building blocks; component-specific styles live next to their component. */
export const common = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
