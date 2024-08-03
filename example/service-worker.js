// 引入 Babel Standalone
// importScripts('https://unpkg.com/@babel/standalone@7.23.4/babel.min.js')

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
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi

  let scriptContent = ''
  let remainingHtml = code

  // 提取 script 内容并移除 script 标签
  remainingHtml = remainingHtml.replace(scriptRegex, function (match, script) {
    scriptContent += script + '\n'
    return ''
  })

  // 移除可能残留的空行
  remainingHtml = remainingHtml.replace(/^\s*[\r\n]/gm, '')
  const dataScopeCode = `
  import Alpine from 'alpinejs'
  Alpine.data("${scopeName}", function () {
    const scope = typeof setup === 'function' ? setup.call(this) : {}
    return scope
  })
  `
  const templateCode = `
  const __template = ${JSON.stringify(remainingHtml)}
  const __container = document.createElement('template')
  __container.innerHTML = __template
  if (__container.content.childElementCount !== 1) {
    throw new Error("${componentName} has more than one root element.")
  }
  __container.content.firstElementChild.setAttribute('x-data', "${scopeName}")
  `
  const componentCode = `
  if (customElements.get("${componentName}")) {
    throw new Error("${componentName} has been registered, check the file name.")
  }
  customElements.define(
    "${componentName}",
    class extends HTMLElement {
      static observedAttributes = []
      static componentName = "${componentName}"
      static type = 'alpine'
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }
      connectedCallback() {
        const content = __container.content.firstElementChild.cloneNode(true)
        this.shadowRoot.appendChild(content)
        if (!this.shadowRoot.host.hasAttribute('x-props')) {
          Alpine.initTree(this.shadowRoot)
        }
      }

      disconnectedCallback() {
        Alpine.destroyTree(this.shadowRoot)
        if (this.shadowRoot.host) {
          Alpine.destroyTree(this.shadowRoot.host)
        }
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
  `
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
