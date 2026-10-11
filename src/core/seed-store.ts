import { isPrismaOrmClient, PrismaClientLike, PrismaOrmClientLike, SeederClient } from './types'

/**
 * Reads and writes the `_prisma_seeds` table that tracks applied seeds
 */
export interface SeedStore {
  create(name: string): Promise<void>
  remove(name: string): Promise<void>
  list(): Promise<string[]>
  close(): Promise<void>
}

interface SeedRecord {
  name: string
}

// Prisma ORM 4–7
class PrismaClientSeedStore implements SeedStore {
  constructor(private readonly client: PrismaClientLike) {}

  async create(name: string) {
    await this.client.$executeRaw`INSERT INTO _prisma_seeds (name) VALUES (${name})`
  }

  async remove(name: string) {
    await this.client.$executeRaw`DELETE FROM _prisma_seeds WHERE name = ${name}`
  }

  async list() {
    const records = await this.client.$queryRaw<SeedRecord[]>`SELECT name FROM _prisma_seeds`
    return records.map((record) => record.name)
  }

  async close() {
    await this.client.$disconnect()
  }
}

// Codec that decodes a text column, per Prisma ORM 8 target
const textCodecs: Record<string, string> = {
  postgres: 'pg/text@1',
  sqlite: 'sqlite/text@1'
}

// Prisma ORM 8
class PrismaOrmSeedStore implements SeedStore {
  private readonly textCodec: string

  constructor(private readonly client: PrismaOrmClientLike) {
    const target = client.contract.target
    const textCodec = textCodecs[target]
    if (!textCodec) {
      throw new Error(`prisma-seeder does not support the Prisma ORM 8 "${target}" target`)
    }
    this.textCodec = textCodec
  }

  async create(name: string) {
    const plan = this.client.raw.sql`INSERT INTO _prisma_seeds (name) VALUES (${name})`.affectedCount().build()
    await this.client.runtime().execute(plan)
  }

  async remove(name: string) {
    const plan = this.client.raw.sql`DELETE FROM _prisma_seeds WHERE name = ${name}`.affectedCount().build()
    await this.client.runtime().execute(plan)
  }

  async list() {
    const plan = this.client.raw.sql`SELECT name FROM _prisma_seeds`.returnsRow({ name: this.textCodec }).build()
    const names: string[] = []
    for await (const record of this.client.runtime().query(plan)) {
      names.push((record as SeedRecord).name)
    }
    return names
  }

  async close() {
    await this.client.close()
  }
}

const missingTablePattern = /does ?n[o']t exist|no such table|invalid object name/i

// Replace the database's "table not found" error with setup instructions
const withSetupHint = <T>(operation: () => Promise<T>) =>
  operation().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('_prisma_seeds') && missingTablePattern.test(message)) {
      throw new Error(
        'The _prisma_seeds table does not exist. Add the PrismaSeeds model to your schema and run your migrations. ' +
          'See https://github.com/esmerlingb/prisma-seeder#usage',
        { cause: error }
      )
    }
    throw error
  })

class GuardedSeedStore implements SeedStore {
  constructor(private readonly store: SeedStore) {}

  create(name: string) {
    return withSetupHint(() => this.store.create(name))
  }

  remove(name: string) {
    return withSetupHint(() => this.store.remove(name))
  }

  list() {
    return withSetupHint(() => this.store.list())
  }

  close() {
    return this.store.close()
  }
}

export const createSeedStore = (client: SeederClient): SeedStore => {
  const store = isPrismaOrmClient(client) ? new PrismaOrmSeedStore(client) : new PrismaClientSeedStore(client)
  return new GuardedSeedStore(store)
}
