import Alpine from 'alpinejs'

requestAnimationFrame(() => {
  if ((window as any).Alpine !== Alpine) {
    console.warn('It is recommended to expose "Alpine" to global (window.Alpine).')
  }
})

const propsCompMap = new WeakMap()

const ignoreProps = (name: string) => {
  if (name.startsWith('x-') || name.startsWith(':') || name.startsWith('@')) {
    return true
  }
  if (name.startsWith('data-')) {
    return true
  }
  return false
}

Alpine.magic('props', el => {
  // console.log('get props', el)

  return {
    tabs: [{ title: 'fooo', key: 'sdf' }],
  }
  // el._props = el._props || Alpine.reactive(Object.create(props))
  // if (el.type === 'alpine') {
  //   return el._props
  // }
  const comp = el.closest('[data-component]')
  if (comp?.type !== 'alpine') {
    console.warn(`"$props" magic variable can only be used inner component.`, el)
    return
  }
  const _props = propsCompMap.get(comp)
  return _props

  // if (comp.type === 'alpine') {
  //   return comp._props
  // }
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
    setup: null | (() => Record<string, any>)
  }
) {
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template

  Alpine.data(scopeName, function (this: any) {
    const scope = setup?.call(this) || {}
    if (this.$el && !this.$el._scope) {
      this.$el._scope = scope
    }
    // console.log('x-data', componentName, scope)

    return scope
  })

  customElements.define(
    componentName,
    class extends HTMLElement {
      constructor() {
        super()
        const _props = Alpine.reactive(Object.create(props))
        propsCompMap.set(this, _props)
        // this._props = this._props || Alpine.reactive(Object.create(props))
      }
      static type = 'alpine'
      type = 'alpine'
      // _props = Alpine.reactive(Object.create(props))
      // #_x_dataStack = []
      // set _x_dataStack(scopes) {
      //   this.#_x_dataStack = scopes[0] ? [scopes[0]] : []
      // }
      // get _x_dataStack() {
      //   this.#_x_dataStack
      // }
      _scope = null
      // _props = Alpine.reactive(Object.create(props))
      connectedCallback() {
        this.setAttribute('data-component', '')
        queueMicrotask(() => {
          this.appendChild(templateContainer.content.cloneNode(true))
          this.setAttribute('x-data', scopeName)
        })
      }

      setAttribute(name: string, value: string): void {
        // console.log('set attr', name, componentName)
        if (ignoreProps(name)) {
          super.setAttribute(name, value)
          return
        }
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (!(propName in props)) {
          console.warn(
            `component "${componentName}" received prop "${name}" but not defined in $props.`,
            this
          )
          super.setAttribute(name, value)
        } else {
          // this._props = this._props || Alpine.reactive(Object.create(props))
          const _props = propsCompMap.get(this)
          _props[propName] = value
        }
      }

      getAttribute(name: string): any {
        if (ignoreProps(name)) {
          return super.getAttribute(name)
        }
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (!(propName in props)) {
          // console.warn(
          //   `component "${componentName}" received prop "${name}" but not defined in $props.`,
          //   this
          // )
          return super.getAttribute(name)
        }
        // this._props = this._props || Alpine.reactive(Object.create(props))
        const _props = propsCompMap.get(this)
        return _props[propName]
      }

      disconnectedCallback() {
        this._scope = null
        propsCompMap.delete(this)
        // delete this._scope
        // this._props = null
        // delete this._props
      }

      adoptedCallback() {}

      attributeChangedCallback() {}
    }
  )
  return componentName
}
