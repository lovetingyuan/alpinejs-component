import { defineConfig } from 'vite'
import { vitePlugin } from 'unplugin-alpinejs-component'

export default defineConfig(() => {
  return {
    plugins: [vitePlugin()],
    optimizeDeps: {
      exclude: ['alpinejs'],
    },
  }
})
