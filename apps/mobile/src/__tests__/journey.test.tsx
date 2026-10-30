import type { Locale, SimulationSettings } from '@commenting/core';
import { TestProviders, createTestServices, type TestServices } from '@commenting/core/testing';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FreshCommentProvider } from '@/lib/fresh-comment';
import { AppLocaleProvider } from '@/lib/locale';
import { AppStack } from '@/lib/navigation';
import RecordsScreen from '@/app/index';
import DiscussionScreen from '@/app/records/[recordId]/index';
import ReplyScreen from '@/app/records/[recordId]/reply/[commentId]';
import SettingsScreen from '@/app/settings';

const safeArea = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

/** Mounts the real stack and screens over deterministic test services (instant network, fixed clock). */
async function renderApp(
  initialUrl: string,
  { locale = 'en', simulation }: { locale?: Locale; simulation?: Partial<SimulationSettings> } = {},
) {
  const services: TestServices = createTestServices({ simulation });
  const Layout = () => (
    <SafeAreaProvider initialMetrics={safeArea}>
      <TestProviders services={services}>
        <AppLocaleProvider initialLocale={locale}>
          <FreshCommentProvider>
            <AppStack />
          </FreshCommentProvider>
        </AppLocaleProvider>
      </TestProviders>
    </SafeAreaProvider>
  );
  const router = await renderRouter(
    {
      _layout: Layout,
      index: RecordsScreen,
      'records/[recordId]/index': DiscussionScreen,
      'records/[recordId]/reply/[commentId]': ReplyScreen,
      settings: SettingsScreen,
    },
    { initialUrl },
  );
  return { router, services };
}

const announce = AccessibilityInfo.announceForAccessibility as jest.Mock;

