import { test } from '@playwright/test'
import { ai } from '@zerostep/playwright'

test.describe("POC", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });
  
  test('basic navigation test', async ({ page }) => {
    await ai('Click the Chickens button',{ page, test });
    await ai('Ayam Cemani', { page, test, shouldBeVisible: true });
    await page.screenshot({ path: 'test-results/screenshot.png' });
  }); 
}); 