import { SeedsService } from '../seeds.service'
import { SeederClient } from '../types'
import { SeedDown } from './seed-down'
import { SeedGenerate } from './seed-generate'
import { SeedRefresh } from './seed-refresh'
import { SeedReset } from './seed-reset'
import { SeedUp } from './seed-up'
import { SeedOperation, SeedOperationOptions } from './types'

export type SeedOperationType = 'up' | 'down' | 'refresh' | 'reset' | 'generate'

export const getSeedOperation = <T extends SeederClient>(
  operation: SeedOperationType,
  options: SeedOperationOptions<T>,
  seedsService: SeedsService
): SeedOperation => {
  switch (operation) {
    case 'up':
      return new SeedUp(options, seedsService)
    case 'down':
      return new SeedDown(options, seedsService)
    case 'refresh':
      return new SeedRefresh(options, seedsService)
    case 'reset':
      return new SeedReset(options, seedsService)
    case 'generate':
      return new SeedGenerate(options, seedsService)
    default:
      throw new Error(`Unsupported seed operation: ${operation}`)
  }
}
