import { test, expect } from '@playwright/test';
import { LOCALES, mockApi, setLocale } from './fixtures';

for (const locale of LOCALES) {
  test(`dashboard StatusSummaryBar renders correctly in ${locale}`, async ({ page }) => {
    await setLocale(page, locale);
    await mockApi(page, {
      dashboardRuns: {
        runs: [],
        counts: {
          all: 12,
          running: 3,
          paused: 1,
          completed: 5,
          failed: 2,
          cancelled: 0,
          pending: 1,
        },
        pagination: { total: 12, limit: 50, offset: 0, hasMore: false },
      },
    });

    await page.goto('/dashboard');
    const summaryBar = page.locator('div').filter({ hasText: /^.*$/ }).first();
    await expect(summaryBar).toBeVisible();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`dashboard-${locale}.png`, {
      fullPage: false,
    });
  });
}
