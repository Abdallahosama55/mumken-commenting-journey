import {
  STORAGE_PREFIX,
  createDraftStore,
  createInMemoryRepository,
  createNetworkSimulator,
  safeStorage,
  sanitizeSimulation,
  type KeyValueStorage,
  type SimulationSettings,
} from '@commenting/core';
import { createCommentingQueryClient, type CommentingServices } from '@commenting/core/react';
import type { QueryClient } from '@tanstack/react-query';

const SIMULATION_KEY = `${STORAGE_PREFIX}simulation`;

let browserServices: CommentingServices | undefined;
let browserQueryClient: QueryClient | undefined;

/**
 * One data layer per browser tab, persisted to sessionStorage (D-2): posted comments, drafts and the
 * Reviewer-tools settings survive a reload and a language switch. During SSR every call gets a fresh,
 * storage-less instance, so nothing is ever shared between requests.
 */
export function getServices(): CommentingServices {
  if (typeof window === 'undefined') return createServices(undefined);
  browserServices ??= createServices(safeStorage(() => window.sessionStorage));
  return browserServices;
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return createCommentingQueryClient();
  browserQueryClient ??= createCommentingQueryClient();
  return browserQueryClient;
}

function createServices(storage: KeyValueStorage | undefined): CommentingServices {
  const network = createNetworkSimulator({ initial: readSimulation(storage) });
  network.subscribe(() => storage?.setItem(SIMULATION_KEY, JSON.stringify(network.getSettings())));
  return {
    network,
    repository: createInMemoryRepository({ network, storage }),
    drafts: createDraftStore(storage),
  };
}

function readSimulation(storage: KeyValueStorage | undefined): Partial<SimulationSettings> {
  try {
    return sanitizeSimulation(JSON.parse(storage?.getItem(SIMULATION_KEY) ?? '{}'));
  } catch {
    return {};
  }
}
