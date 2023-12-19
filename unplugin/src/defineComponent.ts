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
  const comp = el.closest('[data-component]')
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
    return scope
  })

  customElements.define(
    componentName,
    class extends HTMLElement {
      constructor() {
        super()
      }
      static type = 'alpine'
      type = 'alpine'
      connectedCallback() {
        super.setAttribute('data-component', '')
        const _props = Alpine.reactive(Object.create(props))
        propsCompMap.set(this, _props)
        queueMicrotask(() => {
          this.appendChild(templateContainer.content.cloneNode(true))
          super.setAttribute('x-data', scopeName)
        })
      }

      setAttribute(name: string, value: string): void {
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
