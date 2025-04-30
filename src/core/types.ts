export interface PrismaClientLike {
  $executeRaw: (query: TemplateStringsArray, ...values: any[]) => Promise<number>
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T>
  $disconnect: () => Promise<void>
}
