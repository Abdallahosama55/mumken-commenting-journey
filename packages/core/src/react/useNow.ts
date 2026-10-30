import { useSyncExternalStore } from 'react';

const TICK_MS = 30_000;

let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const tick = () => {
  now = Date.now();
  listeners.forEach((listener) => listener());
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick(); // the clock may have been idle; refresh before the first render that uses it
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => now;

/**
 * A single shared clock for relative timestamps ("5 minutes ago"). One interval for the whole app,
 * not one per comment, and it stops when nothing is listening.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
