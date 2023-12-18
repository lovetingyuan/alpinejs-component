import Alpine from 'alpinejs'

requestAnimationFrame(() => {
  if ((window as any).Alpine !== Alpine) {
    console.warn('It is recommended to expose "Alpine" to global (window.Alpine).')
  }
})

Alpine.magic('props', () => {
  return {
    title: 'dfsd',
  }
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
    // props,
    setup,
  }: {
    template: string
    // props: Record<string, any>
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
    return scope
  })

  customElements.define(
    componentName,
    class extends HTMLElement {
      constructor() {
        super()
      }
      _x_dataStack = []
      _scope = null
      connectedCallback() {
        this.appendChild(templateContainer.content.cloneNode(true))
        this.setAttribute('x-data', scopeName)
      }

      disconnectedCallback() {
        this._scope = null
      }

      adoptedCallback() {}

      attributeChangedCallback() {}
    }
  )
  return componentName
}
