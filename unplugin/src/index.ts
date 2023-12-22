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
  const parseCodeCache: Record<string, string> = {}
  return {
    name: 'unplugin-alpinejs-webcomponent',
    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    loadInclude(id) {
      return id.endsWith(`${ext}?alpinejscode`) || id.endsWith(ext)
    },
    transformInclude(id) {
      return id.endsWith(`${ext}?alpinejscode`) || id.endsWith(ext)
    },
    async transform(source, id) {
      const [file, query] = id.split('?')
      const name = basename(file).split('.')[0]
      const { isValid, message } = validateElementName(name)
      if (!isValid) {
        this.error(`filename of "${file}" is not a valid custom element name (${message}).`)
      }
      if (query === 'alpinejscode') {
        return parseCodeCache[file]
      } else {
        const { template, code } = await compileTemplate.call(this, source, name, minify)
        parseCodeCache[file] = code
        return `
import { defineComponent } from 'unplugin-alpinejs-component/defineComponent'
${code ? `import * as Comp from "./${basename(file)}?alpinejscode"\nconst comp=Comp` : ''}

export default defineComponent("${name}", {
  setup: ${code ? 'comp.default || null' : 'null'},
  props: ${code ? 'comp.$props || {}' : '{}'},
  template: ${JSON.stringify(template)},
})
  `.trim()
      }
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
