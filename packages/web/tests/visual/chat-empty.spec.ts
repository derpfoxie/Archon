import { test, expect } from '@playwright/test';
import { LOCALES, mockApi, setLocale } from './fixtures';

for (const locale of LOCALES) {
  test(`chat sidebar empty state renders correctly in ${locale}`, async ({ page }) => {
    await setLocale(page, locale);
    await mockApi(page, {
      codebases: [],
      conversations: [],
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`chat-empty-${locale}.png`);
  });
}
