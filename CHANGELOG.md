# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-12

### Added

- `seeds` accepts a list of glob patterns, such as shared seeds plus test seeds. Matched seeds run once each, in timestamp order across all patterns. `generate` saves new seeds in the folder of the first pattern.

## [2.0.1] - 2026-10-10

### Added

- README section on [running seeds per environment](./README.md#seeds-per-environment), with an example in `examples/prisma`.

## [2.0.0] - 2026-10-10

### Breaking changes

- Seeds created by `generate` use the new `Seed` type. Their `db` parameter only knows your models after you [register your client's type](./README.md#typing-seeds). Existing seeds keep working.
- `down --name` reverts every seed you name. It used to revert only the latest one.
- The package now has an `exports` map, so only `prisma-seeder` can be imported. Deep imports such as `prisma-seeder/dist/index.js` no longer resolve.
- Node.js 20 or newer is required, and is now declared in `engines`. In practice, 1.x already needed it through its `glob` dependency.

### Added

- Prisma ORM 8 support (PostgreSQL and SQLite), alongside Prisma ORM 4 to 7. Pass the `db` client from your `db.ts`.
- `Register` interface and `Seed` type to type seeds with your client on every Prisma version.
- `template` option to set the contents of the files created by `generate`.
- Type declarations for ES modules (`index.d.mts`), resolved through the `exports` map.
- Doc comments in the type declarations.

### Changed

- A missing `_prisma_seeds` table now fails with instructions to add the `PrismaSeeds` model, instead of the raw database error.
- `@prisma/client` is an optional peer dependency, since Prisma 8 projects don't install it.
- The README covers setup for each Prisma version, every CLI option, and troubleshooting.

### Fixed

- The `generate` name prompt no longer opens when the package loads. It kept the process alive until stdin closed, even for other commands.
- Seed paths work on Windows: glob patterns accept backslashes, and seeds are loaded through file URLs.

## Upgrading from 1.x

1. Register your client's type in your seed script, next to the client:

   ```ts
   declare module 'prisma-seeder' {
     interface Register {
       client: typeof db
     }
   }
   ```

   Existing seeds don't need changes. To keep generating seeds in the 1.x format instead, pass it as the `template` option:

   ```ts
   template: `import { PrismaClient } from '@prisma/client'
   
   type Db = PrismaClient
   
   export const up = async (db: Db) => {}
   
   export const down = async (db: Db) => {}
   `
   ```

2. If you run `down --name` with several names and only expect the latest one to be reverted, add `--steps 1`.
3. Replace any deep import of `prisma-seeder/...` with `prisma-seeder`.

[2.1.0]: https://github.com/esmerlingb/prisma-seeder/releases/tag/v2.1.0
[2.0.1]: https://github.com/esmerlingb/prisma-seeder/releases/tag/v2.0.1
[2.0.0]: https://github.com/esmerlingb/prisma-seeder/releases/tag/v2.0.0
