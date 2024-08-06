// 引入 Babel Standalone
// importScripts('https://unpkg.com/@babel/standalone@7.23.4/babel.min.js')
import { parse } from 'https://cdn.jsdelivr.net/npm/@vue/compiler-sfc@3.4.35/+esm'

self.addEventListener('install', event => {
  event.waitUntil(
    self.skipWaiting() // 立即激活新的 Service Worker
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    self.clients
      .claim()
      .then(() => {
        return self.clients.matchAll()
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage('refresh')
        })
      })
  )
})

// 转换 TSX 代码为 JavaScript 代码
function convertTsxToJs(tsxCode) {
  const transformedCode = Babel.transform(tsxCode, {
    presets: ['react', 'typescript'],
    filename: 'file.tsx',
  }).code
  return transformedCode
}

function convertCssToJs(cssCode) {
  return `
const style = document.createElement('style');
style.textContent = \`${cssCode}\`;
document.head.appendChild(style);
export default style;
`.trim()
}

function convertJsonToJs(code) {
  const json = JSON.parse(code)
  const keys = Object.keys(json).map(key => {
    try {
      new Function(`var ${key};`)
      return key
    } catch (e) {
      return ''
    }
  })
  return `
const __$JSon = ${code}
export default __$JSon
export const {${keys}} = __$JSon
`.trim()
}

function transformHtm(code, url) {
  const componentName = url.split('/').pop().split('.').shift()
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  if (!code.includes('<script ') && !code.includes('</script>')) {
    code = code + '<script>/**/</script>'
  }
  const { descriptor, errors } = parse(code)
  if (errors.length) {
    throw new Error(
      `component "${componentName}" has errors: \n${errors.map(e => e.message).join('\n')}`
    )
  }
  const scriptContent = descriptor.script?.content ?? ''
  const stylesContent = descriptor.styles.map(s => s.content).join('\n')
  if (descriptor.customBlocks.length > 1) {
    throw new Error(`component "${componentName}" can only contain one single root element`)
  }
  if (!descriptor.customBlocks.length) {
    throw new Error(`component "${componentName}" must contain one single root element`)
  }
  const [rootElement] = descriptor.customBlocks
  const dataScopeCode = `
import Alpine from 'alpinejs'
Alpine.data("${scopeName}", function () {
  const scope = typeof setup === 'function' ? setup.call(this) : {}
  return scope
})
  `
  const templateCode = `
const __template = document.createElement("${rootElement.type}")
__template.setAttribute('x-data', "${scopeName}")
Object.entries(${JSON.stringify(rootElement.attrs)}).forEach(([k, v]) => {
  __template.setAttribute(k, v)
})
__template.innerHTML = ${JSON.stringify(rootElement.content)}

const __style = document.createElement('style')
__style.textContent = ${JSON.stringify(stylesContent)}
  `
  const componentCode = `
if (customElements.get("${componentName}")) {
  throw new Error('"${componentName}" has been registered, the file name should be unique.')
}
customElements.define(
  "${componentName}",
  class extends HTMLElement {
    static observedAttributes = []
    static componentName = "${componentName}"
    static type = 'alpine'
    constructor() {
      super()
      // this.attachShadow({ mode: 'open' })
    }
    connectedCallback() {
      this.appendChild(__template.cloneNode(true))
      this.appendChild(__style.cloneNode(true))
    }

    disconnectedCallback() {
      Alpine.destroyTree(this)
    }

    adoptedCallback() {}

    attributeChangedCallback() {
      // console.log('attr change', name, val)
    }
  }
)
`
  return `
${scriptContent}
${dataScopeCode}
${templateCode}
${componentCode}
`.trim()
}

const fileExts = ['tsx', 'ts', 'css', 'json', 'htm']

self.addEventListener('fetch', event => {
  const url = event.request.url
  if (fileExts.some(v => url.endsWith('.' + v))) {
    event.respondWith(
      fetch(event.request)
        .then(response => response.text())
        .then(code => {
          let javascriptCode = ''
          if (url.endsWith('.tsx') || url.endsWith('.ts')) {
            // 将 TSX 代码转换为 JavaScript 代码
            javascriptCode = convertTsxToJs(code)
          } else if (url.endsWith('.css')) {
            javascriptCode = convertCssToJs(code)
          } else if (url.endsWith('.json')) {
            javascriptCode = convertJsonToJs(code)
          } else if (url.endsWith('.htm')) {
            javascriptCode = transformHtm(code, url)
          }
          // 创建新的 Response 对象，将转换后的 JavaScript 代码作为响应内容
          const convertedResponse = new Response(javascriptCode, {
            status: 200,
            headers: {
              'Content-Type': 'application/javascript',
            },
          })
          return convertedResponse
        })
        .catch(error => {
          console.error('Error converting TSX to JS:', error)
          // 如果发生错误，可以返回适当的错误响应
        })
    )
  }
})
