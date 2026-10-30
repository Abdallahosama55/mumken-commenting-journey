'use client';

import { useI18n } from '@commenting/core/react';
import { useEffect } from 'react';
import { StatePanel } from '@/components/StatePanel';

/** Last-resort boundary for unexpected render errors: never a blank page. */
export default function ErrorBoundary({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    // A real deployment would report this to error monitoring.
    console.error(error);
  }, [error]);

  return (
    <div className="page">
      <StatePanel
        as="h1"
        tone="danger"
        role="alert"
        title={t('state.generic.title')}
        body={t('state.generic.body')}
        action={
          <button type="button" className="button button-primary" onClick={retry}>
            {t('state.retry')}
          </button>
        }
      />
    </div>
  );
}
