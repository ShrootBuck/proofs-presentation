<script setup lang="ts">
import { computed } from 'vue'
import { useSharedState } from '../composables/useSharedState'
const state = useSharedState('square', { n: 3 })
const cells = computed(() => Array.from({ length: 49 }, (_, i) => { const x = i % 7; const y = Math.floor(i / 7); return { x, y, layer: Math.max(x, y) + 1 } }))
const sum = computed(() => Array.from({ length: state.n }, (_, i) => 2 * i + 1).join(' + '))
</script>
<template>
  <section class="odd-square" @click.stop @keydown.stop>
    <div class="square-grid" role="img" :aria-label="`${state.n} by ${state.n} square, built from odd-numbered L-shaped layers`">
      <div v-for="cell in cells" :key="`${cell.x}:${cell.y}`" :class="['square-cell', { shown: cell.layer <= state.n, newest: cell.layer === state.n }]" :style="{ gridRow: cell.y + 1, gridColumn: cell.x + 1, '--layer': cell.layer, transitionDelay: `${(cell.x + cell.y) * 18}ms` }" />
    </div>
    <div class="square-explanation">
      <div class="micro">ONE NEW L-SHAPED LAYER</div>
      <div class="square-total"><MathTex :tex="`${state.n}^2 = ${state.n * state.n}`" /></div>
      <p class="square-sum">{{ sum }}</p>
      <p>New layer: <strong>{{ 2 * state.n - 1 }} squares</strong></p>
      <div class="square-controls"><button :disabled="state.n <= 1" aria-label="Remove a layer" @click="state.n--">−</button><button class="primary-button" :disabled="state.n >= 7" @click="state.n++">Add a layer</button><button class="text-button" @click="state.n = 3">Reset</button></div>
    </div>
  </section>
</template>
