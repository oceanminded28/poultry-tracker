import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const breedData = await request.json()
    
    if (!breedData || typeof breedData !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const now = new Date()
    const records = []

    for (const [breed, data] of Object.entries(breedData)) {
      // Handle breeders
      if (data?.breeders) {
        const { females = 0, males = 0 } = data.breeders
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
      if (data?.juvenile) {
        const { females = 0, males = 0, unknown = 0 } = data.juvenile
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

      // Handle other stages
      if (data?.stages) {
        for (const [stage, count] of Object.entries(data.stages)) {
          if (count > 0) {
            records.push(
              prisma.dailyCount.create({
                data: {
                  date: now,
                  breed,
                  stage,
                  count
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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