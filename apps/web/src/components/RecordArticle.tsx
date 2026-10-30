import type { PublishedRecord } from '@commenting/core';
import type { I18n } from '@commenting/core/i18n';
import styles from './RecordArticle.module.css';

/**
 * The published record (J-1). A Server Component: static HTML, no client JavaScript, and the page's LCP
 * element. Layout per the Figma web frame: reference + status badge, title, summary, source · date.
 * `id` and `source` exist only in Latin script in the dataset, so they are bidi-isolated (I-3).
 */
export function RecordArticle({ record, i18n }: { record: PublishedRecord; i18n: I18n }) {
  const { locale, t } = i18n;
  // First-strong isolates keep the Latin-only source from reordering the Arabic sentence around it (I-3).
  const source = `\u2068${record.source}\u2069`;
  return (
    <article className={`card ${styles.record}`} aria-labelledby="record-title">
      <div className={styles.topline}>
        <p className={styles.reference}>
          <bdi>{record.id}</bdi>
        </p>
        <p className={styles.badge}>
          <span className={styles.dot} aria-hidden="true" />
          {t('record.published')}
        </p>
      </div>
      <h1 id="record-title" className={styles.title}>
        {record.title[locale]}
      </h1>
      <p className={styles.summary}>{record.summary[locale]}</p>
      <p className={styles.meta}>
        <time dateTime={record.publishedAt}>
          {t('record.sourceLine', { source, date: i18n.formatDate(record.publishedAt) })}
        </time>
      </p>
    </article>
  );
}
