export const getSeedTemplate = () => {
  return `import { PrismaClient } from '@prisma/client'

type Db = PrismaClient

export const up = async (db: Db) => {}

export const down = async (db: Db) => {}
`
}
