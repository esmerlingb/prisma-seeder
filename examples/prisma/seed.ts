import { PrismaSeeder } from '#src/index.js'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const db = new PrismaClient()

async function main() {
  const seeder = new PrismaSeeder({
    client: db,
    seeds: path.join(__dirname, './seeds/*.{ts,js}') // Glob pattern to match your seeds
  })

  await seeder.run()

  process.exit()
}

main()
