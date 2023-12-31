import { defineConfig } from 'tsup'
import { esbuildPlugin as AlpineWebComponentPlugin } from 'unplugin-alpinejs-component'

export default defineConfig({
  entry: ['./index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['alpinejs'],
  esbuildPlugins: [AlpineWebComponentPlugin()],
})
