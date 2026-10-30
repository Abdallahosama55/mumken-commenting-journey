import { describe, expect, it } from 'vitest';
import { getBundledDataset } from '../data/in-memory-repository';
import { detectLanguage, directionOf } from './language';
import { parseDataset } from './schema';
import { buildDiscussion, upsertComment } from './threads';
import type { Comment } from './types';
import { MAX_COMMENT_LENGTH, characterCount, validateCommentBody } from './validation';

const author = { id: 'u', name: 'User', initials: 'U' };
const comment = (id: string, parentId: string | null, createdAt: string): Comment => ({
  id,
  recordId: 'r',
  parentId,
  author,
  body: id,
  language: 'en',
  createdAt,
  updatedAt: null,
});

describe('buildDiscussion (J-1, J-3)', () => {
  it('orders threads newest first and replies oldest first', () => {
    const { threads, total } = buildDiscussion([
      comment('a', null, '2026-10-24T09:00:00Z'),
      comment('a2', 'a', '2026-10-24T09:30:00Z'),
      comment('a1', 'a', '2026-10-24T09:10:00Z'),
      comment('b', null, '2026-10-24T10:00:00Z'),
    ]);
    expect(threads.map((t) => t.comment.id)).toEqual(['b', 'a']);
    expect(threads[1]!.replies.map((r) => r.id)).toEqual(['a1', 'a2']);
    expect(total).toBe(4);
  });

  it('flattens a reply-to-a-reply under its top-level ancestor (one level only)', () => {
    const { threads } = buildDiscussion([
      comment('a', null, '2026-10-24T09:00:00Z'),
      comment('a1', 'a', '2026-10-24T09:10:00Z'),
      comment('a1x', 'a1', '2026-10-24T09:20:00Z'),
    ]);
    expect(threads).toHaveLength(1);
    expect(threads[0]!.replies.map((r) => r.id)).toEqual(['a1', 'a1x']);
  });

  it('promotes orphaned replies instead of dropping them, and survives cycles', () => {
    const { threads, total } = buildDiscussion([
      comment('orphan', 'missing', '2026-10-24T09:00:00Z'),
      comment('x', 'y', '2026-10-24T09:01:00Z'),
      comment('y', 'x', '2026-10-24T09:02:00Z'),
    ]);
    expect(total).toBe(3);
    expect(threads.flatMap((t) => [t.comment.id, ...t.replies.map((r) => r.id)]).sort()).toEqual([
      'orphan',
      'x',
      'y',
    ]);
  });

  it('breaks timestamp ties deterministically by id', () => {
    const at = '2026-10-24T09:00:00Z';
    const ids = buildDiscussion([comment('b', null, at), comment('a', null, at)]).threads.map((t) => t.comment.id);
    expect(ids).toEqual(['b', 'a']);
  });

  it('groups the supplied dataset into the expected threads', () => {
    const dataset = getBundledDataset();
    const users = new Map(dataset.users.map((u) => [u.id, u]));
    const comments = dataset.comments
      .filter((c) => c.recordId === 'record-001')
      .map((c) => ({ ...c, author: users.get(c.authorId)! }));
    const { threads, total } = buildDiscussion(comments);
    expect(total).toBe(5);
    expect(threads.map((t) => [t.comment.id, t.replies.map((r) => r.id)])).toEqual([
      ['comment-005', []],
      ['comment-003', ['comment-004']],
      ['comment-001', ['comment-002']],
    ]);
  });
});

describe('upsertComment', () => {
  it('appends new comments and replaces existing ones by id (no duplicates)', () => {
    const a = comment('a', null, '2026-10-24T09:00:00Z');
    const list = upsertComment([a], comment('b', null, '2026-10-24T09:00:00Z'));
    expect(list.map((c) => c.id)).toEqual(['a', 'b']);
    expect(upsertComment(list, { ...a, body: 'changed' }).map((c) => c.body)).toEqual(['changed', 'b']);
    expect(upsertComment(undefined, a)).toEqual([a]);
  });
});

describe('validateCommentBody (S-7)', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(validateCommentBody('')).toEqual({ ok: false, issue: 'empty' });
    expect(validateCommentBody(' \n\t ')).toEqual({ ok: false, issue: 'empty' });
  });

  it('trims accepted text', () => {
    expect(validateCommentBody('  hello \n')).toEqual({ ok: true, value: 'hello' });
  });

  it('enforces the maximum length in code points, not UTF-16 units', () => {
    expect(validateCommentBody('a'.repeat(MAX_COMMENT_LENGTH)).ok).toBe(true);
    expect(validateCommentBody('a'.repeat(MAX_COMMENT_LENGTH + 1))).toEqual({ ok: false, issue: 'too_long' });
    expect(characterCount('😀😀')).toBe(2);
    expect(validateCommentBody('😀'.repeat(MAX_COMMENT_LENGTH)).ok).toBe(true);
  });
});

describe('detectLanguage (I-3)', () => {
  it('uses the first strong character, like dir="auto"', () => {
    expect(detectLanguage('أتفق تمامًا', 'en')).toBe('ar');
    expect(detectLanguage('Agreed', 'ar')).toBe('en');
    expect(detectLanguage('2030 رؤية', 'en')).toBe('ar');
    expect(detectLanguage('«Hello» مرحبا', 'ar')).toBe('en');
  });

  it('does not treat × or ÷ as Latin letters, nor Hebrew as Arabic', () => {
    expect(detectLanguage('× ٣ مرات', 'en')).toBe('ar');
    expect(detectLanguage('÷ 2 Agreed', 'ar')).toBe('en');
    expect(detectLanguage('שלום', 'en')).toBe('en');
  });

  it('falls back to the UI locale when there is no strong character', () => {
    expect(detectLanguage('👍 123 !!', 'ar')).toBe('ar');
    expect(detectLanguage('👍', 'en')).toBe('en');
  });

  it('maps languages to directions', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });
});

describe('parseDataset (D-1)', () => {
  it('accepts the supplied dataset', () => {
    const dataset = getBundledDataset();
    expect(dataset.records).toHaveLength(2);
    expect(dataset.comments).toHaveLength(5);
    expect(dataset.currentUser.id).toBe('user-001');
  });

  it('rejects malformed data at the boundary', () => {
    expect(() => parseDataset({ currentUser: {}, records: [], users: [], comments: [] })).toThrow();
    const dataset = structuredClone(getBundledDataset());
    (dataset.comments[0] as { language: string }).language = 'fr';
    expect(() => parseDataset(dataset)).toThrow();
  });
});
