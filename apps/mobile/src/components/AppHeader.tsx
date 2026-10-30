import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '@commenting/core/react';
import { router, type NativeStackHeaderProps } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocaleState } from '@/lib/locale';
import { colors } from '@/lib/theme';
import { AppText } from './AppText';

/**
 * The design's dark bar, rendered through the native stack so the system back gesture and transitions
 * stay native (P-2). Geometry from the Expo frames: a 48pt row under the status bar with the title sitting
 * 5pt above centre, back chevron centred 20.5pt from the edge, title 16pt after it.
 * Only the record list carries the settings action — the designed screens have none.
 */
export function AppHeader({ navigation, options, back, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { dir, isRTL } = useLocaleState();
  const title = typeof options.title === 'string' ? options.title : route.name;
  const isModal = route.name === 'settings';
  const showBack = Boolean(back) && !isModal;

  return (
    <View style={[styles.bar, { paddingTop: insets.top, direction: dir }]}>
      <View style={[styles.row, !showBack && styles.rowNoBack]}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.back')}
            onPress={navigation.goBack}
            hitSlop={{ top: 10, bottom: 10 }}
            style={styles.back}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={colors.onInk}
              style={isRTL ? styles.mirrored : undefined}
            />
          </Pressable>
        ) : null}
        <AppText variant="headerTitle" tone="onInk" accessibilityRole="header" numberOfLines={1} style={[styles.title, showBack && styles.titleAfterBack]}>
          {title}
        </AppText>
        {isModal ? (
          <Pressable accessibilityRole="button" onPress={navigation.goBack} hitSlop={10} style={styles.action}>
            <AppText variant="button" tone="onInk">
              {t('settings.done')}
            </AppText>
          </Pressable>
        ) : route.name === 'index' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.settings')}
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={styles.action}
          >
            <Ionicons name="options-outline" size={22} color={colors.onInk} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', height: 48, paddingBottom: 10 },
  rowNoBack: { paddingStart: 20 },
  back: { width: 41, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  titleAfterBack: { marginStart: 16 },
  action: { minWidth: 44, height: 38, alignItems: 'center', justifyContent: 'center', marginEnd: 8 },
  mirrored: { transform: [{ scaleX: -1 }] },
});
