import type { Locale } from '../domain/types';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * CLDR cardinal plural rules for the supported locales (I-4), for integers.
 * Implemented rather than delegated to `Intl.PluralRules` because Hermes does not ship it on every target,
 * and the web and mobile apps must produce identical strings.
 *
 * Arabic: 0 → zero · 1 → one · 2 → two · n%100 ∈ 3..10 → few · n%100 ∈ 11..99 → many · else other.
 */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  const n = Math.abs(Math.trunc(count));
  if (locale === 'ar') {
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    const mod100 = n % 100;
    if (mod100 >= 3 && mod100 <= 10) return 'few';
    if (mod100 >= 11 && mod100 <= 99) return 'many';
    return 'other';
  }
  return n === 1 ? 'one' : 'other';
}
