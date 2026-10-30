import Ionicons from '@expo/vector-icons/Ionicons';
import { detectLanguage, directionOf, type Comment, type Direction } from '@commenting/core';
import { useCommentComposer, useCommenting, useI18n } from '@commenting/core/react';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { notify } from '@/lib/feedback';
import { useLocaleState } from '@/lib/locale';
import { colors, fontSize, radius, space } from '@/lib/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface ComposerHandle {
  focus(): void;
}

interface ComposerProps {
  readonly recordId: string;
  readonly parentId?: string | null;
  readonly replyTo?: string;
  readonly autoFocus?: boolean;
  readonly onPosted?: (comment: Comment) => void;
  readonly ref?: Ref<ComposerHandle>;
}

/**
 * Mobile UI over the shared submission state machine. On failure the composer becomes the design's red
 * panel: the text stays in the field, editable, and the primary action becomes Retry (S-5).
 */
export function Composer({ recordId, parentId = null, replyTo = '', autoFocus = false, onPosted, ref }: ComposerProps) {
  const { t, locale } = useI18n();
  const { dir } = useLocaleState();
  const { repository } = useCommenting();
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const isReply = parentId !== null;
  const composer = useCommentComposer({
    recordId,
    parentId,
    onPosted: (comment) => {
      notify('success', isReply ? t('announce.replyPosted') : t('announce.commentPosted'));
      onPosted?.(comment);
    },
  });
  const submitting = composer.status === 'submitting';
  const failed = composer.status === 'failed' && composer.submitError !== null;

  const submit = async () => {
    const outcome = await composer.submit();
    if (outcome.status === 'failed') {
      notify('error', `${isReply ? t('submitError.replyTitle') : t('submitError.title')}. ${t('submitError.body')}`);
    } else if (outcome.status === 'invalid') {
      inputRef.current?.focus();
    }
  };

  const issue =
    composer.validationIssue === 'empty'
      ? t('validation.empty')
      : composer.validationIssue === 'too_long'
        ? t('validation.too_long', { max: composer.maxLength })
        : null;

  // Typed text follows its own direction; an empty field follows the UI (placeholder side).
  const textDir = composer.value.trim() ? directionOf(detectLanguage(composer.value, locale)) : dir;
  const label = isReply ? t('reply.replyingTo', { name: replyTo }) : t('composer.label');
  const submitLabel = failed ? t('composer.retry') : isReply ? t('reply.submit') : t('composer.submit');

  return (
    <View style={[styles.composer, failed && styles.failed]}>
      {failed ? (
        <View style={styles.alert} accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <View style={styles.alertText}>
            <AppText variant="label" tone="danger">
              {isReply ? t('submitError.replyTitle') : t('submitError.title')}
            </AppText>
            <AppText variant="label" style={styles.alertBody}>
              {composer.submitError?.retryable ? t('submitError.body') : t('submitError.rejected')}
            </AppText>
          </View>
        </View>
      ) : null}

      {isReply ? (
        <AppText variant="label" tone="muted" nativeID={`${recordId}-${parentId}-label`}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={inputRef}
        value={composer.value}
        onChangeText={composer.setValue}
        placeholder={isReply ? t('reply.placeholder') : t('composer.placeholder')}
        placeholderTextColor={colors.textMuted}
        multiline
        autoFocus={autoFocus}
        editable={!submitting}
        textAlignVertical="top"
        accessibilityLabel={label}
        accessibilityHint={issue ?? t('composer.postingAs', { name: repository.getCurrentUser().name })}
        accessibilityState={{ disabled: submitting }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          { textAlign: inputAlign(textDir, dir), writingDirection: textDir },
          focused && styles.inputFocused,
          issue && styles.inputInvalid,
          submitting && styles.inputBusy,
        ]}
      />

      <View style={styles.meta}>
        <AppText variant="meta" tone={issue ? 'danger' : 'muted'} style={styles.hint}>
          {issue ?? t('composer.postingAs', { name: repository.getCurrentUser().name })}
        </AppText>
        {composer.showCounter ? (
          <AppText variant="meta" tone={composer.remaining < 0 ? 'danger' : 'muted'}>
            {composer.remaining >= 0
              ? t('composer.remaining', { count: composer.remaining })
              : t('composer.overLimit', { count: -composer.remaining })}
          </AppText>
        ) : null}
      </View>

      <Button
        label={submitLabel}
        busy={submitting}
        busyLabel={t('composer.submitting')}
        fullWidth
        onPress={() => void submit()}
      />
    </View>
  );
}

/**
 * Aligns typed text to the start of its own direction, like `dir="auto"` on the web (I-3). iOS resolves
 * start/end against the layout direction (`RCTResolveTextAlignment` in React Native 0.88), so text that runs
 * against the UI direction needs `end`. Known gap: on the Android emulator (Expo Go) the TextInput's
 * alignment did not follow this prop reliably, whatever value was set; see DECISIONS § Limitations.
 */
function inputAlign(contentDir: Direction, layoutDir: Direction): 'start' | 'end' {
  return contentDir === layoutDir ? 'start' : 'end';
}

const styles = StyleSheet.create({
  composer: { gap: space.sm },
  failed: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  alert: { flexDirection: 'row', gap: space.sm },
  alertText: { flex: 1, gap: 2 },
  alertBody: { fontWeight: '400' },
  input: {
    minHeight: 96,
    maxHeight: 220,
    padding: space.md,
    paddingTop: space.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  inputFocused: { borderColor: colors.focus, borderWidth: 2, padding: space.md - 1 },
  inputInvalid: { borderColor: colors.danger },
  inputBusy: { backgroundColor: colors.surfaceSunken },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  hint: { flex: 1 },
});
