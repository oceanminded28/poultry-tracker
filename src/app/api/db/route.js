import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { action, data } = await request.json()
    console.log('API Request:', { action, data })

    switch (action) {
      case 'saveDailySnapshot':
        const result = await saveDailySnapshot(data)
        return NextResponse.json(result)
      
      case 'getBreedHistory':
        const history = await getBreedHistory(data)
        return NextResponse.json(history)
      
      case 'debugDatabase':
        const debug = await debugDatabase()
        return NextResponse.json(debug)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function saveDailySnapshot(breedData) {
  const now = new Date()
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))
  const endOfDay = new Date(now.setHours(23, 59, 59, 999))
  const records = []

  // First, delete any existing records for today in the correct order
  await prisma.$transaction([
    // Delete children first
    prisma.breeder.deleteMany({
      where: {
        dailyCount: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    }),
    prisma.juvenile.deleteMany({
      where: {
        dailyCount: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    }),
    // Then delete parent
    prisma.dailyCount.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
  ])

  // For each breed in the data
  for (const [breed, data] of Object.entries(breedData)) {
    console.log(`Processing ${breed}:`, data)

    // Create breeder record
    if (data.breeders.females > 0 || data.breeders.males > 0) {
      records.push(
        prisma.dailyCount.create({
          data: {
            date: now,
            breed: breed,
            stage: 'Breeder',
            count: data.breeders.females + data.breeders.males,
            breeders: {
              create: {
                females: data.breeders.females,
                males: data.breeders.males
              }
            }
          }
        })
      )
    }

    // Create juvenile record
    if (data.juvenile.females > 0 || data.juvenile.males > 0 || data.juvenile.unknown > 0) {
      records.push(
        prisma.dailyCount.create({
          data: {
            date: now,
            breed: breed,
            stage: 'Juvenile',
            count: data.juvenile.females + data.juvenile.males + data.juvenile.unknown,
            juveniles: {
              create: {
                females: data.juvenile.females,
                males: data.juvenile.males,
                unknown: data.juvenile.unknown
              }
            }
          }
        })
      )
    }

    // Create records for all stages
    for (const [stage, count] of Object.entries(data.stages)) {
      if (stage !== 'Juvenile') {
        records.push(
          prisma.dailyCount.create({
            data: {
              date: now,
              breed: breed,
              stage: stage,
              count: count
            }
          })
        )
      }
    }
  }

  // Execute all creates in a transaction
  console.log(`Creating ${records.length} records`)
  return await prisma.$transaction(records)
}

async function getBreedHistory({ startDate, endDate }) {
  return await prisma.dailyCount.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      breeders: true,
      juveniles: true
    }
  })
}

async function debugDatabase() {
  return await prisma.dailyCount.findMany({
    include: {
      breeders: true,
      juveniles: true
    }
  })
} 