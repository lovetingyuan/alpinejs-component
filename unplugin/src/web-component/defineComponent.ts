import Alpine from 'alpinejs'

let currentComponent: any = null

requestAnimationFrame(() => {
  if ((window as any).Alpine !== Alpine) {
    console.warn('It is recommended to expose "Alpine" to global (`window.Alpine`).')
  }
})

Alpine.magic('props', el => {
  // @ts-ignore
  const comp = el.getRootNode().host
  if (comp?.type !== 'alpine') {
    console.warn('$props magic variable can only be used in web component.', el)
    return null
  }
  return comp._props
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
    style,
  }: {
    template: string
    props: Readonly<Record<string, any>>
    setup: null | ((props: Record<string, string>, comp: any) => Record<string, any>)
    style: string
  }
) {
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template

  let tailwindStyle: HTMLStyleElement | null = null
  if (style) {
    tailwindStyle = document.createElement('style')
    tailwindStyle.innerHTML = style
    tailwindStyle.dataset.tailwindcss = ''
  }
  if (setup) {
    Alpine.data(scopeName, () => {
      console.log('x-data', componentName, currentComponent._props)
      const scope = setup(currentComponent._props, currentComponent)
      currentComponent._scope = scope
      return scope
    })
  }

  customElements.define(
    componentName,
    class extends HTMLElement {
      static observedAttributes = Object.keys(props)
      static componentName = componentName
      static props = props
      static type = 'alpine'
      type = 'alpine'
      _scope: Record<string, unknown> = {}
      #props = null
      set _props(p: any) {
        this.#props = p
      }
      get _props() {
        return this.#props
      }
      get _root() {
        if (!this.shadowRoot) {
          console.error('shadowRoot is null.')
          return
        }
        for (const node of this.shadowRoot.children) {
          if (node.tagName !== 'STYLE' && node.tagName !== 'LINK') {
            return node
          }
        }
      }
      constructor() {
        super()
        const shadowRoot = this.attachShadow({ mode: 'open' })
        if (tailwindStyle) {
          shadowRoot.appendChild(tailwindStyle.cloneNode(true))
        }
        const content = templateContainer.content.cloneNode(true)
        shadowRoot.appendChild(content)
        this._props = this._props || Alpine.reactive(Object.create(props))
      }

      setAttribute(name: string, value: any): void {
        const _name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (this._props[name] !== value) {
          this._props[_name] = value
          // @ts-expect-error $data is set by alpine
          this._scope.$data?.propsChange?.(name, value)
        }
      }
      getAttribute(name: string): any | null {
        const _name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return _name in this._props ? this._props[_name] : null
      }

      connectedCallback() {
        const root = this._root as any
        if (setup && root) {
          if (componentName !== 'my-tabs') {
            root.setAttribute('x-data', scopeName)
          }
        }
        let dataStack: any[] = []
        // for data isolate
        if (root) {
          Object.defineProperty(root, '_x_dataStack', {
            get() {
              return dataStack
            },
            set(v) {
              if (v.length === 1) {
                dataStack = v
              }
            },
            enumerable: true,
          })
        }
        requestAnimationFrame(() => {
          if (this.shadowRoot) {
            currentComponent = this
            // @ts-expect-error initTree support shadow dom actually
            Alpine.initTree(this.shadowRoot)
          }
        })
      }

      disconnectedCallback() {
        this._props = null
        // this.#props = null
        if (this.shadowRoot) {
          // @ts-expect-error destroyTree support shadow dom actually
          Alpine.destroyTree(this.shadowRoot)
        }
      }

      adoptedCallback() {}

      attributeChangedCallback() {
        // console.log('attr change', name, val)
      }
    }
  )

  return componentName
}
