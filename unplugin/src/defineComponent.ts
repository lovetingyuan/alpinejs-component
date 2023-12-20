import Alpine from 'alpinejs'

requestAnimationFrame(() => {
  if ((window as any).Alpine !== Alpine) {
    console.warn('It is recommended to expose "Alpine" to global (window.Alpine).')
  }
})

const propsCompMap = new WeakMap()
const div = document.createElement('div')

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
    setup: null | (() => Record<string, any>)
  }
) {
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template

  Alpine.data(scopeName, function (this: any) {
    const scope = setup?.call(this) || {}
    const _init = scope.init
    console.log('data', componentName, this)
    scope.init = function init() {
      console.log('init', componentName, this)
      if (this.$el._x_dataStack?.length) {
        this.$el._x_dataStack = [this.$el._x_dataStack[0]]
      }
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
        // @ts-ignore
        return Alpine.raw(this._x_dataStack[0])
      }
      connectedCallback() {
        // console.log('connected', componentName)
        queueMicrotask(() => {
          // if (componentName !== 'add-counter') {
          super.setAttribute('x-data', scopeName)
          super.setAttribute(':id', `$id("${componentName}")`)
          // }
          const content = templateContainer.content.cloneNode(true)
          const defaultPlaceholder = this.querySelector('template[default]')
          if (defaultPlaceholder) {
            defaultPlaceholder.replaceWith(content)
          } else {
            this.appendChild(content)
          }
        })
      }

      setAttribute(name: string, value: string): void {
        if (ignoreProps(name)) {
          super.setAttribute(name, value)
          return
        }
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (propName in props) {
          const _props = propsCompMap.get(this)
          _props[propName] = value
        } else {
          if (!(propName in div)) {
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
