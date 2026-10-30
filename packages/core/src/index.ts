export * from './domain/types';
export { parseDataset, type Dataset, type RawComment } from './domain/schema';
export { buildDiscussion, upsertComment } from './domain/threads';
export {
  COUNTER_THRESHOLD,
  MAX_COMMENT_LENGTH,
  characterCount,
  validateCommentBody,
  type ValidationIssue,
  type ValidationResult,
} from './domain/validation';
export { detectLanguage, directionOf } from './domain/language';

export { RepositoryError, isNotFound, isRepositoryError, type RepositoryErrorCode } from './data/errors';
export type { CommentingRepository, RequestOptions } from './data/repository';
export {
  SESSION_COMMENTS_KEY,
  createInMemoryRepository,
  getBundledDataset,
  type InMemoryRepository,
  type InMemoryRepositoryOptions,
} from './data/in-memory-repository';
export {
  DEFAULT_SIMULATION,
  createNetworkSimulator,
  type LatencyProfile,
  type NetworkSimulator,
  type SimulationSettings,
  type SubmissionFailureMode,
} from './data/network-simulator';
export { createDraftStore, draftKey, type DraftStore } from './data/draft-store';
export { STORAGE_PREFIX, createMemoryStorage, safeStorage, type KeyValueStorage } from './data/storage';

export * from './i18n';
export * from './theme/tokens';
