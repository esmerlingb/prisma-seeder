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

export const getCurrentTimestamp = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}
