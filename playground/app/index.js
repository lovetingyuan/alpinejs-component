import Alpine from 'alpinejs'
import './style.css'
import 'iconify-icon'

window.Alpine = Alpine
Alpine.data('counter', function () {
  const scope = {
    count: 9,
    ff: Array.from({ length: 3000000 }).map(n => ({ n })),
    add() {
      this.count++
    },
  }
  const _init = scope.init
  // console.log('data', componentName, this)
  scope.init = function init() {
    // console.log('init', componentName, this)
    if (this.$el._x_dataStack?.length) {
      this.$el._x_dataStack = [this.$el._x_dataStack[0]]
    }
    if (!this.$el._x_effects) {
      this.$el._x_effects = new Set()
    }
    // if (scope.propsChange) {
    //   this.$el._x_effects.add(
    //     Alpine.effect(() => {
    //       this.$data.propsChange()
    //     })
    //   )
    // }
    if (_init && scope) {
      return _init.call(this)
    }
  }

  // return scope
  // const { initNum } = this.$props
  return scope
})

export default async function start(container) {
  await import('./my-app.htm')

  const root = typeof container === 'string' ? document.querySelector(container) : container
  if (root) {
    root.replaceChildren(document.createElement('my-app'))
  }
  Alpine.start()
}
