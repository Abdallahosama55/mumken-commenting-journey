import { LOCALES, type Direction, type Locale } from '../domain/types';
import { directionOf } from '../domain/language';
import { createFormatters, type FormatterOptions, type Formatters } from './format';
import { ar } from './messages/ar';
import { en } from './messages/en';
import { createTranslator, type Messages, type Translate } from './translate';

export const DEFAULT_LOCALE: Locale = 'en';

export const dictionaries: Readonly<Record<Locale, Messages>> = { en, ar };

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'ar' : 'en');

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Older than this, a timestamp reads better as a date than as "23 days ago". */
const RELATIVE_LIMIT = 7 * DAY;

export interface I18n extends Formatters {
  readonly locale: Locale;
  readonly dir: Direction;
  readonly t: Translate;
  /** "just now" · "5 minutes ago" · "منذ يومين" · falls back to the date after a week (I-4). */
  formatRelativeTime(iso: string, now: number): string;
}

export function createI18n(locale: Locale, options?: FormatterOptions): I18n {
  const formatters = createFormatters(locale, options);
  const t = createTranslator(locale, dictionaries[locale], formatters.formatNumber);

  return {
    locale,
    dir: directionOf(locale),
    t,
    ...formatters,
    formatRelativeTime(iso, now) {
      // Clamp future timestamps (clock skew between devices) to "just now".
      const elapsed = Math.max(0, now - Date.parse(iso));
      if (elapsed < MINUTE) return t('time.justNow');
      if (elapsed < HOUR) return t('time.minutes', { count: Math.floor(elapsed / MINUTE) });
      if (elapsed < DAY) return t('time.hours', { count: Math.floor(elapsed / HOUR) });
      if (elapsed < RELATIVE_LIMIT) return t('time.days', { count: Math.floor(elapsed / DAY) });
      return formatters.formatDate(iso);
    },
  };
}

/**
 * Picks the best supported locale from an `Accept-Language` header or a device locale list (I-1).
 * Only the primary language subtag matters: `ar-EG` and `ar-SA` both map to `ar`.
 */
export function negotiateLocale(preferences: string | readonly string[] | null | undefined): Locale {
  const tags =
    typeof preferences === 'string'
      ? preferences
          .split(',')
          .map((part) => {
            const [tag = '', ...params] = part.trim().split(';');
            const q = params.find((p) => p.trim().startsWith('q='));
            return { tag, q: q ? Number(q.trim().slice(2)) : 1 };
          })
          .filter((entry) => entry.tag && !Number.isNaN(entry.q) && entry.q > 0)
          .sort((a, b) => b.q - a.q)
          .map((entry) => entry.tag)
      : (preferences ?? []);

  for (const tag of tags) {
    const language = tag.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

export type { Formatters } from './format';
export type { Message, MessageKey, MessageParams, Messages, PluralMessage, Translate } from './translate';
export { pluralCategory, type PluralCategory } from './plural';
export { placeholdersOf } from './translate';
export { NUMBERING_SYSTEM } from './format';
