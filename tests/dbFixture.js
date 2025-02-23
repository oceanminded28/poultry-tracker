const { test: base } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Extend the test with a db fixture
const test = base.extend({
  db: async ({}, testInfo) => {
    await testInfo({
      clearAll: async () => {
        await prisma.breeder.deleteMany();
        await prisma.juvenile.deleteMany();
        await prisma.dailyCount.deleteMany();
      },
      getAll: async () => {
        const records = await prisma.dailyCount.findMany({
          include: {
            breeders: true,
            juveniles: true
          }
        });
        
        // Clean up records by removing undefined fields
        return records.map(record => {
          const cleaned = {
            id: record.id,
            date: record.date,
            breed: record.breed,
            stage: record.stage,
            count: record.count
          };
          
          if (record.breeders) cleaned.breeders = record.breeders;
          if (record.juveniles) cleaned.juveniles = record.juveniles;
          
          return cleaned;
        });
      }
    });
  },
});

module.exports = { test }; 