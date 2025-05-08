# Prisma-Seeder

Take control of your Prisma seeds.

Write seeds with familiar `up` and `down` functions——just like classic migrations.

## Usage

1. Install with npm
```bash
npm install prisma-seeder
```

2. Add `PrismaSeeds` model. We use it to keep track of already executed seeds.
```prisma
// schema.prisma
model PrismaSeeds {
  name String @id()

  @@map("_prisma_seeds")
  @@ignore
}
```

3. Run migrations
```
prisma migrate dev
```

4. Create a new file named `seed.ts`. This can be placed anywhere within your project's folder structure. The example below places it in the `/prisma` folder. This script is a runnable CLI program. Check the available options under [CLI](#command-line-interface)
```ts
// seed.ts
import { PrismaSeeder } from 'prisma-seeder'
import { PrismaClient } from '@prisma/client'
import path from 'path'

// Required if using ESM
const __dirname = import.meta.dirname

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
```

5. Add this command in the `"seed"` key in the `"prisma"` key of your `package.json` file. Prisma executes the seeds manually with `prisma db seed` and automatically in `prisma migrate reset` and (in some scenarios) `prisma migrate dev`
```JSON
"prisma": {
  "seed": "tsx prisma/seed.ts up"
},
```
> **_NOTE:_** you can use any execution engine of your choice to run the script, such as `ts-node` for TypeScript or simply `node` for JavaScript files. For the rest of the docs we are going to use `tsx`

## Command Line Interface Usage

You can run `tsx prisma/seed.ts --help` to see how to use it. It will print something like:
```
Usage: seed [options] [command] ...

Options:
  -h, --help    display help for command

Commands:
  up        Applies pending seeds
  down      Revert seeds
  refresh   Re-applies seeds skipping rollback
  reset     Rollback and re-applies seeds

For detailed help about a specific command, use: seed [command] -h
```

### Running seeds: `up`

Run `tsx prisma/seed.ts up` to apply pending seeds. Use `tsx prisma/seed.ts --help` to see all available options.

```
Usage: seed up [options]

Applies pending seeds

Options:
  -n, --name <names...>  Specify seed names
  -s, --steps <number>   Specify number of steps
  -h, --help             display help for command
```

### Running seeds: `down`
Run `tsx prisma/seed.ts down` to revert seeds. You should provide one of the options `--name` or `--steps` to select the seeds to revert.

Use `tsx prisma/seed.ts --help` to see all available options.

```
Usage: seed down [options]

Revert seeds

Options:
  -n, --name <names...>  Specify seed names
  -s, --steps <number>   Specify number of steps
  -h, --help             display help for command
```

### Refresh seeds: `refresh`

Run `tsx prisma/seed.ts refresh` to re-applies seeds skipping any rollback process. The `--name` option is required; otherwise, no seeds will be refreshed.

Use `tsx prisma/seed.ts refresh --help` to see all available options. 

```
Usage: seed refresh [options]

Re-applies seeds skipping rollback

Options:
  -n, --name <names...>  Specify seed names
  -h, --help             display help for command
  ```

> **_Note:_** For this command to work, the seed must be idempotent—meaning it should be able to run multiple times without failing. For example, use `upsert` instead of `create`.


### Reset seeds: `reset`

Run `tsx prisma/seed.ts reset` to rollback and re-apply seeds. It's equivalent to running `down` and `up`.

```
Usage: seed reset [options]

Rollback and re-applies seeds

Options:
  -n, --name <names...>  Specify seed names
  -h, --help             display help for command
```

### Generate seeds: `generate`

Run `tsx prisma/seed.ts generate` to create a new seed file. By default, it uses the path defined in your script at `PrismaSeeder.seeds`, but you can specify a custom path using the `--dir` option. You can also provide a seed name with the `--name` option, or enter it later when prompted.

Use `tsx prisma/seed.ts generate --help` to see all available options.

```
Usage: seed generate [options]

Generate a new seed file

Options:
  -n, --name <name...>  Name of the seed file
  -d, --dir <dir>       Directory to save the seed file
  -h, --help            display help for command
```

## Examples

### Seeding your database

We are going to seed our `Category` model
```prisma
model Category {
  id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name String @unique()

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

1. Create a new file with seed data
```ts
// categories.ts
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

2. Generate the new seed with `up` & `down` functions
```bash
tsx prisma/seed.ts generate --name add_categories
````

3. Update the generated seed
```ts
import { PrismaClient } from '@prisma/client'
import { categories } from './data/categories.js'

type Db = PrismaClient

export const up = async (db: Db) => {
  // Use transaction to make sure all operation succeed
  await db.$transaction(
    categories.map((category) =>
      /**
       * Use upsert to be able to run this seed multiple times by using "refresh" command
       * We can create/update categories and use "refresh" command to update table with new data
       */
      db.category.upsert({
        where: { id: category.id },
        create: category,
        update: { name: category.name }
      })
    )
  )
}

export const down = async (db: Db) => {
  await db.category.deleteMany({
    where: {
      id: {
        in: categories.map((category) => category.id)
      }
    }
  })
}

```


4. To seed the database, run the `seed up` CLI command:
```bash
tsx prisma/seed.ts up
```
