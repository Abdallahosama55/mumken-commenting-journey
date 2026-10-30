export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export type Direction = 'ltr' | 'rtl';

/** Content language of a comment body. The dataset uses the same codes as the UI locales. */
export type ContentLanguage = Locale;

export type LocalizedText = Readonly<Record<Locale, string>>;

export interface UserSummary {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
}

export interface PublishedRecord {
  readonly id: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  /** Not localised in the dataset — rendered as-is and bidi-isolated (I-3). */
  readonly source: string;
  /** ISO-8601 UTC timestamp. */
  readonly publishedAt: string;
}

/** A comment as the UI consumes it: author already joined, like a typical API response. */
export interface Comment {
  readonly id: string;
  readonly recordId: string;
  readonly parentId: string | null;
  readonly author: UserSummary;
  readonly body: string;
  readonly language: ContentLanguage;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

export interface CommentThread {
  readonly comment: Comment;
  /** Oldest first, one level deep (J-3). */
  readonly replies: readonly Comment[];
}

export interface Discussion {
  /** Newest first. */
  readonly threads: readonly CommentThread[];
  /** Top-level comments + replies. */
  readonly total: number;
}

export interface NewComment {
  readonly recordId: string;
  readonly parentId: string | null;
  readonly body: string;
  /** Detected on the client, which knows the UI locale to fall back to (I-3). */
  readonly language: ContentLanguage;
  /** Idempotency key: retries of the same attempt reuse it so they can never duplicate (S-5d). */
  readonly clientId: string;
}
