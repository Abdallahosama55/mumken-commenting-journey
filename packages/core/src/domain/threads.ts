import type { Comment, CommentThread, Discussion } from './types';

const timeOf = (comment: Comment) => Date.parse(comment.createdAt);

const oldestFirst = (a: Comment, b: Comment) => timeOf(a) - timeOf(b) || a.id.localeCompare(b.id);
const newestFirst = (a: Comment, b: Comment) => -oldestFirst(a, b);

/**
 * Groups a flat comment list into one-level threads (J-1, J-3).
 *
 * - Top-level threads are newest first; replies are oldest first (assumption 2 in the requirements).
 * - A reply to a reply is attached to its top-level ancestor, so the UI never nests deeper than one level.
 * - A reply whose parent is missing is promoted to top level: content is never silently dropped.
 *
 * O(n log n) for the sorts, O(n · depth) to resolve ancestors (depth is 1 in practice).
 */
export function buildDiscussion(comments: readonly Comment[]): Discussion {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const roots: Comment[] = [];
  const repliesByRoot = new Map<string, Comment[]>();

  for (const comment of comments) {
    const rootId = resolveRootId(comment, byId);
    if (rootId === comment.id) {
      roots.push(comment);
      continue;
    }
    const bucket = repliesByRoot.get(rootId);
    if (bucket) bucket.push(comment);
    else repliesByRoot.set(rootId, [comment]);
  }

  const threads: CommentThread[] = roots.sort(newestFirst).map((comment) => ({
    comment,
    replies: (repliesByRoot.get(comment.id) ?? []).sort(oldestFirst),
  }));

  return { threads, total: comments.length };
}

function resolveRootId(comment: Comment, byId: ReadonlyMap<string, Comment>): string {
  let current = comment;
  const seen = new Set<string>([current.id]);
  while (current.parentId !== null) {
    const parent = byId.get(current.parentId);
    // Orphan: the last node we could reach is the root. Its own walk ends at itself, so the two agree.
    if (!parent) return current.id;
    // Cycle in bad data: no member has a real root, so each one is surfaced at top level rather than lost.
    if (seen.has(parent.id)) return comment.id;
    seen.add(parent.id);
    current = parent;
  }
  return current.id;
}

/** Inserts or replaces by id, keeping the cache free of duplicates even if a response is delivered twice. */
export function upsertComment(list: readonly Comment[] | undefined, comment: Comment): Comment[] {
  if (!list) return [comment];
  const index = list.findIndex((existing) => existing.id === comment.id);
  if (index === -1) return [...list, comment];
  const next = list.slice();
  next[index] = comment;
  return next;
}
