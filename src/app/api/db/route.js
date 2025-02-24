import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const breedData = await request.json()
    console.log('API received:', JSON.stringify(breedData, null, 2))
    
    if (!breedData || typeof breedData !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const now = new Date()
    const records = []

    for (const [breed, data] of Object.entries(breedData)) {
      if (!data || typeof data !== 'object') continue;

      // Handle breeders
      if (data.breeders && typeof data.breeders === 'object') {
        const females = Number(data.breeders.females) || 0
        const males = Number(data.breeders.males) || 0
        
        if (females > 0 || males > 0) {
          records.push(
            prisma.dailyCount.create({
              data: {
                date: now,
                breed,
                stage: 'Breeder',
                count: females + males,
                breeders: {
                  create: { females, males }
                }
              }
            })
          )
        }
      }

      // Handle juveniles
      if (data.juvenile && typeof data.juvenile === 'object') {
        const females = Number(data.juvenile.females) || 0
        const males = Number(data.juvenile.males) || 0
        const unknown = Number(data.juvenile.unknown) || 0
        
        if (females > 0 || males > 0 || unknown > 0) {
          records.push(
            prisma.dailyCount.create({
              data: {
                date: now,
                breed,
                stage: 'Juvenile',
                count: females + males + unknown,
                juveniles: {
                  create: { females, males, unknown }
                }
              }
            })
          )
        }
      }

      // Handle stages
      if (data.stages && typeof data.stages === 'object') {
        for (const [stage, count] of Object.entries(data.stages)) {
          const numCount = Number(count) || 0
          if (numCount > 0) {
            records.push(
              prisma.dailyCount.create({
                data: {
                  date: now,
                  breed,
                  stage,
                  count: numCount
                }
              })
            )
          }
        }
      }
    }

    const results = await prisma.$transaction(records)
    return NextResponse.json(results)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
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