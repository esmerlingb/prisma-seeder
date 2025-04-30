import { PrismaSeederOptions } from '../prisma-seeder'
import { SeedsService } from '../seeds.service'
import { PrismaClientLike } from '../types'
import { GetSeedsInputs, PrismaSeedModule, SeedOperation } from './types'
import { validateModule } from './utils'

export class SeedReset<T extends PrismaClientLike> implements SeedOperation {
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

  async getSeeds({ name }: GetSeedsInputs): Promise<string[]> {
    const appliedSeeds = await this.seedsService.getSeeds()
    const seedPaths = await this.seedsService.getSeedPaths(this.options.seeds, 'asc')

    return seedPaths.filter((seedPath) => {
      const seed = this.seedsService.getSeedNameFrom(seedPath)
      const isApplied = appliedSeeds.some((appliedSeed) => appliedSeed === seed)
      const isNameMatch = name ? name.includes(seed) : false
      return isApplied && isNameMatch
    })
  }

  async handleSeed(path: string): Promise<void> {
    const seed = this.seedsService.getSeedNameFrom(path)
    console.log('Resetting seed: %s', seed)
    const seedModule: PrismaSeedModule<T> = await import(path)
    validateModule(seedModule)
    console.log('Running down...')
    await seedModule.down(this.options.client)
    console.log('Running up...')
    await seedModule.up(this.options.client)
    console.log('Seed %s executed successfully\n', seed)
  }
}
