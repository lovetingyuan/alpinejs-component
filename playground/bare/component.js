import { parseHTML } from './compiler.js'

const _module = import.meta.url.split('?').pop()
const url = import.meta.resolve(`./components/${_module}.htm`)

export default await parseHTML(url, _module)
