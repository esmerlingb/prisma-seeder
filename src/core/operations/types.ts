import { SeederClient } from '../types'

export interface GetSeedsInputs {
  name?: string[]
  steps?: number
  dir?: string
}

export interface PrismaSeedModule<T extends SeederClient> {
  up: (client: T) => Promise<void>
  down: (client: T) => Promise<void>
}

export interface SeedOperationOptions<T extends SeederClient> {
  client: T
  seeds: string | string[]
}

export interface SeedOperation {
  run: (inputs: GetSeedsInputs) => Promise<void>
  getSeeds?: (inputs: GetSeedsInputs) => Promise<string[]>
  handleSeed?: (path: string) => Promise<void>
}
