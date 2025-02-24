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
    
    // Add breeder counts
    await page.click('[data-testid="breeder-females"] button[aria-label="Increase"]');
    await page.click('[data-testid="breeder-males"] button[aria-label="Increase"]');
    
    // Add juvenile counts
    await page.click('[data-testid="juvenile-females"] button[aria-label="Increase"]');
    await page.click('[data-testid="juvenile-unknown"] button[aria-label="Increase"]');
    
    // Add stage counts
    await page.click('[data-testid="stage-Incubator"] button[aria-label="Increase"]');
    
    // Wait for data to be saved
    await page.waitForTimeout(5000);
    
    // Check final state
    const savedData = await db.getAll();
    console.log('Final DB state:', savedData);
    
    // Verify no duplicates
    const breedCounts = savedData.reduce((acc, record) => {
        const key = `${record.breed}-${record.stage}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    
    Object.entries(breedCounts).forEach(([key, count]) => {
        expect(count, `Duplicate found for ${key}`).toBe(1);
    });
    
    // Should have 3 records: Breeder, Juvenile, and Incubator
    expect(savedData.length).toBe(3);
    
    // Verify each type of record
    const breederRecord = savedData.find(r => r.stage === 'Breeder');
    expect(breederRecord.breed).toBe('Ayam Cemani');
    expect(breederRecord.count).toBe(2);
    expect(breederRecord.breeders.females).toBe(1);
    expect(breederRecord.breeders.males).toBe(1);
    
    const juvenileRecord = savedData.find(r => r.stage === 'Juvenile');
    expect(juvenileRecord.breed).toBe('Ayam Cemani');
    expect(juvenileRecord.count).toBe(2);
    expect(juvenileRecord.juveniles.females).toBe(1);
    expect(juvenileRecord.juveniles.unknown).toBe(1);
    
    const incubatorRecord = savedData.find(r => r.stage === 'Incubator');
    expect(incubatorRecord.breed).toBe('Ayam Cemani');
    expect(incubatorRecord.count).toBe(1);
  });
}); 