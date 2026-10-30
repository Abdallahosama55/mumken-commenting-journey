'use client';

import { otherLocale } from '@commenting/core/i18n';
import { useI18n } from '@commenting/core/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rememberLocale, switchLocalePath } from '@/lib/locale-cookie';
import styles from './SiteHeader.module.css';

/**
 * Shows the current language code, as in the design ("EN"), and switches to the other language on the same
 * page (I-1). The accessible name starts with the visible code (WCAG 2.5.3) and says what the link does.
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
      className={styles.language}
      aria-label={`${t('language.code')} · ${t('language.switchLabel')}`}
      onClick={() => rememberLocale(target)}
      scroll={false}
    >
      {t('language.code')}
    </Link>
  );
}
