'use client';

import { otherLocale } from '@commenting/core/i18n';
import { useI18n } from '@commenting/core/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rememberLocale, switchLocalePath } from '@/lib/locale-cookie';
import { GlobeIcon } from './icons';
import styles from './SiteHeader.module.css';

/**
 * Swaps the locale segment of the current URL, so the user stays on the same record (I-1).
 * The visible label is the target language in its own script, marked with `lang` so screen readers
 * pronounce it correctly — the accessible name matches the visible text (WCAG 2.5.3).
 */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const target = otherLocale(locale);
  const href = switchLocalePath(pathname, target) as Route;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      className={styles.language}
      onClick={() => rememberLocale(target)}
      scroll={false}
    >
      <GlobeIcon />
      <span>{t('language.switchTo')}</span>
    </Link>
  );
}
