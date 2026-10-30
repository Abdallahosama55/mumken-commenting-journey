import { createInMemoryRepository, createNetworkSimulator, isNotFound, type PublishedRecord } from '@commenting/core';

/**
 * Server-side reads go through the same `CommentingRepository` contract as the client (D-1), so swapping in
 * an HTTP repository changes data access in one place. No simulated latency or failures on the server.
 * `'use cache'` is the Next 16 idiom a real API call would need; here it also keeps prerendering explicit.
 */
const repository = createInMemoryRepository({ network: createNetworkSimulator({ initial: { latency: 'instant' } }) });

export async function listRecords(): Promise<readonly PublishedRecord[]> {
  'use cache';
  return repository.listRecords();
}

/** `null` when the record does not exist (S-2); any other failure propagates to the error boundary. */
export async function findRecord(recordId: string): Promise<PublishedRecord | null> {
  'use cache';
  try {
    return await repository.getRecord(recordId);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
