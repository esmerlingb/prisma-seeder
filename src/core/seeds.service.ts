import { glob } from 'glob'
import path from 'path'
import { SeedStore } from './seed-store'

export class SeedsService {
  constructor(
    private readonly store: SeedStore,
    private readonly template?: string
  ) {}

  async createSeed(name: string) {
    await this.store.create(name)
  }

  async removeSeed(name: string) {
    await this.store.remove(name)
  }

  async getSeeds() {
    return await this.store.list()
  }

  async getSeedPaths(pattern: string, order: 'desc' | 'asc'): Promise<string[]> {
    // Lets Windows patterns built with path.join use backslashes as separators
    const seedPaths = await glob(pattern, { windowsPathsNoEscape: true })

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
      this.template ??
      "import type { Seed } from 'prisma-seeder'\n\n" +
        'export const up: Seed = async (db) => {}\n\n' +
        'export const down: Seed = async (db) => {}\n'
    )
  }
}