describe('mobile commenting journey', () => {
  beforeEach(() => announce.mockClear());

  it('opens a record from the list and shows its discussion (J-4, J-1, S-1)', async () => {
    const { router } = await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Expanding digital services for small businesses' }));
    expect(router.getPathname()).toBe('/records/record-001');
    expect(await screen.findByText(/This could make a meaningful difference/)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Discussion' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Record discussion' })).toBeOnTheScreen();
  });

  it('posts a comment, clears the field and announces it (J-2, A-2)', async () => {
    await renderApp('/records/record-001');
    const field = await screen.findByLabelText('Add a comment');
    await fireEvent.changeText(field, 'Count me in for the pilot.');
    await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));

    expect(await screen.findByText('Count me in for the pilot.')).toBeOnTheScreen();
    expect(field).toHaveProp('value', '');
    expect(announce).toHaveBeenCalledWith('Your comment was posted.');
  });

  it('keeps the text on failure and recovers on Retry without duplicates (S-5)', async () => {
    await renderApp('/records/record-001', { simulation: { failSubmissions: 'once' } });
    const field = await screen.findByLabelText('Add a comment');
    await fireEvent.changeText(field, 'Please keep this text safe.');
    await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Comment wasn’t posted')).toBeOnTheScreen();
    expect(field).toHaveProp('value', 'Please keep this text safe.');
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Comment wasn’t posted'));

    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeOnTheScreen());
    expect(screen.getAllByText('Please keep this text safe.')).toHaveLength(1);
    expect(field).toHaveProp('value', '');
  });

  it('rejects an empty comment with a message (S-7)', async () => {
    const { services } = await renderApp('/records/record-001');
    const createSpy = jest.spyOn(services.repository, 'createComment');
    await fireEvent.changeText(await screen.findByLabelText('Add a comment'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
    expect(await screen.findByText('Write something before posting.')).toBeOnTheScreen();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('replies on a dedicated screen, returns to the thread, and keeps unsent drafts (J-3, S-5a)', async () => {
    const { router } = await renderApp('/records/record-001');
    await fireEvent.press(await screen.findByRole('button', { name: 'Reply to Omar Saleh' }));
    expect(router.getPathname()).toBe('/records/record-001/reply/comment-001');

    const replyField = await screen.findByLabelText('Replying to Omar');
    expect(screen.getByText('Draft text remains available if submission fails.')).toBeOnTheScreen();
    await fireEvent.changeText(replyField, 'A short video guide would help.');
    // Leave without posting — the draft must survive.
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(router.getPathname()).toBe('/records/record-001');

    await fireEvent.press(await screen.findByRole('button', { name: 'Reply to Omar Saleh' }));
    expect(await screen.findByLabelText('Replying to Omar')).toHaveProp('value', 'A short video guide would help.');

    await fireEvent.press(screen.getByRole('button', { name: 'Post reply' }));
    await waitFor(() => expect(router.getPathname()).toBe('/records/record-001'));
    expect(await screen.findByText('A short video guide would help.')).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith('Your reply was posted.');
  });

  it('shows the empty state for a record without comments (S-3)', async () => {
    await renderApp('/records/record-002');
    expect(await screen.findByText('No comments yet')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add first comment' })).toBeOnTheScreen();
  });

  it('shows the unavailable state for an unknown record (S-2)', async () => {
    await renderApp('/records/does-not-exist');
    expect(await screen.findByText('Record unavailable')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back to records' })).toBeOnTheScreen();
  });

  it('keeps the record visible when the discussion fails to load, and recovers (S-4)', async () => {
    const { services } = await renderApp('/records/record-001', { simulation: { failDiscussionLoad: true } });
    expect(await screen.findByText('Couldn’t load discussion')).toBeOnTheScreen();
    expect(screen.getByText('Expanding digital services for small businesses')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Add a comment')).not.toBeOnTheScreen();

    services.network.update({ failDiscussionLoad: false });
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/This could make a meaningful difference/)).toBeOnTheScreen();
  });

  it('renders Arabic right-to-left, with each comment in its own direction (I-1, I-2, I-3)', async () => {
    await renderApp('/records/record-001', { locale: 'ar' });
    expect(await screen.findByRole('header', { name: 'المناقشة' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'مناقشة السجل' })).toBeOnTheScreen();
    // The Latin-only reference is bidi-isolated inside the Arabic line.
    expect(screen.getByText(/^منشور · .*record-001/)).toBeOnTheScreen();

    const englishBody = screen.getByText(/This could make a meaningful difference/);
    expect(StyleSheet.flatten(englishBody.props.style)).toMatchObject({ writingDirection: 'ltr', textAlign: 'end' });
    expect(englishBody).toHaveProp('accessibilityLanguage', 'en');
    const arabicBody = screen.getByText(/من المهم أن تشمل المبادرة/);
    expect(StyleSheet.flatten(arabicBody.props.style)).toMatchObject({ writingDirection: 'rtl', textAlign: 'start' });
  });

  it('switches language instantly from settings, without losing the draft (I-1)', async () => {
    const { router } = await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Expanding digital services for small businesses' }));
    await fireEvent.changeText(await screen.findByLabelText('Add a comment'), 'Unsent draft');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(router.getPathname()).toBe('/settings');
    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));
    expect(await screen.findByRole('header', { name: 'الإعدادات' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'تم' }));

    await fireEvent.press(await screen.findByRole('button', { name: 'توسيع الخدمات الرقمية للمنشآت الصغيرة' }));
    expect(await screen.findByLabelText('أضف تعليقًا')).toHaveProp('value', 'Unsent draft');
  });

  it('replies to a reply in the same thread, addressed to its author (J-3)', async () => {
    const { router } = await renderApp('/records/record-001');
    // [0] is Lina's own thread; [1] is her reply inside Omar's thread.
    const replyToLina = (await screen.findAllByRole('button', { name: 'Reply to Lina Haddad' }))[1]!;
    await fireEvent.press(replyToLina);
    expect(router.getPathname()).toBe('/records/record-001/reply/comment-001');
    expect(await screen.findByText(/Agreed. Clear guidance/)).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Replying to Lina'), 'Noted, thanks');
    await fireEvent.press(screen.getByRole('button', { name: 'Post reply' }));
    await waitFor(() => expect(router.getPathname()).toBe('/records/record-001'));
    expect(await screen.findByText('Noted, thanks')).toBeOnTheScreen();
  });
});
