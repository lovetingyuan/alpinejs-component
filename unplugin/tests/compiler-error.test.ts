import { describe, it, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { compileTemplate } from '../src/compiler'

const file1 = `
<p a>sdkfjdsl</p>

<script>
import "./aa"
export default a

</script>
<script></script>
`

describe('htm-compiler-error', () => {
  it('file1', async t => {
    const context = {
      error: mock.fn(),
    }
    await compileTemplate.call(context, file1, 'a-b', false)
    assert.strictEqual(context.error.mock.calls.length, 1)
    const call = context.error.mock.calls[0]

    assert.ok(call.arguments[0].includes(`component "a-b" contains more than one <script> tag`))
  })
})
