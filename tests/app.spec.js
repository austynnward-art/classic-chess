const { test, expect } = require('@playwright/test');

test.describe('Classic Chess smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class TestWorker {
        constructor(){ this.onmessage=null; this.onerror=null; }
        postMessage(message){ if(message==='uci' && this.onmessage) setTimeout(()=>this.onmessage({data:'uciok'}),0); }
        terminate(){}
      }
      window.Worker = TestWorker;
    });
  });

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
    await expect(page.locator('.chesslyCourseDash')).toBeVisible();
    await expect(page.locator('.ytShell')).toBeVisible();
    await expect(page.locator('.ytShell iframe')).toHaveCount(6);
    await expect(page.locator('.ytShell iframe').first()).toHaveAttribute('src', /youtube\.com\/embed\//);
    await expect(page.locator('.resourceCard')).toHaveCount(17);

    await page.locator('#learnTopPage').click();
    await expect(page.locator('#learningBoard')).toBeVisible();
    await expect(page.locator('.learnWorkspace')).toBeVisible();
    await page.locator('#coursesTopPage').click();
    await expect(page.locator('.chesslyCourseDash')).toBeVisible();
  });
});