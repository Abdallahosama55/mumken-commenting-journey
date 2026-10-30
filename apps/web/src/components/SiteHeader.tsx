import type { I18n } from '@commenting/core/i18n';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './SiteHeader.module.css';

export function SiteHeader({ i18n }: { i18n: I18n }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={`/${i18n.locale}`} className={styles.brand}>
          {i18n.t('app.name')}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
