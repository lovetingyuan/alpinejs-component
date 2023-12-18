import { type UnpluginContext, createUnplugin } from 'unplugin'
import { basename } from 'node:path'
import { createRequire } from 'node:module'
// @ts-ignore
import validateElementName from 'validate-element-name'
import { parse } from 'parse5'

const require = createRequire(import.meta.url)

const defaultMinifyOptions = {
  caseSensitive: true,
  minifyCSS: true,
  minifyJS: false,
  collapseWhitespace: true,
  keepClosingSlash: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
}

async function compileTemplate(
  this: UnpluginContext,
  htmlstr: string,
  name: string,
  minify: boolean
) {
  const doc = parse(htmlstr, {
    onParseError: err => {
      if (err.code !== 'missing-doctype') {
        this.error(
          `component "${name}" contains invalid HTML5 syntax(${err.code} at line ${err.startLine}:${err.startCol}).`
        )
      }
    },
  })
  const html = doc.childNodes.find(v => v.nodeName === 'html')! as any
  const body = html.childNodes.find((v: any) => v.tagName === 'body')
  const fragments = []
  let script: any = null
  for (const node of body.childNodes) {
    if (node.nodeName === 'script') {
      if (script === null) {
        script = node
      } else {
        this.error(`component "${name}" contains more than one <script> tag, please keep only one.`)
      }
    } else if (!node.nodeName.startsWith('#') && node.tagName) {
      fragments.push(node)
    }
  }
  let template = fragments
    .map(node => {
      const { startOffset, endOffset } = node.sourceCodeLocation
      return htmlstr.slice(startOffset, endOffset)
    })
    .join('')

  if (minify && template.length > 10) {
    const { minify: minifyHtml } = require('html-minifier-terser')
    template = await minifyHtml(template, defaultMinifyOptions)
  }
  return {
    code: (script?.childNodes[0]?.value || '') as string,
    template,
  }
}

interface Options {
  fileExt: `.${string}`
  minify?: boolean
}

export const unplugin = createUnplugin((options?: Options) => {
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
      return id.endsWith(`${ext}?jscode`) || id.endsWith(ext)
    },
    transformInclude(id) {
      return id.endsWith(`${ext}?jscode`) || id.endsWith(ext)
    },
    async transform(source, id) {
      const [file, query] = id.split('?')
      const name = basename(file).split('.')[0]
      const { isValid, message } = validateElementName(name)
      if (!isValid) {
        this.error(`filename of "${file}" is not a valid custom element name (${message}).`)
      }
      if (query === 'jscode') {
        return parseCodeCache[file]
      } else {
        const { template, code } = await compileTemplate.call(this, source, name, minify)
        parseCodeCache[file] = code
        return `
import { defineComponent } from 'unplugin-alpinejs-component/defineComponent'
${code ? `import * as Comp from "./${basename(file)}?jscode"\nconst comp=Comp` : ''}

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

export const {
  vite: vitePlugin,
  rollup: rollupPlugin,
  webpack: webpackPlugin,
  rspack: rspackPlugin,
  esbuild: esbuildPlugin,
} = unplugin
