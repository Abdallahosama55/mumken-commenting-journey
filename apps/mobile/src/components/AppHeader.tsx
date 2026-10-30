import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '@commenting/core/react';
import { router, type NativeStackHeaderProps } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocaleState } from '@/lib/locale';
import { colors, space, touchTarget } from '@/lib/theme';
import { AppText } from './AppText';

/**
 * The design's dark bar, rendered through the native stack so the system back gesture and transitions
 * stay native (P-2). Back and settings are ≥ 44 pt targets with labels for VoiceOver.
 */
export function AppHeader({ navigation, options, back, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { dir, isRTL } = useLocaleState();
  const title = typeof options.title === 'string' ? options.title : route.name;
  const isModal = route.name === 'settings';

  return (
    <View style={[styles.bar, { paddingTop: insets.top, direction: dir }]}>
      <View style={styles.row}>
        {back && !isModal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.back')}
            onPress={navigation.goBack}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.onInk}
              style={isRTL ? styles.mirrored : undefined}
            />
          </Pressable>
        ) : null}
        <AppText variant="heading" tone="onInk" accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        {isModal ? (
          <Pressable accessibilityRole="button" onPress={navigation.goBack} hitSlop={8} style={styles.textButton}>
            <AppText variant="label" tone="onInk">
              {t('settings.done')}
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.settings')}
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons name="options-outline" size={22} color={colors.onInk} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: space.sm,
    gap: space.xs,
  },
  title: { flex: 1, paddingHorizontal: space.sm },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  textButton: { minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: space.md },
  mirrored: { transform: [{ scaleX: -1 }] },
});
