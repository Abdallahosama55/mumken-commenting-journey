import type { I18n } from '@commenting/core/i18n';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './SiteHeader.module.css';

/** The design's dark bar: wordmark at the start; workspace name and language switch at the end. */
export function SiteHeader({ i18n }: { i18n: I18n }) {
  return (
    <header className={styles.header}>
      <Link href={`/${i18n.locale}`} className={styles.brand}>
        {i18n.t('app.name')}
      </Link>
      <div className={styles.end}>
        <span className={styles.workspace}>{i18n.t('app.workspace')}</span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
