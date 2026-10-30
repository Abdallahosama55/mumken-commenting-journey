import type { Locale } from '../domain/types';

/** Digits per locale, as in the design (Arabic frame: "قبل ١٢ دقيقة") — assumption 6 in the requirements. */
export const NUMBERING_SYSTEM: Record<Locale, 'latn' | 'arab'> = { en: 'latn', ar: 'arab' };

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
/** Manual fallback for engines whose Intl ignores `numberingSystem`. */
const localiseDigits = (text: string, locale: Locale) =>
  NUMBERING_SYSTEM[locale] === 'arab' ? text.replace(/[0-9]/g, (digit) => ARABIC_INDIC[Number(digit)]!) : text;

/**
 * Dates are shown in Saudi time (assumption 9), so a date prerendered on a build server and a timestamp
 * rendered on a phone always agree, wherever either runs. Riyadh has no DST, so the fallback is a fixed offset.
 */
export const DISPLAY_TIME_ZONE = 'Asia/Riyadh';
const DISPLAY_OFFSET_MS = 3 * 60 * 60 * 1000;

const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', ar: 'ar' };

const MONTHS: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  // Gregorian month names as used in Saudi Arabia and Egypt.
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export interface Formatters {
  /** "24 Oct 2026" / "٢٤ أكتوبر ٢٠٢٦" — always Gregorian (I-4), short month as in the design. */
  formatDate(iso: string): string;
  /** Date plus 24-hour time ("24 Oct 2026, 09:15"), for tooltips and accessibility labels. */
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

  // The UTC fields of a shifted date are the wall-clock fields in the display time zone.
  const inDisplayZone = (iso: string) => new Date(Date.parse(iso) + DISPLAY_OFFSET_MS);
  const manualDate = (value: Date) =>
    localiseDigits(`${value.getUTCDate()} ${MONTHS[locale][value.getUTCMonth()]} ${value.getUTCFullYear()}`, locale);
  const formatDate = (iso: string) => (date ? date.format(new Date(iso)) : manualDate(inDisplayZone(iso)));
  const pad = (n: number) => String(n).padStart(2, '0');
  const separator = locale === 'ar' ? '، ' : ', ';

  return {
    formatDate,
    formatDateTime: (iso) => {
      const value = inDisplayZone(iso);
      return `${formatDate(iso)}${separator}${localiseDigits(`${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`, locale)}`;
    },
    formatNumber: (value) => (number ? number.format(value) : localiseDigits(String(value), locale)),
  };
}

function tryDateFormat(locale: Locale): Intl.DateTimeFormat | undefined {
  try {
    const format = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      calendar: 'gregory',
      numberingSystem: NUMBERING_SYSTEM[locale],
      timeZone: DISPLAY_TIME_ZONE,
    });
    const resolved = format.resolvedOptions();
    const honoured =
      resolved.calendar === 'gregory' &&
      resolved.numberingSystem === NUMBERING_SYSTEM[locale] &&
      resolved.timeZone === DISPLAY_TIME_ZONE;
    return honoured ? format : undefined;
  } catch {
    return undefined;
  }
}

function tryNumberFormat(locale: Locale): Intl.NumberFormat | undefined {
  try {
    const format = new Intl.NumberFormat(INTL_LOCALE[locale], { numberingSystem: NUMBERING_SYSTEM[locale] });
    return format.resolvedOptions().numberingSystem === NUMBERING_SYSTEM[locale] ? format : undefined;
  } catch {
    return undefined;
  }
}
