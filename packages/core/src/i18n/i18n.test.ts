import { describe, expect, it } from 'vitest';
import { createI18n, dictionaries, negotiateLocale, placeholdersOf, pluralCategory, type MessageKey } from '.';
import { createFormatters } from './format';

describe('pluralCategory (I-4)', () => {
  it.each([
    [0, 'zero'],
    [1, 'one'],
    [2, 'two'],
    [3, 'few'],
    [10, 'few'],
    [11, 'many'],
    [99, 'many'],
    [100, 'other'],
    [101, 'other'],
    [102, 'other'],
    [103, 'few'],
    [111, 'many'],
    [1000, 'other'],
  ] as const)('Arabic %i → %s', (count, category) => {
    expect(pluralCategory('ar', count)).toBe(category);
  });

  it('English has one and other', () => {
    expect(pluralCategory('en', 1)).toBe('one');
    expect([0, 2, 5].map((n) => pluralCategory('en', n))).toEqual(['other', 'other', 'other']);
  });
});

describe('dictionaries (I-1)', () => {
  const keys = Object.keys(dictionaries.en) as MessageKey[];

  it('define the same keys in both languages', () => {
    expect(Object.keys(dictionaries.ar).sort()).toEqual([...keys].sort());
  });

  it.each(keys)('"%s" uses the same placeholders in both languages', (key) => {
    expect(placeholdersOf(dictionaries.ar[key])).toEqual(placeholdersOf(dictionaries.en[key]));
  });

  it('keep plural messages plural in both languages', () => {
    for (const key of keys) {
      expect(typeof dictionaries.ar[key], key).toBe(typeof dictionaries.en[key]);
    }
  });

  it('never leave an Arabic string untranslated (Latin-only)', () => {
    const allowedLatin = new Set<MessageKey>(['language.switchTo']);
    for (const key of keys) {
      if (allowedLatin.has(key)) continue;
      const message = dictionaries.ar[key];
      const text = typeof message === 'string' ? message : message.other;
      expect(text, key).toMatch(/[\u0600-\u06FF]/);
    }
  });
});

describe('translator', () => {
  it('interpolates and pluralises with correct Arabic forms', () => {
    const { t } = createI18n('ar');
    expect(t('discussion.count', { count: 0 })).toBe('لا توجد تعليقات');
    expect(t('discussion.count', { count: 1 })).toBe('تعليق واحد');
    expect(t('discussion.count', { count: 2 })).toBe('تعليقان');
    expect(t('discussion.count', { count: 5 })).toBe('5 تعليقات');
    expect(t('discussion.count', { count: 12 })).toBe('12 تعليقًا');
    expect(t('discussion.count', { count: 100 })).toBe('100 تعليق');
    expect(t('reply.label', { name: 'Omar Saleh' })).toBe('الرد على Omar Saleh');
  });

  it('formats numbers with grouping and Western digits', () => {
    expect(createI18n('en').t('discussion.count', { count: 1200 })).toBe('1,200 comments');
    expect(createI18n('ar').t('discussion.count', { count: 1200 })).toMatch(/^1.200 تعليق$/);
  });

  it('leaves unknown placeholders visible instead of printing "undefined"', () => {
    expect(createI18n('en').t('reply.label', {})).toBe('Reply to {name}');
  });
});

describe('formatting (I-4)', () => {
  const iso = '2026-10-24T08:30:00Z';

  it('uses the Gregorian calendar and Western digits in Arabic', () => {
    expect(createI18n('ar').formatDate(iso)).toBe('24 أكتوبر 2026');
    expect(createI18n('en').formatDate(iso)).toBe('24 October 2026');
  });

  it('produces identical dates through Intl and the manual fallback (engine parity)', () => {
    const dates = ['2026-01-05T12:00:00Z', '2026-06-15T12:00:00Z', '2026-12-31T12:00:00Z'];
    for (const locale of ['en', 'ar'] as const) {
      const intl = createFormatters(locale);
      const manual = createFormatters(locale, { forceFallback: true });
      for (const date of dates) expect(manual.formatDate(date)).toBe(intl.formatDate(date));
    }
  });

  it('formats date-time with a locale-appropriate separator', () => {
    expect(createI18n('en').formatDateTime(iso)).toMatch(/^24 October 2026, \d{2}:\d{2}$/);
    expect(createI18n('ar').formatDateTime(iso)).toMatch(/^24 أكتوبر 2026، \d{2}:\d{2}$/);
  });

  it('formats relative time with plural rules and falls back to a date after a week', () => {
    const now = Date.parse('2026-10-30T12:00:00Z');
    const ago = (ms: number) => new Date(now - ms).toISOString();
    const en = createI18n('en');
    const ar = createI18n('ar');
    expect(en.formatRelativeTime(ago(10_000), now)).toBe('just now');
    expect(en.formatRelativeTime(ago(60_000), now)).toBe('1 minute ago');
    expect(en.formatRelativeTime(ago(5 * 3_600_000), now)).toBe('5 hours ago');
    expect(ar.formatRelativeTime(ago(2 * 86_400_000), now)).toBe('منذ يومين');
    expect(ar.formatRelativeTime(ago(3 * 60_000), now)).toBe('منذ 3 دقائق');
    expect(ar.formatRelativeTime(ago(11 * 60_000), now)).toBe('منذ 11 دقيقة');
    expect(en.formatRelativeTime('2026-10-01T12:00:00Z', now)).toBe('1 October 2026');
    // clock skew: a timestamp slightly in the future is "just now", not "-1 minutes ago"
    expect(en.formatRelativeTime(new Date(now + 90_000).toISOString(), now)).toBe('just now');
  });
});

describe('negotiateLocale (I-1)', () => {
  it('honours Accept-Language quality values', () => {
    expect(negotiateLocale('fr-FR,ar;q=0.9,en;q=0.8')).toBe('ar');
    expect(negotiateLocale('en-US,en;q=0.9,ar;q=0.8')).toBe('en');
    expect(negotiateLocale('ar-SA')).toBe('ar');
    expect(negotiateLocale('de;q=0.9, ar;q=0')).toBe('en');
  });

  it('accepts device locale lists and falls back to English', () => {
    expect(negotiateLocale(['ar-EG', 'en-US'])).toBe('ar');
    expect(negotiateLocale([])).toBe('en');
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale('*')).toBe('en');
  });
});
