import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { createI18n, isLocale, type I18n } from '@commenting/core/i18n';
import type { Locale } from '@commenting/core';

/** The active locale from the `[locale]` root segment; anything else is a 404. */
export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getServerI18n(): Promise<I18n> {
  return createI18n(await getLocale());
}
