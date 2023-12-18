import Alpine from 'alpinejs'
import './style.css'

window.Alpine = Alpine

export default async function start(container) {
  await import('./my-app.htm')
  const root = typeof container === 'string' ? document.querySelector(container) : container
  root.innerHTML = ''
  // root.setAttribute('x-data', '{ $root: true }')
  const app = document.createElement('my-app')
  // app.setAttribute('x-comp', '')
  // app.setAttribute('x-data', 'my_app$')
  root.appendChild(app)
  Alpine.start()
}
