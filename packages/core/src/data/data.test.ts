import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NewComment } from '../domain/types';
import { createDraftStore, draftKey } from './draft-store';
import { RepositoryError } from './errors';
import { SESSION_COMMENTS_KEY, createInMemoryRepository, getBundledDataset } from './in-memory-repository';
import { createNetworkSimulator, sanitizeSimulation } from './network-simulator';
import { createMemoryStorage, safeStorage } from './storage';

const instant = () => createNetworkSimulator({ initial: { latency: 'instant' } });

const newComment = (overrides: Partial<NewComment> = {}): NewComment => ({
  recordId: 'record-001',
  parentId: null,
  body: 'A new comment',
  language: 'en',
  clientId: 'client-1',
  ...overrides,
});

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error as RepositoryError,
  );

describe('InMemoryRepository (D-1)', () => {
  it('lists records newest first and joins comment authors', async () => {
    const repo = createInMemoryRepository({ network: instant() });
    expect((await repo.listRecords()).map((r) => r.id)).toEqual(['record-002', 'record-001']);
    const comments = await repo.listComments('record-001');
    expect(comments).toHaveLength(5);
    expect(comments.find((c) => c.id === 'comment-001')?.author.name).toBe('Omar Saleh');
    expect(await repo.listComments('record-002')).toEqual([]);
  });

  it('rejects unknown records with not_found (S-2)', async () => {
    const repo = createInMemoryRepository({ network: instant() });
    expect((await rejection(repo.getRecord('nope'))).code).toBe('not_found');
    expect((await rejection(repo.listComments('nope'))).code).toBe('not_found');
  });

  it('creates comments as the current user without mutating the dataset (J-2)', async () => {
    const dataset = structuredClone(getBundledDataset());
    const repo = createInMemoryRepository({ dataset, network: instant(), now: () => new Date('2026-10-30T12:00:00Z') });
    const created = await repo.createComment(newComment({ body: '  trimmed  ' }));
    expect(created).toMatchObject({
      recordId: 'record-001',
      parentId: null,
      body: 'trimmed',
      author: { id: 'user-001', name: 'Noura Alharbi' },
      createdAt: '2026-10-30T12:00:00.000Z',
    });
    expect(dataset.comments).toHaveLength(5);
    expect(await repo.listComments('record-001')).toHaveLength(6);
  });

  it('is idempotent on clientId: a retry never duplicates (S-5d)', async () => {
    const repo = createInMemoryRepository({ network: instant() });
    const first = await repo.createComment(newComment());
    const retry = await repo.createComment(newComment());
    expect(retry.id).toBe(first.id);
    expect((await repo.listComments('record-001')).filter((c) => c.id === first.id)).toHaveLength(1);
  });

  it('accepts replies to top-level comments only (J-3)', async () => {
    const repo = createInMemoryRepository({ network: instant() });
    const reply = await repo.createComment(newComment({ parentId: 'comment-001', clientId: 'r1' }));
    expect(reply.parentId).toBe('comment-001');
    expect((await rejection(repo.createComment(newComment({ parentId: 'comment-002', clientId: 'r2' })))).code).toBe(
      'invalid',
    );
    expect((await rejection(repo.createComment(newComment({ parentId: 'missing', clientId: 'r3' })))).code).toBe(
      'not_found',
    );
    // a parent from another record is not a valid parent
    expect(
      (await rejection(repo.createComment(newComment({ recordId: 'record-002', parentId: 'comment-001', clientId: 'r4' }))))
        .code,
    ).toBe('not_found');
  });

  it('validates on the "server" too (S-7)', async () => {
    const repo = createInMemoryRepository({ network: instant() });
    const error = await rejection(repo.createComment(newComment({ body: '   ' })));
    expect(error.code).toBe('invalid');
    expect(error.retryable).toBe(false);
  });

  it('persists session comments to storage and restores them (D-2)', async () => {
    const storage = createMemoryStorage();
    const first = createInMemoryRepository({ network: instant(), storage });
    const created = await first.createComment(newComment());
    const second = createInMemoryRepository({ network: instant(), storage });
    expect((await second.listComments('record-001')).map((c) => c.id)).toContain(created.id);
  });

  it('discards corrupt or invalid storage instead of crashing (D-2)', async () => {
    for (const corrupt of ['{not json', JSON.stringify([{ id: 1 }])]) {
      const storage = createMemoryStorage();
      storage.setItem(SESSION_COMMENTS_KEY, corrupt);
      const repo = createInMemoryRepository({ network: instant(), storage });
      expect(await repo.listComments('record-001')).toHaveLength(5);
      expect(storage.getItem(SESSION_COMMENTS_KEY)).toBeNull();
    }
  });
});

