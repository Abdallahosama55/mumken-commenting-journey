import { LOCALES, type LatencyProfile, type Locale, type SubmissionFailureMode } from '@commenting/core';
import { useI18n, useSimulation } from '@commenting/core/react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useLocaleState } from '@/lib/locale';
import { colors, common, layout, radius, touchTarget } from '@/lib/theme';

const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', ar: 'العربية' };
const LATENCIES: readonly LatencyProfile[] = ['instant', 'normal', 'slow'];
const FAILURE_MODES: readonly SubmissionFailureMode[] = ['off', 'once', 'always'];

/** Language (I-1, applied instantly) and the Reviewer tools (D-3), presented as an iOS modal sheet. */
export default function SettingsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { locale, setLocale } = useLocaleState();
  const simulation = useSimulation();

  return (
    <ScrollView style={common.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[common.card, styles.section]}>
        <AppText variant="stateTitle" accessibilityRole="header">
          {t('settings.language')}
        </AppText>
        <Segmented
          options={LOCALES.map((value) => ({ value, label: LANGUAGE_NAMES[value], language: value }))}
          value={locale}
          onChange={setLocale}
        />
      </View>

      {simulation ? (
        <View style={[common.card, styles.section]}>
          <AppText variant="stateTitle" accessibilityRole="header">
            {t('devtools.title')}
          </AppText>
          <AppText variant="summary" tone="muted">
            {t('devtools.description')}
          </AppText>

          <AppText variant="name">{t('devtools.latency')}</AppText>
          <Segmented
            options={LATENCIES.map((value) => ({ value, label: t(`devtools.latency.${value}`) }))}
            value={simulation.settings.latency}
            onChange={(latency) => simulation.update({ latency })}
          />

          <AppText variant="name">{t('devtools.failSubmissions')}</AppText>
          <Segmented
            options={FAILURE_MODES.map((value) => ({ value, label: t(`devtools.failSubmissions.${value}`) }))}
            value={simulation.settings.failSubmissions}
            onChange={(failSubmissions) => simulation.update({ failSubmissions })}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <AppText variant="name">{t('devtools.failDiscussionLoad')}</AppText>
              <AppText variant="small" tone="muted">
                {t('devtools.loadHint')}
              </AppText>
            </View>
            <Switch
              accessibilityLabel={t('devtools.failDiscussionLoad')}
              accessibilityHint={t('devtools.loadHint')}
              value={simulation.settings.failDiscussionLoad}
              onValueChange={(failDiscussionLoad) => simulation.update({ failDiscussionLoad })}
              trackColor={{ true: colors.ink }}
            />
          </View>

          <Button variant="secondary" label={t('devtools.reset')} onPress={simulation.reset} />
        </View>
      ) : null}
    </ScrollView>
  );
}

interface SegmentedProps<T extends string> {
  readonly options: readonly { value: T; label: string; language?: Locale }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

/** A segmented control with radio semantics, so VoiceOver reads "selected, 1 of 3". */
function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLanguage={option.language}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <AppText
              variant="name"
              tone={selected ? 'onInk' : 'default'}
              contentLanguage={option.language}
              style={styles.segmentLabel}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, gap: layout.cardGap },
  section: { gap: 12 },
  segmented: {
    flexDirection: 'row',
    padding: 2,
    gap: 2,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  segment: {
    flex: 1,
    minHeight: touchTarget - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
  segmentSelected: { backgroundColor: colors.ink },
  segmentLabel: { textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
});
