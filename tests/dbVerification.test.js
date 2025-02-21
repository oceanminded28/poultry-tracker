const { test } = require('./dbFixture');
const { expect } = require('@playwright/test');
import { ai } from '@zerostep/playwright'

test.describe("Database Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });
  
  test('should save and verify data', async ({ page, db }) => {
    // Check initial state
    const initialData = await db.getAll();
    console.log('Initial DB state:', initialData);

    // Wait for the React component to mount and initialize
    await page.waitForSelector('h1:has-text("Sugar Feather Farm")');
    
    // Click to expand the category and breed
    await ai('Click the Chickens button',{ page, test });
    await ai('Click Ayam Cemani',{ page, test });
    
    // Input the data
    await ai('Click the Plus button under Breeding Females',{ page, test });
    await ai('Click the Plus button under Breeding Males',{ page, test });
    
    // Wait for data to be saved
    await page.waitForTimeout(1000);
    
    // Check final state
    const savedData = await db.getAll();
    console.log('Final DB state:', savedData);
    
    expect(savedData).toBeDefined();
    expect(savedData.length).toBeGreaterThan(0);
    expect(savedData[0].data['Ayam Cemani']).toBeDefined();
  });
}); 