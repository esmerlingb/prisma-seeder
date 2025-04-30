import { SeedsService } from '../seeds.service'
import { PrismaClientLike } from '../types'
import { SeedDown } from './seed-down'
import { SeedRefresh } from './seed-refresh'
import { SeedReset } from './seed-reset'
import { SeedUp } from './seed-up'
import { SeedOperation, SeedOperationOptions } from './types'

export type SeedOperationType = 'up' | 'down' | 'refresh' | 'reset'

export const getSeedOperation = <T extends PrismaClientLike>(
  operation: SeedOperationType,
  options: SeedOperationOptions<T>
): SeedOperation => {
  const seedsService = new SeedsService(options.client)
  switch (operation) {
    case 'up':
      return new SeedUp(options, seedsService)
    case 'down':
      return new SeedDown(options, seedsService)
    case 'refresh':
      return new SeedRefresh(options, seedsService)
    case 'reset':
      return new SeedReset(options, seedsService)
    default:
      throw new Error(`Unsupported seed operation: ${operation}`)
  }
}
