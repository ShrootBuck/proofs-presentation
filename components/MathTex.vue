<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
const props = withDefaults(defineProps<{ tex: string; block?: boolean }>(), { block: false })
const html = computed(() => katex.renderToString(props.tex, { displayMode: props.block, throwOnError: true, output: 'htmlAndMathml' }))
</script>
<template><span class="math-tex" v-html="html" /></template>
