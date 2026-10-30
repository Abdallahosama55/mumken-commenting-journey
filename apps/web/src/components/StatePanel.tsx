import type { ReactNode } from 'react';
import styles from './StatePanel.module.css';

interface StatePanelProps {
  readonly title: string;
  readonly body?: string;
  /** Error copy is red, as in the design's "Couldn't load discussion" card. */
  readonly tone?: 'neutral' | 'danger';
  readonly action?: ReactNode;
  readonly children?: ReactNode;
  /** `h1` for full-page states (unavailable, not found), `h3` inside the discussion. */
  readonly as?: 'h1' | 'h2' | 'h3';
  readonly role?: 'alert' | 'status';
}

/** The design's state card (S-1…S-4): sunken surface, 1px border, bold title, message, one action. */
export function StatePanel({ title, body, tone = 'neutral', action, children, as: Heading = 'h3', role }: StatePanelProps) {
  return (
    <div className={styles.panel} role={role}>
      <Heading className={styles.title}>{title}</Heading>
      {body ? (
        <p className={styles.body} data-tone={tone}>
          {body}
        </p>
      ) : null}
      {children}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
