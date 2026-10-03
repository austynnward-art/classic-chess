const { test, expect } = require('@playwright/test');

test.describe('Classic Chess smoke tests', () => {
  test('home page loads without a visible fatal error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#coursesTopPage')).toBeVisible();
    await expect(page.locator('#learnTopPage')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('four-player mode is available', async ({ page }) => {
    await page.goto('/');
    const fourPlayer = page.locator('#fourModeBtn');
    await expect(fourPlayer).toBeVisible();
    await fourPlayer.click();
    await expect(page.locator('body.fourPlayerView')).toBeVisible();
    await expect(page.locator('#multiBoard .multiSq')).toHaveCount(196);
  });

  test('two-player controls are reachable', async ({ page }) => {
    await page.goto('/');
    await page.locator('#twoModeBtn').click();
    await expect(page.locator('body.focusHome')).toBeVisible();
    await expect(page.locator('#fourModeBtn')).toBeVisible();
    await expect(page.locator('#twoModeBtn')).toBeVisible();
  });

  test('courses and learn navigation render', async ({ page }) => {
    await page.goto('/');
    await page.locator('#coursesTopPage').click();
    await expect(page.locator('#courseReferenceDashboard')).toBeVisible();

    await page.locator('#learnTopPage').click();
    await expect(page.locator('#learningBoard')).toBeVisible();
  });
});