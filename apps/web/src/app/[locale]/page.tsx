import type { Metadata } from 'next';
import Link from 'next/link';
import { listRecords } from '@/lib/server-data';
import { getServerI18n } from '@/lib/server-i18n';
import styles from './records.module.css';

export const metadata: Metadata = { alternates: { languages: { en: '/en', ar: '/ar' } } };

/** Record list (J-4) — static, prerendered per locale. */
export default async function RecordsPage() {
  const [i18n, records] = await Promise.all([getServerI18n(), listRecords()]);
  const { t, locale } = i18n;

  return (
    <div className="page">
      <header className={styles.intro}>
        <h1 className={styles.title}>{t('records.title')}</h1>
        <p className={styles.subtitle}>{t('records.subtitle')}</p>
      </header>
      <ul className={styles.list}>
        {records.map((record) => (
          <li key={record.id} className={`card ${styles.item}`}>
            <p className={styles.reference}>
              <bdi>{record.id}</bdi>
            </p>
            <h2 className={styles.recordTitle}>
              {/* The whole card is clickable through this link's ::after; the link text stays the title. */}
              <Link href={`/${locale}/records/${record.id}`} className={styles.link}>
                {record.title[locale]}
              </Link>
            </h2>
            <p className={styles.summary}>{record.summary[locale]}</p>
            <p className={styles.meta}>
              <time dateTime={record.publishedAt}>
                {t('record.sourceLine', {
                  source: `\u2068${record.source}\u2069`,
                  date: i18n.formatDate(record.publishedAt),
                })}
              </time>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
