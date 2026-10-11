import { PrismaClient } from '@prisma/client'

type Db = PrismaClient

// Only seeded by seed.test.ts
const testCategories = [
  { id: '0b6f8a52-3c1e-4d7a-9f2b-6e4d1c8a5b30', name: 'Test Goblin' },
  { id: '7d2e9c41-8a5b-4f3e-b1c6-2a9f4e7d0c18', name: 'Test Troll' }
]

export const up = async (db: Db) => {
  await db.$transaction(
    testCategories.map((category) =>
      db.category.upsert({
        where: { id: category.id },
        create: category,
        update: { name: category.name }
      })
    )
  )
}

export const down = async (db: Db) => {
  await db.category.deleteMany({
    where: {
      id: {
        in: testCategories.map((category) => category.id)
      }
    }
  })
}
