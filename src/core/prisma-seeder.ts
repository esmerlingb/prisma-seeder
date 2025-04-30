import { Command } from 'commander'
import { getSeedOperation, SeedOperationType } from './operations'
import { PrismaClientLike } from './types'

export interface PrismaSeederOptions<T extends PrismaClientLike> {
  client: T
  seeds: string
}

interface CommandOptions {
  name?: string[]
  steps?: number
}

export class PrismaSeeder<T extends PrismaClientLike> {
  private readonly program = new Command()

  constructor(private readonly options: PrismaSeederOptions<T>) {
    this.program
      .command('up')
      .description('Run seed up')
      .option('-n, --name <names...>', 'Specify seed names')
      .option('-s, --steps <number>', 'Specify number of steps', parseInt)
      .action(async (options: CommandOptions) => await this.handleOperation('up', options))

    this.program
      .command('down')
      .description('Rollback latest seeds')
      .option('-n, --name <names...>', 'Specify seed names')
      .option('-s, --steps <number>', 'Specify number of steps', parseInt)
      .action(async (options: CommandOptions) => await this.handleOperation('down', options))

    this.program
      .command('refresh')
      .description('Re-run seeds. This command re-applies seeds from the start, skipping any rollback process')
      .requiredOption('-n, --name <names...>', 'Specify seed names')
      .action(async (options: CommandOptions) => await this.handleOperation('refresh', options))

    this.program
      .command('reset')
      .description('It rollback and the re-apply for the specified seeds')
      .requiredOption('-n, --name <names...>', 'Specify seed names')
      .action(async (options: CommandOptions) => await this.handleOperation('reset', options))
  }

  async run() {
    try {
      await this.program.parseAsync(process.argv)
    } finally {
      this.options.client.$disconnect()
    }
  }

  private async handleOperation(operation: SeedOperationType, options: CommandOptions) {
    const seedOperation = getSeedOperation(operation, this.options)
    return await seedOperation.run(options)
  }
}
