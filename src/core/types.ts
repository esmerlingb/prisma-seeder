/**
 * Prisma ORM 4–7 client (`new PrismaClient()`)
 */
export interface PrismaClientLike {
  $executeRaw: (query: TemplateStringsArray, ...values: any[]) => Promise<number>
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T>
  $disconnect: () => Promise<void>
}

/**
 * Prisma ORM 8 SQL client (`postgres()` from `@prisma/orm-postgres/runtime`, `sqlite()` from `@prisma/orm-sqlite/runtime`)
 *
 * Only the members prisma-seeder uses are declared, so we don't depend on Prisma 8 packages
 */
export interface PrismaOrmClientLike {
  readonly contract: { readonly target: string }
  readonly raw: { readonly sql: (strings: TemplateStringsArray, ...values: any[]) => PrismaOrmRawBuilder }
  runtime(): PrismaOrmRuntime
  close(): Promise<void>
}

interface PrismaOrmRawBuilder {
  returnsRow(spec: any): { build(): any }
  affectedCount(): { build(): any }
}

interface PrismaOrmRuntime {
  query(plan: any): AsyncIterable<unknown>
  execute(plan: any): Promise<unknown>
}

export type SeederClient = PrismaClientLike | PrismaOrmClientLike

export const isPrismaOrmClient = (client: SeederClient): client is PrismaOrmClientLike =>
  typeof (client as PrismaOrmClientLike).runtime === 'function' && 'raw' in client

/**
 * Register the type of your Prisma client to type your seeds:
 *
 * ```ts
 * declare module 'prisma-seeder' {
 *   interface Register {
 *     client: typeof db
 *   }
 * }
 * ```
 */
export interface Register {}

/**
 * The client registered in {@link Register}, or any supported client when none is registered
 */
export type RegisteredClient = Register extends { client: infer Client } ? Client : SeederClient

/**
 * A seed's `up` or `down` function
 */
export type Seed = (db: RegisteredClient) => Promise<void>
