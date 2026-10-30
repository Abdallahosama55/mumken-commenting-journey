import { useI18n } from '@commenting/core/react';
import { Stack } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { useLocaleState } from './locale';
import { colors } from './theme';

/** The app's native stack. Kept apart from the providers so tests can mount it with test services. */
export function AppStack() {
  const { t } = useI18n();
  const { dir } = useLocaleState();
  return (
    <Stack
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        contentStyle: { backgroundColor: colors.canvas, direction: dir },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('app.name') }} />
      <Stack.Screen name="records/[recordId]/index" options={{ title: t('nav.recordDiscussion') }} />
      <Stack.Screen name="records/[recordId]/reply/[commentId]" options={{ title: t('nav.reply') }} />
      <Stack.Screen name="settings" options={{ title: t('nav.settings'), presentation: 'modal' }} />
    </Stack>
  );
}
