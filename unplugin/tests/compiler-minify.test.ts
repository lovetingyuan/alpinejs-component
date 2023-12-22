import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { compileTemplate } from '../src/compiler'

const file1 = `
<p a>sdkfjdsl</p>

<div fd="sdf  "   ff="">a   </div>
`

describe('htm-compiler', () => {
  it('file1', async t => {
    const context = {}
    const { code, template } = await compileTemplate.call(context, file1, 'a-b', false)
    assert.ok(code === '')
    assert.equal(template, '<p a>sdkfjdsl</p><div fd="sdf  " ff="">a   </div>')
  })
})