describe('NetworkSimulator (D-3)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails a submission once, then lets the retry through (S-5)', async () => {
    const network = createNetworkSimulator({ initial: { latency: 'instant', failSubmissions: 'once' } });
    const repo = createInMemoryRepository({ network });
    const error = await rejection(repo.createComment(newComment()));
    expect(error).toBeInstanceOf(RepositoryError);
    expect(error.code).toBe('network');
    expect(error.retryable).toBe(true);
    expect(network.getSettings().failSubmissions).toBe('off');
    await expect(repo.createComment(newComment())).resolves.toMatchObject({ body: 'A new comment' });
    // the failed attempt must not have been committed
    expect(await repo.listComments('record-001')).toHaveLength(6);
  });

  it('fails every submission in "always" mode and every discussion load when asked', async () => {
    const network = createNetworkSimulator({
      initial: { latency: 'instant', failSubmissions: 'always', failDiscussionLoad: true },
    });
    const repo = createInMemoryRepository({ network });
    for (let i = 0; i < 3; i++) expect((await rejection(repo.createComment(newComment()))).code).toBe('network');
    expect((await rejection(repo.listComments('record-001'))).code).toBe('network');
    // records are still readable: only the discussion fails (S-4 keeps the record visible)
    await expect(repo.getRecord('record-001')).resolves.toMatchObject({ id: 'record-001' });
  });

  it('applies latency and honours AbortSignal', async () => {
    vi.useFakeTimers();
    const network = createNetworkSimulator({ initial: { latency: 'slow' }, random: () => 0 });
    const controller = new AbortController();
    const pending = rejection(network.run('read', () => 'value', controller.signal));
    controller.abort();
    expect((await pending).code).toBe('aborted');

    const slow = network.run('read', () => 'value');
    await vi.advanceTimersByTimeAsync(2199);
    let settled = false;
    void slow.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(slow).resolves.toBe('value');
  });

  it('notifies subscribers and resets to the initial settings', () => {
    const network = createNetworkSimulator({ initial: { latency: 'instant' } });
    const listener = vi.fn();
    const unsubscribe = network.subscribe(listener);
    network.update({ failDiscussionLoad: true });
    expect(listener).toHaveBeenCalledTimes(1);
    network.reset();
    expect(network.getSettings()).toEqual({ latency: 'instant', failSubmissions: 'off', failDiscussionLoad: false });
    unsubscribe();
    network.update({ latency: 'slow' });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('DraftStore (S-5a, D-2)', () => {
  it('keeps drafts per composer and notifies only that key', () => {
    const drafts = createDraftStore();
    const root = draftKey('record-001', null);
    const reply = draftKey('record-001', 'comment-001');
    const onRoot = vi.fn();
    const onReply = vi.fn();
    drafts.subscribe(root, onRoot);
    drafts.subscribe(reply, onReply);
    drafts.set(root, 'hello');
    drafts.set(root, 'hello'); // no-op
    expect(drafts.get(root)).toBe('hello');
    expect(drafts.get(reply)).toBe('');
    expect(onRoot).toHaveBeenCalledTimes(1);
    expect(onReply).not.toHaveBeenCalled();
  });

  it('restores drafts from storage and removes them when cleared', () => {
    const storage = createMemoryStorage();
    createDraftStore(storage).set('k', 'unsent text');
    const restored = createDraftStore(storage);
    expect(restored.get('k')).toBe('unsent text');
    restored.clear('k');
    expect(createDraftStore(storage).get('k')).toBe('');
  });
});

describe('safeStorage', () => {
  it('returns undefined when storage is unavailable or throws on write (private mode)', () => {
    expect(safeStorage(() => undefined)).toBeUndefined();
    expect(
      safeStorage(() => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {},
      })),
    ).toBeUndefined();
  });

  it('swallows errors from a storage that later starts failing', () => {
    let fail = false;
    const storage = safeStorage(() => ({
      getItem: () => {
        if (fail) throw new Error('boom');
        return 'v';
      },
      setItem: () => {
        if (fail) throw new Error('boom');
      },
      removeItem: () => {},
    }))!;
    fail = true;
    expect(storage.getItem('k')).toBeNull();
    expect(() => storage.setItem('k', 'v')).not.toThrow();
  });
});

describe('sanitizeSimulation', () => {
  it('keeps valid settings and drops anything malformed', () => {
    expect(sanitizeSimulation({ latency: 'slow', failSubmissions: 'once', failDiscussionLoad: true })).toEqual({
      latency: 'slow',
      failSubmissions: 'once',
      failDiscussionLoad: true,
    });
    expect(sanitizeSimulation({ latency: 'warp', failSubmissions: 1, failDiscussionLoad: 'yes', extra: 1 })).toEqual({});
    expect(sanitizeSimulation(null)).toEqual({});
    expect(sanitizeSimulation('slow')).toEqual({});
  });
});
