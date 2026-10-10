import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  // Keep the file names consumers already resolve via package.json
  outExtensions: ({ format }) => (format === 'cjs' ? { js: '.js', dts: '.d.ts' } : { js: '.mjs', dts: '.d.mts' })
})
