<script setup lang="ts">
import { computed } from 'vue'
import { useSharedState } from '../composables/useSharedState'
import { implies } from '../lib/logic.mjs'
const state = useSharedState('implication', { p: true, q: true })
const holds = computed(() => implies(state.p, state.q))
const rows = [[true, true], [true, false], [false, true], [false, false]]
</script>
<template>
  <section class="implication-lab" @click.stop @keydown.stop>
    <div class="switchboard">
      <p class="micro">THE PROMISE</p>
      <p class="promise">"If you guess my magic number,<br />I'll buy you Wingstop."</p>
      <div class="logic-toggles">
        <button :aria-pressed="state.p" @click="state.p = !state.p"><span class="variable">P</span><span>Guessed my magic number</span><b>{{ state.p ? 'TRUE' : 'FALSE' }}</b></button>
        <button :aria-pressed="state.q" @click="state.q = !state.q"><span class="variable">Q</span><span>Got Wingstop</span><b>{{ state.q ? 'TRUE' : 'FALSE' }}</b></button>
      </div>
      <div :class="['promise-status', { broken: !holds }]" aria-live="polite"><span>{{ holds ? '✓' : '×' }}</span><div><strong>{{ holds ? 'Promise kept' : 'Promise broken' }}</strong><p>{{ state.p ? (state.q ? 'The condition happened. So did the result.' : 'The condition happened. The result did not.') : 'No correct guess? The promise made no demand.' }}</p></div></div>
    </div>
    <table class="truth-table">
      <thead><tr><th>P</th><th>Q</th><th><MathTex tex="P\Rightarrow Q" /></th></tr></thead>
      <tbody><tr v-for="([p,q], i) in rows" :key="i" :class="{ active: state.p === p && state.q === q, failure: !implies(p,q) }" @click="state.p = p; state.q = q"><td>{{ p ? 'T' : 'F' }}</td><td>{{ q ? 'T' : 'F' }}</td><td>{{ implies(p,q) ? 'T' : 'F' }}</td></tr></tbody>
    </table>
  </section>
</template>
