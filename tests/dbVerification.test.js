const { test } = require('./dbFixture');
const { expect } = require('@playwright/test');
import { ai } from '@zerostep/playwright'

test.describe("Database Tests", () => {
  test.beforeEach(async ({ page, db }) => {
    // Clear the database before each test
    await db.clearAll();
    await page.goto("/");
  });
  
  test('should save and verify data', async ({ page, db }) => {
    // Check initial state
    const initialData = await db.getAll();
    console.log('Initial DB state:', initialData);
    expect(initialData.length).toBe(0);

    // Wait for the React component to mount and initialize
    await page.waitForSelector('h1:has-text("Sugar Feather Farm")');
    
    // Click category and breed
    await page.click('[data-category="Chickens"]');
    await page.click('[data-breed="Ayam Cemani"]');
    
    // Click the number steppers
    await page.click('[data-testid="breeder-females"] button[aria-label="Increase"]');
    await page.click('[data-testid="breeder-males"] button[aria-label="Increase"]');
    
    // Wait for data to be saved
    await page.waitForTimeout(3000);
    
    // Check final state
    const savedData = await db.getAll();
    console.log('Final DB state:', savedData);
    
    expect(savedData.length).toBe(1);
    const record = savedData[0];
    expect(record.breed).toBe('Ayam Cemani');
    expect(record.stage).toBe('Breeder');
    expect(record.count).toBe(2);
    expect(record.breeders.females).toBe(1);
    expect(record.breeders.males).toBe(1);
  });
}); 