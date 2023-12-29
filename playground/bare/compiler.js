import Alpine from 'alpinejs'
import validateElementName from 'validate-element-name'

window.Alpine = Alpine

const propsCompMap = new WeakMap()
const globalAttrs = [
  'accesskey',
  'autocapitalize',
  'autofocus',
  'class',
  'contenteditable',
  'dir',
  'draggable',
  'enterkeyhint',
  'hidden',
  'id',
  'inert',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'lang',
  'nonce',
  'popover',
  'slot',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate',
].reduce((m, k) => {
  m[k] = true
  return m
}, {})

const ignoreProps = name => {
  if (name.startsWith('x-') || name.startsWith(':') || name.startsWith('@')) {
    return true
  }
  if (name.startsWith('data-') || name.startsWith('aria-')) {
    return true
  }
  return false
}

Alpine.magic('props', el => {
  const comp = el.closest('[x-data$="$"]')
  if (comp?.type !== 'alpine') {
    console.warn(`"$props" magic variable can only be used inner component.`, el)
    return
  }
  return propsCompMap.get(comp)
})

function defineComponent(componentName, { template, props, setup }) {
  // const componentName = moduleName.split('/').pop().split('.')[0]

  const { isValid, message } = validateElementName(componentName)
  if (!isValid) {
    throw new Error(`filename of "${file}" is not a valid custom element name (${message}).`)
  }
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template

  // Alpine.addRootSelector(() => componentName)

  Alpine.data(scopeName, function () {
    const props = propsCompMap.get(this.$el)
    const scope = setup?.call(this, props) || {}
    const _init = scope.init
    scope.init = function init() {
      if (!this.$el._x_effects) {
        this.$el._x_effects = new Set()
      }
      if (scope.propsChange) {
        this.$el._x_effects.add(
          Alpine.effect(() => {
            this.$data.propsChange()
          })
        )
      }
      if (_init) {
        return _init.call(this)
      }
    }

    return scope
  })

  customElements.define(
    componentName,
    class extends HTMLElement {
      constructor() {
        super()
        const _props = Alpine.reactive(Object.create({ ...props }))
        propsCompMap.set(this, _props)
      }
      static type = 'alpine'
      type = 'alpine'
      get props() {
        console.warn('Access "props" only for development purpose.')
        return Alpine.raw(propsCompMap.get(this))
      }
      get data() {
        console.warn('Access "data" only for development purpose.')
        return Alpine.raw(this._x_dataStack[0])
      }
      render() {
        if (this._x_dataStack?.length) {
          this._x_dataStack = [this._x_dataStack[0]]
        }
        const content = templateContainer.content.cloneNode(true)
        const defaultPlaceholder = this.querySelector('template[default]')
        if (defaultPlaceholder) {
          defaultPlaceholder.replaceWith(content)
        } else {
          this.appendChild(content)
        }
      }
      connectedCallback() {
        if (super.hasAttribute('x-data')) {
          console.error(`component "${componentName}" can not have attribute "x-data".`, this)
        }
        queueMicrotask(() => {
          super.setAttribute('x-data', scopeName)
          const init = super.getAttribute('x-init')
          super.setAttribute('x-init', (init ? init + ';' : '') + '$el.render()')
        })
      }

      setAttribute(name, value) {
        if (ignoreProps(name)) {
          super.setAttribute(name, value)
          return
        }
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (propName in props) {
          const _props = propsCompMap.get(this)
          const type = typeof props[propName]
          _props[propName] =
            type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : value
        } else {
          if (!globalAttrs[name]) {
            console.warn(
              `component "${componentName}" received prop "${name}" but not defined in $props.`,
              this
            )
          }
          super.setAttribute(name, value)
        }
      }

      getAttribute(name) {
        if (ignoreProps(name)) {
          return super.getAttribute(name)
        }
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (!(propName in props)) {
          return super.getAttribute(name)
        }
        const _props = propsCompMap.get(this)
        return _props[propName]
      }

      disconnectedCallback() {
        propsCompMap.delete(this)
      }

      adoptedCallback() {}

      attributeChangedCallback() {}
    }
  )
  return componentName
}

const domParser = new DOMParser()

export async function parseHTML(url, _module) {
  const html = await fetch(url).then(r => r.text())

  const doc = domParser.parseFromString(html, 'text/html')
  const script = doc.querySelectorAll('script')
  if (script.length > 1) {
    throw new Error(`component ${_module} contains one more <script> tag, please keep only one.`)
  }
  let props = {}
  let setup = null
  const code = script[0]?.textContent.trim() ?? ''
  if (code) {
    const dataUrl = `data:text/javascript,${encodeURIComponent(
      `
      import.meta.url = "${url}";
      ${code}`
    )}`
    const comp = await import(dataUrl)
    if (comp.$props) {
      props = comp.$props
    }
    if (comp.default) {
      if (typeof comp.default !== 'function') {
        throw new Error(`component ${_module} default export must be function.`)
      }
      setup = comp.default
    }
  }

  script[0]?.remove()
  return defineComponent(_module, {
    template: doc.body.innerHTML,
    setup,
    props,
  })
}
