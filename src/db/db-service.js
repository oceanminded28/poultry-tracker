import { PrismaClient } from '@prisma/client'
import { stringify } from 'csv-stringify/sync'

const prisma = new PrismaClient()

const isProd = process.env.NODE_ENV === 'production'

const DbService = {
  // Save a daily snapshot
  saveDailySnapshot: async (breedData) => {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveDailySnapshot',
        data: breedData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save snapshot')
    }

    return await response.json()
  },

  // Get historical data for a breed
  getBreedHistory: async (breed, startDate, endDate) => {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getBreedHistory',
          data: { breed, startDate, endDate }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Server response:', text)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get breed history:', error)
      return []
    }
  },

  // Get the latest snapshot
  getLatestSnapshot: async () => {
    try {
      const latestDate = await prisma.dailyCount.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true }
      })

      if (!latestDate) return []

      return await prisma.dailyCount.findMany({
        where: { date: latestDate.date },
        include: {
          breeders: true,
          juveniles: true
        }
      })
    } catch (error) {
      console.error('Failed to get latest snapshot:', error)
      return []
    }
  },

  generateCSV: (data) => {
    try {
      const filteredData = data.filter(record => 
        record.females > 0 || 
        record.males > 0 || 
        record.unknown > 0
      )

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
      }))

      return stringify(formattedData, {
        header: true,
        columns: [
          'Date', 'Category', 'Breed', 'Stage', 'Count',
          'Breeding Females', 'Breeding Males',
          'Juvenile Males', 'Juvenile Females', 'Juvenile Unknown'
        ]
      })
    } catch (error) {
      console.error('CSV generation failed:', error)
      return null
    }
  },

  downloadCSV: (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  },

  exportLatestSnapshot: async (filename) => {
    try {
      const data = await DbService.getLatestSnapshot()
      const csvContent = DbService.generateCSV(data)
      if (csvContent) {
        DbService.downloadCSV(csvContent, filename)
        return true
      }
      return false
    } catch (error) {
      console.error('Export failed:', error)
      return false
    }
  },

  exportDateRange: async (startDate, endDate, filename) => {
    try {
      const data = await DbService.getBreedHistory(null, startDate, endDate)
      const csvContent = DbService.generateCSV(data)
      if (csvContent) {
        DbService.downloadCSV(csvContent, filename)
        return true
      }
      return false
    } catch (error) {
      console.error('Export failed:', error)
      return false
    }
  },

  // Add this function to help us debug
  debugDatabase: async () => {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'debugDatabase'
        })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Server response:', text)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Database contents:', data)
      return data
    } catch (error) {
      console.error('Debug failed:', error)
      return []
    }
  }
}

// Call this function when the app starts
if (typeof window !== 'undefined') {
  DbService.debugDatabase().catch(console.error)
}

export default DbService