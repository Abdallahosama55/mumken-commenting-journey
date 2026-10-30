import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_SIMULATION, type SimulationSettings } from '../data/network-simulator';
import { useCommenting } from './providers';

const noopSubscribe = () => () => {};
const defaultSnapshot = () => DEFAULT_SIMULATION;

/** Reviewer tools state (D-3). Returns `null` when the repository is not simulated. */
export function useSimulation(): {
  readonly settings: SimulationSettings;
  readonly update: (patch: Partial<SimulationSettings>) => void;
  readonly reset: () => void;
} | null {
  const { network } = useCommenting();
  const settings = useSyncExternalStore(
    network ? network.subscribe : noopSubscribe,
    network ? network.getSettings : defaultSnapshot,
    defaultSnapshot,
  );
  const update = useCallback((patch: Partial<SimulationSettings>) => network?.update(patch), [network]);
  const reset = useCallback(() => network?.reset(), [network]);
  return network ? { settings, update, reset } : null;
}
