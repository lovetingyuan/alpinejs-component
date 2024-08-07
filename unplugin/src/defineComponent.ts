import Alpine from 'alpinejs'

const PropsMap = new WeakMap()

// @ts-ignore
// Alpine.magic('props', el => {
//   if (el.constructor.type === 'alpine') {
//     return PropsMap.get(el)
//   }
// })

Alpine.directive(
  'props',
  // @ts-ignore
  (el, { value, modifiers, expression }, { Alpine, effect, cleanup, evaluate, evaluateLater }) => {
    if ('type' in el.constructor && el.constructor.type !== 'alpine') {
      return
    }
    const getProps = evaluateLater(expression)

    effect(() => {
      let props: Record<string, unknown> | null = null
      getProps(p => {
        const prevProps = props
        if (props) {
          Object.assign(props, p)
        } else {
          // @ts-ignore
          props = p
        }
        PropsMap.set(el, props)
        // @ts-ignore
        const scopes = el.firstElementChild?._x_dataStack
        if (typeof scopes?.[0]?.props === 'function') {
          scopes[0].props(props, prevProps)
        }
      })
    })
  }
)

/**
 * You should NOT import this module by yourself.
 * It is used for plugin and bundler tools internally.
 * @private
 */
export function defineComponent(
  componentName: string,
  {
    template,
    setup,
  }: {
    template: string
    setup: null | (() => Record<string, any>)
  }
) {
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  const templateContainer = document.createElement('template')
  templateContainer.innerHTML = template
  templateContainer.content.firstElementChild?.setAttribute('x-data', scopeName)

  Alpine.data(scopeName, function (this: any) {
    const scope = setup ? setup.call(this) : {}
    return scope
  })

  customElements.define(
    componentName,
    class extends HTMLElement {
      constructor() {
        super()
      }
      static componentName = '${componentName}'
      static type = 'alpine'

      connectedCallback() {
        this.appendChild(templateContainer.content.cloneNode(true))
      }

      disconnectedCallback() {
        Alpine.destroyTree(this)
      }

      adoptedCallback() {}

      attributeChangedCallback() {}
    }
  )
  return componentName
}
