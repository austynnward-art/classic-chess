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

  test('courses contain GothamChess and Caro-Kann YouTube embeds plus Chessly chapter links', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="courses"]').first().click();
    await expect(page.locator('#courses')).toBeVisible();
    await expect(page.locator('#videos iframe')).toHaveCount(8);
    await expect(page.locator('#videos iframe').first()).toHaveAttribute('src', /youtube\.com\/embed\/XtaEnxG2lbg/);
    await expect(page.locator('#courses a[href="https://chessly.com/"]').first()).toBeVisible();
    await expect(page.locator('#courses a[href="https://www.gothamchess.com/"]').first()).toBeVisible();
    await expect(page.locator('#videos iframe').nth(4)).toHaveAttribute('src', /youtube\.com\/embed\/ebfzL_GwiIE/);\n    await expect(page.locator('#videos iframe').nth(5)).toHaveAttribute('src', /youtube\.com\/embed\/rmbU97iftC8/);\n    await expect(page.locator('#courses a[href^="https://chessly.com/courses/"]')).toHaveCount(4);
  });

  test('learn page has trainer board', async ({ page }) => {
    await page.goto('/');
    const homeSize = await page.locator('#board').boundingBox();
    expect(homeSize).not.toBeNull();
    await page.locator('[data-page="learn"]').first().click();
    await expect(page.locator('#learn')).toBeVisible();
    await expect(page.locator('#learnBoard .sq')).toHaveCount(64);
    await expect(page.locator('#learnBoard .pieceImg')).toHaveCount(32);
    await expect(page.locator('#learnBoard .rankLabel').first()).toHaveAttribute('data-rank', '8');
    await expect(page.locator('#learnBoard .fileLabel').last()).toHaveAttribute('data-file', 'h');
    const learnSize = await page.locator('#learnBoard').boundingBox();
    expect(Math.abs(homeSize.width-learnSize.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(homeSize.height-learnSize.height)).toBeLessThanOrEqual(1);
  });

  test('every lesson launches Stockfish, drill, quiz, and progress tracking', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-page="learn"]').first().click();
    await expect(page.locator('#learn')).toBeVisible();
    for (const id of ['forcing','piece','opening','conversion']) {
      await page.locator('.lesson[data-lesson="'+id+'"]').click();
      await expect(page.locator('#lessonProgress')).toContainText('0/3 completed');
      await page.locator('#learnAnalyze').click();
      await expect(page.locator('#lessonProgress')).toContainText('1/3 completed');
      await page.locator('#learnDrill').click();
      await expect(page.locator('#home')).toBeVisible();
      await page.locator('[data-page="learn"]').first().click();
      await page.locator('.lesson[data-lesson="'+id+'"]').click();
      await page.locator('#learnQuiz').click();
      await expect(page.locator('#lessonQuizPanel')).toBeVisible();
      await expect(page.locator('.quizQ')).toHaveCount(3);
      await page.locator('input[name="q0"][value="0"]').check();
      await page.locator('input[name="q1"][value="0"]').check();
      await page.locator('input[name="q2"][value="0"]').check();
      await page.locator('#quizSubmit').click();
      await expect(page.locator('#quizResult')).toContainText('Quiz complete');
      await expect(page.locator('#lessonProgress')).toContainText('3/3 completed');
    }
  });

  test('game review opens and contains coaching links', async ({ page }) => {
    await page.goto('/');
    await page.locator('#endReview').click();
    await expect(page.locator('#review')).toBeVisible();
    await expect(page.locator('#reviewTitle')).toContainText('Game review');
    await expect(page.locator('#review a[href="https://chessly.com/"]')).toBeVisible();
  });
});