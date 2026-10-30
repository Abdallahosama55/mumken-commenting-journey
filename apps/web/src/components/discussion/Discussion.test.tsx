import type { Locale, SimulationSettings } from '@commenting/core';
import { TestProviders, createTestServices } from '@commenting/core/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { AnnouncerProvider } from '../Announcer';
import { Discussion } from './Discussion';

function renderDiscussion({
  recordId = 'record-001',
  locale = 'en',
  simulation,
}: { recordId?: string; locale?: Locale; simulation?: Partial<SimulationSettings> } = {}) {
  const services = createTestServices({ simulation });
  const user = userEvent.setup();
  const view = render(
    <TestProviders services={services} locale={locale}>
      <AnnouncerProvider>
        <Discussion recordId={recordId} />
      </AnnouncerProvider>
    </TestProviders>,
  );
  return { ...view, services, user };
}

const threadList = () => screen.findByRole('list', { name: 'Comments' });
async function expectNoAxeViolations(container: HTMLElement) {
  const { violations } = await axe.run(container, {
    // jsdom cannot compute colours (contrast is covered by the token test), and a fragment has no landmarks.
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

describe('<Discussion> (web)', () => {
  it('shows a loading state, then threads newest first with nested replies (S-1, J-1)', async () => {
    renderDiscussion();
    expect(screen.getByText('Loading discussion…').closest('[role="status"]')).toBeInTheDocument();

    const list = await threadList();
    expect(screen.getByText('5 comments')).toBeInTheDocument();
    const threads = within(list).getAllByRole('listitem').filter((item) => item.parentElement === list);
    expect(threads.map((item) => within(item).getAllByRole('article')[0]!.id)).toEqual([
      'comment-005',
      'comment-003',
      'comment-001',
    ]);
    expect(within(threads[2]!).getByRole('list', { name: '1 reply' })).toHaveTextContent('Agreed. Clear guidance');
  });

  it('posts a comment: it appears first, the field clears, and it is announced (J-2, A-2)', async () => {
    const { user } = renderDiscussion();
    await threadList();
    const field = screen.getByRole('textbox', { name: 'Add a comment' });

    await user.type(field, 'Count me in for the pilot.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    const list = await threadList();
    await waitFor(() => expect(within(list).getAllByRole('article')[0]).toHaveTextContent('Count me in for the pilot.'));
    expect(within(list).getAllByRole('article')[0]).toHaveTextContent('You');
    expect(field).toHaveValue('');
    expect(screen.getByText('6 comments')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Your comment was posted.')).toBeInTheDocument());
  });

  it('keeps the text when posting fails, explains it, and recovers on Retry without duplicates (S-5)', async () => {
    const { user } = renderDiscussion({ simulation: { failSubmissions: 'once' } });
    await threadList();
    const field = screen.getByRole('textbox', { name: 'Add a comment' });

    await user.type(field, 'Please publish the timeline.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Comment wasn’t posted');
    expect(alert).toHaveTextContent('Your text has been kept.');
    expect(field).toHaveValue('Please publish the timeline.');
    expect(field).toHaveAccessibleDescription(/Comment wasn’t posted/);

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(field).toHaveValue('');
    expect(screen.getAllByText('Please publish the timeline.')).toHaveLength(1);
  });

  it('lets the user edit the text after a failure before retrying (S-5e)', async () => {
    const { user } = renderDiscussion({ simulation: { failSubmissions: 'once' } });
    await threadList();
    const field = screen.getByRole('textbox', { name: 'Add a comment' });
    await user.type(field, 'Draft one');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));
    await screen.findByRole('alert');

    await user.clear(field);
    await user.type(field, 'Draft two');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Draft two')).toBeInTheDocument());
    expect(screen.queryByText('Draft one')).not.toBeInTheDocument();
  });

  it('rejects an empty comment with a message and keeps focus in the field (S-7)', async () => {
    const { user, services } = renderDiscussion();
    const createSpy = vi.spyOn(services.repository, 'createComment');
    await threadList();
    const field = screen.getByRole('textbox', { name: 'Add a comment' });

    await user.type(field, '   ');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Write something before posting.');
    expect(field).toHaveFocus();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('posts with Ctrl+Enter (A-1)', async () => {
    const { user } = renderDiscussion();
    await threadList();
    await user.type(screen.getByRole('textbox', { name: 'Add a comment' }), 'Keyboard post{Control>}{Enter}{/Control}');
    await waitFor(() => expect(screen.getByText('Keyboard post')).toBeInTheDocument());
  });

  it('replies inline with focus management: open → field, Esc → Reply button, post → new reply (J-3, A-3)', async () => {
    const { user } = renderDiscussion();
    await threadList();
    const replyToOmar = screen.getByRole('button', { name: 'Reply to Omar Saleh' });

    await user.click(replyToOmar);
    const replyField = screen.getByRole('textbox', { name: 'Replying to Omar Saleh' });
    expect(replyField).toHaveFocus();
    expect(replyToOmar).toHaveAttribute('aria-expanded', 'true');

    await user.type(replyField, 'Half-written reply');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Replying to Omar Saleh' })).not.toBeInTheDocument();
    expect(replyToOmar).toHaveFocus();

    // The draft survived closing the composer.
    await user.click(replyToOmar);
    const reopened = screen.getByRole('textbox', { name: 'Replying to Omar Saleh' });
    expect(reopened).toHaveValue('Half-written reply');

    await user.click(screen.getByRole('button', { name: 'Post reply' }));
    const replies = await screen.findByRole('list', { name: '2 replies' });
    const newReply = within(replies).getAllByRole('article').at(-1)!;
    expect(newReply).toHaveTextContent('Half-written reply');
    await waitFor(() => expect(newReply).toHaveFocus());
    expect(screen.queryByRole('textbox', { name: 'Replying to Omar Saleh' })).not.toBeInTheDocument();
  });

  it('shows the empty state and its action focuses the composer (S-3)', async () => {
    const { user } = renderDiscussion({ recordId: 'record-002' });
    expect(await screen.findByRole('heading', { name: 'No comments yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Write a comment' }));
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveFocus();
  });

  it('shows a load error with Try again, and recovers once the network is back (S-4)', async () => {
    const { user, services } = renderDiscussion({ simulation: { failDiscussionLoad: true } });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load discussion');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    services.network.update({ failDiscussionLoad: false });
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await threadList()).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toBeInTheDocument();
  });

  it('renders each comment in its own language and direction, in either UI language (I-3)', async () => {
    renderDiscussion({ locale: 'ar' });
    await screen.findByRole('list', { name: 'التعليقات' });
    const arabicBody = screen.getByText(/من المهم أن تشمل المبادرة/);
    const englishBody = screen.getByText(/This could make a meaningful difference/);
    expect(arabicBody).toHaveAttribute('lang', 'ar');
    expect(arabicBody).toHaveAttribute('dir', 'rtl');
    expect(englishBody).toHaveAttribute('lang', 'en');
    expect(englishBody).toHaveAttribute('dir', 'ltr');
  });

  it('is fully translated in Arabic, with Arabic plural forms (I-1, I-4)', async () => {
    const { user } = renderDiscussion({ locale: 'ar', simulation: { failSubmissions: 'once' } });
    expect(await screen.findByText('5 تعليقات')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'المناقشة' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'أضف تعليقًا' }), 'تعليق تجريبي');
    await user.click(screen.getByRole('button', { name: 'نشر التعليق' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('لم يُنشر التعليق');
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeInTheDocument();
  });

  it('has no axe violations when loaded, failed, open for reply and empty (A-2)', async () => {
    const loaded = renderDiscussion({ simulation: { failSubmissions: 'always' } });
    await threadList();
    await loaded.user.click(screen.getByRole('button', { name: 'Reply to Lina Haddad' }));
    await loaded.user.type(screen.getByRole('textbox', { name: 'Add a comment' }), 'x');
    await loaded.user.click(screen.getByRole('button', { name: 'Post comment' }));
    await screen.findByRole('alert');
    await expectNoAxeViolations(loaded.container);
    loaded.unmount();

    const empty = renderDiscussion({ recordId: 'record-002' });
    await screen.findByRole('heading', { name: 'No comments yet' });
    await expectNoAxeViolations(empty.container);
    empty.unmount();

    const failed = renderDiscussion({ simulation: { failDiscussionLoad: true } });
    await screen.findByRole('alert');
    await expectNoAxeViolations(failed.container);
  });
});
