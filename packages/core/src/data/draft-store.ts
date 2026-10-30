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
}

export const draftKey = (recordId: string, parentId: string | null) => `${recordId}:${parentId ?? 'root'}`;

const storageKey = (key: string) => `${STORAGE_PREFIX}draft:${key}`;

export function createDraftStore(storage?: KeyValueStorage): DraftStore {
  const drafts = new Map<string, string>();
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
