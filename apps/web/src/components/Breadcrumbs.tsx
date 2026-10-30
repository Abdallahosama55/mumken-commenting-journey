import type { I18n } from '@commenting/core/i18n';
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs({ i18n, current }: { i18n: I18n; current: string }) {
  return (
    <nav aria-label={i18n.t('nav.breadcrumb')} className={styles.breadcrumbs}>
      <ol>
        <li>
          <Link href={`/${i18n.locale}`}>{i18n.t('nav.records')}</Link>
        </li>
        <li aria-current="page">
          <span className={styles.current}>{current}</span>
        </li>
      </ol>
    </nav>
  );
}
