import type { Comment, NewComment, PublishedRecord, UserSummary } from '../domain/types';

export interface RequestOptions {
  readonly signal?: AbortSignal;
}

/**
 * The seam between UI and data (D-1). The in-memory implementation below backs both apps today;
 * an HTTP implementation would satisfy the same contract without touching a component.
 *
 * All methods reject with `RepositoryError` only.
 */
export interface CommentingRepository {
  getCurrentUser(): UserSummary;
  listRecords(options?: RequestOptions): Promise<readonly PublishedRecord[]>;
  /** Rejects with `not_found` for unknown ids (S-2). */
  getRecord(recordId: string, options?: RequestOptions): Promise<PublishedRecord>;
  /** Flat list with authors joined; ordering is a presentation concern (`buildDiscussion`). */
  listComments(recordId: string, options?: RequestOptions): Promise<readonly Comment[]>;
  /** Idempotent on `input.clientId` (S-5d). */
  createComment(input: NewComment, options?: RequestOptions): Promise<Comment>;
}
