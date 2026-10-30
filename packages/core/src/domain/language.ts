import type { ContentLanguage, Direction, Locale } from './types';

// Arabic script: Arabic, Supplement, Extended-A and presentation forms. Other RTL scripts (Hebrew, …) are
// outside the two supported content languages and fall through to the next strong character / fallback.
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/;
// Strong LTR: Latin (excluding × and ÷), Greek, Cyrillic and CJK/Hangul letters. Explicit ranges rather
// than `\p{L}` because Unicode property escapes are not guaranteed in every Hermes build.
const STRONG_LTR = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u0370-\u03FF\u0400-\u04FF\u1E00-\u1FFF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

/**
 * Detects the base direction of user-written text from its first strong character, the same rule
 * browsers apply for `dir="auto"` (I-3, assumption 7). Text without strong characters
 * (emoji, digits, punctuation) falls back to the UI locale.
 */
export function detectLanguage(text: string, fallback: Locale): ContentLanguage {
  for (const char of text) {
    if (ARABIC.test(char)) return 'ar';
    if (STRONG_LTR.test(char)) return 'en';
  }
  return fallback;
}

export function directionOf(language: Locale): Direction {
  return language === 'ar' ? 'rtl' : 'ltr';
}
