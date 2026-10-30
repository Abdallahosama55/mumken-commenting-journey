import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Regenerates the web screenshots in docs/screenshots (a deliverable). Opt-in: `npm run screenshots`.
 */
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to regenerate docs/screenshots');

const out = (name: string) => path.resolve(__dirname, '../../../docs/screenshots', name);

async function shot(page: Page, name: string, fullPage = true) {
  await page.addStyleTag({ content: '*{caret-color:transparent!important}' });
  await page.screenshot({ path: out(name), fullPage });
}

test('web screenshots', async ({ page }, testInfo) => {
  const device = testInfo.project.name === 'phone' ? 'mobile' : 'desktop';

  for (const locale of ['en', 'ar'] as const) {
    await page.goto(`/${locale}/records/record-001`);
    await expect(page.getByRole('list', { name: locale === 'en' ? 'Comments' : 'التعليقات' })).toBeVisible();
    await shot(page, `web-${device}-${locale}-discussion.png`);
  }

  // Reply composer open (J-3)
  await page.goto('/en/records/record-001');
  await page.getByRole('button', { name: 'Reply to Omar Saleh' }).click();
  await page.keyboard.type('A checklist for first-time users would help.');
  await shot(page, `web-${device}-en-reply.png`);

  // Submission failure with the text kept (S-5)
  await page.goto('/en/records/record-001');
  await page.getByText('Reviewer tools').click();
  await page.getByLabel('Always fails').check();
  await page.getByText('Reviewer tools').click();
  await page.getByRole('textbox', { name: 'Add a comment' }).fill('Will the support channels include WhatsApp?');
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(page.getByText('Comment wasn’t posted')).toBeVisible();
  await page.getByRole('heading', { name: 'Discussion' }).scrollIntoViewIfNeeded();
  await shot(page, `web-${device}-en-submit-failed.png`, false);

  // Loading skeleton (S-1)
  await page.getByText('Reviewer tools').click();
  await page.getByLabel('Slow').check();
  await page.getByLabel('Succeeds').check();
  await page.reload();
  await expect(page.getByText('Loading discussion…')).toBeAttached();
  await shot(page, `web-${device}-en-loading.png`, false);

  // Empty (S-3) and unavailable (S-2), in Arabic
  await page.getByText('Reviewer tools').click();
  await page.getByLabel('Normal').check();
  await page.goto('/ar/records/record-002');
  await expect(page.getByRole('heading', { name: 'لا توجد تعليقات بعد' })).toBeVisible();
  await shot(page, `web-${device}-ar-empty.png`, false);
  await page.goto('/ar/records/unknown');
  await expect(page.getByRole('heading', { name: 'السجل غير متاح' })).toBeVisible();
  await shot(page, `web-${device}-ar-unavailable.png`, false);
});
