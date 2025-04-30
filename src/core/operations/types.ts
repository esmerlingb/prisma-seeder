import { PrismaClientLike } from '../types'

export interface GetSeedsInputs {
  name?: string[]
  steps?: number
}

export interface PrismaSeedModule<T extends PrismaClientLike> {
  up: (client: T) => Promise<void>
  down: (client: T) => Promise<void>
}

export interface SeedOperationOptions<T extends PrismaClientLike> {
  client: T
  seeds: string
}

export interface SeedOperation {
  run: (inputs: GetSeedsInputs) => Promise<void>
  getSeeds: (inputs: GetSeedsInputs) => Promise<string[]>
  handleSeed: (path: string) => Promise<void>
}
