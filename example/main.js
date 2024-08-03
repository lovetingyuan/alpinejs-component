import './style.css'
import './my-foo.htm'
import Alpine from 'alpinejs'

// function compile({ url, template }) {
//   //
//   const parser = new DOMParser()
//   const doc = parser.parseFromString(template)
//   const script = doc.querySelector('script')
//   script.remove()
//   const scriptCode = script.textContent.replace('export default ', 'const __setup = ')
//   const componentName = url.split('/').pop().split('.').shift()
//   const scopeName = `${componentName.replace(/-/g, '_')}$`
//   const registerScopeCode = `
//   if (typeof __setup === 'function') {
//     Alpine.data("${scopeName}", () => {
//       const scope = __setup()
//       return scope
//     })
//   } else {
//     Alpine.data("${scopeName}", () => {
//       return {}
//     })
//   }
//   `
//   const registerComponentCode = `
//   const __template = ${JSON.stringify(doc.firstElementChild.outerHTML)};
//   const templateContainer = document.createElement('template')
//   templateContainer.innerHTML = __template
//   customElements.define(
//     "${componentName}",
//     class extends HTMLElement {
//       static observedAttributes = []
//       static componentName = "${componentName}"
//       static type = 'alpine'
//       constructor() {
//         super()
//         const shadowRoot = this.attachShadow({ mode: 'open' })
//         const content = templateContainer.content.cloneNode(true)
//         shadowRoot.appendChild(content)
//       }
//       connectedCallback() {
//         const root = this.shadowRoot
//         root.setAttribute('x-data', "${scopeName}")
//         // requestAnimationFrame(() => {
//         //   Alpine.initTree(this.shadowRoot)
//         // })
//       }

//       disconnectedCallback() {
//         if (this.shadowRoot) {
//           Alpine.destroyTree(this.shadowRoot)
//         }
//       }

//       adoptedCallback() {}

//       attributeChangedCallback() {
//         // console.log('attr change', name, val)
//       }
//     }
//   )
//   `
//   return `
//     ${scriptCode}
//     ${registerScopeCode}
//     ${registerComponentCode}
//   `
// }

Alpine.directive(
  'props',
  (el, { value, modifiers, expression }, { Alpine, effect, cleanup, evaluate, evaluateLater }) => {
    if (el.constructor.type !== 'alpine') {
      return
    }
    const getProps = evaluateLater(expression)

    effect(() => {
      let props
      getProps(p => {
        if (props) {
          Object.assign(props, p)
        } else {
          props = p
        }
        const scopes = el.shadowRoot.firstElementChild._x_dataStack
        if (scopes && scopes[0] && typeof scopes[0].props === 'function') {
          scopes[0].props(props)
        }
        // console.log('props update', el, props)
        // if (el._props) {
        //   Object.assign(el._props, props)
        // } else {
        //   el._props = props
        // }
        // console.log(11, el, el._props)
      })
    })
    // effect(() => {
    //   el._props = evaluate(expression)
    //   console.log(11, el._props)
    // })
    // console.log('props', el, el._props)
    Alpine.initTree(el.shadowRoot)
    console.log('init', el)
  }
)

async function start() {
  document.body.innerHTML = '<h1>的方式</h1><my-foo></my-foo>'
  Alpine.start()
}

start()
