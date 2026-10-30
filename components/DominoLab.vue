<script setup lang="ts">
import { computed } from 'vue'
import { useSharedState } from '../composables/useSharedState'
const state = useSharedState('domino', { base: true, linked: true, run: 0, playing: false })
const result = computed(() => !state.playing ? 'What does a proof need to start?' : !state.base ? 'No base case. Nothing starts.' : !state.linked ? 'The first case holds. The chain stops.' : 'A base case + every link = the whole chain.')
function reset() { state.playing = false; state.run++ }
function play() { state.playing = false; state.run++; requestAnimationFrame(() => state.playing = true) }
function toggle(key: 'base' | 'linked') { reset(); state[key] = !state[key] }
</script>
<template>
  <section class="domino-lab" @click.stop @keydown.stop>
    <div class="domino-settings">
      <button :aria-pressed="state.base" @click="toggle('base')"><span class="switch-dot" />Base case <b>{{ state.base ? 'ON' : 'OFF' }}</b></button>
      <button :aria-pressed="state.linked" @click="toggle('linked')"><span class="switch-dot" />Every link <b>{{ state.linked ? 'ON' : 'OFF' }}</b></button>
      <button class="primary-button" @click="play">Run the chain</button>
      <button class="text-button" @click="reset">Reset</button>
    </div>
    <div :key="state.run" class="domino-track" role="img" aria-label="Eight dominoes illustrate the base case and the implication from each integer to the next.">
      <div v-for="i in 8" :key="i" class="domino-position">
        <div :class="['domino', { fallen: state.playing && state.base && (state.linked || i === 1) }]" :style="{ transitionDelay: `${(i - 1) * 130}ms` }"><span>{{ i }}</span><span class="domino-line" /><small>P({{ i }})</small></div>
        <span v-if="i < 8" :class="['domino-link', { missing: !state.linked }]">{{ state.linked ? '⇒' : '×' }}</span>
      </div>
      <span class="domino-etc">···</span>
    </div>
    <p class="domino-result" aria-live="polite">{{ result }}</p>
    <p class="demo-hint">The picture shows eight cases. The proof establishes the step for every integer k ≥ 1.</p>
  </section>
</template>
