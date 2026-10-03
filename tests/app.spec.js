const { test, expect } = require('@playwright/test');

test.describe('Rebuild app smoke tests', () => {
  test('home loads and has a board', async ({ page }) => {
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#board .sq')).toHaveCount(64);
    await expect(page.locator('#board .pieceImg')).toHaveCount(32);
    expect(errors).toEqual([]);
  });

  test('four-player board is available', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-mode="four"]').first().click();
    await expect(page.locator('#multi')).toBeVisible();
    await expect(page.locator('#multiBoard .multiSq')).toHaveCount(196);
    const multiSize = await page.locator('#multiBoard').boundingBox();
    await page.locator('[data-mode="local"]').first().click();
    const homeSize = await page.locator('#board').boundingBox();
    expect(Math.abs(multiSize.width-homeSize.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(multiSize.height-homeSize.height)).toBeLessThanOrEqual(1);
  });

  test('courses contain six real YouTube embeds', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="courses"]').first().click();
    await expect(page.locator('#courses')).toBeVisible();
    await expect(page.locator('#videos iframe')).toHaveCount(6);
    await expect(page.locator('#videos iframe').first()).toHaveAttribute('src', /youtube\.com\/embed\/XtaEnxG2lbg/);
    await expect(page.locator('#courses a[href="https://chessly.com/"]').first()).toBeVisible();
    await expect(page.locator('#courses a[href="https://www.gothamchess.com/"]').first()).toBeVisible();
    await expect(page.locator('#videos iframe').first()).toHaveAttribute('src', /youtube\.com\/embed\//);
  });

  test('learn page has trainer board', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="learn"]').first().click();
    await expect(page.locator('#learn')).toBeVisible();
    await expect(page.locator('#learnBoard .sq')).toHaveCount(64);
    await expect(page.locator('#learnBoard .pieceImg')).toHaveCount(32);
    await expect(page.locator('#learnBoard .rankLabel').first()).toHaveAttribute('data-rank', '8');
    await expect(page.locator('#learnBoard .fileLabel').last()).toHaveAttribute('data-file', 'h');
    const homeSize = await page.locator('#board').boundingBox();
    const learnSize = await page.locator('#learnBoard').boundingBox();
    expect(Math.abs(homeSize.width-learnSize.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(homeSize.height-learnSize.height)).toBeLessThanOrEqual(1);
  });

  test('game review opens and contains coaching links', async ({ page }) => {
    await page.goto('/');
    await page.locator('#endReview').click();
    await expect(page.locator('#review')).toBeVisible();
    await expect(page.locator('#reviewTitle')).toContainText('Game review');
    await expect(page.locator('#review a[href="https://chessly.com/"]')).toBeVisible();
  });
});