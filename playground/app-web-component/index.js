import Alpine from 'alpinejs'

window.Alpine = Alpine

export default async function start(container) {
  await import('./my-app.htm')
  const root = typeof container === 'string' ? document.querySelector(container) : container
  root.innerHTML = ''
  root.setAttribute('x-data', '{ root: true }')
  root.appendChild(document.createElement('my-app'))
}
