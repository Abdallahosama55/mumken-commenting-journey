import { useI18n } from '@commenting/core/react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { StatePanel } from '@/components/StatePanel';
import { common, layout } from '@/lib/theme';

/** Unknown deep links land here instead of a blank screen. */
export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <View style={[common.screen, styles.padded]}>
      <StatePanel
        title={t('state.pageNotFound.title')}
        body={t('state.pageNotFound.body')}
        action={<Button label={t('state.unavailable.action')} onPress={() => router.dismissTo('/')} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({ padded: { padding: layout.screenPadding } });
