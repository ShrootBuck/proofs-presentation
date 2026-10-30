<script setup lang="ts">
import { computed } from 'vue'
import { useSharedState } from '../composables/useSharedState'
import { isPrime, primePolynomial, factorPair } from '../lib/logic.mjs'
const state = useSharedState('prime', { n: 0 })
const n = computed(() => Math.max(0, Math.min(50, Math.round(Number(state.n) || 0))))
const value = computed(() => primePolynomial(n.value))
const prime = computed(() => isPrime(value.value))
const factors = computed(() => factorPair(value.value))
function choose(value: number) { state.n = Math.max(0, Math.min(50, value)) }
</script>
<template>
  <section class="prime-machine" @click.stop @keydown.stop>
    <div class="prime-equation"><MathTex tex="f(n)=n^2+n+41" /></div>
    <div class="prime-readout">
      <div class="prime-input"><span class="micro">INPUT</span><span class="number">{{ n }}</span><span class="muted">nonnegative integer</span></div>
      <span class="machine-arrow">⟶</span>
      <div :class="['prime-output', { composite: !prime }]" aria-live="polite">
        <span class="micro">OUTPUT</span><Transition name="number-pop" mode="out-in"><span :key="value" class="number">{{ value }}</span></Transition>
        <span class="result-label">{{ prime ? 'PRIME' : `COMPOSITE: ${factors?.[0]} × ${factors?.[1]}` }}</span>
      </div>
    </div>
    <div class="machine-controls">
      <button aria-label="Decrease n" :disabled="n === 0" @click="choose(n - 1)">−</button>
      <input aria-label="Choose n" type="range" min="0" max="50" step="1" :value="n" @input="choose(Number(($event.target as HTMLInputElement).value))" />
      <button aria-label="Increase n" :disabled="n === 50" @click="choose(n + 1)">+</button>
      <button class="quiet-button" @click="choose(39)">Try 39</button>
      <button class="quiet-button" @click="choose(40)">Try 40</button>
      <button class="text-button" @click="choose(0)">Reset</button>
    </div>
    <p class="demo-hint">Call out an input. How many successes would convince you?</p>
  </section>
</template>
