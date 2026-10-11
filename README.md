# prisma-seeder

[![npm version](https://img.shields.io/npm/v/prisma-seeder)](https://www.npmjs.com/package/prisma-seeder)
[![license](https://img.shields.io/npm/l/prisma-seeder)](./LICENSE)

Take control of your Prisma seeds. Write seeds with `up` and `down` functions, just like classic migrations.

- Applies each seed once and remembers what has already run
- Reverts seeds with `down`, and re-runs them with `refresh` or `reset`
- Generates new seed files with a timestamp, so they run in order
- Works with Prisma ORM 4 to 8

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [How it works](#how-it-works)
- [Setup](#setup)
- [Command Line Interface](#command-line-interface)
- [Typing seeds](#typing-seeds)
- [Example: seeding your database](#example-seeding-your-database)
- [Troubleshooting](#troubleshooting)

## Requirements

- Node.js 20 or newer (Prisma 8 needs Node.js 22.18 or newer)
- One of these Prisma ORM versions:

| Prisma ORM | Databases             | Seed command                              |
| ---------- | --------------------- | ----------------------------------------- |
| 4, 5, 6    | SQL databases         | `"prisma": { "seed" }` in `package.json`  |
| 7          | SQL databases         | `migrations.seed` in `prisma.config.ts`   |
| 8          | PostgreSQL and SQLite | An npm script (Prisma 8 has no `db seed`) |

MongoDB is not supported.

## Installation

```bash
npm install prisma-seeder
```

The examples run TypeScript with [`tsx`](https://tsx.is). Install it too, or use any other runner such as `ts-node`, or `node` for JavaScript files:

```bash
npm install --save-dev tsx
```

## How it works

- A seed is a file that exports an async `up` function (apply) and an async `down` function (revert). Both receive your Prisma client.
- Seed file names start with a timestamp, such as `20250507135916_add_categories.ts`. Seeds run in timestamp order. The [`generate`](#generate-seeds-generate) command names them for you.
- prisma-seeder records each applied seed by its file name (without the extension) in a `_prisma_seeds` table. Renaming an applied seed makes it a new, pending seed.
- If a seed throws, the run stops and that seed is not recorded. Seeds applied before it stay applied.

## Setup

Pick your Prisma version. Every setup does the same four things: add the table that tracks applied seeds, apply it to your database, create a seed script, and register the script as a command.

<details>
<summary><strong>Prisma 4, 5 and 6</strong></summary>

1. Add the `PrismaSeeds` model to your schema. `@@ignore` keeps it out of your Prisma Client.

```prisma
// prisma/schema.prisma
model PrismaSeeds {
  name String @id()

  @@map("_prisma_seeds")
  @@ignore
}
```

2. Create and apply a migration

```bash
npx prisma migrate dev
```

3. Create the seed script. It can live anywhere in your project; this example uses the `prisma` folder. The `Register` declaration [types your seeds](#typing-seeds) with your client.

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { PrismaSeeder } from 'prisma-seeder'

const db = new PrismaClient()

declare module 'prisma-seeder' {
  interface Register {
    client: typeof db
  }
}

async function main() {
  const seeder = new PrismaSeeder({
    client: db,
    seeds: path.join(__dirname, './seeds/*.{ts,js}') // Glob pattern to match your seeds
  })

  await seeder.run()

  process.exit()
}

main()
```

> **Note:** `__dirname` is only available in CommonJS. If your project uses ESM (`"type": "module"`), use `import.meta.dirname` instead.

4. Register the script under `"prisma"` in your `package.json`. Prisma runs it with `prisma db seed`, and automatically after `prisma migrate reset` (and in some cases `prisma migrate dev`).

```json
"prisma": {
  "seed": "tsx prisma/seed.ts up"
}
```

</details>

<details>
<summary><strong>Prisma 7</strong></summary>

1. Add the `PrismaSeeds` model to your schema. `@@ignore` keeps it out of your Prisma Client.

```prisma
// prisma/schema.prisma
model PrismaSeeds {
  name String @id()

  @@map("_prisma_seeds")
  @@ignore
}
```

2. Create and apply a migration, then generate the client

```bash
npx prisma migrate dev
npx prisma generate
```

3. Create the seed script. Import `PrismaClient` from your generator's `output` path and create it with your driver adapter (this example uses PostgreSQL). The `Register` declaration [types your seeds](#typing-seeds) with your client.

```ts
// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg'
import path from 'node:path'
import { PrismaSeeder } from 'prisma-seeder'
import { PrismaClient } from '../generated/prisma/client.js'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

declare module 'prisma-seeder' {
  interface Register {
    client: typeof db
  }
}

const seeder = new PrismaSeeder({
  client: db,
  seeds: path.join(import.meta.dirname, './seeds/*.{ts,js}') // Glob pattern to match your seeds
})

await seeder.run()

process.exit()
```

4. Register the script under `migrations.seed` in your `prisma.config.ts`. Prisma runs it with `prisma db seed`.

```ts
// prisma.config.ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts up'
  },
  datasource: {
    url: process.env.DATABASE_URL!
  }
})
```

</details>

<details>
<summary><strong>Prisma 8</strong></summary>

1. Add the `PrismaSeeds` model to your contract. Prisma 8 doesn't support `@@ignore`, so the model also appears as `db.orm.public.PrismaSeeds`. Leave it to prisma-seeder.

```prisma
// src/prisma/contract.prisma
model PrismaSeeds {
  name String @id()

  @@map("_prisma_seeds")
}
```

2. Emit the contract and apply it to your database

```bash
npx prisma contract emit

# A new database
npx prisma db init

# A database that's already initialized: plan and apply a migration
npx prisma migration plan
npx prisma db migrate
```

3. Create the seed script next to your `db.ts` and pass it the `db` client. The `Register` declaration [types your seeds](#typing-seeds) with your client.

```ts
// src/prisma/seed.ts
import path from 'node:path'
import { PrismaSeeder } from 'prisma-seeder'
import { db } from './db'

declare module 'prisma-seeder' {
  interface Register {
    client: typeof db
  }
}

const seeder = new PrismaSeeder({
  client: db,
  seeds: path.join(import.meta.dirname, './seeds/*.{ts,js}') // Glob pattern to match your seeds
})

await seeder.run()

process.exit()
```

4. Prisma 8 doesn't have a `prisma db seed` command, so seeds don't run automatically after a database reset. Add a script to your `package.json` and run it with `npm run seed`.

```json
"scripts": {
  "seed": "tsx src/prisma/seed.ts up"
}
```

</details>

## Command Line Interface

The seed script is a command line program. The examples below use `prisma/seed.ts`; use the path of your own script.

```
Usage: seed [options] [command]

Options:
  -h, --help          display help for command

Commands:
  up [options]        Applies pending seeds
  down [options]      Revert seeds
  refresh [options]   Re-applies seeds skipping rollback
  reset [options]     Rollback and re-applies seeds
  generate [options]  Generate a new seed file
  help [command]      display help for command

For detailed help about a specific command, use: seed [command] -h
```

`--name` takes the seed's file name without the extension, such as `20250507135916_add_categories`. Pass several names separated by spaces.

### Apply seeds: `up`

Applies pending seeds in timestamp order. Use `--name` to apply specific seeds, and `--steps` to apply only that many.

```bash
tsx prisma/seed.ts up
tsx prisma/seed.ts up --steps 1
```

```
Options:
  -n, --name <names...>  Specify seed names
  -s, --steps <number>   Specify number of steps
```

### Revert seeds: `down`

Reverts applied seeds, latest first. Without options, it reverts the last applied seed. Use `--name` to revert specific seeds, and `--steps` to revert that many of the latest applied seeds (combined with `--name`, it limits how many of the named seeds are reverted).

```bash
tsx prisma/seed.ts down
tsx prisma/seed.ts down --steps 3
tsx prisma/seed.ts down --name 20250507135916_add_categories
```

```
Options:
  -n, --name <names...>  Specify seed names
  -s, --steps <number>   Specify number of steps
```

### Re-run seeds: `refresh`

Runs `up` again on applied seeds, without running `down` first. Use it after changing a seed's data. `--name` is required, and seeds that aren't applied yet are skipped.

```bash
tsx prisma/seed.ts refresh --name 20250507135916_add_categories
```

```
Options:
  -n, --name <names...>  Specify seed names
```

> **Note:** The seed must be idempotent, meaning it can run several times without failing. For example, use `upsert` instead of `create`.

### Revert and re-apply seeds: `reset`

Runs `down` and then `up` on applied seeds. `--name` is required, and seeds that aren't applied yet are skipped.

```bash
tsx prisma/seed.ts reset --name 20250507135916_add_categories
```

```
Options:
  -n, --name <names...>  Specify seed names
```

### Generate seeds: `generate`

Creates a seed file named `<timestamp>_<name>.ts`. Spaces and dashes in the name become underscores. It saves the file in the folder of your `seeds` glob pattern, or in `--dir`. Without `--name`, it asks for one.

```bash
tsx prisma/seed.ts generate --name add_categories
```

```
Options:
  -n, --name <name...>  Name of the seed file
  -d, --dir <dir>       Directory to save the seed file
```

## Typing seeds

`generate` creates seeds that use the `Seed` type, on every Prisma version:

```ts
import type { Seed } from 'prisma-seeder'

export const up: Seed = async (db) => {}

export const down: Seed = async (db) => {}
```

`db` is the client you passed to `PrismaSeeder`. To give it your client's type, register it once in your seed script, next to the client:

```ts
declare module 'prisma-seeder' {
  interface Register {
    client: typeof db
  }
}
```

Without it, `db` only has the members prisma-seeder uses, and your models aren't available on it.

### Custom template

The `template` option replaces the contents of the files created by `generate`:

```ts
const seeder = new PrismaSeeder({
  client: db,
  seeds: path.join(import.meta.dirname, './seeds/*.{ts,js}'),
  template: `import type { Seed } from 'prisma-seeder'

export const up: Seed = async (db) => {
  // TODO
}

export const down: Seed = async (db) => {
  // TODO
}
`
})
```

## Example: seeding your database

We are going to seed a `Category` model

```prisma
model Category {
  id   String @id @default(uuid())
  name String @unique()
}
```

1. Create a file with the seed data. Keep it out of the folder matched by your `seeds` glob pattern, for example in a `data` subfolder

```ts
// prisma/seeds/data/categories.ts
interface Category {
  id: string
  name: string
}

export const categories: Category[] = [
  {
    // Use a constant id to make the seed idempotent
    id: '61ba3e3b-2fbe-4ede-b4d4-d39cbf9e7c4c',
    name: 'Elf'
  },
  {
    id: 'e9620577-af7f-4eaa-abea-1724ce95aa84',
    name: 'Dryad'
  },
  {
    id: 'cb1e2ec1-a5b5-4330-ae85-4e0a046f50e9',
    name: 'Gnome'
  }
]
```

2. Generate the seed

```bash
tsx prisma/seed.ts generate --name add_categories
```

3. Fill in the generated `up` and `down` functions

<details>
<summary><strong>Prisma 4, 5, 6 and 7</strong></summary>

```ts
// prisma/seeds/20250507135916_add_categories.ts
import type { Seed } from 'prisma-seeder'
import { categories } from './data/categories.js'

export const up: Seed = async (db) => {
  // Use a transaction so either all categories are saved or none are
  await db.$transaction(
    categories.map((category) =>
      // Use upsert so the "refresh" command can run this seed again with updated data
      db.category.upsert({
        where: { id: category.id },
        create: category,
        update: { name: category.name }
      })
    )
  )
}

export const down: Seed = async (db) => {
  await db.category.deleteMany({
    where: {
      id: {
        in: categories.map((category) => category.id)
      }
    }
  })
}
```

</details>

<details>
<summary><strong>Prisma 8</strong></summary>

Prisma 8 runs an array of queries one by one, so use `db.transaction` with a callback to make them atomic.

```ts
// src/prisma/seeds/20250507135916_add_categories.ts
import type { Seed } from 'prisma-seeder'
import { categories } from './data/categories'

export const up: Seed = async (db) => {
  // Use a transaction so either all categories are saved or none are
  await db.transaction(async (tx) => {
    for (const category of categories) {
      // Use upsert so the "refresh" command can run this seed again with updated data
      await tx.orm.public.Category.upsert({
        create: category,
        update: { name: category.name }
      })
    }
  })
}

export const down: Seed = async (db) => {
  await db.orm.public.Category.where((c) => c.id.in(categories.map((category) => category.id))).deleteAll()
}
```

</details>

4. Apply the seed

```bash
tsx prisma/seed.ts up
```

## Troubleshooting

### `The _prisma_seeds table does not exist`

prisma-seeder couldn't find the table that tracks applied seeds. Add the `PrismaSeeds` model for your Prisma version (see [Setup](#setup)) and apply it to your database.

### `Seed module must have up and down functions`

A file matched by your `seeds` glob pattern doesn't export `up` and `down`. Move other files, such as seed data, out of that folder (for example into a `data` subfolder), or narrow the pattern.

### `Property '...' does not exist on type 'SeederClient'`

Your client's type isn't registered, so `db` in your seeds doesn't know your models. Add the [`Register` declaration](#typing-seeds) to your seed script.

### Why doesn't prisma-seeder create the table itself?

Prisma compares your database with your schema and migration history. A table created outside of them counts as drift, and `prisma migrate dev` would offer to reset your database. Declaring the table in your schema keeps Prisma aware of it.

## License

[MIT](./LICENSE)
