import { stringify } from 'csv-stringify/sync';
import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from '@/constants/database';
import { getCategoryForBreed } from '@/constants/breeds';
import { STAGES } from '@/constants/breeds';

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
      console.log('Input data:', data);  // Log the input data

      for (const [breed, breedData] of Object.entries(data)) {
        // Log the raw values
        console.log('Processing breed:', breed, {
          breeders: breedData.breeders,
          juvenile: breedData.juvenile
        });

        // Calculate total count
        const totalCount = 
          Number(breedData.breeders.females || 0) +
          Number(breedData.breeders.males || 0) +
          Number(breedData.juvenile.males || 0) +
          Number(breedData.juvenile.females || 0) +
          Number(breedData.juvenile.unknown || 0) +
          Number(breedData.stages['Incubator'] || 0) +
          Number(breedData.stages['Hatch'] || 0) +
          Number(breedData.stages['1 Month'] || 0) +
          Number(breedData.stages['2 Month'] || 0);

        if (totalCount > 0) {
          // Create the daily count record first
          const dailyCountKey = await tx.objectStore(STORES.DAILY_COUNTS).add({
            date: today,
            breed,
            category: getCategoryForBreed(breed),
            stage: 'Total',
            count: totalCount
          });

          // Save the four specific stages
          const stages = ['Incubator', 'Hatch', '1 Month', '2 Month'];
          for (const stage of stages) {
            await tx.objectStore(STORES.DAILY_COUNTS).add({
              date: today,
              breed,
              category: getCategoryForBreed(breed),
              stage,
              count: Number(breedData.stages[stage] || 0)
            });
          }

          // Save breeders
          await tx.objectStore(STORES.BREEDERS).add({
            daily_count_id: dailyCountKey,
            females: Number(breedData.breeders.females) || 0,
            males: Number(breedData.breeders.males) || 0
          });

          // Save juveniles
          await tx.objectStore(STORES.JUVENILES).add({
            daily_count_id: dailyCountKey,
            males: Number(breedData.juvenile.males) || 0,
            females: Number(breedData.juvenile.females) || 0,
            unknown: Number(breedData.juvenile.unknown) || 0
          });

          console.log('Saved complete record for:', breed);
        } else {
          console.log('Skipping breed with no counts:', breed);
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
        females: breeders?.females || 0,
        males: breeders?.males || 0,
        males: juveniles?.males || 0,
        females: juveniles?.females || 0,
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

    const dates = counts.map(c => new Date(c.date).getTime());
    const latestDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
    const latestCounts = counts.filter(c => c.date === latestDate);
    const uniqueCounts = new Map();
    
    for (const count of latestCounts) {
      const breeders = await tx.objectStore(STORES.BREEDERS).get(count.id);
      const juveniles = await tx.objectStore(STORES.JUVENILES).get(count.id);
      
      console.log('Raw data for:', count.breed, { breeders, juveniles });
      
      const key = count.breed;
      
      const entry = {
        date: count.date,
        category: count.category,
        breed: count.breed,
        stage: count.stage,
        count: count.count,
        breeders: {
          females: Number(breeders?.females) || 0,
          males: Number(breeders?.males) || 0
        },
        juvenile: {
          males: Number(juveniles?.males) || 0,
          females: Number(juveniles?.females) || 0,
          unknown: Number(juveniles?.unknown) || 0
        }
      };
      
      entry.count = entry.females + entry.males + entry.males + entry.females + entry.unknown;
      
      if (entry.count > 0) {
        uniqueCounts.set(key, entry);
      }
    }

    return Array.from(uniqueCounts.values());
  },

  generateCSV: (data) => {
    try {
      const filteredData = data.filter(record => 
        record.females > 0 || 
        record.males > 0 || 
        record.unknown > 0
      );

      const formattedData = filteredData.map(record => ({
        Date: record.date,
        Category: record.category,
        Breed: record.breed,
        Stage: record.stage,
        Count: record.count,
        'Breeding Females': record.females,
        'Breeding Males': record.males,
        'Juvenile Males': record.males,
        'Juvenile Females': record.females,
        'Juvenile Unknown': record.unknown
      }));

      return stringify(formattedData, {
        header: true,
        columns: [
          'Date', 'Category', 'Breed', 'Stage', 'Count',
          'Breeding Females', 'Breeding Males',
          'Juvenile Males', 'Juvenile Females', 'Juvenile Unknown'
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
  },

  // Add this function to help us debug
  debugDatabase: async () => {
    const db = await dbPromise;
    const tx = db.transaction([STORES.DAILY_COUNTS, STORES.BREEDERS, STORES.JUVENILES], 'readonly');
    
    const counts = await tx.objectStore(STORES.DAILY_COUNTS).getAll();
    const breeders = await tx.objectStore(STORES.BREEDERS).getAll();
    const juveniles = await tx.objectStore(STORES.JUVENILES).getAll();
    
    console.log('Database contents:');
    console.log('Counts:', counts);
    console.log('Breeders:', breeders);
    console.log('Juveniles:', juveniles);
    
    // Log the database version
    console.log('Database version:', db.version);
    // Log the object store names
    console.log('Object stores:', Array.from(db.objectStoreNames));
  }
};

// Call this function when the app starts
if (typeof window !== 'undefined') {
  DbService.debugDatabase().catch(console.error);
}

export default DbService;