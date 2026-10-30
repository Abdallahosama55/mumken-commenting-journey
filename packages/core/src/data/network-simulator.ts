import { RepositoryError } from './errors';

export type LatencyProfile = 'instant' | 'normal' | 'slow';
export type SubmissionFailureMode = 'off' | 'once' | 'always';

export interface SimulationSettings {
  readonly latency: LatencyProfile;
  readonly failSubmissions: SubmissionFailureMode;
  readonly failDiscussionLoad: boolean;
}

export type SimulatedOperation = 'read' | 'load-discussion' | 'submit';

export const DEFAULT_SIMULATION: SimulationSettings = {
  latency: 'normal',
  failSubmissions: 'off',
  failDiscussionLoad: false,
};

const LATENCY_RANGE_MS: Record<LatencyProfile, readonly [min: number, max: number]> = {
  instant: [0, 0],
  normal: [350, 750],
  slow: [2200, 3000],
};

export interface NetworkSimulator {
  getSettings(): SimulationSettings;
  update(patch: Partial<SimulationSettings>): void;
  reset(): void;
  /** For `useSyncExternalStore` in the Reviewer tools. */
  subscribe(listener: () => void): () => void;
  /** Runs `operation` after simulated latency, or rejects according to the failure settings (D-3). */
  run<T>(kind: SimulatedOperation, operation: () => T, signal?: AbortSignal): Promise<T>;
}

export interface NetworkSimulatorOptions {
  /** What Reset returns to (default `DEFAULT_SIMULATION`). */
  readonly defaults?: Partial<SimulationSettings>;
  /** The starting state, e.g. settings restored from storage (default: `defaults`). */
  readonly initial?: Partial<SimulationSettings>;
  /** Injected for deterministic tests. */
  readonly random?: () => number;
}

export function createNetworkSimulator(options: NetworkSimulatorOptions = {}): NetworkSimulator {
  const defaults: SimulationSettings = { ...DEFAULT_SIMULATION, ...options.defaults };
  const random = options.random ?? Math.random;
  let settings: SimulationSettings = { ...defaults, ...options.initial };
  const listeners = new Set<() => void>();

  const setSettings = (next: SimulationSettings) => {
    settings = next;
    listeners.forEach((listener) => listener());
  };

  const latencyMs = () => {
    const [min, max] = LATENCY_RANGE_MS[settings.latency];
    return Math.round(min + (max - min) * random());
  };

  const shouldFail = (kind: SimulatedOperation): boolean => {
    if (kind === 'load-discussion') return settings.failDiscussionLoad;
    if (kind !== 'submit' || settings.failSubmissions === 'off') return false;
    // "once" disarms itself so the very next retry succeeds — the recovery path reviewers want to see.
    if (settings.failSubmissions === 'once') setSettings({ ...settings, failSubmissions: 'off' });
    return true;
  };

  return {
    getSettings: () => settings,
    update: (patch) => setSettings({ ...settings, ...patch }),
    reset: () => setSettings(defaults),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async run(kind, operation, signal) {
      await delay(latencyMs(), signal);
      if (shouldFail(kind)) {
        throw new RepositoryError('network', `Simulated network failure (${kind})`);
      }
      return operation();
    },
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new RepositoryError('aborted', 'Request aborted'));
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new RepositoryError('aborted', 'Request aborted'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** The options the Reviewer tools offer, shared by both apps and the sanitizer. */
export const LATENCY_PROFILES: readonly LatencyProfile[] = ['instant', 'normal', 'slow'];
export const SUBMISSION_FAILURE_MODES: readonly SubmissionFailureMode[] = ['off', 'once', 'always'];

/** Keeps only well-formed settings from untrusted input (e.g. values read back from storage). */
export function sanitizeSimulation(input: unknown): Partial<SimulationSettings> {
  if (typeof input !== 'object' || input === null) return {};
  const candidate = input as Record<string, unknown>;
  const settings: { -readonly [K in keyof SimulationSettings]?: SimulationSettings[K] } = {};
  if (LATENCY_PROFILES.includes(candidate.latency as LatencyProfile)) {
    settings.latency = candidate.latency as LatencyProfile;
  }
  if (SUBMISSION_FAILURE_MODES.includes(candidate.failSubmissions as SubmissionFailureMode)) {
    settings.failSubmissions = candidate.failSubmissions as SubmissionFailureMode;
  }
  if (typeof candidate.failDiscussionLoad === 'boolean') settings.failDiscussionLoad = candidate.failDiscussionLoad;
  return settings;
}
