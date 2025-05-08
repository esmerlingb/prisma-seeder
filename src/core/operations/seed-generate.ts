import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline/promises'
import { PrismaSeederOptions } from '../prisma-seeder'
import { SeedsService } from '../seeds.service'
import { PrismaClientLike } from '../types'
import { GetSeedsInputs, SeedOperation } from './types'
import { getCurrentTimestamp } from './utils'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export class SeedGenerate<T extends PrismaClientLike> implements SeedOperation {
  constructor(
    private readonly options: PrismaSeederOptions<T>,
    private readonly seedsService: SeedsService
  ) {}

  async run({ name, dir }: GetSeedsInputs): Promise<void> {
    const seedsPath = dir ?? path.dirname(this.options.seeds)
    const rawNames = name ?? [await rl.question('Seed name: ')]

    for (const rawName of rawNames) {
      await this.createSeed(rawName, seedsPath)
    }
  }

  private async createSeed(name: string, seedsDir: string) {
    await fs.mkdir(seedsDir, { recursive: true })

    const parsedName = this.parseName(name)
    const seedName = `${getCurrentTimestamp()}_${parsedName}.ts`
    const seedPath = path.join(seedsDir, seedName)
    const template = this.seedsService.getSeedTemplate()

    await fs.writeFile(seedPath, template)

    console.log(`Seed ${seedName} generated at ${seedsDir}`)
  }

  private parseName(name: string): string {
    return name.replace(/[\s-]/g, '_')
  }
}
