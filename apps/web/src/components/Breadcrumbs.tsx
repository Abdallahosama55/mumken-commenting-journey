import type { I18n } from '@commenting/core/i18n';
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

/** "Monitoring / Records / <reference>" as in the design. Monitoring has no page of its own here. */
export function Breadcrumbs({ i18n, current }: { i18n: I18n; current: string }) {
  return (
    <nav aria-label={i18n.t('nav.breadcrumb')} className={styles.breadcrumbs}>
      <ol>
        <li>{i18n.t('nav.monitoring')}</li>
        <li>
          <Link href={`/${i18n.locale}`}>{i18n.t('nav.records')}</Link>
        </li>
        <li aria-current="page">
          <bdi className={styles.current}>{current}</bdi>
        </li>
      </ol>
    </nav>
  );
}
