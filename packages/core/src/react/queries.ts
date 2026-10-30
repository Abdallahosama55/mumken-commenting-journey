import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isRepositoryError } from '../data/errors';
import { buildDiscussion, upsertComment } from '../domain/threads';
import type { Comment, NewComment } from '../domain/types';
import { useCommenting } from './providers';

export const commentingKeys = {
  all: ['commenting'] as const,
  records: () => [...commentingKeys.all, 'records'] as const,
  record: (recordId: string) => [...commentingKeys.all, 'record', recordId] as const,
  comments: (recordId: string) => [...commentingKeys.all, 'comments', recordId] as const,
};

/**
 * One configuration for both apps.
 * - Reads retry once, and only for network errors: a 404 is final, and a long silent retry loop would hide
 *   the error state the user needs to see (S-4).
 * - Writes never retry automatically: re-sending is the user's decision (S-5c).
 */
export function createCommentingQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => isRepositoryError(error) && error.retryable && failureCount < 1,
        retryDelay: 400,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

export function useRecords() {
  const { repository } = useCommenting();
  return useQuery({
    queryKey: commentingKeys.records(),
    queryFn: ({ signal }) => repository.listRecords({ signal }),
  });
}

export function useRecord(recordId: string) {
  const { repository } = useCommenting();
  return useQuery({
    queryKey: commentingKeys.record(recordId),
    queryFn: ({ signal }) => repository.getRecord(recordId, { signal }),
  });
}

/** Comments grouped into threads. `select` is module-level, so threads are rebuilt only when data changes. */
export function useDiscussion(recordId: string) {
  const { repository } = useCommenting();
  return useQuery({
    queryKey: commentingKeys.comments(recordId),
    queryFn: ({ signal }) => repository.listComments(recordId, { signal }),
    select: buildDiscussion,
  });
}

export function useCreateComment(recordId: string) {
  const { repository } = useCommenting();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...commentingKeys.comments(recordId), 'create'],
    mutationFn: (input: NewComment) => repository.createComment(input),
    onSuccess: (comment) => {
      // Write-through instead of refetching: no flicker, no extra request. If the list has not been
      // loaded yet there is nothing to patch — the next load includes the new comment anyway.
      queryClient.setQueryData<readonly Comment[]>(commentingKeys.comments(recordId), (current) =>
        current ? upsertComment(current, comment) : current,
      );
    },
  });
}
