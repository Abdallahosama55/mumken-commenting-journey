import { getBundledDataset } from '@commenting/core';
import Link from 'next/link';
import { getServerI18n } from '@/lib/server-i18n';
import styles from './records.module.css';

/** Record list (J-4) — static, prerendered per locale. */
export default async function RecordsPage() {
  const i18n = await getServerI18n();
  const { t, locale } = i18n;
  const records = [...getBundledDataset().records].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return (
    <div className="page">
      <header className={styles.intro}>
        <h1 className={styles.title}>{t('records.title')}</h1>
        <p className={styles.subtitle}>{t('records.subtitle')}</p>
      </header>
      <ul className={styles.list}>
        {records.map((record) => (
          <li key={record.id} className={`card ${styles.item}`}>
            <p className={styles.source}>
              <bdi lang="en" dir="ltr">
                {record.source}
              </bdi>
              <span aria-hidden="true"> · </span>
              <time dateTime={record.publishedAt}>{i18n.formatDate(record.publishedAt)}</time>
            </p>
            <h2 className={styles.recordTitle}>
              {/* The whole card is clickable through this link's ::after; the link text stays the title. */}
              <Link href={`/${locale}/records/${record.id}`} className={styles.link}>
                {record.title[locale]}
              </Link>
            </h2>
            <p className={styles.summary}>{record.summary[locale]}</p>
            <p className={styles.cta} aria-hidden="true">
              {t('records.open')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
