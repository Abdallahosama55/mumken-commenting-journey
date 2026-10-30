import { detectLanguage, directionOf, type Comment, type Direction } from '@commenting/core';
import { useCommentComposer, useI18n } from '@commenting/core/react';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { notify } from '@/lib/feedback';
import { useLocaleState } from '@/lib/locale';
import { colors, fonts, radius } from '@/lib/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface ComposerHandle {
  focus(): void;
}

interface ComposerProps {
  readonly recordId: string;
  readonly parentId?: string | null;
  /** First name shown in "Replying to …". */
  readonly replyTo?: string;
  readonly autoFocus?: boolean;
  readonly onPosted?: (comment: Comment) => void;
  readonly ref?: Ref<ComposerHandle>;
}

/**
 * Mobile UI over the shared submission state machine, per the Expo frames: an 84pt field, then a full-width
 * 44pt button (15pt below on the discussion screen, 12pt on the reply screen). On failure it becomes the
 * design's red panel: title, "Draft preserved", message, the kept text, Retry (S-5).
 */
export function Composer({ recordId, parentId = null, replyTo = '', autoFocus = false, onPosted, ref }: ComposerProps) {
  const { t, locale } = useI18n();
  const { dir } = useLocaleState();
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
      const title = isReply ? t('submitError.replyTitle') : t('submitError.title');
      notify('error', `${title}. ${outcome.error.retryable ? t('submitError.body') : t('submitError.rejected')}`);
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
    <View style={failed && styles.failed}>
      {failed ? (
        <View accessible accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.alert}>
          <View style={styles.alertHead}>
            <AppText variant="stateTitle" tone="danger" style={styles.alertTitle}>
              {isReply ? t('submitError.replyTitle') : t('submitError.title')}
            </AppText>
            <AppText variant="small" tone="danger">
              {t('submitError.draftPreserved')}
            </AppText>
          </View>
          <AppText variant="summary" style={styles.alertBody}>
            {composer.submitError?.retryable ? t('submitError.body') : t('submitError.rejected')}
          </AppText>
        </View>
      ) : null}

      {isReply ? (
        <AppText variant="meta" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={inputRef}
        value={composer.value}
        onChangeText={composer.setValue}
        placeholder={isReply ? t('reply.placeholder') : t('composer.placeholder')}
        placeholderTextColor={colors.text}
        multiline
        autoFocus={autoFocus}
        editable={!submitting}
        textAlignVertical="top"
        accessibilityLabel={label}
        accessibilityHint={issue ?? t('composer.hint')}
        accessibilityState={{ disabled: submitting }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          { textAlign: inputAlign(textDir, dir), writingDirection: textDir },
          focused && styles.inputFocused,
          (issue || failed) && styles.inputInvalid,
          submitting && styles.inputBusy,
        ]}
      />

      {issue || composer.showCounter ? (
        <View style={styles.meta}>
          {issue ? (
            <AppText variant="small" tone="danger" style={styles.hint}>
              {issue}
            </AppText>
          ) : (
            <View style={styles.hint} />
          )}
          {composer.showCounter ? (
            <AppText variant="small" tone={composer.remaining < 0 ? 'danger' : 'muted'}>
              {composer.remaining >= 0
                ? t('composer.remaining', { count: composer.remaining })
                : t('composer.overLimit', { count: -composer.remaining })}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={isReply || failed ? styles.buttonAfterReply : styles.buttonAfterComment}>
        <Button
          label={submitLabel}
          busy={submitting}
          busyLabel={t('composer.submitting')}
          fullWidth
          onPress={() => void submit()}
        />
      </View>
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
  failed: {
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  alert: { marginBottom: 14 },
  alertHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  alertTitle: { flexShrink: 1 },
  alertBody: { marginTop: 12 },
  label: { marginBottom: 12 },
  input: {
    minHeight: 84,
    maxHeight: 220,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderField,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  inputFocused: { borderColor: colors.focus },
  inputInvalid: { borderColor: colors.danger },
  inputBusy: { backgroundColor: colors.surfaceSunken },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  hint: { flex: 1 },
  buttonAfterComment: { marginTop: 15 },
  buttonAfterReply: { marginTop: 12 },
});
