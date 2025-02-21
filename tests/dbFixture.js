// First create the fixture file
const base = require('@playwright/test');

async function clearDatabase(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('PoultryTrackerDB');
      request.onsuccess = () => resolve();
    });
  });
}

async function setupDatabase(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const request = indexedDB.open('PoultryTrackerDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('dailyCounts', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date');
        store.createIndex('breed', 'breed');
      };
      request.onsuccess = () => resolve();
    });
  });
}

exports.test = base.test.extend({
  db: async ({ page }, runTest) => {
    // Setup database before test
    await clearDatabase(page);
    await setupDatabase(page);
    
    // Make database helper functions available to test
    const db = {
      async getAll() {
        return page.evaluate(() => {
          return new Promise((resolve) => {
            const request = indexedDB.open('PoultryTrackerDB', 1);
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('dailyCounts', 'readonly');
              const store = tx.objectStore('dailyCounts');
              const getRequest = store.getAll();
              getRequest.onsuccess = () => resolve(getRequest.result);
            };
          });
        });
      },
      async clear() {
        await clearDatabase(page);
        await setupDatabase(page);
      }
    };
    
    await runTest(db);
    
    // Cleanup after test
    await clearDatabase(page);
  },
}); 