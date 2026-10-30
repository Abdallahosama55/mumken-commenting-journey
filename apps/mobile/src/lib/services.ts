import { createDraftStore, createInMemoryRepository, createNetworkSimulator } from '@commenting/core';
import type { CommentingServices } from '@commenting/core/react';

/**
 * The app session's data layer (D-2): comments and drafts live in memory for as long as the app process
 * runs — the brief's "current application session". Swapping in an HTTP repository changes only this file.
 */
export function createAppServices(): CommentingServices {
  const network = createNetworkSimulator();
  return { network, repository: createInMemoryRepository({ network }), drafts: createDraftStore() };
}
