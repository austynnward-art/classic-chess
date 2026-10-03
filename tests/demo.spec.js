const { test, expect } = require('@playwright/test');
test.use({ video: 'on' });
test('Classic Chess visual walkthrough', async ({ page }) => {
  await page.addInitScript(() => {
    class DemoWorker {
      constructor(){ this.onmessage=null; this.onerror=null; }
      postMessage(message){
        if(message==='uci' && this.onmessage) setTimeout(()=>this.onmessage({data:'uciok'}),0);
      }
      terminate(){}
    }
    window.Worker = DemoWorker;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(700);
  await page.locator('#fourModeBtn').click();
  await page.waitForTimeout(900);
  await page.locator('#coursesTopPage').click();
  await expect(page.locator('#courseReferenceDashboard')).toBeVisible();
  await page.waitForTimeout(1400);
  await page.locator('#learnTopPage').click();
  await expect(page.locator('#learningBoard')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.locator('#coursesTopPage').click();
  await page.waitForTimeout(1200);
});