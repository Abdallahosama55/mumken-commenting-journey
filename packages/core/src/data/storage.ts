/** The subset of the Web Storage API the data layer needs; satisfied by sessionStorage or an in-memory map. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_PREFIX = 'commenting:v1:';

/**
 * Wraps browser storage so quota errors, Safari private mode or disabled storage never break the journey —
 * persistence degrades to in-memory only (D-2).
 */
export function safeStorage(getStorage: () => KeyValueStorage | undefined): KeyValueStorage | undefined {
  let storage: KeyValueStorage | undefined;
  try {
    storage = getStorage();
    if (!storage) return undefined;
    const probe = `${STORAGE_PREFIX}probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
  } catch {
    return undefined;
  }
  const target = storage;
  return {
    getItem: (key) => attempt(() => target.getItem(key), null),
    setItem: (key, value) => attempt(() => target.setItem(key, value), undefined),
    removeItem: (key) => attempt(() => target.removeItem(key), undefined),
  };
}

function attempt<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}
