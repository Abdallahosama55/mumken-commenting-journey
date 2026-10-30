'use client';

import { LATENCY_PROFILES, SUBMISSION_FAILURE_MODES } from '@commenting/core';
import { useI18n, useSimulation } from '@commenting/core/react';
import { SlidersIcon } from './icons';
import styles from './ReviewerTools.module.css';

/**
 * Network simulation for reviewers (D-3): makes the loading, failure and retry states reachable on demand.
 * A native <details> disclosure — keyboard and screen-reader support for free, no JS for open/close.
 */
export function ReviewerTools() {
  const { t } = useI18n();
  const simulation = useSimulation();
  if (!simulation) return null;
  const { settings, update, reset } = simulation;

  return (
    <details className={styles.tools}>
      <summary className={styles.summary}>
        <SlidersIcon />
        {t('devtools.title')}
      </summary>
      <div className={styles.panel}>
        <p className={styles.description}>{t('devtools.description')}</p>

        <fieldset className={styles.group}>
          <legend>{t('devtools.latency')}</legend>
          <div className={styles.options}>
            {LATENCY_PROFILES.map((latency) => (
              <label key={latency} className={styles.option}>
                <input
                  type="radio"
                  name="sim-latency"
                  checked={settings.latency === latency}
                  onChange={() => update({ latency })}
                />
                {t(`devtools.latency.${latency}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{t('devtools.failSubmissions')}</legend>
          <div className={styles.options}>
            {SUBMISSION_FAILURE_MODES.map((mode) => (
              <label key={mode} className={styles.option}>
                <input
                  type="radio"
                  name="sim-fail-submissions"
                  checked={settings.failSubmissions === mode}
                  onChange={() => update({ failSubmissions: mode })}
                />
                {t(`devtools.failSubmissions.${mode}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={styles.option}>
          <input
            type="checkbox"
            checked={settings.failDiscussionLoad}
            onChange={(event) => update({ failDiscussionLoad: event.target.checked })}
            aria-describedby="sim-load-hint"
          />
          {t('devtools.failDiscussionLoad')}
        </label>
        <p id="sim-load-hint" className={styles.hint}>
          {t('devtools.loadHint')}
        </p>

        <button type="button" className="button button-secondary" onClick={reset}>
          {t('devtools.reset')}
        </button>
      </div>
    </details>
  );
}
