import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

/** Success / failure feedback: a VoiceOver announcement (A-2) plus the iOS notification haptic (P-2). */
export function notify(kind: 'success' | 'error', message?: string) {
  if (message) AccessibilityInfo.announceForAccessibility(message);
  void Haptics.notificationAsync(
    kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {
    // Haptics are best-effort (simulators, low-power mode).
  });
}
