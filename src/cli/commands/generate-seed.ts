import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import readline from 'node:readline/promises'
import { getSeedTemplate } from './seed.template'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const getCurrentTimestamp = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

export interface GenerateSeedOptions {
  name?: string
  dir?: string
}

export class GenerateSeedCommand {
  async run(options: GenerateSeedOptions = {}) {
    const name = options.name ?? (await rl.question('Seed name: '))
    const fullName = `${getCurrentTimestamp()}_${name}.ts`

    // Get the directory from where the script is called
    const cwd = process.cwd()

    const defaultSeedsDir = resolve(cwd, 'prisma/seeds')
    const seedsDir = options.dir ?? defaultSeedsDir

    // Path for the new file in the calling package
    const filePath = resolve(cwd, `${seedsDir}/${fullName}`)

    await fs.mkdir(resolve(cwd, seedsDir), { recursive: true })

    const template = getSeedTemplate()

    await fs.writeFile(filePath, template)
  }
}
