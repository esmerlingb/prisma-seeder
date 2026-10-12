import { Command } from 'commander'
import { getSeedOperation, SeedOperationType } from './operations'
import { createSeedStore, SeedStore } from './seed-store'
import { SeedsService } from './seeds.service'
import { SeederClient } from './types'

export interface PrismaSeederOptions<T extends SeederClient> {
  client: T
  seeds: string | string[]
  /** Contents of the files created by the `generate` command */
  template?: string
}

interface CommandOptions {
  name?: string[]
  steps?: number
  dir?: string
}

export class PrismaSeeder<T extends SeederClient> {
  private readonly program = new Command()
  private readonly store: SeedStore

  constructor(private readonly options: PrismaSeederOptions<T>) {
    this.store = createSeedStore(options.client)

    this.program
      .command('up')
      .description('Applies pending seeds')
      .option('-n, --name <names...>', 'Specify seed names')
      .option('-s, --steps <number>', 'Specify number of steps', parseInt)
      .action(async (options: CommandOptions) => await this.handleOperation('up', options))

    this.program
      .command('down')
      .description('Revert seeds')
      .option('-n, --name <names...>', 'Specify seed names')
      .option('-s, --steps <number>', 'Specify number of steps', parseInt)
      .action(async (options: CommandOptions) => await this.handleOperation('down', options))

    this.program
      .command('refresh')
      .description('Re-applies seeds skipping rollback')
      .requiredOption('-n, --name <names...>', 'Specify seed names')
      .action(async (options: CommandOptions) => await this.handleOperation('refresh', options))

    this.program
      .command('reset')
      .description('Rollback and re-applies seeds')
      .requiredOption('-n, --name <names...>', 'Specify seed names')
      .action(async (options: CommandOptions) => await this.handleOperation('reset', options))

    this.program
      .command('generate')
      .description('Generate a new seed file')
      .option('-n, --name <name...>', 'Name of the seed file')
      .option('-d, --dir <dir>', 'Directory to save the seed file')
      .action(async (options: CommandOptions) => await this.handleOperation('generate', options))

    this.program.addHelpText('after', '\nFor detailed help about a specific command, use: seed [command] -h')
  }

  async run() {
    try {
      await this.program.parseAsync(process.argv)
    } finally {
      await this.store.close()
    }
  }

  private async handleOperation(operation: SeedOperationType, options: CommandOptions) {
    const seedsService = new SeedsService(this.store, this.options.template)
    const seedOperation = getSeedOperation(operation, this.options, seedsService)
    return await seedOperation.run(options)
  }
}
