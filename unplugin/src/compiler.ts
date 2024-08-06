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
  const styles = []
  let script: any = null
  let rootElement: any = null

  for (const node of childNodes) {
    if (node.nodeName === 'script') {
      if (script === null) {
        script = node
      } else {
        this.error(`component "${name}" contains more than one <script> tag, please keep only one.`)
      }
    } else if (!node.nodeName.startsWith('#') && node.tagName) {
      if (node.nodeName === 'style') {
        styles.push(node)
      } else if (rootElement === null) {
        rootElement = node
      } else {
        this.error(
          `component "${name}" contains more than one root element except <style> and <script>, please keep only one.`
        )
      }
    }
  }
  if (!rootElement) {
    this.error(
      `component "${name}" must contain only one root element except <style> and <script>.`
    )
  }
  let template = [rootElement, ...styles]
    .map(node => {
      if (!node?.sourceCodeLocation) {
        return ''
      }
      const { startOffset, endOffset } = node.sourceCodeLocation
      return htmlstr.slice(startOffset, endOffset)
    })
    .join('')

  if (minify) {
    const { minify: minifyHtml } = require('html-minifier-terser')
    template = await minifyHtml(template, defaultMinifyOptions)
  }
  return {
    code: (script?.childNodes[0]?.value || '').trim() as string,
    template,
  }
}
