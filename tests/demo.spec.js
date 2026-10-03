const { test, expect } = require('@playwright/test');
test.use({ video: 'on' });

test('Classic Chess rebuilt visual walkthrough', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('#board .sq')).toHaveCount(64);
  await page.locator('[data-mode="four"]').first().click();
  await expect(page.locator('#multiBoard .multiSq')).toHaveCount(196);
  await page.locator('[data-page="courses"]').first().click();
  await expect(page.locator('#videos iframe')).toHaveCount(6);
  await page.locator('[data-page="learn"]').first().click();
  await expect(page.locator('#learnBoard .sq')).toHaveCount(64);
  await page.waitForTimeout(500);
});