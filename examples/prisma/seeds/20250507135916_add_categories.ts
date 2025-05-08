import { PrismaClient } from '@prisma/client'
import { categories } from './data/categories.js'

type Db = PrismaClient

export const up = async (db: Db) => {
  // Use transaction to make sure all operation succeed
  await db.$transaction(
    categories.map((category) =>
      /**
       * Use upsert to be able to run this seed multiple times by using "refresh" command
       * We can create/update categories and use "refresh" command to update table with new data
       */
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
        in: categories.map((category) => category.id)
      }
    }
  })
}
