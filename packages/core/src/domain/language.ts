import type { ContentLanguage, Direction, Locale } from './types';

// Strong RTL: Hebrew, Arabic, Syriac, Thaana, NKo, Arabic Supplement/Extended and presentation forms.
const STRONG_RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;
// Strong LTR: Latin, Greek, Cyrillic and CJK/Hangul letters. Explicit ranges rather than `\p{L}` because
// Unicode property escapes are not guaranteed in every Hermes build.
const STRONG_LTR = /[A-Za-z\u00C0-\u02AF\u0370-\u03FF\u0400-\u04FF\u1E00-\u1FFF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

/**
 * Detects the base direction of user-written text from its first strong character, the same rule
 * browsers apply for `dir="auto"` (I-3, assumption 7). Text without strong characters
 * (emoji, digits, punctuation) falls back to the UI locale.
 */
export function detectLanguage(text: string, fallback: Locale): ContentLanguage {
  for (const char of text) {
    if (STRONG_RTL.test(char)) return 'ar';
    if (STRONG_LTR.test(char)) return 'en';
  }
  return fallback;
}

export function directionOf(language: Locale): Direction {
  return language === 'ar' ? 'rtl' : 'ltr';
}
