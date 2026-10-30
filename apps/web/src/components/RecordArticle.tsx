import type { PublishedRecord } from '@commenting/core';
import type { I18n } from '@commenting/core/i18n';
import styles from './RecordArticle.module.css';

/**
 * The published record (J-1). A Server Component: static HTML, no client JavaScript, and the page's LCP
 * element. `source` exists only in English in the dataset, so it is isolated with its own `lang`/`dir` (I-3).
 */
export function RecordArticle({ record, i18n }: { record: PublishedRecord; i18n: I18n }) {
  const { locale, t } = i18n;
  return (
    <article className={`card ${styles.record}`} aria-labelledby="record-title">
      <div className={styles.topline}>
        <p className={styles.source}>
          <span className="visually-hidden">{t('record.source')}: </span>
          <bdi lang="en" dir="ltr">
            {record.source}
          </bdi>
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
      <p className={styles.dateline}>
        <time dateTime={record.publishedAt}>{t('record.publishedOn', { date: i18n.formatDate(record.publishedAt) })}</time>
      </p>
    </article>
  );
}
