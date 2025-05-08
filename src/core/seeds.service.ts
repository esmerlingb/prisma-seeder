import { glob } from 'glob'
import path from 'path'
import { PrismaClientLike } from './types'

interface SeedRecord {
  name: string
}

export class SeedsService {
  constructor(private readonly client: PrismaClientLike) {}

  async createSeed(name: string) {
    await this.client.$executeRaw`INSERT INTO _prisma_seeds (name) VALUES (${name})`
  }

  async removeSeed(name: string) {
    await this.client.$executeRaw`DELETE FROM _prisma_seeds WHERE name = ${name}`
  }

  async getSeeds() {
    const records = await this.client.$queryRaw<SeedRecord[]>`SELECT name FROM _prisma_seeds`
    return records.map((record) => record.name)
  }

  async getSeedPaths(pattern: string, order: 'desc' | 'asc'): Promise<string[]> {
    const seedPaths = await glob(pattern)

    // Order descending by timestamp
    return seedPaths.sort((a, b) => {
      const timestampA = parseInt(this.getSeedNameFrom(a).split('_')[0])
      const timestampB = parseInt(this.getSeedNameFrom(b).split('_')[0])
      if (order === 'asc') return timestampA - timestampB
      return timestampB - timestampA
    })
  }

  getSeedNameFrom(seedPath: string) {
    const ext = path.extname(seedPath)
    return path.basename(seedPath, ext)
  }

  getSeedTemplate = () => {
    return (
      "import { PrismaClient } from '@prisma/client'\n\n" +
      'type Db = PrismaClient\n\n' +
      'export const up = async (db: Db) => {}\n\n' +
      'export const down = async (db: Db) => {}\n'
    )
  }
}
