import { expect, test, type Page } from '@playwright/test';

// Specs compile to CommonJS, so `require.resolve` is available.
const axePath = require.resolve('axe-core/axe.min.js');

const discussion = (page: Page) => page.getByRole('list', { name: /^(Comments|التعليقات)$/ });

async function openReviewerTools(page: Page) {
  const summary = page.getByText(/^(Reviewer tools|أدوات المراجعة)$/);
  await summary.click();
}

test.describe('in an Arabic browser', () => {
  // The browser derives Accept-Language from its locale, exactly as a real user's browser would.
  test.use({ locale: 'ar-SA' });

  test('negotiates the locale at the root and lists records (I-1, J-4)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('السجلات المنشورة');
    await page.getByRole('link', { name: 'توسيع الخدمات الرقمية للمنشآت الصغيرة' }).click();
    await expect(page).toHaveURL(/\/ar\/records\/record-001$/);
  });
});

test.describe('commenting journey', () => {
  test('posts a comment and a reply, then keeps them across a reload (J-2, J-3, D-2)', async ({ page }) => {
    await page.goto('/en/records/record-001');
    await expect(discussion(page)).toBeVisible();

    await page.getByRole('textbox', { name: 'Add a comment' }).fill('Is there a timeline for phase two?');
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(discussion(page).getByRole('article').first()).toContainText('Is there a timeline for phase two?');
    await expect(page.getByText('6 comments')).toBeVisible();

    await page.getByRole('button', { name: 'Reply to Omar Saleh' }).click();
    await expect(page.getByRole('textbox', { name: 'Replying to Omar Saleh' })).toBeFocused();
    await page.keyboard.type('A checklist for first-time users would help.');
    await page.getByRole('button', { name: 'Post reply' }).click();
    const replies = page.getByRole('list', { name: '2 replies' });
    await expect(replies.getByRole('article').last()).toBeFocused();
    await expect(page.getByText('7 comments')).toBeVisible();

    await page.reload();
    await expect(page.getByText('7 comments')).toBeVisible();
    await expect(page.getByText('A checklist for first-time users would help.')).toBeVisible();
  });

  test('recovers from a failed submission without losing the text (S-5)', async ({ page }) => {
    await page.goto('/en/records/record-001');
    await openReviewerTools(page);
    await page.getByLabel('Fails once').check();

    const field = page.getByRole('textbox', { name: 'Add a comment' });
    await field.fill('Please keep this text safe.');
    await page.getByRole('button', { name: 'Post comment' }).click();

    await expect(page.getByText('Comment wasn’t posted')).toBeVisible();
    await expect(field).toHaveValue('Please keep this text safe.');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Comment wasn’t posted')).toBeHidden();
    await expect(field).toHaveValue('');
    await expect(discussion(page).getByText('Please keep this text safe.')).toHaveCount(1);
  });

  test('keeps drafts and posted comments when switching language (I-1, I-2)', async ({ page }) => {
    await page.goto('/en/records/record-001');
    await expect(discussion(page)).toBeVisible();
    await page.getByRole('textbox', { name: 'Add a comment' }).fill('Unsent draft');

    await page.getByRole('link', { name: 'العربية' }).click();
    await expect(page).toHaveURL(/\/ar\/records\/record-001$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'المناقشة' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'أضف تعليقًا' })).toHaveValue('Unsent draft');
    // English content keeps its own direction inside the RTL page (I-3). Scoped to the visible list: with
    // Cache Components, Next keeps the previous (English) route mounted but hidden via <Activity>.
    await expect(discussion(page).getByText(/^This could make a meaningful difference/)).toHaveAttribute('dir', 'ltr');
  });

  test('shows the empty, unavailable and load-failure states (S-2, S-3, S-4)', async ({ page }) => {
    await page.goto('/en/records/record-002');
    await expect(page.getByRole('heading', { name: 'No comments yet' })).toBeVisible();

    await page.goto('/en/records/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Record unavailable' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to records' }).click();
    await expect(page).toHaveURL(/\/en$/);

    await page.goto('/en/records/record-001');
    await openReviewerTools(page);
    await page.getByLabel('Fail loading the discussion').check();
    await page.reload();
    await expect(page.getByText('Couldn’t load discussion')).toBeVisible();
    // The record itself is still readable (S-4).
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Expanding digital services for small businesses');

    await openReviewerTools(page);
    await page.getByLabel('Fail loading the discussion').uncheck();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(discussion(page)).toBeVisible();
  });

  test('has no accessibility violations in a real browser, in both languages (A-2, A-4)', async ({ page }) => {
    for (const path of ['/en', '/en/records/record-001', '/ar/records/record-001', '/ar/records/record-002']) {
      await page.goto(path);
      if (path.includes('records/')) await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      if (path.endsWith('record-001')) await expect(discussion(page)).toBeVisible();
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => {
        // @ts-expect-error axe is injected above
        const result = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] });
        return result.violations.map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      });
      expect(violations, path).toEqual([]);
    }
  });
});
