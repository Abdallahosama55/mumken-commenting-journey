import styles from './Discussion.module.css';

/** Mirrors the comment layout so nothing jumps when content arrives (S-1). */
export function DiscussionSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.skeleton} role="status">
      <span className="visually-hidden">{label}</span>
      {[0, 1, 2].map((index) => (
        <div key={index} className={styles.skeletonItem} aria-hidden="true">
          <span className={styles.skeletonAvatar} />
          <span className={styles.skeletonLines}>
            <span style={{ inlineSize: '30%' }} />
            <span style={{ inlineSize: '90%' }} />
            <span style={{ inlineSize: index === 1 ? '55%' : '70%' }} />
          </span>
        </div>
      ))}
    </div>
  );
}
