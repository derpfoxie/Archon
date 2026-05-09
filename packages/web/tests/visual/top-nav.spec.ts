import { test, expect } from '@playwright/test';
import { LOCALES, mockApi, setLocale } from './fixtures';

for (const locale of LOCALES) {
  test(`TopNav + LanguageSwitcher renders correctly in ${locale}`, async ({ page }) => {
    await setLocale(page, locale);
    await mockApi(page, {
      dashboardRuns: {
        runs: [],
        counts: {
          all: 5,
          running: 2,
          paused: 0,
          completed: 3,
          failed: 0,
          cancelled: 0,
          pending: 0,
        },
        pagination: { total: 5, limit: 1, offset: 0, hasMore: true },
      },
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    await expect(nav).toHaveScreenshot(`top-nav-${locale}.png`);
  });
}
