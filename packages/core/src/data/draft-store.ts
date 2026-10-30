import { STORAGE_PREFIX, type KeyValueStorage } from './storage';

/**
 * Unsent text, keyed per composer (S-5a, D-2). An external store so that typing re-renders only the
 * composer that owns the key (via `useSyncExternalStore`), never the comment list.
 */
export interface DraftStore {
  get(key: string): string;
  set(key: string, value: string): void;
  clear(key: string): void;
  subscribe(key: string, listener: () => void): () => void;
  /**
   * The submission of a draft lives with the draft, not with a composer instance, so closing and reopening a
   * composer mid-flight (or after a failure) keeps the same idempotency key and in-flight guard (S-5d, S-6).
   */
  getAttempt(key: string): DraftAttempt | undefined;
  setAttempt(key: string, attempt: DraftAttempt | undefined): void;
}

export interface DraftAttempt {
  readonly clientId: string;
  readonly body: string;
  readonly inFlight: boolean;
}

export const draftKey = (recordId: string, parentId: string | null) => `${recordId}:${parentId ?? 'root'}`;

const storageKey = (key: string) => `${STORAGE_PREFIX}draft:${key}`;

export function createDraftStore(storage?: KeyValueStorage): DraftStore {
  const drafts = new Map<string, string>();
  const attempts = new Map<string, DraftAttempt>();
  const listeners = new Map<string, Set<() => void>>();

  const get = (key: string) => {
    let value = drafts.get(key);
    if (value === undefined) {
      value = storage?.getItem(storageKey(key)) ?? '';
      drafts.set(key, value);
    }
    return value;
  };

  const set = (key: string, value: string) => {
    if (get(key) === value) return;
    drafts.set(key, value);
    if (value) storage?.setItem(storageKey(key), value);
    else storage?.removeItem(storageKey(key));
    listeners.get(key)?.forEach((listener) => listener());
  };

  return {
    get,
    set,
    clear: (key) => set(key, ''),
    getAttempt: (key) => attempts.get(key),
    setAttempt: (key, attempt) => {
      if (attempt) attempts.set(key, attempt);
      else attempts.delete(key);
    },
    subscribe(key, listener) {
      let keyListeners = listeners.get(key);
      if (!keyListeners) {
        keyListeners = new Set();
        listeners.set(key, keyListeners);
      }
      keyListeners.add(listener);
      return () => {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) listeners.delete(key);
      };
    },
  };
}
