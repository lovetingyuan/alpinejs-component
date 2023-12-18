import Alpine from 'alpinejs'
import './style.css'

window.Alpine = Alpine

export default async function start(container) {
  await import('./my-app.htm')
  const root = typeof container === 'string' ? document.querySelector(container) : container
  root.innerHTML = ''
  const app = document.createElement('my-app')
  root.appendChild(app)
  Alpine.start()
}
