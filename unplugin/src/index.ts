import { createUnplugin } from 'unplugin'
import { basename } from 'node:path'
// @ts-ignore
import validateElementName from 'validate-element-name'
import { compileTemplate } from './compiler'

interface Options {
  fileExt: `.${string}`
  minify?: boolean
}

const unplugin = createUnplugin((options?: Options) => {
  options = options ?? { fileExt: '.htm', minify: process.env.NODE_ENV !== 'development' }
  const ext = options.fileExt || '.htm'
  const minify =
    typeof options?.minify === 'boolean' ? options.minify : process.env.NODE_ENV !== 'development'
  return {
    name: 'unplugin-alpinejs-webcomponent',
    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    loadInclude(id) {
      return id.endsWith(ext)
      // return id.endsWith(`${ext}?alpinejscode`) || id.endsWith(ext)
    },
    transformInclude(id) {
      return id.endsWith(ext)
      // return id.endsWith(`${ext}?alpinejscode`) || id.endsWith(ext)
    },
    async transform(source, id) {
      const file = basename(id)
      const name = file.split('.')[0]
      const { isValid, message } = validateElementName(name)
      if (!isValid) {
        this.error(`Filename of "${file}" is not a valid custom element name (${message}).`)
      }

      const { template, code } = await compileTemplate.call(this, source, name, minify)
      return `
${code}
import { defineComponent } from 'unplugin-alpinejs-component/defineComponent'

defineComponent("${name}", {
  setup: typeof setup === 'function' ? setup : null,
  template: ${JSON.stringify(template)},
})
  `.trim()
    },
  }
})

export { unplugin }

export const {
  vite: vitePlugin,
  rollup: rollupPlugin,
  webpack: webpackPlugin,
  rspack: rspackPlugin,
  esbuild: esbuildPlugin,
} = unplugin
