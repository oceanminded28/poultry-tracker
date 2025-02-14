import { openDB } from 'idb';

const DB_NAME = 'PoultryTrackerDB';
const DB_VERSION = 1;

async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the stores
      const dailyCountsStore = db.createObjectStore('dailyCounts', {
        keyPath: 'id',
        autoIncrement: true,
      });
      dailyCountsStore.createIndex('date', 'date');
      dailyCountsStore.createIndex('breed', 'breed');
    },
  });
  return db;
}

const DbService = {
  saveDailySnapshot: async (data) => {
    const db = await initDB();
    const tx = db.transaction('dailyCounts', 'readwrite');
    const store = tx.objectStore('dailyCounts');

    const today = new Date().toISOString().split('T')[0];
    const snapshot = {
      date: today,
      data: data,
      createdAt: new Date().toISOString(),
    };

    await store.add(snapshot);
    await tx.done;
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
    const tx = db.transaction('dailyCounts', 'readonly');
    const store = tx.objectStore('dailyCounts');
    const index = store.index('date');

    const records = await index.getAll();
    return records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= new Date(startDate) && 
             recordDate <= new Date(endDate) &&
             record.data[breed];
    });
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
      '2 Month',
      'Juvenile Total',
      'Cockerels',
      'Pullets',
      'Unknown',
      'Breeding Hens',
      'Breeding Roosters'
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
          breedData.stages['2 Month'] || 0,
          breedData.juvenile.cockerels + breedData.juvenile.pullets + breedData.juvenile.unknown,
          breedData.juvenile.cockerels,
          breedData.juvenile.pullets,
          breedData.juvenile.unknown,
          breedData.breeders.hens,
          breedData.breeders.roosters
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