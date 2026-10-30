export type RepositoryErrorCode = 'network' | 'not_found' | 'invalid' | 'aborted';

/** The only error type the data layer throws; UI branches on `code`, never on message text. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
  }

  /** Network failures are worth retrying; a 404 or a validation error is not. */
  get retryable(): boolean {
    return this.code === 'network';
  }
}

export const isRepositoryError = (error: unknown): error is RepositoryError => error instanceof RepositoryError;

export const isNotFound = (error: unknown): boolean => isRepositoryError(error) && error.code === 'not_found';
