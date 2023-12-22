import type { UnpluginContext } from 'unplugin'
import { parse } from 'parse5'
import { createRequire } from 'node:module'

const defaultMinifyOptions = {
  caseSensitive: true,
  minifyCSS: true,
  minifyJS: false,
  collapseWhitespace: true,
  // collapseInlineTagWhitespace: true,
  // conservativeCollapse: true,
  keepClosingSlash: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
}

const require = createRequire(import.meta.url)

export async function compileTemplate(
  this: UnpluginContext,
  htmlstr: string,
  name: string,
  minify: boolean
) {
  const doc = parse(htmlstr, {
    onParseError: err => {
      if (err.code !== 'missing-doctype') {
        console.log(22, err)
        this.error(
          `component "${name}" contains invalid HTML5 syntax(${err.code} at line ${err.startLine}:${err.startCol}).`
        )
      }
    },
    sourceCodeLocationInfo: true,
  })
  const html = doc.childNodes.find(v => v.nodeName === 'html')! as any
  const head = html.childNodes.find((v: any) => v.tagName === 'head')
  const body = html.childNodes.find((v: any) => v.tagName === 'body')
  const childNodes = [...(head?.childNodes ?? []), ...(body?.childNodes ?? [])]
  const fragments = []
  let script: any = null

  for (const node of childNodes) {
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
      if (!node.sourceCodeLocation) {
        return ''
      }
      const { startOffset, endOffset } = node.sourceCodeLocation
      return htmlstr.slice(startOffset, endOffset)
    })
    .join('')

  if (minify && template.length > 10) {
    const { minify: minifyHtml } = require('html-minifier-terser')
    template = await minifyHtml(template, defaultMinifyOptions)
  }
  return {
    code: (script?.childNodes[0]?.value || '').trim() as string,
    template,
  }
}
