#!/usr/bin/env node
import { program } from 'commander'
import { GenerateSeedCommand, GenerateSeedOptions } from './commands/generate-seed'

program
  .command('generate:seed')
  .description('Generate a new seed file')
  .option('-d, --dir <dir>', 'Directory to save the seed file')
  .option('-n, --name <name>', 'Name of the seed file')
  .action(async (options: GenerateSeedOptions) => {
    const command = new GenerateSeedCommand()
    await command.run(options)
    process.exit()
  })

program.parseAsync(process.argv)
