## unplugin-alpinejs-component

Use component way to develop alpinejs web app.

Install `npm install unplugin-alpinejs-component -D`

Usage:

```js
import { vitePlugin, rollupPlugin, webpackPlugin } from 'unplugin-alpinejs-component'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vitePlugin()],
})
```

Example:

counter component(`add-counter.htm`):

```html
<div>
  <span>Counter:</span>
  <span x-text="count"></span>
  <button @click="add">Increment</button>
  <button @click="count = $props.initNum">Reset</button>
</div>

<script>
  export const $props = {
    initNum: 0,
    step: 1,
  }
  export default function () {
    const { initNum, step } = this.$props
    return {
      count: initNum,
      step,
      propsChange() {
        this.step = this.$props.step
      },
      add() {
        this.count += this.step
      },
    }
  }
</script>
```

```html
<div>
  <add-counter :init-num="0" :step="1"></add-counter>
</div>
<script>
  import './add-counter.htm'
</script>
```
