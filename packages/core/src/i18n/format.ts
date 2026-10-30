import type { Locale } from '../domain/types';

/** Western digits in both languages — assumption 6 in the requirements. Change here to use Arabic-Indic. */
export const NUMBERING_SYSTEM = 'latn';

const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', ar: 'ar' };

const MONTHS: Record<Locale, readonly string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  // Gregorian month names as used in Saudi Arabia and Egypt.
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export interface Formatters {
  /** "24 October 2026" / "24 أكتوبر 2026" — always Gregorian (I-4). */
  formatDate(iso: string): string;
  /** Date plus 24-hour time ("24 October 2026, 09:15"), for tooltips and accessibility labels. */
  formatDateTime(iso: string): string;
  formatNumber(value: number): string;
}

export interface FormatterOptions {
  /** Forces the manual fallback; used by tests to cover engines without full `Intl` support. */
  readonly forceFallback?: boolean;
}

/**
 * Uses `Intl` when the engine honours the requested calendar and digits, otherwise a small manual formatter.
 * This matters on two fronts: `ar-SA` defaults to the Hijri calendar, and Hermes' `Intl` coverage differs
 * between iOS and Android. Both paths yield the same text (asserted in tests), so web and mobile never
 * disagree. The time part is composed manually because engines join date and time differently ("at" vs ",").
 */
export function createFormatters(locale: Locale, options: FormatterOptions = {}): Formatters {
  const date = options.forceFallback ? undefined : tryDateFormat(locale);
  const number = options.forceFallback ? undefined : tryNumberFormat(locale);

  const manualDate = (value: Date) => `${value.getDate()} ${MONTHS[locale][value.getMonth()]} ${value.getFullYear()}`;
  const formatDate = (iso: string) => {
    const value = new Date(iso);
    return date ? date.format(value) : manualDate(value);
  };
  const pad = (n: number) => String(n).padStart(2, '0');
  const separator = locale === 'ar' ? '، ' : ', ';

  return {
    formatDate,
    formatDateTime: (iso) => {
      const value = new Date(iso);
      return `${formatDate(iso)}${separator}${pad(value.getHours())}:${pad(value.getMinutes())}`;
    },
    formatNumber: (value) => (number ? number.format(value) : String(value)),
  };
}

function tryDateFormat(locale: Locale): Intl.DateTimeFormat | undefined {
  try {
    const format = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      calendar: 'gregory',
      numberingSystem: NUMBERING_SYSTEM,
    });
    const resolved = format.resolvedOptions();
    return resolved.calendar === 'gregory' && resolved.numberingSystem === NUMBERING_SYSTEM ? format : undefined;
  } catch {
    return undefined;
  }
}

function tryNumberFormat(locale: Locale): Intl.NumberFormat | undefined {
  try {
    const format = new Intl.NumberFormat(INTL_LOCALE[locale], { numberingSystem: NUMBERING_SYSTEM });
    return format.resolvedOptions().numberingSystem === NUMBERING_SYSTEM ? format : undefined;
  } catch {
    return undefined;
  }
}
