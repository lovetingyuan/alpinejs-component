import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    entries: ['./src/index.ts'],
    declaration: true,
    failOnWarn: false,
    sourcemap: false,
    clean: true,
    rollup: {
      emitCJS: true,
      dts: {
        respectExternal: false,
      },
    },
  },
  {
    entries: ['./src/defineComponent.ts'],
    declaration: true,
    failOnWarn: false,
    sourcemap: true,
    clean: false,
    externals: ['alpinejs'],
    rollup: {
      esbuild: {
        minify: false,
      },
      output: {
        entryFileNames: 'defineComponent.js',
      },
    },
  },
])
