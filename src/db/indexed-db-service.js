import { openDB } from 'idb';
import { STORES } from '@/constants/database';
import { STAGES } from '@/constants/breeds';

const DB_NAME = 'poultryDB';
const DB_VERSION = 2;

async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the stores
      const dailyCountsStore = db.createObjectStore(STORES.DAILY_COUNTS, {
        keyPath: 'id',
        autoIncrement: true,
      });
      dailyCountsStore.createIndex('date', 'date');
      dailyCountsStore.createIndex('breed', 'breed');
      dailyCountsStore.createIndex('stage', 'stage');

      db.createObjectStore(STORES.BREEDERS, {
        keyPath: 'id',
        autoIncrement: true,
      });

      db.createObjectStore(STORES.JUVENILES, {
        keyPath: 'id',
        autoIncrement: true,
      });
    },
  });
  return db;
}

const DbService = {
  saveDailySnapshot: async (data) => {
    const db = await initDB();
    const tx = db.transaction([STORES.DAILY_COUNTS, STORES.BREEDERS, STORES.JUVENILES], 'readwrite');
    const today = new Date().toISOString().split('T')[0];

    try {
      for (const [breed, breedData] of Object.entries(data)) {
        let hasData = false;
        const dailyCountKey = await tx.objectStore(STORES.DAILY_COUNTS).add({
          date: today,
          breed,
          stage: STAGES[0], // Use first stage instead of 'Total'
          count: Number(breedData.stages[STAGES[0]] || 0)
        });

        // Save all stages
        for (const stage of STAGES) {
          const count = Number(breedData.stages[stage] || 0);
          if (count > 0) {
            hasData = true;
            await tx.objectStore(STORES.DAILY_COUNTS).add({
              date: today,
              breed,
              stage,
              count
            });
          }
        }

        // Save breeders if there are any
        const breedersCount = Number(breedData.breeders.females || 0) + Number(breedData.breeders.males || 0);
        if (breedersCount > 0) {
          hasData = true;
          await tx.objectStore(STORES.BREEDERS).add({
            daily_count_id: dailyCountKey,
            females: Number(breedData.breeders.females) || 0,
            males: Number(breedData.breeders.males) || 0
          });
        }

        // Save juveniles if there are any
        const juvenileCount = Number(breedData.juvenile.males || 0) + 
                            Number(breedData.juvenile.females || 0) + 
                            Number(breedData.juvenile.unknown || 0);
        if (juvenileCount > 0) {
          hasData = true;
          await tx.objectStore(STORES.JUVENILES).add({
            daily_count_id: dailyCountKey,
            males: Number(breedData.juvenile.males) || 0,
            females: Number(breedData.juvenile.females) || 0,
            unknown: Number(breedData.juvenile.unknown) || 0
          });
        }

        // If no data was saved, delete the initial record
        if (!hasData) {
          await tx.objectStore(STORES.DAILY_COUNTS).delete(dailyCountKey);
        }
      }
      await tx.done;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  },

  getLatestSnapshot: async () => {
    const db = await initDB();
    const tx = db.transaction('dailyCounts', 'readonly');
    const store = tx.objectStore('dailyCounts');
    const index = store.index('date');
    
    // Get all records and sort by date
    const records = await index.getAll();
    return records.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];
  },

  getBreedHistory: async (breed, startDate, endDate) => {
    const db = await initDB();
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
        breeders: {
          females: breeders?.females || 0,
          males: breeders?.males || 0
        },
        juvenile: {
          males: juveniles?.males || 0,
          females: juveniles?.females || 0,
          unknown: juveniles?.unknown || 0
        }
      };
    }));
  },

  generateCSV: (data) => {
    // Convert data to CSV format
    const headers = [
      'Date',
      'Category',
      'Breed',
      'Incubator',
      'Hatch',
      '1 Month',
      'Juvenile Total',
      'Unknown',
    ].join(',');

    const rows = data.map(snapshot => {
      return Object.entries(snapshot.data).map(([breed, breedData]) => {
        return [
          snapshot.date,
          // You'll need to add category lookup here
          breed,
          breedData.stages['Incubator'] || 0,
          breedData.stages['Hatch'] || 0,
          breedData.stages['1 Month'] || 0,
          breedData.juvenile.unknown,
        ].join(',');
      }).join('\n');
    }).join('\n');

    return `${headers}\n${rows}`;
  },

  downloadCSV: (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportLatestSnapshot: async (filename) => {
    try {
      const snapshot = await DbService.getLatestSnapshot();
      if (snapshot) {
        const csvContent = DbService.generateCSV([snapshot]);
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
      if (data.length > 0) {
        const csvContent = DbService.generateCSV(data);
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