import Alpine from 'alpinejs'
import './style.css'
import 'iconify-icon'

window.Alpine = Alpine

export default async function start(container) {
  await import('./my-app.htm')

  const root = typeof container === 'string' ? document.querySelector(container) : container
  if (root) {
    root.replaceChildren(document.createElement('my-app'))
  }
  Alpine.start()
}
