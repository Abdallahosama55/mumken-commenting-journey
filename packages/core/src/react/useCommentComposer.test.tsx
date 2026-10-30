// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestProviders, createTestServices, type TestServices } from '../testing';
import { commentingKeys, useDiscussion } from './queries';
import { useCommentComposer, type CommentComposerOptions } from './useCommentComposer';

function setup(options: Partial<CommentComposerOptions> = {}, services: TestServices = createTestServices()) {
  const wrapper = ({ children }: { children: ReactNode }) => <TestProviders services={services}>{children}</TestProviders>;
  const onPosted = vi.fn();
  const hook = renderHook(
    () => ({
      composer: useCommentComposer({ recordId: 'record-001', onPosted, ...options }),
      discussion: useDiscussion('record-001'),
    }),
    { wrapper },
  );
  return { ...hook, services, onPosted };
}

describe('useCommentComposer', () => {
  it('posts, clears the draft and writes through to the discussion cache (J-2)', async () => {
    const { result, onPosted, services } = setup();
    await waitFor(() => expect(result.current.discussion.data?.total).toBe(5));

    act(() => result.current.composer.setValue('Great initiative'));
    let outcome;
    await act(async () => {
      outcome = await result.current.composer.submit();
    });

    expect(outcome).toMatchObject({ status: 'posted', comment: { body: 'Great initiative', parentId: null } });
    expect(result.current.composer.value).toBe('');
    expect(result.current.composer.status).toBe('idle');
    expect(onPosted).toHaveBeenCalledOnce();
    // Newest first: the new comment leads the list without a refetch.
    expect(result.current.discussion.data?.threads[0]?.comment.body).toBe('Great initiative');
    expect(result.current.discussion.data?.total).toBe(6);
    expect(services.queryClient.getQueryState(commentingKeys.comments('record-001'))?.dataUpdateCount).toBe(2);
  });

  it('keeps the text and exposes a retryable error when posting fails (S-5a, S-5b)', async () => {
    const { result } = setup({}, createTestServices({ simulation: { failSubmissions: 'always' } }));
    act(() => result.current.composer.setValue('Do not lose me'));
    await act(async () => {
      await result.current.composer.submit();
    });
    expect(result.current.composer.status).toBe('failed');
    expect(result.current.composer.value).toBe('Do not lose me');
    expect(result.current.composer.submitError?.retryable).toBe(true);
  });

  it('recovers on retry without duplicating the comment (S-5c, S-5d)', async () => {
    const services = createTestServices({ simulation: { failSubmissions: 'once' } });
    const createSpy = vi.spyOn(services.repository, 'createComment');
    const { result } = setup({}, services);
    await waitFor(() => expect(result.current.discussion.isSuccess).toBe(true));

    act(() => result.current.composer.setValue('Second time lucky'));
    await act(async () => {
      await result.current.composer.submit();
    });
    expect(result.current.composer.status).toBe('failed');

    await act(async () => {
      await result.current.composer.submit();
    });
    expect(result.current.composer.status).toBe('idle');
    expect(result.current.composer.value).toBe('');

    const [first, second] = createSpy.mock.calls.map(([input]) => input.clientId);
    expect(second).toBe(first);
    const matching = result.current.discussion.data?.threads.filter((t) => t.comment.body === 'Second time lucky');
    expect(matching).toHaveLength(1);
  });

  it('uses a new idempotency key when the text is edited after a failure', async () => {
    const services = createTestServices({ simulation: { failSubmissions: 'once' } });
    const createSpy = vi.spyOn(services.repository, 'createComment');
    const { result } = setup({}, services);
    act(() => result.current.composer.setValue('First version'));
    await act(async () => {
      await result.current.composer.submit();
    });
    act(() => result.current.composer.setValue('Edited version'));
    await act(async () => {
      await result.current.composer.submit();
    });
    const [first, second] = createSpy.mock.calls.map(([input]) => input.clientId);
    expect(second).not.toBe(first);
  });

  it('ignores a second submit while one is in flight (S-6)', async () => {
    const services = createTestServices();
    const createSpy = vi.spyOn(services.repository, 'createComment');
    const { result } = setup({}, services);
    act(() => result.current.composer.setValue('Double tap'));
    let outcomes: unknown[] = [];
    await act(async () => {
      outcomes = await Promise.all([result.current.composer.submit(), result.current.composer.submit()]);
    });
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(outcomes.map((o) => (o as { status: string }).status).sort()).toEqual(['ignored', 'posted']);
  });

  it('validates on submit and clears the message as soon as the user types (S-7)', async () => {
    const services = createTestServices();
    const createSpy = vi.spyOn(services.repository, 'createComment');
    const { result } = setup({}, services);
    act(() => result.current.composer.setValue('   '));
    expect(result.current.composer.validationIssue).toBeNull();
    await act(async () => {
      await result.current.composer.submit();
    });
    expect(result.current.composer.validationIssue).toBe('empty');
    expect(createSpy).not.toHaveBeenCalled();
    act(() => result.current.composer.setValue('Now with text'));
    expect(result.current.composer.validationIssue).toBeNull();
  });

  it('clears a "too long" message once the text is cut back under the limit (S-7)', async () => {
    const { result } = setup();
    act(() => result.current.composer.setValue('a'.repeat(1050)));
    await act(async () => {
      await result.current.composer.submit();
    });
    expect(result.current.composer.validationIssue).toBe('too_long');
    act(() => result.current.composer.setValue('a'.repeat(950)));
    expect(result.current.composer.validationIssue).toBeNull();
  });

  it('shows the counter near the limit and flags text over it', () => {
    const { result } = setup();
    act(() => result.current.composer.setValue('a'.repeat(899)));
    expect(result.current.composer.showCounter).toBe(false);
    act(() => result.current.composer.setValue('a'.repeat(900)));
    expect(result.current.composer.showCounter).toBe(true);
    expect(result.current.composer.remaining).toBe(100);
    act(() => result.current.composer.setValue('a'.repeat(1001)));
    expect(result.current.composer.validationIssue).toBe('too_long');
  });

  it('posts replies under their parent and keeps reply drafts separate (J-3)', async () => {
    const services = createTestServices();
    const wrapper = ({ children }: { children: ReactNode }) => <TestProviders services={services}>{children}</TestProviders>;
    const { result } = renderHook(
      () => ({
        root: useCommentComposer({ recordId: 'record-001' }),
        reply: useCommentComposer({ recordId: 'record-001', parentId: 'comment-001' }),
        discussion: useDiscussion('record-001'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.discussion.isSuccess).toBe(true));
    act(() => {
      result.current.root.setValue('root draft');
      result.current.reply.setValue('أتفق مع هذا');
    });
    await act(async () => {
      await result.current.reply.submit();
    });
    expect(result.current.root.value).toBe('root draft');
    const thread = result.current.discussion.data?.threads.find((t) => t.comment.id === 'comment-001');
    expect(thread?.replies.at(-1)).toMatchObject({ body: 'أتفق مع هذا', language: 'ar' });
  });

  it('discard drops the draft and the error', async () => {
    const { result } = setup({}, createTestServices({ simulation: { failSubmissions: 'always' } }));
    act(() => result.current.composer.setValue('to be discarded'));
    await act(async () => {
      await result.current.composer.submit();
    });
    act(() => result.current.composer.discard());
    expect(result.current.composer.value).toBe('');
    expect(result.current.composer.status).toBe('idle');
    expect(result.current.composer.submitError).toBeNull();
  });
});
