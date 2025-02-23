const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDb() {
  try {
    // Clear related tables first
    await prisma.breeder.deleteMany()
    await prisma.juvenile.deleteMany()
    // Then clear main table
    await prisma.dailyCount.deleteMany()
    
    console.log('Database cleared successfully')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDb()