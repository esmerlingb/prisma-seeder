import { PrismaSeederOptions } from '../prisma-seeder'
import { SeedsService } from '../seeds.service'
import { SeederClient } from '../types'
import { GetSeedsInputs, SeedOperation } from './types'
import { importSeed } from './utils'

export class SeedDown<T extends SeederClient> implements SeedOperation {
  constructor(
    private readonly options: PrismaSeederOptions<T>,
    private readonly seedsService: SeedsService
  ) {}

  async run(inputs: GetSeedsInputs): Promise<void> {
    const seeds = await this.getSeeds(inputs)
    for (const seed of seeds) {
      await this.handleSeed(seed)
    }
  }

  async getSeeds({ name, steps }: GetSeedsInputs): Promise<string[]> {
    // Without names, revert only the last applied seed
    const limit = steps ?? (name ? undefined : 1)
    const appliedSeeds = await this.seedsService.getSeeds()
    const seedPaths = await this.seedsService.getSeedPaths(this.options.seeds, 'desc')

    return seedPaths
      .filter((seedPath) => {
        const seed = this.seedsService.getSeedNameFrom(seedPath)
        const isApplied = appliedSeeds.some((appliedSeed) => appliedSeed === seed)
        const isNameMatch = name ? name.includes(seed) : true
        return isApplied && isNameMatch
      })
      .slice(0, limit)
  }

  async handleSeed(path: string): Promise<void> {
    const seed = this.seedsService.getSeedNameFrom(path)
    console.log('Rollback seed: %s', seed)
    const seedModule = await importSeed<T>(path)
    await seedModule.down(this.options.client)
    await this.seedsService.removeSeed(seed)
    console.log('Seed %s executed successfully\n', seed)
  }
}
