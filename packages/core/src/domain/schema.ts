import * as z from 'zod/mini';

/**
 * Runtime schema for the supplied dataset (and for anything read back from storage).
 * zod/mini keeps the client bundle small; the types below are inferred, so schema and types cannot drift.
 */
const id = z.string().check(z.minLength(1));
const isoDate = z.iso.datetime({ offset: true });
const localized = z.object({ en: z.string(), ar: z.string() });

export const userSchema = z.object({ id, name: z.string(), initials: z.string() });

export const recordSchema = z.object({
  id,
  title: localized,
  summary: localized,
  source: z.string(),
  publishedAt: isoDate,
});

export const rawCommentSchema = z.object({
  id,
  recordId: id,
  parentId: z.nullable(id),
  authorId: id,
  body: z.string(),
  language: z.enum(['en', 'ar']),
  createdAt: isoDate,
  updatedAt: z.nullable(isoDate),
});

export const datasetSchema = z.object({
  currentUser: userSchema,
  records: z.array(recordSchema),
  users: z.array(userSchema),
  comments: z.array(rawCommentSchema),
});

export type Dataset = z.infer<typeof datasetSchema>;
export type RawComment = z.infer<typeof rawCommentSchema>;

export function parseDataset(input: unknown): Dataset {
  return datasetSchema.parse(input);
}
