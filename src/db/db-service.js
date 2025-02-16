import { stringify } from 'csv-stringify/sync';
import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from '@/constants/database';
import { getCategoryForBreed } from '@/constants/breeds';

// Initialize IndexedDB connection only in browser environment
const dbPromise = (typeof window !== 'undefined' && window.indexedDB) 
  ? openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.DAILY_COUNTS)) {
          const dailyCountsStore = db.createObjectStore(STORES.DAILY_COUNTS, { keyPath: 'id', autoIncrement: true });
          dailyCountsStore.createIndex('date', 'date');
          dailyCountsStore.createIndex('breed', 'breed');
        }
        if (!db.objectStoreNames.contains(STORES.BREEDERS)) {
          db.createObjectStore(STORES.BREEDERS, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORES.JUVENILES)) {
          db.createObjectStore(STORES.JUVENILES, { keyPath: 'id', autoIncrement: true });
        }
      }
    })
  : null;

const DbService = {
  // Save a daily snapshot
  saveDailySnapshot: async (data) => {
    const db = await dbPromise;
    const tx = db.transaction([STORES.DAILY_COUNTS, STORES.BREEDERS, STORES.JUVENILES], 'readwrite');
    const today = new Date().toISOString().split('T')[0];

    try {
      for (const [breed, breedData] of Object.entries(data)) {
        for (const [stage, count] of Object.entries(breedData.stages)) {
          // Save main count
          const dailyCount = await tx.objectStore(STORES.DAILY_COUNTS).add({
            date: today,
            breed,
            category: getCategoryForBreed(breed),
            stage,
            count
          });

          // Save breeders
          await tx.objectStore(STORES.BREEDERS).add({
            daily_count_id: dailyCount,
            hens: breedData.breeders.hens,
            roosters: breedData.breeders.roosters
          });

          // Save juveniles
          await tx.objectStore(STORES.JUVENILES).add({
            daily_count_id: dailyCount,
            cockerels: breedData.juvenile.cockerels,
            pullets: breedData.juvenile.pullets,
            unknown: breedData.juvenile.unknown
          });
        }
      }
      await tx.done;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  },

  // Get historical data for a breed
  getBreedHistory: async (breed, startDate, endDate) => {
    const db = await dbPromise;
    const tx = db.transaction([STORES.DAILY_COUNTS, STORES.BREEDERS, STORES.JUVENILES], 'readonly');
    
    const counts = breed 
      ? await tx.objectStore(STORES.DAILY_COUNTS).index('breed').getAll(breed)
      : await tx.objectStore(STORES.DAILY_COUNTS).getAll();
    
    const filteredCounts = counts.filter(count => 
      count.date >= startDate && count.date <= endDate
    );

    return Promise.all(filteredCounts.map(async count => {
      const breeders = await tx.objectStore(STORES.BREEDERS).get(count.id);
      const juveniles = await tx.objectStore(STORES.JUVENILES).get(count.id);
      
      return {
        date: count.date,
        category: count.category,
        breed: count.breed,
        stage: count.stage,
        count: count.count,
        hens: breeders?.hens || 0,
        roosters: breeders?.roosters || 0,
        cockerels: juveniles?.cockerels || 0,
        pullets: juveniles?.pullets || 0,
        unknown: juveniles?.unknown || 0
      };
    }));
  },

  // Get the latest snapshot
  getLatestSnapshot: async () => {
    const db = await dbPromise;
    const tx = db.transaction([STORES.DAILY_COUNTS, STORES.BREEDERS, STORES.JUVENILES], 'readonly');
    
    const counts = await tx.objectStore(STORES.DAILY_COUNTS).getAll();
    if (!counts || counts.length === 0) {
      return [];
    }

    // Find the latest date
    const dates = counts.map(c => new Date(c.date).getTime());
    const latestDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
    
    const latestCounts = counts.filter(c => c.date === latestDate);
    
    // Get related data for each count
    const result = await Promise.all(latestCounts.map(async count => {
      const breeders = await tx.objectStore(STORES.BREEDERS).get(count.id);
      const juveniles = await tx.objectStore(STORES.JUVENILES).get(count.id);
      
      return {
        date: count.date,
        category: count.category,
        breed: count.breed,
        stage: count.stage,
        count: count.count,
        hens: breeders?.hens || 0,
        roosters: breeders?.roosters || 0,
        cockerels: juveniles?.cockerels || 0,
        pullets: juveniles?.pullets || 0,
        unknown: juveniles?.unknown || 0
      };
    }));

    return result;
  },

  generateCSV: (data) => {
    try {
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Data must be an array');
        return null;
      }

      // Format data for CSV
      const formattedData = data.map(record => ({
        Date: record.date,
        Category: record.category,
        Breed: record.breed,
        Stage: record.stage,
        Count: record.count,
        'Breeding Hens': record.hens,
        'Breeding Roosters': record.roosters,
        'Juvenile Cockerels': record.cockerels,
        'Juvenile Pullets': record.pullets,
        'Juvenile Unknown': record.unknown
      }));

      // Convert to CSV
      return stringify(formattedData, {
        header: true,
        columns: [
          'Date', 'Category', 'Breed', 'Stage', 'Count',
          'Breeding Hens', 'Breeding Roosters',
          'Juvenile Cockerels', 'Juvenile Pullets', 'Juvenile Unknown'
        ]
      });
    } catch (error) {
      console.error('CSV generation failed:', error);
      return null;
    }
  },

  downloadCSV: (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  exportLatestSnapshot: async (filename) => {
    try {
      const data = await DbService.getLatestSnapshot();
      const csvContent = DbService.generateCSV(data);
      if (csvContent) {
        DbService.downloadCSV(csvContent, filename);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  },

  exportDateRange: async (startDate, endDate, filename) => {
    try {
      const data = await DbService.getBreedHistory(null, startDate, endDate);
      const csvContent = DbService.generateCSV(data);
      if (csvContent) {
        DbService.downloadCSV(csvContent, filename);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  }
};

export default DbService;