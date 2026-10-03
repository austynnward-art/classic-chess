const { test, expect } = require('@playwright/test');

test.describe('Classic Chess rebuilt smoke tests', () => {
  test('home loads and has a board', async ({ page }) => {
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#board .sq')).toHaveCount(64);
    expect(errors).toEqual([]);
  });

  test('four-player board is available', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-mode="four"]').first().click();
    await expect(page.locator('#multi')).toBeVisible();
    await expect(page.locator('#multiBoard .multiSq')).toHaveCount(196);
  });

  test('courses contain six real YouTube embeds', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="courses"]').first().click();
    await expect(page.locator('#courses')).toBeVisible();
    await expect(page.locator('#videos iframe')).toHaveCount(6);
    await expect(page.locator('#videos iframe').first()).toHaveAttribute('src', /youtube\.com\/embed\//);
  });

  test('learn page has trainer board', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="learn"]').first().click();
    await expect(page.locator('#learn')).toBeVisible();
    await expect(page.locator('#learnBoard .sq')).toHaveCount(64);
  });
});