import Alpine from 'alpinejs'

requestAnimationFrame(() => {
  if ((window as any).Alpine !== Alpine) {
    console.warn('It is recommended to expose "Alpine" to global (window.Alpine).')
  }
})

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
}, {} as any)

const ignoreProps = (name: string) => {
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
  // @ts-ignore
  if (comp?.type !== 'alpine') {
    console.warn(`"$props" magic variable can only be used inner component.`, el)
    return
  }
  return propsCompMap.get(comp)
})

/**
 * You should NOT import this module by yourself.
 * It is used for plugin and bundler tools internally.
 * @private
 */
export function defineComponent(
  componentName: string,
  {
    template,
    props,
    setup,
  }: {
    template: string
    props: Record<string, any>
    setup: null | ((props: Record<string, any>) => Record<string, any>)
  }
) {
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template

  // Alpine.addRootSelector(() => componentName)

  Alpine.data(scopeName, function (this: any) {
    // console.log('x-data', scopeName)
    const props = propsCompMap.get(this.$el)
    const scope = setup?.call(this, props) || {}
    const _init = scope.init
    scope.init = function init() {
      // console.log('init', scopeName)
      // if (this.$el._x_dataStack?.length) {
      //   this.$el._x_dataStack = [this.$el._x_dataStack[0]]
      // }
      if (!this.$el._x_effects) {
        this.$el._x_effects = new Set()
      }
      if (scope.propsChange) {
        this.$el._x_effects.add(
          Alpine.effect(() => {
            // if (this.$el._init) {
            this.$data.propsChange()
            // }
          })
        )
      }
      // this.$el._init = true
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
        // super.setAttribute('x-ignore', '')
      }
      static type = 'alpine'
      type = 'alpine'
      get props() {
        console.warn('Access "props" only for development purpose.')
        return Alpine.raw(propsCompMap.get(this))
      }
      get data() {
        console.warn('Access "data" only for development purpose.')
        // @ts-ignore
        return Alpine.raw(this._x_dataStack[0])
      }
      render() {
        // console.log('render', componentName)
        // @ts-ignore
        if (this._x_dataStack?.length) {
          // @ts-ignore
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
        // console.log('connect', componentName)
        if (super.hasAttribute('x-data')) {
          console.error(`component "${componentName}" can not have attribute "x-data".`, this)
        }
        // super.removeAttribute('x-ignore')
        // if (this._x_dataStack?.length) {
        //   this._x_dataStack = [this._x_dataStack[0]]
        // }
        queueMicrotask(() => {
          // console.log('set x-data', componentName)
          super.setAttribute('x-data', scopeName)
          // super.removeAttribute('x-ignore')
          const init = super.getAttribute('x-init')
          // if (this._x_dataStack?.length) {
          //   this._x_dataStack = [this._x_dataStack[0]]
          // }
          super.setAttribute('x-init', (init ? init + ';' : '') + '$el.render()')
        })
      }

      setAttribute(name: string, value: string): void {
        // console.log('setAttribute', name, value, componentName)
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

      getAttribute(name: string): any {
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
