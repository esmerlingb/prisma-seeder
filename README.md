# Prisma-Seeder

Take control of your Prisma seeds.

Write seeds with familiar `up` and `down` functions——just like classic migrations.

## Usage

Install with npm
```bash
npm install prisma-seeder
```

Add `PrismaSeeds` model. We use it to keep track of already executed seeds.
```prisma
// prisma/schema.prisma

model PrismaSeeds {
  name String @id()

  @@map("_prisma_seeds")
  @@ignore
}
```

This script is a runnable CLI program. Check the available options under [CLI](#command-line-interface)
```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaSeeder } from 'prisma-seeder'
import path from 'path'

// Required if using ESM
const __dirname = import.meta.dirname

const db = new PrismaClient()

// We use this type on the up and down functions
export type Db = PrismaClient

async function main() {
  const seeder = new PrismaSeeder({
    client: db,
    seeds: path.join(__dirname, './seeds/*.{ts,js}') // Glob pattern to match your seeds
  })

  seeder.run()
}


main()
```

Add this command in the `"seed"` key in the `"prisma"` key of your `package.json` file. Prisma executes the seeds manually with `prisma db seed` and automatically in `prisma migrate reset` and (in some scenarios) `prisma migrate dev`
```JSON
...
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


### Reset Seeds: `reset`

Run `tsx prisma/seed.ts reset` to rollback and re-apply seeds. Is the same as running `down` and `up`.

```
Usage: seed reset [options]

Rollback and re-applies seeds

Options:
  -n, --name <names...>  Specify seed names
  -h, --help             display help for command
```