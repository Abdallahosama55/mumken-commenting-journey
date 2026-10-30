import styles from './Discussion.module.css';

/** The design's loading card: two text bars and a block, in the space the comments will take (S-1). */
export function DiscussionSkeleton({ title, label }: { title: string; label: string }) {
  return (
    <div className={styles.loading} role="status">
      <span className="visually-hidden">{label}</span>
      <p className={styles.loadingTitle} aria-hidden="true">
        {title}
      </p>
      <span className={styles.bar} aria-hidden="true" />
      <span className={styles.bar} data-short aria-hidden="true" />
      <span className={styles.block} aria-hidden="true" />
    </div>
  );
}
