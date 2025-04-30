import { PrismaClientLike } from '../types'
import { PrismaSeedModule } from './types'

export const validateModule = <T extends PrismaClientLike>(module: PrismaSeedModule<T>) => {
  if (!module.up || !module.down) {
    throw new Error('Seed module must have up and down functions')
  }

  if (typeof module.up !== 'function' || typeof module.down !== 'function') {
    throw new Error('up/down must be of type function')
  }
}
