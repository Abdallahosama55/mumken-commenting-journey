import * as z from 'zod/mini';
import rawDataset from './commenting-assignment-data.json';
import { parseDataset, rawCommentSchema, type Dataset, type RawComment } from '../domain/schema';
import type { Comment, NewComment, PublishedRecord, UserSummary } from '../domain/types';
import { validateCommentBody } from '../domain/validation';
import { RepositoryError } from './errors';
import { createNetworkSimulator, type NetworkSimulator } from './network-simulator';
import type { CommentingRepository } from './repository';
import { STORAGE_PREFIX, type KeyValueStorage } from './storage';

let bundledDataset: Dataset | undefined;

/** The supplied JSON, validated once at the boundary (D-1). */
export function getBundledDataset(): Dataset {
  bundledDataset ??= parseDataset(rawDataset);
  return bundledDataset;
}

export const SESSION_COMMENTS_KEY = `${STORAGE_PREFIX}comments`;

const sessionCommentsSchema = z.array(rawCommentSchema);

const UNKNOWN_AUTHOR: UserSummary = { id: 'unknown', name: 'Unknown user', initials: '?' };

export interface InMemoryRepositoryOptions {
  readonly dataset?: Dataset;
  readonly network?: NetworkSimulator;
  /** Persists comments created in this session (sessionStorage on web, D-2). */
  readonly storage?: KeyValueStorage;
  readonly now?: () => Date;
}

export interface InMemoryRepository extends CommentingRepository {
  readonly network: NetworkSimulator;
}

export function createInMemoryRepository(options: InMemoryRepositoryOptions = {}): InMemoryRepository {
  const dataset = options.dataset ?? getBundledDataset();
  const network = options.network ?? createNetworkSimulator();
  const now = options.now ?? (() => new Date());
  const { storage } = options;

  const usersById = new Map(dataset.users.map((user) => [user.id, user]));
  usersById.set(dataset.currentUser.id, dataset.currentUser);
  const recordsById = new Map(dataset.records.map((record) => [record.id, record]));

  // The dataset is never mutated; this session's writes live in their own map, merged on read.
  const seeded = new Map(dataset.comments.map((comment) => [comment.id, comment]));
  const created = new Map<string, RawComment>(
    restoreSessionComments(storage)
      .filter((comment) => recordsById.has(comment.recordId) && !seeded.has(comment.id))
      .map((comment) => [comment.id, comment]),
  );

  const findComment = (id: string) => seeded.get(id) ?? created.get(id);

  const join = (comment: RawComment): Comment => ({
    id: comment.id,
    recordId: comment.recordId,
    parentId: comment.parentId,
    author: usersById.get(comment.authorId) ?? UNKNOWN_AUTHOR,
    body: comment.body,
    language: comment.language,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  });

  const requireRecord = (recordId: string): PublishedRecord => {
    const record = recordsById.get(recordId);
    if (!record) throw new RepositoryError('not_found', `Record ${recordId} does not exist`);
    return record;
  };

  const persist = () => {
    storage?.setItem(SESSION_COMMENTS_KEY, JSON.stringify([...created.values()]));
  };

  return {
    network,

    getCurrentUser: () => dataset.currentUser,

    listRecords: ({ signal } = {}) =>
      network.run(
        'read',
        () => [...dataset.records].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
        signal,
      ),

    getRecord: (recordId, { signal } = {}) => network.run('read', () => requireRecord(recordId), signal),

    listComments: (recordId, { signal } = {}) =>
      network.run(
        'load-discussion',
        () => {
          requireRecord(recordId);
          return [...seeded.values(), ...created.values()]
            .filter((comment) => comment.recordId === recordId)
            .map(join);
        },
        signal,
      ),

    createComment: (input: NewComment, { signal } = {}) =>
      network.run(
        'submit',
        () => {
          const id = `comment-${input.clientId}`;
          // Idempotency (S-5d): a retry of an attempt that already landed returns the original.
          const existing = created.get(id);
          if (existing) return join(existing);

          requireRecord(input.recordId);
          const validation = validateCommentBody(input.body);
          if (!validation.ok) throw new RepositoryError('invalid', `Comment body is ${validation.issue}`);

          if (input.parentId !== null) {
            const parent = findComment(input.parentId);
            if (!parent || parent.recordId !== input.recordId) {
              throw new RepositoryError('not_found', `Parent comment ${input.parentId} does not exist`);
            }
            if (parent.parentId !== null) {
              throw new RepositoryError('invalid', 'Replies are limited to one level');
            }
          }

          const comment: RawComment = {
            id,
            recordId: input.recordId,
            parentId: input.parentId,
            authorId: dataset.currentUser.id,
            body: validation.value,
            language: input.language,
            createdAt: now().toISOString(),
            updatedAt: null,
          };
          created.set(id, comment);
          persist();
          return join(comment);
        },
        signal,
      ),
  };
}

/** Anything unreadable in storage is discarded rather than allowed to break the app (D-2). */
function restoreSessionComments(storage: KeyValueStorage | undefined): RawComment[] {
  const raw = storage?.getItem(SESSION_COMMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = sessionCommentsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // fall through
  }
  storage?.removeItem(SESSION_COMMENTS_KEY);
  return [];
}
