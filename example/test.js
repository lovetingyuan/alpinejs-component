const { parse } = require('@vue/compiler-sfc')
const template = `
<div><div></div></div>
<template>
a
</template>
<script>
  console.log(9)
</script>
`
const result = parse(template)

console.log(result.errors)
