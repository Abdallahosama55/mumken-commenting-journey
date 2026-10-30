import type { ReactNode } from 'react';
import { AlertIcon, ChatIcon } from './icons';
import styles from './StatePanel.module.css';

interface StatePanelProps {
  readonly tone?: 'neutral' | 'danger';
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
  /** `h1` for full-page states (unavailable, not found), `h3` inside the discussion. */
  readonly as?: 'h1' | 'h2' | 'h3';
  readonly role?: 'alert' | 'status';
}

/** Empty, unavailable and error states share one layout (S-2, S-3, S-4) — matching the design's state cards. */
export function StatePanel({ tone = 'neutral', title, body, action, as: Heading = 'h3', role }: StatePanelProps) {
  const Icon = tone === 'danger' ? AlertIcon : ChatIcon;
  return (
    <div className={styles.panel} data-tone={tone} role={role}>
      <Icon className={styles.icon} width={20} height={20} />
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        <p className={styles.body}>{body}</p>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </div>
  );
}
