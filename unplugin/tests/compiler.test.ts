import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { compileTemplate } from '../src/compiler'

const file1 = `
<p a>sdkfjdsl</p>
`
const file2 = `
<p a>sdkfjdsl</p>

<script>
import "./aa"
export default a

</script>
`

const file3 = `
<script>
import "./aa"
export default a

</script>
`

describe('htm-compiler', () => {
  it('file1', async t => {
    const context: any = {}
    const { code, template } = await compileTemplate.call(context, file1, 'a-b', false)
    assert.ok(code === '')
    assert.ok(template === '<p a>sdkfjdsl</p>')
  })

  it('file2', async t => {
    const context: any = {}
    const { code, template } = await compileTemplate.call(context, file2, 'a-b', false)
    assert.equal(
      code,
      `
import "./aa"
export default a
    `.trim()
    )
    assert.ok(template === '<p a>sdkfjdsl</p>')
  })

  it('file3', async t => {
    const context: any = {}
    const { code, template } = await compileTemplate.call(context, file3, 'a-b', false)
    assert.equal(
      code,
      `
import "./aa"
export default a
    `.trim()
    )
    assert.ok(template === '')
  })
})
