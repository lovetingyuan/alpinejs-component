import { defineConfig } from 'vite'
import { vitePlugin, rollupPlugin } from 'unplugin-alpinejs-component'
import { resolve } from 'path'

const lib = process.argv.includes('lib')

export default defineConfig(() => {
  if (!lib) {
    return {
      plugins: [vitePlugin()],
      optimizeDeps: {
        exclude: ['alpinejs'],
      },
    }
  }
  return {
    build: {
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, './main.js'),
        name: 'MyLib',
        // the proper extensions will be added
        fileName: 'my-lib',
      },
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ['alpinejs'],
        plugins: [rollupPlugin()],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            alpinejs: 'Alpine',
          },
        },
      },
    },
  }
})
