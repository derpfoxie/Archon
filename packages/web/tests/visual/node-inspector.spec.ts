import { test, expect } from '@playwright/test';
import { LOCALES, mockApi, setLocale } from './fixtures';

for (const locale of LOCALES) {
  test(`NodeInspector renders correctly in ${locale}`, async ({ page }) => {
    await setLocale(page, locale);
    await mockApi(page);

    await page.goto('/workflows/builder');
    await page.waitForLoadState('networkidle');

    // Add a prompt node via the QuickAdd toolbar so the inspector has something to render.
    const addNode = page.getByRole('button', { name: /Add Node|添加节点|ノードを追加/ }).first();
    if (await addNode.isVisible().catch(() => false)) {
      await addNode.click();
      const promptOption = page
        .getByRole('button', { name: /^Prompt$|^内联提示|^インライン/ })
        .first();
      if (await promptOption.isVisible().catch(() => false)) {
        await promptOption.click();
      }
    }

    // Click the first node on the canvas to open the inspector.
    const node = page.locator('[data-id]').first();
    if (await node.isVisible().catch(() => false)) {
      await node.click();
    }

    const inspector = page.locator('[role="tablist"]').first();
    await expect(inspector).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveScreenshot(`node-inspector-${locale}.png`);
  });
}
